import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import sys
import pickle
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

input_file = os.path.join("data", "processed", "FORTRESS_STRESS_RESULTS.parquet")
model_file = os.path.join("models", "fortress_bust_model.pkl")

corridors_output = os.path.join("data", "processed", "FORTRESS_FAILURE_CORRIDORS.parquet")
fingerprints_output = os.path.join("data", "processed", "FORTRESS_FAILURE_FINGERPRINTS.parquet")
master_output = os.path.join("data", "processed", "FORTRESS_FAILURE_INTELLIGENCE.parquet")

if not os.path.exists(input_file):
    raise FileNotFoundError(f"Input stress file missing: {input_file}")

if not os.path.exists(model_file):
    raise FileNotFoundError(f"Model file missing: {model_file}")

print("Loading FORTRESS stress results and trained Bust Risk AI model...")
df = pd.read_parquet(input_file)
with open(model_file, "rb") as f:
    bundle = pickle.load(f)

base_model = bundle["base_model"]
calibrator = bundle["calibrator"]
feature_cols = bundle["feature_cols"]

if hasattr(base_model, "n_jobs"):
    base_model.n_jobs = 1

print(f"Loaded {len(df)} rows. Calculating atmospheric sensitivities...")

def predict_calibrated_probs(X_data):
    results = []
    chunk_size = 2000
    for start in range(0, len(X_data), chunk_size):
        chunk = X_data.iloc[start:start+chunk_size]
        raw_p = base_model.predict_proba(chunk)[:, 1]
        cal_p = calibrator.predict(raw_p)
        results.append(cal_p)
    return np.concatenate(results)

X_base = df[feature_cols].copy()
baseline_p = predict_calibrated_probs(X_base)
df["baseline_p_bust"] = baseline_p

X_hum = X_base.copy()
X_hum["specific_humidity_gkg_mean"] += 2.0
sens_hum = predict_calibrated_probs(X_hum) - baseline_p

X_tmp = X_base.copy()
X_tmp["temp_2m_c_mean"] += 2.0
sens_tmp = predict_calibrated_probs(X_tmp) - baseline_p

X_prs = X_base.copy()
X_prs["mslp_hpa_mean"] -= 3.0
sens_prs = predict_calibrated_probs(X_prs) - baseline_p

X_wnd = X_base.copy()
X_wnd["wind_speed_mean_ms"] += 3.0
sens_wnd = predict_calibrated_probs(X_wnd) - baseline_p

df["sens_humidity"] = sens_humidity = np.maximum(0.0, sens_hum)
df["sens_temperature"] = sens_temperature = np.maximum(0.0, sens_tmp)
df["sens_pressure"] = sens_pressure = np.maximum(0.0, sens_prs)
df["sens_wind"] = sens_wind = np.maximum(0.0, sens_wnd)

print("Building Failure Corridors using KMeans clustering...")
sens_matrix = np.column_stack([sens_humidity, sens_temperature, sens_pressure, sens_wind])
scaler = StandardScaler()
sens_scaled = scaler.fit_transform(sens_matrix)

sil_scores = {}
np.random.seed(42)
sample_indices = np.random.choice(len(df), size=min(3000, len(df)), replace=False)
sens_sample = sens_scaled[sample_indices]

for k in [2, 3, 4]:
    km_test = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels_test = km_test.fit_predict(sens_sample)
    score = silhouette_score(sens_sample, labels_test)
    sil_scores[k] = score
    print(f"K={k}: Silhouette Score = {score:.4f}")

best_k = max(sil_scores, key=sil_scores.get)
print(f"Selected K={best_k} failure corridors (Silhouette Score: {sil_scores[best_k]:.4f}).")

kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
df["failure_corridor_id"] = kmeans.fit_predict(sens_scaled)

corridor_means = df.groupby("failure_corridor_id")[["sens_humidity", "sens_temperature", "sens_pressure", "sens_wind"]].mean()

label_map = {}
for c_id in range(best_k):
    means = corridor_means.loc[c_id]
    dominant_var = means.idxmax()
    if dominant_var == "sens_humidity":
        label_map[c_id] = "Moisture-Driven Instability"
    elif dominant_var == "sens_temperature":
        label_map[c_id] = "Thermal Instability"
    elif dominant_var == "sens_pressure":
        label_map[c_id] = "Pressure Instability"
    elif dominant_var == "sens_wind":
        label_map[c_id] = "Wind / Circulation Sensitive"
    else:
        label_map[c_id] = "Mixed Atmospheric Instability"

df["failure_corridor_label"] = df["failure_corridor_id"].map(label_map)

