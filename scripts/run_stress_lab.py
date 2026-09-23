import os
import warnings
warnings.filterwarnings("ignore")

import pickle
import numpy as np
import pandas as pd

dataset_file = os.path.join("data", "processed", "FORTRESS_BUST_INDIA.parquet")
model_file = os.path.join("models", "fortress_bust_model.pkl")
output_file = os.path.join("data", "processed", "FORTRESS_STRESS_RESULTS.parquet")

if not os.path.exists(dataset_file):
    raise FileNotFoundError(f"Input dataset missing: {dataset_file}")

if not os.path.exists(model_file):
    raise FileNotFoundError(f"Trained model missing: {model_file}")

print("Loading dataset and trained Bust Risk AI model...")
df = pd.read_parquet(dataset_file)
with open(model_file, "rb") as f:
    model_bundle = pickle.load(f)

base_model = model_bundle["base_model"]
calibrator = model_bundle["calibrator"]
feature_cols = model_bundle["feature_cols"]

print(f"Loaded dataset ({len(df)} rows) and model ({model_bundle['model_name']}).")

raw_probs = base_model.predict_proba(df[feature_cols])[:, 1]
df["baseline_p_bust"] = calibrator.transform(raw_probs)

n_samples = len(df)
np.random.seed(42)
num_perturbations = 50

d_hum = np.random.uniform(-3.0, 3.0, num_perturbations)
d_tmp = np.random.uniform(-3.0, 3.0, num_perturbations)
d_prs = np.random.uniform(-5.0, 5.0, num_perturbations)
d_wnd = np.random.uniform(-5.0, 5.0, num_perturbations)

norm_dist = np.sqrt((d_hum/3.0)**2 + (d_tmp/3.0)**2 + (d_prs/5.0)**2 + (d_wnd/5.0)**2)

idx_hum = feature_cols.index("specific_humidity_gkg_mean")
idx_tmp = feature_cols.index("temp_2m_c_mean")
idx_prs = feature_cols.index("mslp_hpa_mean")
idx_wnd = feature_cols.index("wind_speed_mean_ms")

print(f"Vectorizing stress testing for {n_samples} forecast states across {num_perturbations} perturbation scenarios...")

X_base = df[feature_cols].copy()

ffd_array = np.full(n_samples, 1.0)
min_sh = np.zeros(n_samples)
min_st = np.zeros(n_samples)
min_sp = np.zeros(n_samples)
min_sw = np.zeros(n_samples)

frag_20 = np.zeros(n_samples)
frag_40 = np.zeros(n_samples)
frag_60 = np.zeros(n_samples)
frag_80 = np.zeros(n_samples)
frag_100 = np.zeros(n_samples)

sorted_pert_indices = np.argsort(norm_dist)

for p_idx in sorted_pert_indices:
    dist = norm_dist[p_idx]
    dh = d_hum[p_idx]
    dt = d_tmp[p_idx]
    dp = d_prs[p_idx]
    dw = d_wnd[p_idx]
    
    X_p = X_base.copy()
    X_p.iloc[:, idx_hum] = np.clip(X_p.iloc[:, idx_hum] + dh, 0.0, 30.0)
    X_p.iloc[:, idx_tmp] = X_p.iloc[:, idx_tmp] + dt
    X_p.iloc[:, idx_prs] = X_p.iloc[:, idx_prs] + dp
    X_p.iloc[:, idx_wnd] = np.clip(X_p.iloc[:, idx_wnd] + dw, 0.0, 50.0)
    
    p_raw = base_model.predict_proba(X_p)[:, 1]
    p_bust = calibrator.transform(p_raw)
    is_bust = p_bust >= 0.5
    
    newly_busted = is_bust & (ffd_array == 1.0)
    ffd_array[newly_busted] = dist
    min_sh[newly_busted] = dh
    min_st[newly_busted] = dt
    min_sp[newly_busted] = dp
    min_sw[newly_busted] = dw
    
    if dist <= 0.2:
        frag_20 += is_bust.astype(int)
    if dist <= 0.4:
        frag_40 += is_bust.astype(int)
    if dist <= 0.6:
        frag_60 += is_bust.astype(int)
    if dist <= 0.8:
        frag_80 += is_bust.astype(int)
    frag_100 += is_bust.astype(int)

c_20 = np.sum(norm_dist <= 0.2) or 1
c_40 = np.sum(norm_dist <= 0.4) or 1
c_60 = np.sum(norm_dist <= 0.6) or 1
c_80 = np.sum(norm_dist <= 0.8) or 1

df["ffd"] = ffd_array
df["min_bust_delta_humidity"] = min_sh
df["min_bust_delta_temp"] = min_st
df["min_bust_delta_mslp"] = min_sp
df["min_bust_delta_wind"] = min_sw
df["fragility_20"] = frag_20 / c_20
df["fragility_40"] = frag_40 / c_40
df["fragility_60"] = frag_60 / c_60
df["fragility_80"] = frag_80 / c_80
df["fragility_100"] = frag_100 / num_perturbations

missing_count = df.isnull().sum().sum()
if missing_count > 0:
    raise ValueError(f"Found {missing_count} missing values in stress testing results!")

df.to_parquet(output_file, index=False)

print("============================================")
print("PHASE 4 - STRESS LAB & FFD COMPLETE")
print(f"Output File: {output_file}")
print(f"Total Rows: {len(df)}")
print(f"Total Columns: {len(df.columns)}")
print(f"Average FFD: {df['ffd'].mean():.4f}")
print(f"Fragile Forecasts (FFD < 0.5): {(df['ffd'] < 0.5).sum()}")
print("============================================")
