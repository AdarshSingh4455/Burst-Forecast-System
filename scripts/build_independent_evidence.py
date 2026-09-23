import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

def no_blas_cosine_sim(A, B):
    norm_A = np.sqrt(np.sum(A**2, axis=1, keepdims=True))
    norm_B = np.sqrt(np.sum(B**2, axis=1, keepdims=True))
    norm_A[norm_A == 0] = 1e-10
    norm_B[norm_B == 0] = 1e-10
    dot_product = np.zeros((A.shape[0], B.shape[0]), dtype=float)
    for i in range(A.shape[1]):
        dot_product += A[:, i:i+1] * B[:, i:i+1].T
    return dot_product / (norm_A * norm_B.T)

df = pd.read_parquet("FORTRESS/data/processed/FORTRESS_FAILURE_INTELLIGENCE.parquet")
df['forecast_init'] = pd.to_datetime(df['forecast_init'])

ood_features = [
    'specific_humidity_gkg_mean', 'temp_2m_c_mean', 'mslp_hpa_mean',
    'pwat_mm_mean', 'wind_speed_mean_ms', 'ensemble_mean_mm',
    'ensemble_spread_mm', 'member_range_mm'
]

train_mask = df['forecast_init'] <= pd.to_datetime('2019-08-30')
scaler_ood = StandardScaler()
X_train_ood = scaler_ood.fit_transform(df.loc[train_mask, ood_features])
X_all_ood = scaler_ood.transform(df[ood_features])

iso_model = IsolationForest(n_estimators=100, random_state=42, n_jobs=1)
iso_model.fit(X_train_ood)

raw_train_scores = -iso_model.decision_function(X_train_ood)
raw_all_scores = -iso_model.decision_function(X_all_ood)

sorted_train_scores = np.sort(raw_train_scores)
df['ood_score'] = (np.searchsorted(sorted_train_scores, raw_all_scores, side='right') / len(sorted_train_scores)) * 100.0

def assign_ood_cat(val):
    if val < 75.0:
        return 'FAMILIAR'
    elif val < 90.0:
        return 'UNUSUAL'
    else:
        return 'HIGHLY NOVEL'

df['ood_category'] = df['ood_score'].apply(assign_ood_cat)

with open("FORTRESS/models/fortress_ood_model.pkl", "wb") as f:
    pickle.dump({"model": iso_model, "scaler": scaler_ood, "features": ood_features}, f)

analogue_features = [
    'specific_humidity_gkg_mean', 'temp_2m_c_mean', 'mslp_hpa_mean',
    'pwat_mm_mean', 'wind_speed_mean_ms', 'ensemble_mean_mm', 'ensemble_spread_mm'
]

analogue_counts = np.zeros(len(df), dtype=int)
analogue_mean_bust_rates = np.zeros(len(df), dtype=float)
analogue_mean_dists = np.zeros(len(df), dtype=float)
analogue_max_sims = np.zeros(len(df), dtype=float)
analogue_agreement_flags = np.zeros(len(df), dtype=int)

analogue_tuples = []
init_dates = sorted(df['forecast_init'].unique())

for t_date in init_dates:
    df_current_t = df[df['forecast_init'] == t_date]
    df_prior = df[df['forecast_init'] < t_date]
    
    if len(df_prior) == 0:
        continue
    
    for lead_day in sorted(df_current_t['lead_day'].unique()):
        curr_mask = (df['forecast_init'] == t_date) & (df['lead_day'] == lead_day)
        prior_mask = (df['forecast_init'] < t_date) & (df['lead_day'] == lead_day)
        
        df_curr_sub = df[curr_mask]
        df_prior_sub = df[prior_mask]
        
        if len(df_prior_sub) == 0:
            continue
        
        scaler_sub = StandardScaler()
        X_prior_sub = scaler_sub.fit_transform(df_prior_sub[analogue_features])
        X_curr_sub = scaler_sub.transform(df_curr_sub[analogue_features])
        
        k_neighbors = min(5, len(df_prior_sub))
        nn = NearestNeighbors(n_neighbors=k_neighbors, metric='euclidean', n_jobs=1)
        nn.fit(X_prior_sub)
        
        distances, indices = nn.kneighbors(X_curr_sub)
        
        curr_indices = df_curr_sub.index.values
        curr_lats = df_curr_sub['latitude'].values
        curr_lons = df_curr_sub['longitude'].values
        
        prior_bust_labels = df_prior_sub['bust_label'].values
        prior_corridors = df_prior_sub['failure_corridor_id'].values
        prior_inits = df_prior_sub['forecast_init'].values
        prior_lats = df_prior_sub['latitude'].values
        prior_lons = df_prior_sub['longitude'].values
        
        for idx_in_sub, global_idx in enumerate(curr_indices):
            dists = distances[idx_in_sub]
            neighbor_sub_indices = indices[idx_in_sub]
            
            b_labels = prior_bust_labels[neighbor_sub_indices]
            mean_b_rate = np.mean(b_labels)
            mean_d = np.mean(dists)
            min_d = np.min(dists)
            max_sim = 1.0 / (1.0 + min_d)
            
            analogue_counts[global_idx] = k_neighbors
            analogue_mean_bust_rates[global_idx] = mean_b_rate
            analogue_mean_dists[global_idx] = mean_d
            analogue_max_sims[global_idx] = max_sim
            analogue_agreement_flags[global_idx] = 1 if mean_b_rate >= 0.5 else 0
            
            t_lat = curr_lats[idx_in_sub]
            t_lon = curr_lons[idx_in_sub]
            
            for rank_i, n_sub_idx in enumerate(neighbor_sub_indices):
                analogue_tuples.append((
                    t_date, lead_day, t_lat, t_lon,
                    rank_i + 1, prior_inits[n_sub_idx], lead_day,
                    prior_lats[n_sub_idx], prior_lons[n_sub_idx],
                    dists[rank_i], b_labels[rank_i], prior_corridors[n_sub_idx]
                ))

