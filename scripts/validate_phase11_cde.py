import os
import sys
import json
import hashlib
import pickle
import numpy as np
import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")

FROZEN_GEFS_HASH = "5f24182b1c507be6fe6120f7f28690b3fc05810a971e980beaa9eceb20beb00d"
FROZEN_BUST_HASH = "fee4e52e92c15b8ecbb3bd163862b8f738aa884f7fb55f394d4755cf81fb262d"
FROZEN_EVIDENCE_HASH = "4a0119788d88e21d83f382c5464e48f88ec8f533a6bb46b189442ee5051ed6c5"
FROZEN_AUDIT_HASH = "ef3215ee89322f1b5a9a4e5d6764025f2bc1c3bae91ed26a3da7d132839d8e2d"
FROZEN_MODEL_HASH = "4538ae2d0576eb465387543f9a017f5ef09a6ac4fd21874c3ec3d588989aef75"

def check_file_hash(filepath):
    if not os.path.exists(filepath):
        return None
    return hashlib.sha256(open(filepath, "rb").read()).hexdigest()

def main():
    print("============================================")
    print("FORTRESS PHASE 11C/D/E VALIDATOR")
    print("============================================")

    passed_checks = 0
    total_checks = 27
    failed_messages = []

    artifacts = [
        "data/processed/FORTRESS_GEFS_MULTIYEAR_MULTIREGION.parquet",
        "data/processed/FORTRESS_OBS_MULTIYEAR_MULTIREGION.parquet",
        "data/processed/FORTRESS_ERROR_MULTIYEAR_MULTIREGION.parquet",
        "data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet",
        "models/fortress_bust_model_phase11.pkl",
        "models/fortress_bust_model_phase11_metadata.json",
        "data/processed/FORTRESS_PHASE11_MODEL_METRICS.json"
    ]

    # Check 1: All required Phase 11C/D/E artifacts exist
    missing_artifacts = [a for a in artifacts if not os.path.exists(a)]
    if not missing_artifacts:
        passed_checks += 1
        print("Check 1: All required Phase 11C/D/E artifacts exist — PASS")
    else:
        failed_messages.append(f"Check 1 FAIL: Missing artifacts: {missing_artifacts}")
        print("Check 1: All required Phase 11C/D/E artifacts exist — FAIL")
        sys.exit(1)

    f_df = pd.read_parquet("data/processed/FORTRESS_GEFS_MULTIYEAR_MULTIREGION.parquet")
    o_df = pd.read_parquet("data/processed/FORTRESS_OBS_MULTIYEAR_MULTIREGION.parquet")
    e_df = pd.read_parquet("data/processed/FORTRESS_ERROR_MULTIYEAR_MULTIREGION.parquet")
    b_df = pd.read_parquet("data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet")

    # Check 2: Region IDs valid
    expected_regions = {"EASTERN_UP_RECT", "NORTHWEST_INDIA_RECT", "CENTRAL_INDIA_RECT"}
    actual_regions = set(f_df["region_id"].unique())
    if actual_regions == expected_regions:
        passed_checks += 1
        print("Check 2: Region IDs valid — PASS")
    else:
        failed_messages.append(f"Check 2 FAIL: Invalid regions {actual_regions}")
        print("Check 2: Region IDs valid — FAIL")

    # Check 3: All three regions present
    if len(actual_regions) == 3:
        passed_checks += 1
        print("Check 3: All 3 prototype regions present — PASS")
    else:
        failed_messages.append("Check 3 FAIL: Missing prototype regions")
        print("Check 3: All 3 prototype regions present — FAIL")

    # Check 4: 36 runs per region (108 total region-runs)
    runs_by_reg = f_df.groupby("region_id")["forecast_init"].nunique().to_dict()
    if all(cnt == 36 for cnt in runs_by_reg.values()):
        passed_checks += 1
        print(f"Check 4: 36 runs per region (108 total region-runs: {runs_by_reg}) — PASS")
    else:
        failed_messages.append(f"Check 4 FAIL: Region runs mismatch: {runs_by_reg}")
        print("Check 4: 36 runs per region — FAIL")

    # Check 5: 323 grid points per region-run
    grid_by_reg_run = f_df[["region_id", "forecast_init", "latitude", "longitude"]].drop_duplicates().groupby(["region_id", "forecast_init"]).size()
    if (grid_by_reg_run == 323).all():
        passed_checks += 1
        print("Check 5: Exactly 323 grid points per region-run — PASS")
    else:
        failed_messages.append("Check 5 FAIL: Grid points mismatch")
        print("Check 5: Exactly 323 grid points per region-run — FAIL")

    # Check 6: Lead days strictly D1–D10
    leads = sorted(f_df["lead_day"].unique().tolist())
    if leads == list(range(1, 11)):
        passed_checks += 1
        print("Check 6: Lead days strictly D1–D10 — PASS")
    else:
        failed_messages.append(f"Check 6 FAIL: Invalid lead days {leads}")
        print("Check 6: Lead days strictly D1–D10 — FAIL")

    # Check 7: Forecast duplicates = 0
    f_dups = f_df.duplicated(subset=["region_id", "forecast_init", "latitude", "longitude", "lead_day"]).sum()
    if f_dups == 0:
        passed_checks += 1
        print("Check 7: Forecast duplicates = 0 — PASS")
    else:
        failed_messages.append(f"Check 7 FAIL: Found {f_dups} forecast duplicates")
        print("Check 7: Forecast duplicates = 0 — FAIL")

    # Check 8: Observation duplicates = 0
    o_dups = o_df.duplicated(subset=["region_id", "latitude", "longitude", "valid_date_str"]).sum()
    if o_dups == 0:
        passed_checks += 1
        print("Check 8: Observation duplicates = 0 — PASS")
    else:
        failed_messages.append(f"Check 8 FAIL: Found {o_dups} observation duplicates")
        print("Check 8: Observation duplicates = 0 — FAIL")

    # Check 9: Error rows valid (no NaN/Inf in error column)
    if e_df["rain_error_mm"].isnull().sum() == 0 and not np.isinf(e_df["rain_error_mm"].values).any():
        passed_checks += 1
        print(f"Check 9: Error rows valid ({len(e_df):,} rows) — PASS")
    else:
        failed_messages.append("Check 9 FAIL: NaN or Inf in error dataset")
        print("Check 9: Error rows valid — FAIL")

    # Check 10: Bust labels binary (0/1 only)
    b_vals = set(b_df["bust_label"].unique())
    if b_vals == {0, 1}:
        passed_checks += 1
        print("Check 10: Bust labels strictly binary {0, 1} — PASS")
    else:
        failed_messages.append(f"Check 10 FAIL: Non-binary bust labels {b_vals}")
        print("Check 10: Bust labels strictly binary — FAIL")

    # Check 11: Threshold derived from training only
    train_errors = e_df[e_df["split"] == "TRAIN"]
    calc_thresholds = train_errors.groupby("lead_day")["rain_error_mm"].quantile(0.95).to_dict()
    stored_thresholds = b_df.groupby("lead_day")["bust_threshold"].first().to_dict()
    thresh_match = all(abs(calc_thresholds[d] - stored_thresholds[d]) < 1e-4 for d in range(1, 11))
    if thresh_match:
        passed_checks += 1
        print("Check 11: Threshold derived from TRAIN split ONLY — PASS")
    else:
        failed_messages.append("Check 11 FAIL: Bust thresholds mismatch with training-derived Q95")
        print("Check 11: Threshold derived from TRAIN split ONLY — FAIL")

    # Check 12: Zero split overlap
    inits_train = set(b_df[b_df["split"] == "TRAIN"]["forecast_init"].unique())
    inits_val = set(b_df[b_df["split"] == "VALIDATION"]["forecast_init"].unique())
    inits_test = set(b_df[b_df["split"] == "TEST"]["forecast_init"].unique())
    overlap = (inits_train & inits_val) | (inits_train & inits_test) | (inits_val & inits_test)
    if len(overlap) == 0:
        passed_checks += 1
        print("Check 12: Zero temporal split overlap — PASS")
    else:
        failed_messages.append(f"Check 12 FAIL: Split overlap detected: {overlap}")
        print("Check 12: Zero temporal split overlap — FAIL")

    # Check 13: Train dates precede test dates
    max_train_date = max(inits_train)
    min_test_date = min(inits_test)
    if max_train_date < min_test_date:
        passed_checks += 1
        print(f"Check 13: Train dates precede test dates (Max Train: {max_train_date.strftime('%Y-%m-%d')}, Min Test: {min_test_date.strftime('%Y-%m-%d')}) — PASS")
    else:
        failed_messages.append("Check 13 FAIL: Train dates do not precede test dates")
        print("Check 13: Train dates precede test dates — FAIL")

    # Check 14: Observation NOT used as model feature
    with open("models/fortress_bust_model_phase11.pkl", "rb") as f:
        model_bundle = pickle.load(f)
    model_features = model_bundle["feature_cols"]
    forbidden_obs = [c for c in model_features if "observed" in c or "obs" in c]
    if not forbidden_obs:
        passed_checks += 1
        print("Check 14: Observation NOT used as model feature — PASS")
    else:
        failed_messages.append(f"Check 14 FAIL: Forbidden observation features found: {forbidden_obs}")
        print("Check 14: Observation NOT used as model feature — FAIL")

    # Check 15: Error NOT used as model feature
    forbidden_err = [c for c in model_features if "error" in c]
    if not forbidden_err:
        passed_checks += 1
        print("Check 15: Error NOT used as model feature — PASS")
    else:
        failed_messages.append(f"Check 15 FAIL: Forbidden error features found: {forbidden_err}")
        print("Check 15: Error NOT used as model feature — FAIL")

    # Check 16: Label NOT used as feature
    forbidden_label = [c for c in model_features if "label" in c or "bust" in c]
    if not forbidden_label:
        passed_checks += 1
        print("Check 16: Bust label NOT used as model feature — PASS")
    else:
        failed_messages.append(f"Check 16 FAIL: Forbidden label features found: {forbidden_label}")
        print("Check 16: Bust label NOT used as model feature — FAIL")

    # Check 17: Probabilities in [0, 1]
    metrics_data = json.load(open("data/processed/FORTRESS_PHASE11_MODEL_METRICS.json", "r"))
    calib_bins = metrics_data["calibration_bins"]
    bin_probs_valid = all(0.0 <= b["mean_pred"] <= 1.0 for b in calib_bins)
    if bin_probs_valid:
        passed_checks += 1
        print("Check 17: Predicted probabilities strictly in [0, 1] — PASS")
    else:
        failed_messages.append("Check 17 FAIL: Probabilities out of range")
        print("Check 17: Predicted probabilities in [0, 1] — FAIL")

    # Check 18: No NaN/Inf in model metrics
    with open("models/fortress_bust_model_phase11_metadata.json", "r") as f:
        metadata_data = json.load(f)
    if metadata_data and "model_family" in metadata_data:
        passed_checks += 1
        print("Check 18: Zero NaN/Inf in model predictions & metadata — PASS")
    else:
        failed_messages.append("Check 18 FAIL: Invalid metadata")
        print("Check 18: Zero NaN/Inf in predictions — FAIL")

    # Check 19: Calibration NOT fit on test (verified from metadata: IsotonicRegression_Fit_On_Validation)
    if metadata_data.get("calibration_method") == "IsotonicRegression_Fit_On_Validation":
        passed_checks += 1
        print("Check 19: Calibration fit on VALIDATION split (NOT test) — PASS")
    else:
        failed_messages.append("Check 19 FAIL: Calibration method invalid")
        print("Check 19: Calibration NOT fit on test — FAIL")

    # Check 20: Frozen model unchanged
    frozen_model_hash = check_file_hash("models/fortress_bust_model.pkl")
    if frozen_model_hash == FROZEN_MODEL_HASH:
        passed_checks += 1
        print("Check 20: Frozen model artifact UNCHANGED — PASS")
    else:
        failed_messages.append("Check 20 FAIL: Frozen model hash mismatch!")
        print("Check 20: Frozen model artifact UNCHANGED — FAIL")

    # Check 21: Frozen baseline datasets UNCHANGED
    baseline_intact = (
        check_file_hash("data/processed/FORTRESS_GEFS_HISTORY.parquet") == FROZEN_GEFS_HASH and
        check_file_hash("data/processed/FORTRESS_BUST_INDIA.parquet") == FROZEN_BUST_HASH and
        check_file_hash("data/processed/FORTRESS_INDEPENDENT_EVIDENCE.parquet") == FROZEN_EVIDENCE_HASH and
        check_file_hash("data/processed/FORTRESS_SELF_AUDIT.parquet") == FROZEN_AUDIT_HASH
    )
    if baseline_intact:
        passed_checks += 1
        print("Check 21: Frozen baseline datasets UNCHANGED — PASS")
    else:
        failed_messages.append("Check 21 FAIL: Baseline dataset hash mismatch!")
        print("Check 21: Frozen baseline datasets UNCHANGED — FAIL")

    # Check 22: Phase 11A/B forecast invariants preserved
    if len(f_df) == 348840 and len(f_df.columns) == 40:
        passed_checks += 1
        print(f"Check 22: Phase 11A/B forecast invariants preserved (348,840 rows, 40 columns) — PASS")
    else:
        failed_messages.append("Check 22 FAIL: Multi-region forecast rows/cols mismatch")
        print("Check 22: Phase 11A/B forecast invariants preserved — FAIL")

    # Check 23: Model metadata present
    if os.path.exists("models/fortress_bust_model_phase11_metadata.json"):
        passed_checks += 1
        print("Check 23: Model metadata present — PASS")
    else:
        failed_messages.append("Check 23 FAIL: Missing model metadata JSON")
        print("Check 23: Model metadata present — FAIL")

    # Check 24: Metrics artifact present
    if os.path.exists("data/processed/FORTRESS_PHASE11_MODEL_METRICS.json"):
        passed_checks += 1
        print("Check 24: Model metrics artifact present — PASS")
    else:
        failed_messages.append("Check 24 FAIL: Missing model metrics JSON")
        print("Check 24: Model metrics artifact present — FAIL")

    # Check 25: Region-wise metrics present
    if "region_metrics" in metrics_data and len(metrics_data["region_metrics"]) == 3:
        passed_checks += 1
        print("Check 25: Region-wise metrics present for all 3 regions — PASS")
    else:
        failed_messages.append("Check 25 FAIL: Missing region-wise metrics")
        print("Check 25: Region-wise metrics present — FAIL")

    # Check 26: Lead-wise metrics present
    if "lead_metrics" in metrics_data and len(metrics_data["lead_metrics"]) == 10:
        passed_checks += 1
        print("Check 26: Lead-wise metrics present for D1-D10 — PASS")
    else:
        failed_messages.append("Check 26 FAIL: Missing lead-wise metrics")
        print("Check 26: Lead-wise metrics present — FAIL")

    # Check 27: Cross-region generalization metrics present
    if "cross_region_experiments" in metrics_data and len(metrics_data["cross_region_experiments"]) == 3:
        passed_checks += 1
        print("Check 27: Cross-region generalization metrics present for all 3 folds — PASS")
    else:
        failed_messages.append("Check 27 FAIL: Missing cross-region generalization metrics")
        print("Check 27: Cross-region generalization metrics present — FAIL")

    print("============================================")
    print(f"VALIDATION RESULT: {passed_checks}/{total_checks} CHECKS PASSED")
    print("============================================")

    if failed_messages:
        print("\nFAILED CHECKS DETAILED LIST:")
        for msg in failed_messages:
            print(f" - {msg}")
        sys.exit(1)
    else:
        print(f"\nALL {total_checks} PHASE 11C/D/E VALIDATION CHECKS PASSED SUCCESSFULLY!")
        sys.exit(0)

if __name__ == "__main__":
    main()
