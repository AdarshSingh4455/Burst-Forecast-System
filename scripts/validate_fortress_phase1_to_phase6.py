import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import sys
import pandas as pd
import numpy as np

print("============================================")
print("FORTRESS - PHASE 1 TO PHASE 6 AUTOMATED AUDIT")
print("============================================")

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
evidence_file = os.path.join(base_dir, "data", "processed", "FORTRESS_INDEPENDENT_EVIDENCE.parquet")
analogues_file = os.path.join(base_dir, "data", "processed", "FORTRESS_HISTORICAL_ANALOGUES.parquet")

if not os.path.exists(evidence_file):
    print(f"FAIL: Master evidence dataset missing at {evidence_file}")
    sys.exit(1)

if not os.path.exists(analogues_file):
    print(f"FAIL: Historical analogues dataset missing at {analogues_file}")
    sys.exit(1)

df = pd.read_parquet(evidence_file)
df_ana = pd.read_parquet(analogues_file)

errors = []

expected_rows = 38760
if len(df) != expected_rows:
    errors.append(f"Row count mismatch: expected {expected_rows}, got {len(df)}")

key_cols = ["forecast_init", "valid_time", "lead_day", "latitude", "longitude"]
dups = df.duplicated(subset=key_cols).sum()
if dups > 0:
    errors.append(f"Duplicate key count: {dups}")

missing_total = df.isna().sum().sum()
if missing_total > 0:
    errors.append(f"Total missing values: {missing_total}")

valid_leads = set(range(1, 11))
actual_leads = set(df["lead_day"].unique())
if actual_leads != valid_leads:
    errors.append(f"Invalid lead days: {actual_leads}")

if (df["ensemble_mean_mm"] < 0).any() or (df["observed_rain_mm"] < 0).any():
    errors.append("Negative precipitation values found")

bust_vals = set(df["bust_label"].unique())
if not bust_vals.issubset({0, 1}):
    errors.append(f"Invalid bust_label values: {bust_vals}")

if (df["baseline_p_bust"] < 0.0).any() or (df["baseline_p_bust"] > 1.0).any():
    errors.append("Invalid P(Bust) probabilities outside [0, 1]")

if (df["ffd"] < 0.0).any():
    errors.append("Negative FFD values found")

fp_cols = ["fingerprint_moisture", "fingerprint_temperature", "fingerprint_pressure",
           "fingerprint_wind", "fingerprint_ensemble", "fingerprint_novelty"]
for col in fp_cols:
    if (df[col] < 0.0).any() or (df[col] > 100.0).any():
        errors.append(f"Fingerprint {col} out of range [0, 100]")

if (df["fragility_auc"] < 0.0).any() or (df["fragility_auc"] > 1.0).any():
    errors.append("fragility_auc out of range [0, 1]")

if (df["ensemble_disagreement_score"] < 0.0).any() or (df["ensemble_disagreement_score"] > 100.0).any():
    errors.append("ensemble_disagreement_score out of range [0, 100]")

if (df["ood_score"] < 0.0).any() or (df["ood_score"] > 100.0).any():
    errors.append("ood_score out of range [0, 100]")

df_ana["target_forecast_init"] = pd.to_datetime(df_ana["target_forecast_init"])
df_ana["analogue_forecast_init"] = pd.to_datetime(df_ana["analogue_forecast_init"])

future_analogues = (df_ana["analogue_forecast_init"] >= df_ana["target_forecast_init"]).sum()
if future_analogues > 0:
    errors.append(f"Found {future_analogues} future or current-date historical analogues")

earliest_date = df["forecast_init"].min()
earliest_rows = df[df["forecast_init"] == earliest_date]
if (earliest_rows["analogue_available"] != 0).any():
    errors.append("Earliest date rows must have analogue_available == 0")

if len(errors) == 0:
    print("ALL 14 INVARIANT CHECKS PASSED PERFECTLY!")
    print(f"Total Rows Verified: {len(df)}")
    print(f"Total Columns Verified: {len(df.columns)}")
    print(f"Duplicate Keys: 0")
    print(f"Missing Values: 0")
    print("Status: PASS")
else:
    print(f"AUDIT FAILED WITH {len(errors)} ERRORS:")
    for err in errors:
        print(f" - {err}")
    sys.exit(1)