corridor_summary = df.groupby(["failure_corridor_id", "failure_corridor_label"]).agg(
    number_of_cases=("lead_day", "count"),
    mean_sens_humidity=("sens_humidity", "mean"),
    mean_sens_temperature=("sens_temperature", "mean"),
    mean_sens_pressure=("sens_pressure", "mean"),
    mean_sens_wind=("sens_wind", "mean"),
    mean_ffd=("ffd", "mean"),
    mean_bust_probability=("baseline_p_bust", "mean")
).reset_index()
corridor_summary["percentage_of_cases"] = (corridor_summary["number_of_cases"] / len(df)) * 100.0
corridor_summary.to_parquet(corridors_output, index=False)

print("Calculating 6-dimensional Failure Fingerprints...")
df["fingerprint_moisture"] = (df["sens_humidity"].rank(pct=True) * 100.0).round(2)
df["fingerprint_temperature"] = (df["sens_temperature"].rank(pct=True) * 100.0).round(2)
df["fingerprint_pressure"] = (df["sens_pressure"].rank(pct=True) * 100.0).round(2)
df["fingerprint_wind"] = (df["sens_wind"].rank(pct=True) * 100.0).round(2)
df["fingerprint_ensemble"] = (df["ensemble_spread_mm"].rank(pct=True) * 100.0).round(2)

norm_q = (df["specific_humidity_gkg_mean"] - df["specific_humidity_gkg_mean"].mean()) / df["specific_humidity_gkg_mean"].std()
norm_t = (df["temp_2m_c_mean"] - df["temp_2m_c_mean"].mean()) / df["temp_2m_c_mean"].std()
norm_p = (df["mslp_hpa_mean"] - df["mslp_hpa_mean"].mean()) / df["mslp_hpa_mean"].std()
norm_w = (df["wind_speed_mean_ms"] - df["wind_speed_mean_ms"].mean()) / df["wind_speed_mean_ms"].std()

z_dist = np.sqrt(norm_q**2 + norm_t**2 + norm_p**2 + norm_w**2)
df["novelty_proxy"] = (pd.Series(z_dist).rank(pct=True) * 100.0).round(2)
df["fingerprint_novelty"] = df["novelty_proxy"]

fp_cols = [
    "fingerprint_moisture",
    "fingerprint_temperature",
    "fingerprint_pressure",
    "fingerprint_wind",
    "fingerprint_ensemble",
    "fingerprint_novelty"
]

def generate_fp_label(row):
    scores = {
        "Moisture-sensitive": row["fingerprint_moisture"],
        "Temperature-sensitive": row["fingerprint_temperature"],
        "Pressure-sensitive": row["fingerprint_pressure"],
        "Wind-sensitive": row["fingerprint_wind"],
        "High ensemble disagreement": row["fingerprint_ensemble"],
        "Novel atmospheric state": row["fingerprint_novelty"]
    }
    max_label = max(scores, key=scores.get)
    if scores[max_label] < 60.0:
        return "Mixed sensitivity"
    return max_label

df["failure_fingerprint_label"] = df.apply(generate_fp_label, axis=1)

fingerprint_dataset = df[[
    "forecast_init", "valid_time", "lead_day", "latitude", "longitude", "region",
    "fingerprint_moisture", "fingerprint_temperature", "fingerprint_pressure",
    "fingerprint_wind", "fingerprint_ensemble", "fingerprint_novelty",
    "failure_fingerprint_label"
]]
fingerprint_dataset.to_parquet(fingerprints_output, index=False)

print("Refining Fragility Diagnostics...")
curve_points = np.array([0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
fragility_matrix = np.column_stack([
    df["baseline_p_bust"].values,
    df["fragility_20"].values,
    df["fragility_40"].values,
    df["fragility_60"].values,
    df["fragility_80"].values,
    df["fragility_100"].values
])

df["fragility_auc"] = np.trapezoid(fragility_matrix, x=curve_points, axis=1)

q33 = df["fragility_auc"].quantile(0.333)
q66 = df["fragility_auc"].quantile(0.666)

def categorize_fragility(auc_val):
    if auc_val <= q33:
        return "LOW FRAGILITY"
    elif auc_val <= q66:
        return "MODERATE FRAGILITY"
    else:
        return "HIGH FRAGILITY"

df["fragility_category"] = df["fragility_auc"].apply(categorize_fragility)

missing_count = df.isnull().sum().sum()
if missing_count > 0:
    raise ValueError(f"Found {missing_count} missing values in failure intelligence results!")

dups = df.duplicated(subset=["forecast_init", "valid_time", "lead_day", "latitude", "longitude"]).sum()
if dups > 0:
    raise ValueError(f"Found {dups} duplicate rows in failure intelligence results!")

df.to_parquet(master_output, index=False)

print("============================================")
print("PHASE 5 - FAILURE INTELLIGENCE COMPLETE")
print(f"Master Output File: {master_output}")
print(f"Corridors Output: {corridors_output}")
print(f"Fingerprints Output: {fingerprints_output}")
print(f"Total Rows: {len(df)}")
print(f"Total Columns: {len(df.columns)}")
print(f"Selected K: {best_k}")
print(f"Missing Values: {missing_count}")
print(f"Duplicate Keys: {dups}")
print("============================================")