df['analogue_count'] = analogue_counts
df['analogue_available'] = (analogue_counts > 0).astype(int)
df['analogue_mean_bust_rate'] = analogue_mean_bust_rates
df['analogue_mean_dist'] = analogue_mean_dists
df['analogue_max_similarity'] = analogue_max_sims
df['analogue_agreement_flag'] = analogue_agreement_flags

analogue_cols = [
    'target_forecast_init', 'target_lead_day', 'target_latitude', 'target_longitude',
    'analogue_rank', 'analogue_forecast_init', 'analogue_lead_day',
    'analogue_latitude', 'analogue_longitude', 'analogue_dist',
    'analogue_bust_label', 'analogue_corridor_id'
]
df_analogues_detail = pd.DataFrame(analogue_tuples, columns=analogue_cols)
df_analogues_detail.to_parquet("FORTRESS/data/processed/FORTRESS_HISTORICAL_ANALOGUES.parquet", index=False)

dna_features = [
    'fingerprint_moisture', 'fingerprint_temperature', 'fingerprint_pressure',
    'fingerprint_wind', 'fingerprint_ensemble', 'fingerprint_novelty'
]

dna_max_sims = np.zeros(len(df), dtype=float)
dna_top3_mean_sims = np.zeros(len(df), dtype=float)
dna_nearest_corridors = np.full(len(df), -1, dtype=int)
dna_risk_flags = np.zeros(len(df), dtype=int)

for t_date in init_dates:
    curr_mask = df['forecast_init'] == t_date
    prior_bust_mask = (df['forecast_init'] < t_date) & (df['bust_label'] == 1)
    
    df_curr_sub = df[curr_mask]
    df_prior_busts = df[prior_bust_mask]
    
    if len(df_prior_busts) == 0:
        continue
    
    curr_indices = df_curr_sub.index.values
    X_curr_dna = df_curr_sub[dna_features].values
    X_prior_bust_dna = df_prior_busts[dna_features].values
    prior_corridors = df_prior_busts['failure_corridor_id'].values
    
    sim_matrix = no_blas_cosine_sim(X_curr_dna, X_prior_bust_dna)
    k_top = min(3, len(df_prior_busts))
    
    for idx_in_sub, global_idx in enumerate(curr_indices):
        sims = sim_matrix[idx_in_sub]
        top_k_idxs = np.argsort(sims)[::-1][:k_top]
        max_sim = sims[top_k_idxs[0]]
        top3_mean = np.mean(sims[top_k_idxs])
        nearest_corridor = prior_corridors[top_k_idxs[0]]
        dna_max_sims[global_idx] = max_sim
        dna_top3_mean_sims[global_idx] = top3_mean
        dna_nearest_corridors[global_idx] = nearest_corridor
        dna_risk_flags[global_idx] = 1 if max_sim >= 0.85 else 0

df['failure_dna_max_sim'] = dna_max_sims
df['failure_dna_top3_mean_sim'] = dna_top3_mean_sims
df['failure_dna_nearest_corridor'] = dna_nearest_corridors
df['failure_dna_risk_flag'] = dna_risk_flags

df['ensemble_spread_percentile'] = df.groupby('lead_day')['ensemble_spread_mm'].rank(pct=True) * 100.0
df['member_range_percentile'] = df.groupby('lead_day')['member_range_mm'].rank(pct=True) * 100.0
df['ensemble_disagreement_score'] = (df['ensemble_spread_percentile'] + df['member_range_percentile']) / 2.0

def assign_disagree_cat(val):
    if val < 60.0:
        return 'LOW'
    elif val < 85.0:
        return 'MODERATE'
    else:
        return 'HIGH'

df['ensemble_disagreement_category'] = df['ensemble_disagreement_score'].apply(assign_disagree_cat)

df.to_parquet("FORTRESS/data/processed/FORTRESS_INDEPENDENT_EVIDENCE.parquet", index=False)
print("SUCCESS: Phase 6 execution complete!", flush=True)
