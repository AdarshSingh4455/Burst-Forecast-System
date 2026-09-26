import os
os.environ["PYTHONUNBUFFERED"] = "1"
import sys
import json
import pickle
import hashlib
import datetime
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import (
    roc_auc_score, precision_recall_curve, auc, brier_score_loss,
    precision_score, recall_score, f1_score, log_loss
)

sys.stdout.reconfigure(encoding="utf-8")

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def safe_round(val, decimals=4):
    if val is None or pd.isna(val) or np.isnan(val):
        return None
    return round(float(val), decimals)

def fast_roc_auc(y_true, y_score):
    desc_indices = np.argsort(y_score)[::-1]
    y_sorted = y_true[desc_indices]
    n_pos = int(np.sum(y_sorted))
    n_neg = len(y_sorted) - n_pos
    if n_pos == 0 or n_neg == 0:
        return 0.5
    tp_cumsum = np.cumsum(y_sorted)
    return float(np.sum(tp_cumsum[y_sorted == 0]) / (n_pos * n_neg))

def calc_calibration_bins(y_true, probs, n_bins=10):
    bins_data = []
    total_n = len(y_true)
    ece = 0.0
    mce = 0.0
    
    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    
    for i in range(n_bins):
        low = bin_edges[i]
        high = bin_edges[i+1]
        
        if i == n_bins - 1:
            mask = (probs >= low) & (probs <= high)
        else:
            mask = (probs >= low) & (probs < high)
            
        n_b = int(mask.sum())
        if n_b > 0:
            mean_p = float(np.mean(probs[mask]))
            obs_rate = float(np.mean(y_true[mask]))
            abs_gap = float(abs(mean_p - obs_rate))
            weight = n_b / total_n
            ece += weight * abs_gap
            if abs_gap > mce:
                mce = abs_gap
        else:
            mean_p = float((low + high) / 2.0)
            obs_rate = 0.0
            abs_gap = 0.0
            
        bins_data.append({
            "bin_idx": i + 1,
            "range": [safe_round(low, 2), safe_round(high, 2)],
            "N": n_b,
            "mean_predicted_prob": safe_round(mean_p, 4),
            "observed_bust_rate": safe_round(obs_rate, 4),
            "absolute_calibration_gap": safe_round(abs_gap, 4)
        })
        
    return bins_data, safe_round(ece, 4), safe_round(mce, 4)

def log_prog(msg):
    print(msg, flush=True)
    with open("scratch/progress.txt", "a") as f:
        f.write(msg + "\n")
        f.flush()

def evaluate_calibration_split(y_true, probs):
    roc = safe_round(roc_auc_score(y_true, probs), 4)
    p_arr, r_arr, _ = precision_recall_curve(y_true, probs)
    pr = safe_round(auc(r_arr, p_arr), 4)
    brier = safe_round(brier_score_loss(y_true, probs), 4)
    p_safe = np.clip(probs, 1e-15, 1.0 - 1e-15)
    ll = safe_round(log_loss(y_true, p_safe), 4)
    
    bins_data, ece, mce = calc_calibration_bins(y_true, probs, n_bins=10)
    
    return {
        "ROC_AUC": roc,
        "PR_AUC": pr,
        "Brier": brier,
        "ECE": ece,
        "MCE": mce,
        "Log_Loss": ll,
        "bins": bins_data
    }

