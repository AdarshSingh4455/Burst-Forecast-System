import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import sys
import json
import pickle
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import NearestNeighbors

sys.stdout.reconfigure(encoding="utf-8")

def no_blas_cosine_sim(A, B):
    norm_A = np.sqrt(np.sum(A**2, axis=1, keepdims=True))
    norm_B = np.sqrt(np.sum(B**2, axis=1, keepdims=True))
    norm_A[norm_A == 0] = 1e-10
    norm_B[norm_B == 0] = 1e-10
    dot_product = np.zeros((A.shape[0], B.shape[0]), dtype=float)
    for i in range(A.shape[1]):
        dot_product += A[:, i:i+1] * B[:, i:i+1].T
    return dot_product / (norm_A * norm_B.T)

import traceback

def main():
    try:
        _main_impl()
    except Exception as e:
        print("\nERROR IN PIPELINE:")
        traceback.print_exc()
        sys.exit(1)

def _main_impl():
    print("============================================")
    print("FORTRESS PHASE 11F + 11G + 11H PIPELINE BUILDER")
    print("============================================")

    # File paths
    gefs_file = "data/processed/FORTRESS_GEFS_MULTIYEAR_MULTIREGION.parquet"
    bust_file = "data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet"
    model_file = "models/fortress_bust_model_phase11.pkl"

    ffd_output = "data/processed/FORTRESS_FFD_PHASE11.parquet"
    fingerprint_output = "data/processed/FORTRESS_FAILURE_FINGERPRINT_PHASE11.parquet"
    evidence_output = "data/processed/FORTRESS_INDEPENDENT_EVIDENCE_PHASE11.parquet"
    self_audit_output = "data/processed/FORTRESS_SELF_AUDIT_PHASE11.parquet"
    horizon_output = "data/processed/FORTRESS_TRUST_HORIZON_PHASE11.parquet"
    metrics_output = "data/processed/FORTRESS_PHASE11_RELIABILITY_METRICS.json"

    # Load multi-region dataset and Phase 11 model
    print("Loading multi-region dataset and Phase 11 Bust Risk AI model...")
    df = pd.read_parquet(bust_file)
    with open(model_file, "rb") as f:
        model_bundle = pickle.load(f)

    base_model = model_bundle["base_model"]
    calibrator = model_bundle["calibrator"]
    feature_cols = model_bundle["feature_cols"]

    if hasattr(base_model, "n_jobs"):
        base_model.n_jobs = 1

    print(f"Loaded dataset: {len(df):,} rows across {df['region_id'].nunique()} regions.")
    print(f"Model architecture: {model_bundle.get('selected_model', 'Phase 11 AI')}")

    # Compute baseline predictions
    X_base = df[feature_cols].copy()
    raw_probs = base_model.predict_proba(X_base)[:, 1]
    df["baseline_p_bust"] = calibrator.transform(raw_probs)

    # ----------------------------------------------------
    # PHASE 11F: MULTI-REGION STRESS LAB & FFD
    # ----------------------------------------------------
    print("\n--- PHASE 11F: MULTI-REGION STRESS LAB & FFD ---")
    n_samples = len(df)
    np.random.seed(42)
    num_perturbations = 50

    d_hum = np.random.uniform(-3.0, 3.0, num_perturbations)
    d_tmp = np.random.uniform(-3.0, 3.0, num_perturbations)
    d_prs = np.random.uniform(-5.0, 5.0, num_perturbations)
    d_wnd = np.random.uniform(-5.0, 5.0, num_perturbations)

    norm_dist = np.sqrt((d_hum/3.0)**2 + (d_tmp/3.0)**2 + (d_prs/5.0)**2 + (d_wnd/5.0)**2)
    sorted_pert_indices = np.argsort(norm_dist)

    idx_hum = feature_cols.index("specific_humidity_gkg_mean")
    idx_tmp = feature_cols.index("temp_2m_c_mean")
    idx_prs = feature_cols.index("mslp_hpa_mean")
    idx_wnd = feature_cols.index("wind_speed_mean_ms")

    ffd_array = np.full(n_samples, np.nan)
    ffd_failure_found = np.zeros(n_samples, dtype=int)
    min_sh = np.zeros(n_samples)
    min_st = np.zeros(n_samples)
    min_sp = np.zeros(n_samples)
    min_sw = np.zeros(n_samples)
    dom_dim = np.full(n_samples, "NONE", dtype=object)

    # Batch stress evaluation using NumPy arrays for ultra-fast vectorized prediction
    chunk_size = 20000
    for start in range(0, n_samples, chunk_size):
        end = min(start + chunk_size, n_samples)
        sub_X_arr = X_base.iloc[start:end].to_numpy(copy=True)
        sub_n = len(sub_X_arr)

        sub_ffd = np.full(sub_n, np.nan)
        sub_found = np.zeros(sub_n, dtype=int)
        sub_sh = np.zeros(sub_n)
        sub_st = np.zeros(sub_n)
        sub_sp = np.zeros(sub_n)
        sub_sw = np.zeros(sub_n)
        sub_dom = np.full(sub_n, "NONE", dtype=object)

        for p_idx in sorted_pert_indices:
            dist = norm_dist[p_idx]
            dh, dt, dp, dw = d_hum[p_idx], d_tmp[p_idx], d_prs[p_idx], d_wnd[p_idx]

            X_p = sub_X_arr.copy()
            X_p[:, idx_hum] = np.clip(X_p[:, idx_hum] + dh, 0.0, 30.0)
            X_p[:, idx_tmp] = X_p[:, idx_tmp] + dt
            X_p[:, idx_prs] = X_p[:, idx_prs] + dp
            X_p[:, idx_wnd] = np.clip(X_p[:, idx_wnd] + dw, 0.0, 50.0)

            p_raw = base_model.predict_proba(X_p)[:, 1]
            p_bust = calibrator.transform(p_raw)
            is_bust = p_bust >= 0.50

            newly_busted = is_bust & (sub_found == 0)
            if np.any(newly_busted):
                sub_ffd[newly_busted] = dist
                sub_found[newly_busted] = 1
                sub_sh[newly_busted] = dh
                sub_st[newly_busted] = dt
                sub_sp[newly_busted] = dp
                sub_sw[newly_busted] = dw

                dims = np.column_stack([
                    np.abs(dh / 3.0) * newly_busted,
                    np.abs(dt / 3.0) * newly_busted,
                    np.abs(dp / 5.0) * newly_busted,
                    np.abs(dw / 5.0) * newly_busted
                ])
                dom_names = ["Moisture", "Temperature", "Pressure", "Wind"]
                for i_rel, is_nb in enumerate(newly_busted):
                    if is_nb:
                        sub_dom[i_rel] = dom_names[np.argmax(dims[i_rel])]

        ffd_array[start:end] = sub_ffd
        ffd_failure_found[start:end] = sub_found
        min_sh[start:end] = sub_sh
        min_st[start:end] = sub_st
        min_sp[start:end] = sub_sp
        min_sw[start:end] = sub_sw
        dom_dim[start:end] = sub_dom

    df["ffd"] = ffd_array
    df["ffd_failure_found"] = ffd_failure_found
    df["dominant_failure_dimension"] = dom_dim
    df["min_bust_delta_humidity"] = min_sh
    df["min_bust_delta_temp"] = min_st
    df["min_bust_delta_mslp"] = min_sp
    df["min_bust_delta_wind"] = min_sw

    ffd_df = df[[
        "region_id", "forecast_init", "lead_day", "latitude", "longitude",
        "baseline_p_bust", "ffd", "ffd_failure_found", "dominant_failure_dimension",
        "min_bust_delta_humidity", "min_bust_delta_temp", "min_bust_delta_mslp", "min_bust_delta_wind"
    ]].copy()
    ffd_df.to_parquet(ffd_output, index=False)
    print(f"Saved Phase 11 FFD artifact to: {ffd_output}")
    print(f"  Failure Found Rate: {(ffd_failure_found.sum()/n_samples)*100.0:.2f}% ({ffd_failure_found.sum():,}/{n_samples:,})")
    print(f"  No-Failure Rate   : {((n_samples - ffd_failure_found.sum())/n_samples)*100.0:.2f}%")

    # ----------------------------------------------------
    # FAILURE CORRIDORS & 6D FAILURE FINGERPRINTS
    # ----------------------------------------------------
    print("\n--- PHASE 11F: FAILURE CORRIDORS & 6D FINGERPRINTS ---")
    
    # Sensitivities (+2 g/kg hum, +2 C temp, -3 hPa prs, +3 m/s wnd)
    X_base_arr = X_base.to_numpy(copy=True)

    def calc_sens(col_idx, delta, name, clip_min=None):
        print(f"  Calculating sensitivity for {name}...")
        X_mod = X_base_arr.copy()
        if clip_min is not None:
            X_mod[:, col_idx] = np.clip(X_mod[:, col_idx] + delta, clip_min, None)
        else:
            X_mod[:, col_idx] = X_mod[:, col_idx] + delta
        
        chunk_sz = 50000
        cal_ps = []
        for c_start in range(0, n_samples, chunk_sz):
            c_end = min(c_start + chunk_sz, n_samples)
            p_raw = base_model.predict_proba(X_mod[c_start:c_end])[:, 1]
            p_cal = calibrator.transform(p_raw)
            cal_ps.append(p_cal)
        p_cal_all = np.concatenate(cal_ps)
        res = np.maximum(0.0, p_cal_all - df["baseline_p_bust"].values)
        print(f"    {name} sensitivity done.")
        return res

    sens_humidity = calc_sens(idx_hum, 2.0, "Moisture (+2 g/kg)", clip_min=0.0)
    sens_temperature = calc_sens(idx_tmp, 2.0, "Temperature (+2 C)")
    sens_pressure = calc_sens(idx_prs, -3.0, "Pressure (-3 hPa)")
    sens_wind = calc_sens(idx_wnd, 3.0, "Wind (+3 m/s)", clip_min=0.0)

    df["sens_humidity"] = sens_humidity
    df["sens_temperature"] = sens_temperature
    df["sens_pressure"] = sens_pressure
    df["sens_wind"] = sens_wind

    print("  Stacking sensitivity matrix...")
    from scipy.cluster.vq import kmeans2

    def pure_numpy_silhouette(X, labels):
        unique_labels = np.unique(labels)
        if len(unique_labels) < 2:
            return 0.0
        n = len(X)
        a = np.zeros(n)
        b = np.full(n, np.inf)
        dists = np.sqrt(np.sum((X[:, np.newaxis, :] - X[np.newaxis, :, :])**2, axis=2))
        for l in unique_labels:
            mask = labels == l
            if np.sum(mask) > 1:
                a[mask] = np.sum(dists[mask][:, mask], axis=1) / (np.sum(mask) - 1)
            for ol in unique_labels:
                if ol == l:
                    continue
                other_mask = labels == ol
                if np.sum(other_mask) > 0:
                    other_dists = np.mean(dists[mask][:, other_mask], axis=1)
                    b[mask] = np.minimum(b[mask], other_dists)
        s = (b - a) / np.maximum(a, b)
        return float(np.mean(np.nan_to_num(s)))

    sens_matrix = np.column_stack([sens_humidity, sens_temperature, sens_pressure, sens_wind])
    scaler = StandardScaler()
    sens_scaled = scaler.fit_transform(sens_matrix)

    print("  Evaluating failure corridors (K=2, 3, 4)...")
    sil_scores = {}
    sample_indices = np.random.choice(len(df), size=min(1000, len(df)), replace=False)
    sens_sample = sens_scaled[sample_indices]

    for k in [2, 3, 4]:
        centroids, labels_test = kmeans2(sens_sample, k, minit="points", seed=42)
        score = pure_numpy_silhouette(sens_sample, labels_test)
        sil_scores[k] = score
        print(f"  K={k}: Silhouette Score = {score:.4f}")

    best_k = max(sil_scores, key=sil_scores.get)
    print(f"Selected K={best_k} failure corridors (Silhouette Score: {sil_scores[best_k]:.4f}).")

    best_centroids, _ = kmeans2(sens_sample, best_k, minit="points", seed=42)
    # Distance to best_centroids for all 348,840 rows
    dists = np.linalg.norm(sens_scaled[:, np.newaxis, :] - best_centroids[np.newaxis, :, :], axis=2)
    df["failure_corridor_id"] = np.argmin(dists, axis=1)
    df["failure_corridor_label"] = "Corridor " + (df["failure_corridor_id"] + 1).astype(str)

    # 6D Fingerprints
    df["fingerprint_moisture"] = (df["sens_humidity"].rank(pct=True) * 100.0).round(2)
    df["fingerprint_temperature"] = (df["sens_temperature"].rank(pct=True) * 100.0).round(2)
    df["fingerprint_pressure"] = (df["sens_pressure"].rank(pct=True) * 100.0).round(2)
    df["fingerprint_wind"] = (df["sens_wind"].rank(pct=True) * 100.0).round(2)
    df["fingerprint_ensemble"] = (df["ensemble_spread_mm"].rank(pct=True) * 100.0).round(2)

    # Novelty proxy rank (TRAIN-ONLY reference for mu, sigma, and ECDF percentile mapping)
    train_mask = df["split"] == "TRAIN"

    q_mean = df.loc[train_mask, "specific_humidity_gkg_mean"].mean()
    q_std = df.loc[train_mask, "specific_humidity_gkg_mean"].std()

    t_mean = df.loc[train_mask, "temp_2m_c_mean"].mean()
    t_std = df.loc[train_mask, "temp_2m_c_mean"].std()

    p_mean = df.loc[train_mask, "mslp_hpa_mean"].mean()
    p_std = df.loc[train_mask, "mslp_hpa_mean"].std()

    w_mean = df.loc[train_mask, "wind_speed_mean_ms"].mean()
    w_std = df.loc[train_mask, "wind_speed_mean_ms"].std()

    norm_q = (df["specific_humidity_gkg_mean"] - q_mean) / q_std
    norm_t = (df["temp_2m_c_mean"] - t_mean) / t_std
    norm_p = (df["mslp_hpa_mean"] - p_mean) / p_std
    norm_w = (df["wind_speed_mean_ms"] - w_mean) / w_std

    raw_novelty_all = np.sqrt(norm_q**2 + norm_t**2 + norm_p**2 + norm_w**2)
    raw_novelty_train_sorted = np.sort(raw_novelty_all[train_mask].values)

    pct_mapped = (np.searchsorted(raw_novelty_train_sorted, raw_novelty_all.values, side="right") / len(raw_novelty_train_sorted)) * 100.0
    df["fingerprint_novelty"] = np.round(np.clip(pct_mapped, 0.0, 100.0), 2)

    fp_df = df[[
        "region_id", "forecast_init", "valid_time", "lead_day", "latitude", "longitude",
        "fingerprint_moisture", "fingerprint_temperature", "fingerprint_pressure",
        "fingerprint_wind", "fingerprint_ensemble", "fingerprint_novelty"
    ]].copy()
    fp_df.to_parquet(fingerprint_output, index=False)
    print(f"Saved Phase 11 Fingerprint artifact to: {fingerprint_output}")

    # ----------------------------------------------------
    # PHASE 11G: INDEPENDENT EVIDENCE
    # ----------------------------------------------------
    print("\n--- PHASE 11G: INDEPENDENT EVIDENCE ---")

    # 1. IsolationForest OOD (Trained STRICTLY on TRAIN split)
    ood_features = [
        "specific_humidity_gkg_mean", "temp_2m_c_mean", "mslp_hpa_mean",
        "pwat_mm_mean", "wind_speed_mean_ms", "ensemble_mean_mm",
        "ensemble_spread_mm", "member_range_mm"
    ]
    train_mask = df["split"] == "TRAIN"
    scaler_ood = StandardScaler()
    X_train_ood = scaler_ood.fit_transform(df.loc[train_mask, ood_features])
    X_all_ood = scaler_ood.transform(df[ood_features])

    iso_model = IsolationForest(n_estimators=100, random_state=42, n_jobs=1)
    iso_model.fit(X_train_ood)

    raw_train_scores = -iso_model.decision_function(X_train_ood)
    raw_all_scores = -iso_model.decision_function(X_all_ood)
    sorted_train_scores = np.sort(raw_train_scores)
    
    df["ood_score"] = (np.searchsorted(sorted_train_scores, raw_all_scores, side="right") / len(sorted_train_scores)) * 100.0
    df["ood_flag"] = (df["ood_score"] >= 90.0).astype(int)

    def assign_ood_cat(val):
        if val < 75.0:
            return "FAMILIAR"
        elif val < 90.0:
            return "UNUSUAL"
        else:
            return "HIGHLY NOVEL"

    df["ood_category"] = df["ood_score"].apply(assign_ood_cat)
    print(f"  OOD Model trained on TRAIN ({train_mask.sum():,} rows). Highly Novel rate: {(df['ood_flag'].sum()/n_samples)*100.0:.2f}%")

    # 2. Prior-Only Historical Analogues
    analogue_features = [
        "specific_humidity_gkg_mean", "temp_2m_c_mean", "mslp_hpa_mean",
        "pwat_mm_mean", "wind_speed_mean_ms", "ensemble_mean_mm", "ensemble_spread_mm"
    ]
    df["forecast_init_dt"] = pd.to_datetime(df["forecast_init"])

    analogue_counts = np.zeros(n_samples, dtype=int)
    analogue_mean_bust_rates = np.zeros(n_samples, dtype=float)
    analogue_mean_dists = np.zeros(n_samples, dtype=float)
    analogue_max_sims = np.zeros(n_samples, dtype=float)
    same_reg_counts = np.zeros(n_samples, dtype=int)
    cross_reg_counts = np.zeros(n_samples, dtype=int)

    init_dates = sorted(df["forecast_init_dt"].unique())

    for t_date in init_dates:
        curr_mask = df["forecast_init_dt"] == t_date
        prior_mask = df["forecast_init_dt"] < t_date

        df_curr_sub = df[curr_mask]
        df_prior_sub = df[prior_mask]

        if len(df_prior_sub) == 0:
            continue

        for lead_day in sorted(df_curr_sub["lead_day"].unique()):
            curr_l_mask = (df["forecast_init_dt"] == t_date) & (df["lead_day"] == lead_day)
            prior_l_mask = (df["forecast_init_dt"] < t_date) & (df["lead_day"] == lead_day)

            df_curr_l = df[curr_l_mask]
            df_prior_l = df[prior_l_mask]

            if len(df_prior_l) == 0:
                continue

            scaler_sub = StandardScaler()
            X_prior_sub = scaler_sub.fit_transform(df_prior_l[analogue_features])
            X_curr_sub = scaler_sub.transform(df_curr_l[analogue_features])

            k_neighbors = min(5, len(df_prior_l))
            nn = NearestNeighbors(n_neighbors=k_neighbors, metric="euclidean", n_jobs=1)
            nn.fit(X_prior_sub)

            distances, indices = nn.kneighbors(X_curr_sub)

            curr_indices = df_curr_l.index.values
            curr_regions = df_curr_l["region_id"].values
            prior_bust_labels = df_prior_l["bust_label"].values
            prior_regions = df_prior_l["region_id"].values

            for idx_in_sub, global_idx in enumerate(curr_indices):
                dists = distances[idx_in_sub]
                n_idxs = indices[idx_in_sub]
                b_labels = prior_bust_labels[n_idxs]
                n_regs = prior_regions[n_idxs]
                c_reg = curr_regions[idx_in_sub]

                analogue_counts[global_idx] = k_neighbors
                analogue_mean_bust_rates[global_idx] = np.mean(b_labels)
                analogue_mean_dists[global_idx] = np.mean(dists)
                analogue_max_sims[global_idx] = 1.0 / (1.0 + np.min(dists))
                same_reg_counts[global_idx] = np.sum(n_regs == c_reg)
                cross_reg_counts[global_idx] = np.sum(n_regs != c_reg)

    df["analogue_count"] = analogue_counts
    df["analogue_available"] = (analogue_counts > 0).astype(int)
    df["analogue_mean_bust_rate"] = analogue_mean_bust_rates
    df["analogue_mean_dist"] = analogue_mean_dists
    df["analogue_max_similarity"] = analogue_max_sims
    df["same_region_analogue_count"] = same_reg_counts
    df["cross_region_analogue_count"] = cross_reg_counts

    analogue_avail_pct = (df["analogue_available"].sum() / n_samples) * 100.0
    print(f"  Prior-Only Analogue Availability: {analogue_avail_pct:.2f}% ({df['analogue_available'].sum():,}/{n_samples:,})")

    # 3. Failure DNA (Cosine Similarity against prior busts)
    dna_features = [
        "fingerprint_moisture", "fingerprint_temperature", "fingerprint_pressure",
        "fingerprint_wind", "fingerprint_ensemble", "fingerprint_novelty"
    ]
    dna_max_sims = np.zeros(n_samples, dtype=float)
    dna_risk_flags = np.zeros(n_samples, dtype=int)

    for t_date in init_dates:
        curr_mask = df["forecast_init_dt"] == t_date
        prior_bust_mask = (df["forecast_init_dt"] < t_date) & (df["bust_label"] == 1)

        df_curr_sub = df[curr_mask]
        df_prior_busts = df[prior_bust_mask]

        if len(df_prior_busts) == 0:
            continue

        curr_indices = df_curr_sub.index.values
        X_curr_dna = df_curr_sub[dna_features].values
        X_prior_bust_dna = df_prior_busts[dna_features].values

        sim_matrix = no_blas_cosine_sim(X_curr_dna, X_prior_bust_dna)
        for idx_in_sub, global_idx in enumerate(curr_indices):
            sims = sim_matrix[idx_in_sub]
            max_s = np.max(sims)
            dna_max_sims[global_idx] = max_s
            dna_risk_flags[global_idx] = 1 if max_s >= 0.85 else 0

    df["failure_dna_max_sim"] = dna_max_sims
    df["failure_dna_risk_flag"] = dna_risk_flags

    # 4. Ensemble Disagreement
    df["ensemble_spread_percentile"] = df.groupby("lead_day")["ensemble_spread_mm"].rank(pct=True) * 100.0
    df["member_range_percentile"] = df.groupby("lead_day")["member_range_mm"].rank(pct=True) * 100.0
    df["ensemble_disagreement_score"] = (df["ensemble_spread_percentile"] + df["member_range_percentile"]) / 2.0

    def assign_disagree_cat(val):
        if val < 60.0:
            return "LOW"
        elif val < 85.0:
            return "MODERATE"
        else:
            return "HIGH"

    df["ensemble_disagreement_category"] = df["ensemble_disagreement_score"].apply(assign_disagree_cat)

    # Save Independent Evidence Artifact
    evidence_df = df[[
        "region_id", "forecast_init", "valid_time", "lead_day", "latitude", "longitude",
        "baseline_p_bust", "analogue_available", "analogue_mean_bust_rate", "analogue_max_similarity",
        "same_region_analogue_count", "cross_region_analogue_count",
        "failure_dna_max_sim", "failure_dna_risk_flag",
        "ensemble_disagreement_score", "ensemble_disagreement_category",
        "ood_score", "ood_flag", "ood_category", "split"
    ]].copy()
    evidence_df.to_parquet(evidence_output, index=False)
    print(f"Saved Phase 11 Independent Evidence artifact to: {evidence_output}")

    # ----------------------------------------------------
    # PHASE 11H: SELF-AUDIT, TRUST INDEX, HORIZON & BREAKING POINT
    # ----------------------------------------------------
    print("\n--- PHASE 11H: SELF-AUDIT & TRUST INDEX ---")

    def get_ai_risk_cat(p):
        if p < 0.20:
            return "LOW"
        elif p < 0.50:
            return "ELEVATED"
        else:
            return "HIGH"

    df["ai_risk_category"] = df["baseline_p_bust"].apply(get_ai_risk_cat)

    def get_stress_ev(row):
        if row["ffd_failure_found"] == 0 or np.isnan(row["ffd"]):
            return "NO_FAILURE_FOUND_WITHIN_TESTED_RANGE"
        elif row["ffd"] < 0.50:
            return "HIGHLY_FRAGILE"
        elif row["ffd"] < 0.85:
            return "MODERATELY_FRAGILE"
        else:
            return "ROBUST_WITHIN_TESTED_RANGE"

    df["stress_evidence"] = df.apply(get_stress_ev, axis=1)

    def get_hist_ev(row):
        if row["analogue_available"] == 0:
            return "NO_HISTORY"
        elif row["analogue_mean_bust_rate"] >= 0.40:
            return "HIGH HISTORICAL BUST SUPPORT"
        elif row["analogue_mean_bust_rate"] >= 0.15:
            return "MIXED HISTORICAL SUPPORT"
        else:
            return "LOW HISTORICAL BUST SUPPORT"

    df["history_evidence"] = df.apply(get_hist_ev, axis=1)

    def get_dna_ev(sim):
        if sim >= 0.90:
            return "HIGH HISTORICAL FAILURE PATTERN MATCH"
        elif sim >= 0.80:
            return "MODERATE MATCH"
        else:
            return "LOW MATCH"

    df["dna_evidence"] = df["failure_dna_max_sim"].apply(get_dna_ev)

    # Calculate supporting vs contradicting votes
    risk_votes = []
    stable_votes = []

    for idx, row in df.iterrows():
        r_cnt = 0
        s_cnt = 0
        if row["stress_evidence"] in ["HIGHLY_FRAGILE", "MODERATELY_FRAGILE"]:
            r_cnt += 1
        elif row["stress_evidence"] in ["ROBUST_WITHIN_TESTED_RANGE", "NO_FAILURE_FOUND_WITHIN_TESTED_RANGE"]:
            s_cnt += 1

        if row["history_evidence"] == "HIGH HISTORICAL BUST SUPPORT":
            r_cnt += 1
        elif row["history_evidence"] == "LOW HISTORICAL BUST SUPPORT":
            s_cnt += 1

        if row["dna_evidence"] == "HIGH HISTORICAL FAILURE PATTERN MATCH":
            r_cnt += 1

        if row["ensemble_disagreement_category"] == "HIGH":
            r_cnt += 1
        elif row["ensemble_disagreement_category"] == "LOW":
            s_cnt += 1

        if row["ood_category"] == "HIGHLY NOVEL":
            r_cnt += 1
        elif row["ood_category"] == "FAMILIAR":
            s_cnt += 1

        risk_votes.append(r_cnt)
        stable_votes.append(s_cnt)

    df["supporting_evidence_count"] = stable_votes
    df["contradicting_evidence_count"] = risk_votes

    # Self-Audit Status Rules
    def get_status(row):
        ai_cat = row["ai_risk_category"]
        r_cnt = row["contradicting_evidence_count"]
        s_cnt = row["supporting_evidence_count"]
        ood_cat = row["ood_category"]
        hist_ev = row["history_evidence"]

        if ai_cat == "LOW" and r_cnt >= 2:
            return "CONFLICT / POSSIBLE BLIND SPOT"
        elif ai_cat == "HIGH" and s_cnt >= 2 and r_cnt == 0:
            return "CONFLICT / POSSIBLE BLIND SPOT"
        elif ood_cat == "HIGHLY NOVEL" and (hist_ev == "NO_HISTORY" or r_cnt >= 2):
            return "EXPERT REVIEW"
        elif ai_cat in ["ELEVATED", "HIGH"] and r_cnt >= 1:
            return "SUPPORTED WARNING"
        elif hist_ev == "NO_HISTORY" and ai_cat == "LOW" and r_cnt < 2:
            return "INSUFFICIENT EVIDENCE"
        elif ai_cat in ["ELEVATED", "HIGH"]:
            return "SUPPORTED WARNING"
        else:
            return "SUPPORTED RELIABILITY"

    df["self_audit_status"] = df.apply(get_status, axis=1)

    # Prototype Diagnostic Trust Index (0-100)
    scores = []
    for idx, row in df.iterrows():
        sc = 100.0
        sc -= (row["baseline_p_bust"] * 40.0)

        if row["stress_evidence"] == "HIGHLY_FRAGILE":
            sc -= 20.0
        elif row["stress_evidence"] == "MODERATELY_FRAGILE":
            sc -= 10.0

        if row["history_evidence"] == "HIGH HISTORICAL BUST SUPPORT":
            sc -= 20.0
        elif row["history_evidence"] == "MIXED HISTORICAL SUPPORT":
            sc -= 10.0

        if row["ensemble_disagreement_category"] == "HIGH":
            sc -= 15.0
        elif row["ensemble_disagreement_category"] == "MODERATE":
            sc -= 5.0

        if row["ood_category"] == "HIGHLY NOVEL":
            sc -= 15.0
        elif row["ood_category"] == "UNUSUAL":
            sc -= 5.0

        if row["dna_evidence"] == "HIGH HISTORICAL FAILURE PATTERN MATCH":
            sc -= 10.0

        scores.append(float(np.clip(sc, 0.0, 100.0)))

    df["trust_index"] = np.round(scores, 2)

    def get_band(st):
        if st == "SUPPORTED RELIABILITY":
            return "GREEN"
        elif st == "INSUFFICIENT EVIDENCE":
            return "YELLOW"
        else:
            return "RED"

    df["reliability_band"] = df["self_audit_status"].apply(get_band)

    # Save Self-Audit Artifact
    self_audit_df = df[[
        "region_id", "forecast_init", "valid_time", "lead_day", "latitude", "longitude",
        "baseline_p_bust", "self_audit_status", "trust_index", "reliability_band",
        "supporting_evidence_count", "contradicting_evidence_count", "split", "bust_label"
    ]].copy()
    self_audit_df.to_parquet(self_audit_output, index=False)
    print(f"Saved Phase 11 Self-Audit artifact to: {self_audit_output}")

    # ----------------------------------------------------
    # TRUST HORIZON & BREAKING POINT
    # ----------------------------------------------------
    print("\n--- PHASE 11H: TRUST HORIZON & BREAKING POINT ---")

    df = df.sort_values(by=["region_id", "forecast_init", "latitude", "longitude", "lead_day"]).reset_index(drop=True)

    th_days = []
    bp_days = []

    grid_groups = df.groupby(["region_id", "forecast_init", "latitude", "longitude"])
    n_sequences = len(grid_groups)
    print(f"  Total Forecast Sequences: {n_sequences:,} (Expected: 34,884)")

    horizon_rows = []

    for (reg_id, init_dt, lat, lon), g_df in grid_groups:
        g_sorted = g_df.sort_values(by="lead_day").reset_index(drop=True)
        bands = g_sorted["reliability_band"].values
        leads = g_sorted["lead_day"].values

        bp = None
        for i in range(len(bands) - 1):
            if bands[i] == "RED" and bands[i+1] == "RED":
                bp = int(leads[i])
                break

        if bp is not None:
            th = max(1, bp - 1)
            bp_val = float(bp)
        else:
            th = 10
            bp_val = np.nan

        split_val = g_sorted["split"].values[0]

        horizon_rows.append({
            "region_id": reg_id,
            "forecast_init": init_dt,
            "latitude": lat,
            "longitude": lon,
            "trust_horizon_day": th,
            "breaking_point_day": bp_val,
            "reached_d10_without_red": bool(np.all(bands != "RED")),
            "split": split_val
        })

    horizon_df = pd.DataFrame(horizon_rows)
    horizon_df.to_parquet(horizon_output, index=False)
    print(f"Saved Phase 11 Trust Horizon artifact to: {horizon_output}")

    # ----------------------------------------------------
    # RETROSPECTIVE HELD-OUT TEST VALIDATION & METRICS JSON
    # ----------------------------------------------------
    print("\n--- RETROSPECTIVE HELD-OUT TEST VALIDATION ---")
    test_df = df[df["split"] == "TEST"].copy()

    print("\n  Retrospective Observed Bust Rates by Trust Band (2019 Test Set, 116,280 rows):")
    band_metrics = {}
    for band_name in ["GREEN", "YELLOW", "RED"]:
        b_sub = test_df[test_df["reliability_band"] == band_name]
        n_b = len(b_sub)
        n_busts = b_sub["bust_label"].sum()
        p_rate = (n_busts / n_b * 100.0) if n_b > 0 else 0.0
        mean_p = b_sub["baseline_p_bust"].mean() if n_b > 0 else 0.0
        band_metrics[band_name] = {"N": int(n_b), "bust_count": int(n_busts), "observed_bust_rate": float(p_rate), "mean_p_bust": float(mean_p)}
        print(f"    {band_name:8s}: N={n_b:6,} | Observed Busts={n_busts:5,} ({p_rate:5.2f}%) | Mean P(Bust)={mean_p:.4f}")

    print("\n  Retrospective Observed Bust Rates by Self-Audit Status (2019 Test Set):")
    status_metrics = {}
    for st_name in test_df["self_audit_status"].unique():
        s_sub = test_df[test_df["self_audit_status"] == st_name]
        n_s = len(s_sub)
        n_busts = s_sub["bust_label"].sum()
        p_rate = (n_busts / n_s * 100.0) if n_s > 0 else 0.0
        mean_p = s_sub["baseline_p_bust"].mean() if n_s > 0 else 0.0
        status_metrics[st_name] = {"N": int(n_s), "bust_count": int(n_busts), "observed_bust_rate": float(p_rate), "mean_p_bust": float(mean_p)}
        print(f"    {st_name:32s}: N={n_s:6,} | Observed Busts={n_busts:5,} ({p_rate:5.2f}%) | Mean P(Bust)={mean_p:.4f}")

    # Build comprehensive Phase 11FGH Reliability Metrics JSON
    metrics_json = {
        "phase": "11F + 11G + 11H",
        "sample_size": n_samples,
        "regions_count": df["region_id"].nunique(),
        "ffd_summary": {
            "failure_found_count": int(ffd_failure_found.sum()),
            "failure_found_rate_pct": float((ffd_failure_found.sum() / n_samples) * 100.0),
            "no_failure_count": int(n_samples - ffd_failure_found.sum()),
            "no_failure_rate_pct": float(((n_samples - ffd_failure_found.sum()) / n_samples) * 100.0),
            "median_ffd": float(np.nanmedian(ffd_array))
        },
        "corridor_summary": {
            "selected_k": best_k,
            "silhouette_scores": {str(k): float(v) for k, v in sil_scores.items()},
            "best_silhouette_score": float(sil_scores[best_k])
        },
        "evidence_summary": {
            "analogue_availability_pct": float(analogue_avail_pct),
            "highly_novel_ood_rate_pct": float((df['ood_flag'].sum() / n_samples) * 100.0),
            "dna_high_match_rate_pct": float((df['failure_dna_risk_flag'].sum() / n_samples) * 100.0)
        },
        "trust_band_metrics_held_out_2019_test": band_metrics,
        "self_audit_status_metrics_held_out_2019_test": status_metrics,
        "trust_horizon_summary": {
            "total_sequences": n_sequences,
            "average_trust_horizon_days": float(horizon_df["trust_horizon_day"].mean()),
            "median_trust_horizon_days": float(horizon_df["trust_horizon_day"].median()),
            "pct_sequences_reaching_d10_without_red": float((horizon_df["reached_d10_without_red"].sum() / n_sequences) * 100.0)
        },
        "breaking_point_summary": {
            "sequences_with_breaking_point": int(horizon_df["breaking_point_day"].notna().sum()),
            "sequences_without_breaking_point": int(horizon_df["breaking_point_day"].isna().sum()),
            "median_breaking_point_lead": float(np.nanmedian(horizon_df["breaking_point_day"]))
        }
    }

    with open(metrics_output, "w", encoding="utf-8") as f:
        json.dump(metrics_json, f, indent=2)
    print(f"\nSaved Phase 11 Reliability Metrics JSON to: {metrics_output}")

    print("============================================")
    print("PHASE 11F + 11G + 11H PIPELINE COMPLETED SUCCESSFULLY")
    print("============================================")

if __name__ == "__main__":
    main()