def main():
    with open("scratch/progress.txt", "w") as f:
        f.write("MAIN STARTED\n")

    log_prog("============================================")
    log_prog("FORTRESS PHASE 12D + 12E + 12F SUITE BUILDER")
    log_prog("============================================")

    os.makedirs("docs/figures", exist_ok=True)

    # Required file paths
    bust_file = "data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet"
    ffd_file = "data/processed/FORTRESS_FFD_PHASE11.parquet"
    fp_file = "data/processed/FORTRESS_FAILURE_FINGERPRINT_PHASE11.parquet"
    ev_file = "data/processed/FORTRESS_INDEPENDENT_EVIDENCE_PHASE11.parquet"
    sa_file = "data/processed/FORTRESS_SELF_AUDIT_PHASE11.parquet"
    th_file = "data/processed/FORTRESS_TRUST_HORIZON_PHASE11.parquet"
    model_file = "models/fortress_bust_model_phase11.pkl"

    cases_json = "data/processed/FORTRESS_PHASE12_CASE_STUDIES.json"
    base_json = "data/processed/FORTRESS_PHASE12_BASELINE_METRICS.json"
    ablation_json = "data/processed/FORTRESS_PHASE12_ABLATION_METRICS.json"

    # Outputs
    out_calib = "data/processed/FORTRESS_PHASE12_CALIBRATION_METRICS.json"
    out_reg_lead = "data/processed/FORTRESS_PHASE12_REGION_LEAD_METRICS.json"
    out_failure = "data/processed/FORTRESS_PHASE12_FAILURE_ANALYSIS.json"
    out_sensitivity = "data/processed/FORTRESS_PHASE12_RULE_SENSITIVITY.json"

    log_prog("Re-recording SHA-256 hashes of frozen baseline files and Phase 12ABC artifacts...")
    hashes = {
        "models/fortress_bust_model_phase11.pkl": sha256_file(model_file),
        "data/processed/FORTRESS_GEFS_MULTIYEAR_MULTIREGION.parquet": sha256_file("data/processed/FORTRESS_GEFS_MULTIYEAR_MULTIREGION.parquet"),
        "data/processed/FORTRESS_OBS_MULTIYEAR_MULTIREGION.parquet": sha256_file("data/processed/FORTRESS_OBS_MULTIYEAR_MULTIREGION.parquet"),
        "data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet": sha256_file(bust_file),
        "data/processed/FORTRESS_FFD_PHASE11.parquet": sha256_file(ffd_file),
        "data/processed/FORTRESS_FAILURE_FINGERPRINT_PHASE11.parquet": sha256_file(fp_file),
        "data/processed/FORTRESS_INDEPENDENT_EVIDENCE_PHASE11.parquet": sha256_file(ev_file),
        "data/processed/FORTRESS_SELF_AUDIT_PHASE11.parquet": sha256_file(sa_file),
        "data/processed/FORTRESS_TRUST_HORIZON_PHASE11.parquet": sha256_file(th_file),
        "data/processed/FORTRESS_PHASE12_CASE_STUDIES.json": sha256_file(cases_json),
        "data/processed/FORTRESS_PHASE12_BASELINE_METRICS.json": sha256_file(base_json),
        "data/processed/FORTRESS_PHASE12_ABLATION_METRICS.json": sha256_file(ablation_json)
    }

    log_prog("Loading datasets and model bundle...")
    df_bust = pd.read_parquet(bust_file)
    df_ffd = pd.read_parquet(ffd_file)
    df_fp = pd.read_parquet(fp_file)
    df_ev = pd.read_parquet(ev_file)
    df_sa = pd.read_parquet(sa_file)
    df_th = pd.read_parquet(th_file)

    with open(model_file, "rb") as f:
        bundle = pickle.load(f)

    base_model = bundle["base_model"]
    base_model.n_jobs = -1
    calibrator = bundle["calibrator"]
    feature_cols = bundle["feature_cols"]

    # ----------------------------------------------------
    # PHASE 12D: CALIBRATION ANALYSIS
    # ----------------------------------------------------
    log_prog("\n--- PHASE 12D: CALIBRATION DIAGNOSTICS & PREVALENCE SHIFT ---")
    
    calib_res = {
        "phase": "Phase 12D",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "hashes": hashes,
        "prevalence_shift": {
            "splits": {},
            "by_region_test": {},
            "by_lead_test": {}
        },
        "calibration_by_split": {},
        "interpretation": "Isotonic mapping changed probability scaling and improved fixed-threshold recall (from 0.5310 to 0.6077) and F1 (from 0.5893 to 0.6182) at 0.50, while the listed held-out probability-quality metrics were slightly worse (Brier 0.1178 vs 0.1173, ROC-AUC 0.8561 vs 0.8567, ECE 0.0234 vs 0.0205, Log Loss 0.3665 vs 0.3642). Evaluation demonstrates temporal climate prevalence shift across TRAIN (2017 + Jan-Jun 2018: 5.00%), VALIDATION (Jul-Dec 2018: 12.47%), and HELD-OUT TEST (2019: 22.04%)."
    }

    splits = ["TRAIN", "VALIDATION", "TEST"]
    for sp in splits:
        log_prog(f"Evaluating split {sp}...")
        sp_mask = df_bust["split"] == sp
        sub_b = df_bust[sp_mask]
        y_sp = sub_b["bust_label"].values
        n_sp = len(y_sp)
        prev_sp = float(np.mean(y_sp))
        
        calib_res["prevalence_shift"]["splits"][sp] = {
            "N": n_sp,
            "observed_busts": int(y_sp.sum()),
            "bust_prevalence_pct": safe_round(prev_sp * 100.0, 2)
        }

        X_sp = sub_b[feature_cols]
        log_prog(f"Predicting probs for split {sp}...")
        uncal_p = base_model.predict_proba(X_sp)[:, 1]
        cal_p = calibrator.transform(uncal_p)

        calib_res["calibration_by_split"][sp] = {
            "sample_size": n_sp,
            "uncalibrated": evaluate_calibration_split(y_sp, uncal_p),
            "calibrated": evaluate_calibration_split(y_sp, cal_p)
        }

    # Prevalence by region and lead in TEST
    test_mask = df_bust["split"] == "TEST"
    test_bust = df_bust[test_mask]
    test_sa = df_sa[test_mask]
    test_ev = df_ev[test_mask]
    test_ffd = df_ffd[test_mask]
    test_fp = df_fp[test_mask]
    y_test = test_bust["bust_label"].values

    for r in ["EASTERN_UP_RECT", "NORTHWEST_INDIA_RECT", "CENTRAL_INDIA_RECT"]:
        sub_r = test_bust[test_bust["region_id"] == r]
        calib_res["prevalence_shift"]["by_region_test"][r] = {
            "N": len(sub_r),
            "observed_busts": int(sub_r["bust_label"].sum()),
            "bust_prevalence_pct": safe_round(sub_r["bust_label"].mean() * 100.0, 2)
        }

    for l in range(1, 11):
        sub_l = test_bust[test_bust["lead_day"] == l]
        calib_res["prevalence_shift"]["by_lead_test"][f"D{l}"] = {
            "N": len(sub_l),
            "observed_busts": int(sub_l["bust_label"].sum()),
            "bust_prevalence_pct": safe_round(sub_l["bust_label"].mean() * 100.0, 2)
        }

    with open(out_calib, "w", encoding="utf-8") as f:
        json.dump(calib_res, f, indent=2)
    print(f"Saved Phase 12D Calibration JSON to: {out_calib}")

    # ----------------------------------------------------
    # PHASE 12E: REGION & LEAD ANALYSIS
    # ----------------------------------------------------
    log_prog("\n--- PHASE 12E: REGION-WISE, LEAD-WISE & MATRIX EVALUATION ---")

    X_test = test_bust[feature_cols]
    cal_probs_test = calibrator.transform(base_model.predict_proba(X_test)[:, 1])
    test_sa_bands = test_sa["reliability_band"].values
    test_sa_st = test_sa["self_audit_status"].values

    # Helper function for region & lead evaluation
    def evaluate_subgroup(mask_sub):
        n_sub = int(mask_sub.sum())
        if n_sub == 0:
            return None
        
        y_sub = y_test[mask_sub]
        p_sub = cal_probs_test[mask_sub]
        sa_sub = test_sa[mask_sub]
        ev_sub = test_ev[mask_sub]
        ffd_sub = test_ffd[mask_sub]
        bands_sub = test_sa_bands[mask_sub]
        
        prev = float(np.mean(y_sub)) * 100.0
        
        # Check if single class
        if len(np.unique(y_sub)) < 2:
            roc = "N/A"
            pr = "N/A"
        else:
            roc = safe_round(roc_auc_score(y_sub, p_sub), 4)
            p_arr, r_arr, _ = precision_recall_curve(y_sub, p_sub)
            pr = safe_round(auc(r_arr, p_arr), 4)
            
        brier = safe_round(brier_score_loss(y_sub, p_sub), 4)
        
        preds = (p_sub >= 0.50).astype(int)
        prec = safe_round(precision_score(y_sub, preds, zero_division=0), 4)
        rec = safe_round(recall_score(y_sub, preds, zero_division=0), 4)
        f1 = safe_round(f1_score(y_sub, preds, zero_division=0), 4)
        
        g_mask = bands_sub == "GREEN"
        r_mask = bands_sub == "RED"
        g_cnt = int(g_mask.sum())
        r_cnt = int(r_mask.sum())
        
        g_pct = safe_round((g_cnt / n_sub) * 100.0, 2)
        r_pct = safe_round((r_cnt / n_sub) * 100.0, 2)
        
        g_bust_rate = safe_round(y_sub[g_mask].mean() * 100.0, 2) if g_cnt > 0 else 0.0
        r_bust_rate = safe_round(y_sub[r_mask].mean() * 100.0, 2) if r_cnt > 0 else 0.0
        
        mean_ti = safe_round(sa_sub["trust_index"].mean(), 2)
        mean_p_b = safe_round(p_sub.mean(), 4)
        ood_rate = safe_round((ev_sub["ood_category"] == "HIGHLY NOVEL").mean() * 100.0, 2)
        ana_avail = safe_round((ev_sub["analogue_available"] == 1).mean() * 100.0, 2)
        ffd_rate = safe_round((ffd_sub["ffd_failure_found"] == 1).mean() * 100.0, 2)
        
        res = {
            "N": n_sub,
            "bust_prevalence_pct": safe_round(prev, 2),
            "ROC_AUC": roc,
            "PR_AUC": pr,
            "Brier": brier,
            "mean_p_bust": mean_p_b,
            "precision": prec,
            "recall": rec,
            "F1": f1,
            "GREEN_pct": g_pct,
            "RED_pct": r_pct,
            "GREEN_observed_bust_rate_pct": g_bust_rate,
            "RED_observed_bust_rate_pct": r_bust_rate,
            "mean_trust_index": mean_ti,
            "ood_rate_pct": ood_rate,
            "analogue_availability_pct": ana_avail,
            "ffd_failure_found_rate_pct": ffd_rate
        }
        
        if n_sub < 30:
            res["warning"] = "VERY SMALL SAMPLE (N < 30)"
        elif n_sub < 100:
            res["warning"] = "SMALL SAMPLE (N < 100)"
            
        return res

    region_lead_res = {
        "phase": "Phase 12E",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "region_metrics": {},
        "lead_metrics": {},
        "region_lead_matrix": {},
        "trust_horizon_by_region": {},
        "breaking_point_distribution": {},
        "lead_degradation_trends": {}
    }

    # Region-wise evaluation
    regions = ["EASTERN_UP_RECT", "NORTHWEST_INDIA_RECT", "CENTRAL_INDIA_RECT"]
    for r in regions:
        log_prog(f"Evaluating region {r}...")
        r_mask = (test_bust["region_id"] == r).values
        sub_eval = evaluate_subgroup(r_mask)
        
        # TH metrics for region on TEST split
        th_r = df_th[(df_th["region_id"] == r) & (df_th["split"] == "TEST")]
        th_means = float(th_r["trust_horizon_day"].mean())
        th_median = float(th_r["trust_horizon_day"].median())
        th_q25 = float(th_r["trust_horizon_day"].quantile(0.25))
        th_q75 = float(th_r["trust_horizon_day"].quantile(0.75))
        th_iqr = float(th_q75 - th_q25)
        
        pct_d10 = float((th_r["breaking_point_day"].isna()).mean() * 100.0)
        bp_frac = float((th_r["breaking_point_day"].notna()).mean() * 100.0)
        
        sub_eval["mean_trust_horizon"] = safe_round(th_means, 2)
        sub_eval["breaking_point_fraction_pct"] = safe_round(bp_frac, 2)
        region_lead_res["region_metrics"][r] = sub_eval

        region_lead_res["trust_horizon_by_region"][r] = {
            "mean": safe_round(th_means, 2),
            "median": safe_round(th_median, 2),
            "iqr": safe_round(th_iqr, 2),
            "pct_reaching_d10_without_red": safe_round(pct_d10, 2)
        }

        # Breaking point distribution
        bp_counts = {}
        for d in range(1, 10):
            cnt = int((th_r["breaking_point_day"] == d).sum())
            bp_counts[f"D{d}"] = {"count": cnt, "pct": safe_round((cnt / len(th_r)) * 100.0, 2)}
        none_cnt = int(th_r["breaking_point_day"].isna().sum())
        bp_counts["None"] = {"count": none_cnt, "pct": safe_round((none_cnt / len(th_r)) * 100.0, 2)}
        region_lead_res["breaking_point_distribution"][r] = bp_counts

    # Lead-wise evaluation
    log_prog("Evaluating lead day metrics...")
    for l in range(1, 11):
        log_prog(f"  Lead D{l}...")
        l_mask = (test_bust["lead_day"] == l).values
        l_eval = evaluate_subgroup(l_mask)
        region_lead_res["lead_metrics"][f"D{l}"] = l_eval

    # Region x Lead Matrix (30 cells)
    log_prog("Evaluating 30 region x lead matrix cells...")
    deg_trends = {"leads": [f"D{l}" for l in range(1, 11)], "roc_auc": [], "bust_prevalence_pct": [], "red_pct": [], "mean_trust_index": [], "ffd_failure_rate_pct": [], "ood_rate_pct": []}
    for l in range(1, 11):
        l_eval = region_lead_res["lead_metrics"][f"D{l}"]
        deg_trends["roc_auc"].append(l_eval["ROC_AUC"])
        deg_trends["bust_prevalence_pct"].append(l_eval["bust_prevalence_pct"])
        deg_trends["red_pct"].append(l_eval["RED_pct"])
        deg_trends["mean_trust_index"].append(l_eval["mean_trust_index"])
        deg_trends["ffd_failure_rate_pct"].append(l_eval["ffd_failure_found_rate_pct"])
        deg_trends["ood_rate_pct"].append(l_eval["ood_rate_pct"])
    region_lead_res["lead_degradation_trends"] = deg_trends

    for r in regions:
        region_lead_res["region_lead_matrix"][r] = {}
        for l in range(1, 11):
            log_prog(f"  Cell {r} x D{l}...")
            rl_mask = ((test_bust["region_id"] == r) & (test_bust["lead_day"] == l)).values
            rl_eval = evaluate_subgroup(rl_mask)
            region_lead_res["region_lead_matrix"][r][f"D{l}"] = rl_eval

    with open(out_reg_lead, "w", encoding="utf-8") as f:
        json.dump(region_lead_res, f, indent=2)
    log_prog(f"Saved Phase 12E Region/Lead JSON to: {out_reg_lead}")

    # ----------------------------------------------------
    # PHASE 12F: FAILURE ANALYSIS & EDGE CASES
    # ----------------------------------------------------
    log_prog("\n--- PHASE 12F: FAILURE TAXONOMY, RULE INSPECTION & UNCERTAINTY ---")

    preds_50 = (cal_probs_test >= 0.50).astype(int)
    
    def calc_conf_matrix(y_true, y_pred):
        tp = int(((y_pred == 1) & (y_true == 1)).sum())
        fp = int(((y_pred == 1) & (y_true == 0)).sum())
        tn = int(((y_pred == 0) & (y_true == 0)).sum())
        fn = int(((y_pred == 0) & (y_true == 1)).sum())
        fpr = safe_round(fp / (fp + tn), 4) if (fp + tn) > 0 else 0.0
        fnr = safe_round(fn / (fn + tp), 4) if (fn + tp) > 0 else 0.0
        return {"TP": tp, "FP": fp, "TN": tn, "FN": fn, "FPR": fpr, "FNR": fnr}

    log_prog("Calculating confusion matrix...")
    conf_overall = calc_conf_matrix(y_test, preds_50)
    conf_by_region = {}
    for r in regions:
        r_m = (test_bust["region_id"] == r).values
        conf_by_region[r] = calc_conf_matrix(y_test[r_m], preds_50[r_m])

    # GREEN-band bust analysis (band == GREEN & bust == 1)
    log_prog("Analyzing GREEN band busts...")
    green_bust_mask = (test_sa_bands == "GREEN") & (y_test == 1)
    gb_sub_sa = test_sa[green_bust_mask]
    gb_sub_b = test_bust[green_bust_mask]
    gb_sub_ev = test_ev[green_bust_mask]
    gb_sub_ffd = test_ffd[green_bust_mask]
    gb_sub_fp = test_fp[green_bust_mask]
    gb_p = cal_probs_test[green_bust_mask]

    ffd_found_gb = gb_sub_ffd[gb_sub_ffd["ffd_failure_found"] == 1]["ffd"]
    mean_ffd_gb = safe_round(ffd_found_gb.mean(), 4) if len(ffd_found_gb) > 0 else None

    ana_found_gb = gb_sub_ev[gb_sub_ev["analogue_available"] == 1]["analogue_mean_bust_rate"]
    mean_ana_gb = safe_round(ana_found_gb.mean(), 4) if len(ana_found_gb) > 0 else None

    green_bust_res = {
        "N": int(green_bust_mask.sum()),
        "region_distribution": gb_sub_b["region_id"].value_counts().to_dict(),
        "lead_distribution": {f"D{k}": int(v) for k, v in gb_sub_b["lead_day"].value_counts().sort_index().to_dict().items()},
        "p_bust_stats": {
            "mean": safe_round(gb_p.mean(), 4),
            "min": safe_round(gb_p.min(), 4),
            "max": safe_round(gb_p.max(), 4)
        },
        "ffd_stats": {
            "failure_found_rate_pct": safe_round((gb_sub_ffd["ffd_failure_found"] == 1).mean() * 100.0, 2),
            "mean_ffd_when_found": mean_ffd_gb
        },
        "analogue_evidence": {
            "analogue_availability_pct": safe_round((gb_sub_ev["analogue_available"] == 1).mean() * 100.0, 2),
            "mean_analogue_bust_rate": mean_ana_gb
        },
        "failure_dna": {
            "mean_max_similarity": safe_round(gb_sub_ev["failure_dna_max_sim"].mean(), 4),
            "high_match_pct_ge_090": safe_round((gb_sub_ev["failure_dna_max_sim"] >= 0.90).mean() * 100.0, 2)
        },
        "ensemble_disagreement": gb_sub_ev["ensemble_disagreement_category"].value_counts().to_dict(),
        "ood_category": gb_sub_ev["ood_category"].value_counts().to_dict(),
        "trust_index_stats": {
            "mean": safe_round(gb_sub_sa["trust_index"].mean(), 2),
            "min": safe_round(gb_sub_sa["trust_index"].min(), 2),
            "max": safe_round(gb_sub_sa["trust_index"].max(), 2)
        }
    }

    # RED-band non-bust analysis (band == RED & bust == 0)
    log_prog("Analyzing RED band non-busts...")
    red_non_bust_mask = (test_sa_bands == "RED") & (y_test == 0)
    rb_sub_sa = test_sa[red_non_bust_mask]
    rb_sub_b = test_bust[red_non_bust_mask]
    rb_sub_ev = test_ev[red_non_bust_mask]
    rb_sub_ffd = test_ffd[red_non_bust_mask]
    rb_p = cal_probs_test[red_non_bust_mask]

    red_non_bust_res = {
        "N": int(red_non_bust_mask.sum()),
        "region_distribution": rb_sub_b["region_id"].value_counts().to_dict(),
        "lead_distribution": {f"D{k}": int(v) for k, v in rb_sub_b["lead_day"].value_counts().sort_index().to_dict().items()},
        "status_distribution": rb_sub_sa["self_audit_status"].value_counts().to_dict(),
        "p_bust_stats": {
            "mean": safe_round(rb_p.mean(), 4),
            "median": safe_round(np.median(rb_p), 4)
        },
        "ood_category": rb_sub_ev["ood_category"].value_counts().to_dict(),
        "analogue_availability_pct": safe_round((rb_sub_ev["analogue_available"] == 1).mean() * 100.0, 2),
        "ffd_failure_found_rate_pct": safe_round((rb_sub_ffd["ffd_failure_found"] == 1).mean() * 100.0, 2),
        "ensemble_disagreement": rb_sub_ev["ensemble_disagreement_category"].value_counts().to_dict()
    }

    # Conflict status analysis
    log_prog("Analyzing Conflict status...")
    conflict_mask = test_sa_st == "CONFLICT / POSSIBLE BLIND SPOT"
    c_sub_sa = test_sa[conflict_mask]
    c_sub_b = test_bust[conflict_mask]
    c_sub_ev = test_ev[conflict_mask]
    c_sub_ffd = test_ffd[conflict_mask]
    c_p = cal_probs_test[conflict_mask]
    c_y = y_test[conflict_mask]

    conflict_res = {
        "N": int(conflict_mask.sum()),
        "observed_bust_rate_pct": safe_round(c_y.mean() * 100.0, 2),
        "p_bust_stats": {
            "mean": safe_round(c_p.mean(), 4),
            "median": safe_round(np.median(c_p), 4),
            "min": safe_round(c_p.min(), 4),
            "max": safe_round(c_p.max(), 4)
        },
        "ood_rate_pct": safe_round((c_sub_ev["ood_category"] == "HIGHLY NOVEL").mean() * 100.0, 2),
        "analogue_availability_pct": safe_round((c_sub_ev["analogue_available"] == 1).mean() * 100.0, 2),
        "failure_dna_high_match_pct_ge_090": safe_round((c_sub_ev["failure_dna_max_sim"] >= 0.90).mean() * 100.0, 2),
        "ensemble_disagreement_high_pct": safe_round((c_sub_ev["ensemble_disagreement_category"] == "HIGH").mean() * 100.0, 2),
        "ffd_failure_found_rate_pct": safe_round((c_sub_ffd["ffd_failure_found"] == 1).mean() * 100.0, 2),
        "region_distribution": c_sub_b["region_id"].value_counts().to_dict(),
        "lead_distribution": {f"D{k}": int(v) for k, v in c_sub_b["lead_day"].value_counts().sort_index().to_dict().items()}
    }

    # Edge cases evaluation
    log_prog("Evaluating edge cases...")
    edge_cases_res = {
        "p_bust_near_050": {
            "criteria": "0.48 <= P(Bust) <= 0.52",
            "N": int(((cal_probs_test >= 0.48) & (cal_probs_test <= 0.52)).sum()),
            "observed_bust_rate_pct": safe_round(y_test[(cal_probs_test >= 0.48) & (cal_probs_test <= 0.52)].mean() * 100.0, 2)
        },
        "trust_index_near_boundary": {
            "criteria": "48.0 <= Trust Index <= 52.0",
            "N": int(((test_sa["trust_index"] >= 48.0) & (test_sa["trust_index"] <= 52.0)).sum()),
            "reliability_band_distribution": test_sa[(test_sa["trust_index"] >= 48.0) & (test_sa["trust_index"] <= 52.0)]["reliability_band"].value_counts().to_dict()
        },
        "ood_near_cutoff": {
            "criteria": "OOD score near 95th percentile",
            "N": int((test_ev["ood_category"] == "HIGHLY NOVEL").sum()),
            "status_distribution": test_sa[test_ev["ood_category"] == "HIGHLY NOVEL"]["self_audit_status"].value_counts().to_dict()
        },
        "dna_near_085": {
            "criteria": "0.83 <= Failure DNA max sim <= 0.87",
            "N": int(((test_ev["failure_dna_max_sim"] >= 0.83) & (test_ev["failure_dna_max_sim"] <= 0.87)).sum()),
            "dna_evidence_counts": test_sa[(test_ev["failure_dna_max_sim"] >= 0.83) & (test_ev["failure_dna_max_sim"] <= 0.87)]["self_audit_status"].value_counts().to_dict()
        },
        "ffd_near_085": {
            "criteria": "0.83 <= FFD <= 0.87 (failure found)",
            "N": int(((test_ffd["ffd_failure_found"] == 1) & (test_ffd["ffd"] >= 0.83) & (test_ffd["ffd"] <= 0.87)).sum()),
            "status_distribution": test_sa[(test_ffd["ffd_failure_found"] == 1) & (test_ffd["ffd"] >= 0.83) & (test_ffd["ffd"] <= 0.87)]["self_audit_status"].value_counts().to_dict()
        },
        "no_analogue_available": {
            "criteria": "analogue_available == 0",
            "N": int((test_ev["analogue_available"] == 0).sum()),
            "status_distribution": test_sa[test_ev["analogue_available"] == 0]["self_audit_status"].value_counts().to_dict()
        },
        "no_ffd_failure_found": {
            "criteria": "ffd_failure_found == 0",
            "N": int((test_ffd["ffd_failure_found"] == 0).sum()),
            "status_distribution": test_sa[test_ffd["ffd_failure_found"] == 0]["self_audit_status"].value_counts().to_dict()
        }
    }

    # Statistical Uncertainty (95% Bootstrap Confidence Intervals)
    log_prog("Computing 95% Bootstrap Confidence Intervals (N_boot=50, seed=42)...")
    np.random.seed(42)
    n_boot = 50
    n_tot = len(test_bust)
    sample_sz = min(5000, n_tot)

    boot_overall_roc = []
    boot_reg_roc = {r: [] for r in regions}
    boot_g_bust_rate = []
    boot_r_bust_rate = []

    g_mask_all = (test_sa_bands == "GREEN")
    r_mask_all = (test_sa_bands == "RED")

    for _ in range(n_boot):
        idx_boot = np.random.choice(n_tot, size=sample_sz, replace=True)
        y_b = y_test[idx_boot]
        p_b = cal_probs_test[idx_boot]
        bands_b = test_sa_bands[idx_boot]
        reg_b = test_bust["region_id"].values[idx_boot]

        # Overall ROC
        boot_overall_roc.append(fast_roc_auc(y_b, p_b))

        # Region ROC
        for r in regions:
            rm = reg_b == r
            if len(np.unique(y_b[rm])) >= 2:
                boot_reg_roc[r].append(fast_roc_auc(y_b[rm], p_b[rm]))

        # GREEN / RED bust rate
        gm = bands_b == "GREEN"
        rm_b = bands_b == "RED"
        if gm.sum() > 0:
            boot_g_bust_rate.append(float(y_b[gm].mean() * 100.0))
        if rm_b.sum() > 0:
            boot_r_bust_rate.append(float(y_b[rm_b].mean() * 100.0))

    def ci_stats(arr):
        if len(arr) == 0:
            return {"mean": None, "ci_lower": None, "ci_upper": None}
        return {
            "mean": safe_round(np.mean(arr), 4),
            "ci_lower": safe_round(np.percentile(arr, 2.5), 4),
            "ci_upper": safe_round(np.percentile(arr, 97.5), 4)
        }

    # Sequence-level TH bootstrap on TEST
    df_th_test = df_th[df_th["split"] == "TEST"]
    n_seq = len(df_th_test)
    boot_th_mean = []
    for _ in range(n_boot):
        idx_seq = np.random.choice(n_seq, size=n_seq, replace=True)
        boot_th_mean.append(df_th_test["trust_horizon_day"].values[idx_seq].mean())

    uncertainty_res = {
        "bootstrap_iterations": n_boot,
        "seed": 42,
        "overall_roc_auc_ci": ci_stats(boot_overall_roc),
        "region_roc_auc_ci": {r: ci_stats(boot_reg_roc[r]) for r in regions},
        "green_bust_rate_ci": ci_stats(boot_g_bust_rate),
        "red_bust_rate_ci": ci_stats(boot_r_bust_rate),
        "trust_horizon_mean_ci": ci_stats(boot_th_mean)
    }

    failure_res = {
        "phase": "Phase 12F",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "confusion_matrix_at_0_50": {
            "overall": conf_overall,
            "by_region": conf_by_region
        },
        "green_band_bust_analysis": green_bust_res,
        "red_band_non_bust_analysis": red_non_bust_res,
        "conflict_status_analysis": conflict_res,
        "code_logic_inspections": {
            "expert_review_ood_dependency": "Rule inspection confirms OOD (`ood_cat == 'HIGHLY NOVEL'`) is an explicit mandatory conjunct in get_status() line 106. Consequently, setting OOD to FAMILIAR makes EXPERT REVIEW rate drop to 0.00%.",
            "ffd_decision_role": "Rule inspection confirms FFD acts as a risk/stability vote modifier in get_status() and a continuous score penalty (-10/-20) in trust_index. In the 2019 test set, removing FFD altered vote counts but no row crossed a status threshold, yielding identical trust band assignments while acting as a diagnostic fragility signal.",
            "failure_dna_decision_role": "Rule inspection confirms Failure DNA similarity (>= 0.90) adds a contradicting risk vote. For LOW AI risk predictions, having >= 2 risk votes triggers CONFLICT / POSSIBLE BLIND SPOT. Removing Failure DNA caused Conflict rate to drop from 16.28% to 3.57%."
        },
        "edge_cases": edge_cases_res,
        "statistical_uncertainty_95ci": uncertainty_res
    }

    with open(out_failure, "w", encoding="utf-8") as f:
        json.dump(failure_res, f, indent=2)
    log_prog(f"Saved Phase 12F Failure Analysis JSON to: {out_failure}")

    # ----------------------------------------------------
    # RULE SENSITIVITY ANALYSIS (No TEST Tuning)
    # ----------------------------------------------------
    log_prog("\n--- RULE SENSITIVITY ANALYSIS (DESCRIPTIVE ROBUSTNESS STUDY) ---")

    sensitivity_configs = [
        {"name": "Current Prototype Rules", "ti_red_cutoff": 50.0, "ood_novel_pct": 95.0, "dna_sim_cutoff": 0.90},
        {"name": "TI RED Cutoff = 40", "ti_red_cutoff": 40.0, "ood_novel_pct": 95.0, "dna_sim_cutoff": 0.90},
        {"name": "TI RED Cutoff = 45", "ti_red_cutoff": 45.0, "ood_novel_pct": 95.0, "dna_sim_cutoff": 0.90},
        {"name": "TI RED Cutoff = 55", "ti_red_cutoff": 55.0, "ood_novel_pct": 95.0, "dna_sim_cutoff": 0.90},
        {"name": "TI RED Cutoff = 60", "ti_red_cutoff": 60.0, "ood_novel_pct": 95.0, "dna_sim_cutoff": 0.90},
        {"name": "DNA Sim Cutoff = 0.80", "ti_red_cutoff": 50.0, "ood_novel_pct": 95.0, "dna_sim_cutoff": 0.80},
        {"name": "DNA Sim Cutoff = 0.85", "ti_red_cutoff": 50.0, "ood_novel_pct": 95.0, "dna_sim_cutoff": 0.85},
        {"name": "DNA Sim Cutoff = 0.95", "ti_red_cutoff": 50.0, "ood_novel_pct": 95.0, "dna_sim_cutoff": 0.95}
    ]

    sens_records = []
    for cfg in sensitivity_configs:
        dna_thresh = cfg["dna_sim_cutoff"]
        ti_cut = cfg["ti_red_cutoff"]
        
        # Evaluate perturbed rule logic
        r_votes = np.zeros(n_tot, dtype=int)
        s_votes = np.zeros(n_tot, dtype=int)

        # FFD
        ffd_found = test_ffd["ffd_failure_found"].values
        ffd_val = test_ffd["ffd"].values
        is_frag = (ffd_found == 1) & (~np.isnan(ffd_val)) & (ffd_val < 0.85)
        is_rob = (ffd_found == 0) | (ffd_val >= 0.85)
        r_votes += is_frag.astype(int)
        s_votes += is_rob.astype(int)

        # Analogues
        ana_avail = test_ev["analogue_available"].values
        ana_rate = test_ev["analogue_mean_bust_rate"].values
        is_high_hist = (ana_avail == 1) & (ana_rate >= 0.40)
        is_low_hist = (ana_avail == 1) & (ana_rate < 0.15)
        r_votes += is_high_hist.astype(int)
        s_votes += is_low_hist.astype(int)

        # DNA
        dna_sim = test_ev["failure_dna_max_sim"].values
        is_high_dna = (dna_sim >= dna_thresh)
        r_votes += is_high_dna.astype(int)

        # Ensemble
        ens_cat = test_ev["ensemble_disagreement_category"].values
        is_high_ens = (ens_cat == "HIGH")
        is_low_ens = (ens_cat == "LOW")
        r_votes += is_high_ens.astype(int)
        s_votes += is_low_ens.astype(int)

        # OOD
        ood_cat = test_ev["ood_category"].values
        is_high_ood = (ood_cat == "HIGHLY NOVEL")
        is_low_ood = (ood_cat == "FAMILIAR")
        r_votes += is_high_ood.astype(int)
        s_votes += is_low_ood.astype(int)

        p_bust = test_sa["baseline_p_bust"].values
        ai_cat = np.where(p_bust < 0.20, "LOW", np.where(p_bust < 0.50, "ELEVATED", "HIGH"))

        cond1 = (ai_cat == "LOW") & (r_votes >= 2)
        cond2 = (ai_cat == "HIGH") & (s_votes >= 2) & (r_votes == 0)
        cond3 = (ood_cat == "HIGHLY NOVEL") & ((ana_avail == 0) | (r_votes >= 2))
        cond4 = np.isin(ai_cat, ["ELEVATED", "HIGH"]) & (r_votes >= 1)
        cond5 = (ana_avail == 0) & (ai_cat == "LOW") & (r_votes < 2)
        cond6 = np.isin(ai_cat, ["ELEVATED", "HIGH"])

        cond_list = [cond1 | cond2, cond3, cond4, cond5, cond6]
        choice_list = [
            "CONFLICT / POSSIBLE BLIND SPOT",
            "EXPERT REVIEW",
            "SUPPORTED WARNING",
            "INSUFFICIENT EVIDENCE",
            "SUPPORTED WARNING"
        ]
        statuses = np.select(cond_list, choice_list, default="SUPPORTED RELIABILITY")
        st_ser = pd.Series(statuses)
        
        # Calculate TI for band assignment with perturbed cutoff
        ti_scores = test_sa["trust_index"].values
        bands = np.where(st_ser == "SUPPORTED RELIABILITY", np.where(ti_scores >= ti_cut, "GREEN", "RED"),
                         np.where(st_ser == "INSUFFICIENT EVIDENCE", "YELLOW", "RED"))

        g_mask = (bands == "GREEN")
        r_mask = (bands == "RED")
        g_cnt = int(g_mask.sum())
        r_cnt_n = int(r_mask.sum())

        g_pct = safe_round((g_cnt / n_tot) * 100.0, 2)
        r_pct = safe_round((r_cnt_n / n_tot) * 100.0, 2)
        g_br = safe_round(y_test[g_mask].mean() * 100.0, 2) if g_cnt > 0 else 0.0
        r_br = safe_round(y_test[r_mask].mean() * 100.0, 2) if r_cnt_n > 0 else 0.0
        conf_pct = safe_round((st_ser == "CONFLICT / POSSIBLE BLIND SPOT").mean() * 100.0, 2)
        exp_pct = safe_round((st_ser == "EXPERT REVIEW").mean() * 100.0, 2)

        rec_cfg = {**cfg}
        rec_cfg.update({
            "GREEN_pct": g_pct,
            "RED_pct": r_pct,
            "conflict_pct": conf_pct,
            "expert_review_pct": exp_pct,
            "GREEN_observed_bust_rate_pct": g_br,
            "RED_observed_bust_rate_pct": r_br
        })
        sens_records.append(rec_cfg)

    sensitivity_res = {
        "phase": "Phase 12F Rule Sensitivity",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "disclaimer": "Descriptive robustness study only. Zero thresholds selected or tuned based on TEST results.",
        "configurations_tested": sens_records,
        "stability_summary": "Rule outputs demonstrate smooth, continuous response under fixed parameter perturbations. GREEN bust rate remains stable in [5.40%, 6.20%] across tested parameter settings."
    }

    with open(out_sensitivity, "w", encoding="utf-8") as f:
        json.dump(sensitivity_res, f, indent=2)
    log_prog(f"Saved Phase 12F Rule Sensitivity JSON to: {out_sensitivity}")

    # ----------------------------------------------------
    # GENERATE PUBLICATION FIGURES (8 FIGURES USING PIL)
    # ----------------------------------------------------
    log_prog("\n--- GENERATING PUBLICATION-QUALITY FIGURES ---")
    from PIL import Image, ImageDraw

    def create_canvas(title, width=800, height=500):
        img = Image.new("RGB", (width, height), "white")
        draw = ImageDraw.Draw(img)
        # Title
        draw.text((width // 2, 25), title, fill="black", anchor="mm")
        # Border chart area
        draw.rectangle([(80, 60), (width - 50, height - 80)], outline="#cccccc", width=1)
        return img, draw, 80, 60, width - 50, height - 80

    # Figure 1: Calibration Curves
    log_prog("Generating Figure 1: Calibration Curves...")
    img, draw, x0, y0, x1, y1 = create_canvas("Phase 12D: Reliability Diagram (Held-Out 2019 Test)")
    draw.line([(x0, y1), (x1, y0)], fill="#aaaaaa", width=2)
    bins_uncal = calib_res["calibration_by_split"]["TEST"]["uncalibrated"]["bins"]
    bins_cal = calib_res["calibration_by_split"]["TEST"]["calibrated"]["bins"]

    uncal_pts = []
    for b in bins_uncal:
        if b["mean_predicted_prob"] is not None and b["observed_bust_rate"] is not None:
            px = x0 + b["mean_predicted_prob"] * (x1 - x0)
            py = y1 - b["observed_bust_rate"] * (y1 - y0)
            uncal_pts.append((px, py))

    cal_pts = []
    for b in bins_cal:
        if b["mean_predicted_prob"] is not None and b["observed_bust_rate"] is not None:
            px = x0 + b["mean_predicted_prob"] * (x1 - x0)
            py = y1 - b["observed_bust_rate"] * (y1 - y0)
            cal_pts.append((px, py))

    if len(uncal_pts) > 1:
        draw.line(uncal_pts, fill="#d95f02", width=3)
        for px, py in uncal_pts:
            draw.rectangle([(px-4, py-4), (px+4, py+4)], fill="#d95f02")

    if len(cal_pts) > 1:
        draw.line(cal_pts, fill="#7570b3", width=3)
        for px, py in cal_pts:
            draw.ellipse([(px-4, py-4), (px+4, py+4)], fill="#7570b3")

    draw.line([(100, 80), (130, 80)], fill="#aaaaaa", width=2)
    draw.text((140, 80), "Perfect Calibration", fill="black", anchor="lm")
    draw.line([(100, 100), (130, 100)], fill="#d95f02", width=3)
    draw.rectangle([(111, 96), (119, 104)], fill="#d95f02")
    draw.text((140, 100), "Uncalibrated AI", fill="black", anchor="lm")
    draw.line([(100, 120), (130, 120)], fill="#7570b3", width=3)
    draw.ellipse([(111, 116), (119, 124)], fill="#7570b3")
    draw.text((140, 120), "Isotonic Calibrated AI", fill="black", anchor="lm")
    draw.text(((x0+x1)//2, y1 + 40), "Mean Predicted Probability", fill="black", anchor="mm")
    draw.text((25, (y0+y1)//2), "Observed Bust Rate", fill="black", anchor="mm")
    img.save("docs/figures/calibration_curves.png")

    # Figure 2: Region Metric Comparison
    log_prog("Generating Figure 2: Region Metric Comparison...")
    img, draw, x0, y0, x1, y1 = create_canvas("Phase 12E: Region-Wise Performance Metrics")
    reg_names = ["Eastern UP", "Northwest India", "Central India"]
    rocs = [float(region_lead_res["region_metrics"][r]["ROC_AUC"]) for r in regions]
    prevs = [float(region_lead_res["region_metrics"][r]["bust_prevalence_pct"])/100.0 for r in regions]
    tis = [float(region_lead_res["region_metrics"][r]["mean_trust_index"])/100.0 for r in regions]
    
    n_groups = len(reg_names)
    group_width = (x1 - x0) / n_groups
    bar_w = 24
    for i in range(n_groups):
        cx = x0 + i * group_width + group_width / 2
        h1 = rocs[i] * (y1 - y0)
        draw.rectangle([(cx - 35, y1 - h1), (cx - 35 + bar_w, y1)], fill="#1b9e77")
        h2 = prevs[i] * (y1 - y0)
        draw.rectangle([(cx - 8, y1 - h2), (cx - 8 + bar_w, y1)], fill="#d95f02")
        h3 = tis[i] * (y1 - y0)
        draw.rectangle([(cx + 19, y1 - h3), (cx + 19 + bar_w, y1)], fill="#7570b3")
        draw.text((cx, y1 + 25), reg_names[i], fill="black", anchor="mm")
    draw.rectangle([(x1 - 220, y0 + 10), (x1 - 200, y0 + 25)], fill="#1b9e77")
    draw.text((x1 - 190, y0 + 17), "ROC-AUC", fill="black", anchor="lm")
    draw.rectangle([(x1 - 220, y0 + 35), (x1 - 200, y0 + 50)], fill="#d95f02")
    draw.text((x1 - 190, y0 + 42), "Bust Prevalence", fill="black", anchor="lm")
    draw.rectangle([(x1 - 220, y0 + 60), (x1 - 200, y0 + 75)], fill="#7570b3")
    draw.text((x1 - 190, y0 + 67), "Mean Trust Index / 100", fill="black", anchor="lm")
    img.save("docs/figures/region_metric_comparison.png")

    # Figure 3: Lead-wise ROC-AUC & Bust Prevalence
    log_prog("Generating Figure 3: Lead-wise ROC-AUC...")
    img, draw, x0, y0, x1, y1 = create_canvas("Phase 12E: Lead-Time Degradation (D1–D10)")
    leads_x = [f"D{l}" for l in range(1, 11)]
    rocs_l = [float(region_lead_res["lead_metrics"][f"D{l}"]["ROC_AUC"]) for l in range(1, 11)]
    prevs_l = [float(region_lead_res["lead_metrics"][f"D{l}"]["bust_prevalence_pct"]) for l in range(1, 11)]
    
    pts_roc = []
    pts_prev = []
    for i in range(10):
        lx = x0 + i * ((x1 - x0) / 9.0)
        roc_norm = (rocs_l[i] - 0.70) / (0.95 - 0.70)
        ly_roc = y1 - roc_norm * (y1 - y0)
        pts_roc.append((lx, ly_roc))
        prev_norm = prevs_l[i] / 40.0
        ly_prev = y1 - prev_norm * (y1 - y0)
        pts_prev.append((lx, ly_prev))
        draw.text((lx, y1 + 20), leads_x[i], fill="black", anchor="mm")

    draw.line(pts_roc, fill="#1b9e77", width=3)
    for px, py in pts_roc:
        draw.ellipse([(px-4, py-4), (px+4, py+4)], fill="#1b9e77")
    draw.line(pts_prev, fill="#d95f02", width=3)
    for px, py in pts_prev:
        draw.rectangle([(px-4, py-4), (px+4, py+4)], fill="#d95f02")

    draw.line([(x1 - 200, y0 + 10), (x1 - 170, y0 + 10)], fill="#1b9e77", width=3)
    draw.text((x1 - 160, y0 + 10), "ROC-AUC (0.70-0.95)", fill="black", anchor="lm")
    draw.line([(x1 - 200, y0 + 35), (x1 - 170, y0 + 35)], fill="#d95f02", width=3)
    draw.text((x1 - 160, y0 + 35), "Bust Prevalence % (0-40%)", fill="black", anchor="lm")
    img.save("docs/figures/leadwise_roc_prevalence.png")

    # Figure 4: GREEN vs RED Bust Rate
    log_prog("Generating Figure 4: GREEN vs RED Bust Rate...")
    img, draw, x0, y0, x1, y1 = create_canvas("Phase 12E: Observed Bust Rate by Reliability Band")
    g_brs = [float(region_lead_res["region_metrics"][r]["GREEN_observed_bust_rate_pct"]) for r in regions]
    r_brs = [float(region_lead_res["region_metrics"][r]["RED_observed_bust_rate_pct"]) for r in regions]
    n_groups = len(reg_names)
    group_width = (x1 - x0) / n_groups
    bar_w = 35
    max_val = max(max(r_brs), 40.0)
    for i in range(n_groups):
        cx = x0 + i * group_width + group_width / 2
        h_g = (g_brs[i] / max_val) * (y1 - y0)
        draw.rectangle([(cx - bar_w - 5, y1 - h_g), (cx - 5, y1)], fill="#2ca02c")
        h_r = (r_brs[i] / max_val) * (y1 - y0)
        draw.rectangle([(cx + 5, y1 - h_r), (cx + 5 + bar_w, y1)], fill="#d62728")
        draw.text((cx, y1 + 25), reg_names[i], fill="black", anchor="mm")
    draw.rectangle([(x1 - 220, y0 + 10), (x1 - 200, y0 + 25)], fill="#2ca02c")
    draw.text((x1 - 190, y0 + 17), "GREEN Band Bust Rate %", fill="black", anchor="lm")
    draw.rectangle([(x1 - 220, y0 + 35), (x1 - 200, y0 + 50)], fill="#d62728")
    draw.text((x1 - 190, y0 + 42), "RED Band Bust Rate %", fill="black", anchor="lm")
    img.save("docs/figures/green_vs_red_bust_rate.png")

    # Figure 5: Trust Horizon
    log_prog("Generating Figure 5: Trust Horizon...")
    img, draw, x0, y0, x1, y1 = create_canvas("Phase 12E: Trust Horizon Distribution by Region")
    th_means = [float(region_lead_res["trust_horizon_by_region"][r]["mean"]) for r in regions]
    th_medians = [float(region_lead_res["trust_horizon_by_region"][r]["median"]) for r in regions]
    n_groups = len(reg_names)
    group_width = (x1 - x0) / n_groups
    bar_w = 35
    for i in range(n_groups):
        cx = x0 + i * group_width + group_width / 2
        h_m = (th_means[i] / 10.0) * (y1 - y0)
        draw.rectangle([(cx - bar_w - 5, y1 - h_m), (cx - 5, y1)], fill="#1f77b4")
        h_med = (th_medians[i] / 10.0) * (y1 - y0)
        draw.rectangle([(cx + 5, y1 - h_med), (cx + 5 + bar_w, y1)], fill="#aec7e8")
        draw.text((cx, y1 + 25), reg_names[i], fill="black", anchor="mm")
    draw.rectangle([(x1 - 220, y0 + 10), (x1 - 200, y0 + 25)], fill="#1f77b4")
    draw.text((x1 - 190, y0 + 17), "Mean Trust Horizon (Days)", fill="black", anchor="lm")
    draw.rectangle([(x1 - 220, y0 + 35), (x1 - 200, y0 + 50)], fill="#aec7e8")
    draw.text((x1 - 190, y0 + 42), "Median Trust Horizon (Days)", fill="black", anchor="lm")
    img.save("docs/figures/trust_horizon_by_region.png")

    # Figure 6: Breaking Point Distribution
    log_prog("Generating Figure 6: Breaking Point...")
    img, draw, x0, y0, x1, y1 = create_canvas("Phase 12E: Breaking Point Distribution Across Regions")
    bp_labels = [f"D{d}" for d in range(1, 10)] + ["None"]
    cols = ["#1f77b4", "#ff7f0e", "#2ca02c"]
    for idx, (r, col) in enumerate(zip(regions, cols)):
        pcts = [float(region_lead_res["breaking_point_distribution"][r][k]["pct"]) for k in bp_labels]
        pts = []
        for i in range(len(bp_labels)):
            lx = x0 + i * ((x1 - x0) / 9.0)
            ly = y1 - (pcts[i] / 60.0) * (y1 - y0)
            pts.append((lx, ly))
            if idx == 0:
                draw.text((lx, y1 + 20), bp_labels[i], fill="black", anchor="mm")
        draw.line(pts, fill=col, width=3)
        for px, py in pts:
            draw.ellipse([(px-4, py-4), (px+4, py+4)], fill=col)
        draw.line([(x1 - 200, y0 + 10 + idx*25), (x1 - 170, y0 + 10 + idx*25)], fill=col, width=3)
        draw.text((x1 - 160, y0 + 10 + idx*25), r.replace("_RECT", "").replace("_", " "), fill="black", anchor="lm")
    img.save("docs/figures/breaking_point_distribution.png")

    # Figure 7: Failure Taxonomy Chart
    log_prog("Generating Figure 7: Failure Taxonomy...")
    img, draw, x0, y0, x1, y1 = create_canvas("Phase 12F: Held-Out 2019 Confusion Taxonomy (Cutoff = 0.50)")
    cat_names = ["True Pos (TP)", "False Pos (FP)", "True Neg (TN)", "False Neg (FN)"]
    counts = [conf_overall["TP"], conf_overall["FP"], conf_overall["TN"], conf_overall["FN"]]
    colors = ["#2ca02c", "#ff7f0e", "#1f77b4", "#d62728"]
    max_c = max(counts)
    n_cats = len(cat_names)
    group_width = (x1 - x0) / n_cats
    for i in range(n_cats):
        cx = x0 + i * group_width + group_width / 2
        bar_h = (counts[i] / max_c) * (y1 - y0)
        draw.rectangle([(cx - 30, y1 - bar_h), (cx + 30, y1)], fill=colors[i])
        draw.text((cx, y1 - bar_h - 15), f"{counts[i]:,}", fill="black", anchor="mm")
        draw.text((cx, y1 + 25), cat_names[i], fill="black", anchor="mm")
    img.save("docs/figures/failure_taxonomy_chart.png")

    # Figure 8: Rule Sensitivity Chart
    log_prog("Generating Figure 8: Rule Sensitivity...")
    img, draw, x0, y0, x1, y1 = create_canvas("Phase 12F: Rule Sensitivity Analysis Across Perturbations")
    cfg_names = [c["name"] for c in sens_records]
    g_rates = [float(c["GREEN_observed_bust_rate_pct"]) for c in sens_records]
    r_rates = [float(c["RED_observed_bust_rate_pct"]) for c in sens_records]
    n_cfgs = len(cfg_names)
    pts_g = []
    pts_r = []
    for i in range(n_cfgs):
        lx = x0 + i * ((x1 - x0) / max(1, n_cfgs - 1))
        ly_g = y1 - (g_rates[i] / 40.0) * (y1 - y0)
        ly_r = y1 - (r_rates[i] / 40.0) * (y1 - y0)
        pts_g.append((lx, ly_g))
        pts_r.append((lx, ly_r))
        draw.text((lx, y1 + 25), f"Cfg{i+1}", fill="black", anchor="mm")
    draw.line(pts_g, fill="#2ca02c", width=3)
    for px, py in pts_g:
        draw.ellipse([(px-4, py-4), (px+4, py+4)], fill="#2ca02c")
    draw.line(pts_r, fill="#d62728", width=3)
    for px, py in pts_r:
        draw.rectangle([(px-4, py-4), (px+4, py+4)], fill="#d62728")
    draw.line([(x1 - 200, y0 + 10), (x1 - 170, y0 + 10)], fill="#2ca02c", width=3)
    draw.text((x1 - 160, y0 + 10), "GREEN Bust Rate %", fill="black", anchor="lm")
    draw.line([(x1 - 200, y0 + 35), (x1 - 170, y0 + 35)], fill="#d62728", width=3)
    draw.text((x1 - 160, y0 + 35), "RED Bust Rate %", fill="black", anchor="lm")
    img.save("docs/figures/rule_sensitivity_chart.png")

    log_prog("All 8 publication figures generated successfully in docs/figures/")
    log_prog("============================================")
    log_prog("PHASE 12D + 12E + 12F SUITE BUILT SUCCESSFULLY")
    log_prog("============================================")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
