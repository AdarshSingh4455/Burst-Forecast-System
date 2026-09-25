import os
import sys
import json
import hashlib

sys.stdout.reconfigure(encoding="utf-8")

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def main():
    print("============================================")
    print("FORTRESS PHASE 12D + 12E + 12F MASTER VALIDATOR")
    print("============================================")

    passed = 0
    failed = 0

    def check(condition, desc):
        nonlocal passed, failed
        if condition:
            print(f"  [PASS] {desc}")
            passed += 1
        else:
            print(f"  [FAIL] {desc}")
            failed += 1

    # 1. Output files presence check
    calib_json_path = "data/processed/FORTRESS_PHASE12_CALIBRATION_METRICS.json"
    reg_lead_json_path = "data/processed/FORTRESS_PHASE12_REGION_LEAD_METRICS.json"
    failure_json_path = "data/processed/FORTRESS_PHASE12_FAILURE_ANALYSIS.json"
    sensitivity_json_path = "data/processed/FORTRESS_PHASE12_RULE_SENSITIVITY.json"
    doc_path = "docs/phase12_calibration_region_lead_failure_analysis.md"

    check(os.path.exists(calib_json_path), f"Calibration metrics JSON exists: {calib_json_path}")
    check(os.path.exists(reg_lead_json_path), f"Region/Lead metrics JSON exists: {reg_lead_json_path}")
    check(os.path.exists(failure_json_path), f"Failure analysis JSON exists: {failure_json_path}")
    check(os.path.exists(sensitivity_json_path), f"Rule sensitivity JSON exists: {sensitivity_json_path}")

    # Load JSON files
    with open(calib_json_path, "r", encoding="utf-8") as f:
        calib_data = json.load(f)
    with open(reg_lead_json_path, "r", encoding="utf-8") as f:
        reg_lead_data = json.load(f)
    with open(failure_json_path, "r", encoding="utf-8") as f:
        failure_data = json.load(f)
    with open(sensitivity_json_path, "r", encoding="utf-8") as f:
        sens_data = json.load(f)

    # 2. SHA-256 Hashes Verification
    print("\nVerifying SHA-256 hashes of frozen baseline and Phase 12 files...")
    model_file = "models/fortress_bust_model_phase11.pkl"
    bust_file = "data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet"
    cases_json = "data/processed/FORTRESS_PHASE12_CASE_STUDIES.json"

    check(os.path.exists(model_file), f"Model bundle exists: {model_file}")
    check(os.path.exists(bust_file), f"Bust dataset parquet exists: {bust_file}")
    check(os.path.exists(cases_json), f"Phase 12A cases JSON exists: {cases_json}")

    current_model_hash = sha256_file(model_file)
    recorded_model_hash = calib_data["hashes"]["models/fortress_bust_model_phase11.pkl"]
    check(current_model_hash == recorded_model_hash, "Phase 11 model binary hash matching")

    # 3. Phase 12D Calibration & Prevalence Shift Checks
    print("\nValidating Phase 12D Calibration Metrics & Prevalence Shift...")
    prev_shift = calib_data.get("prevalence_shift", {}).get("splits", {})
    check("TRAIN" in prev_shift and "VALIDATION" in prev_shift and "TEST" in prev_shift, "Prevalence shift contains TRAIN, VALIDATION, TEST")
    
    train_prev = prev_shift.get("TRAIN", {}).get("bust_prevalence_pct")
    valid_prev = prev_shift.get("VALIDATION", {}).get("bust_prevalence_pct")
    test_prev = prev_shift.get("TEST", {}).get("bust_prevalence_pct")

    check(abs(train_prev - 5.00) < 0.1, f"TRAIN prevalence shift ~5.00% (actual: {train_prev}%)")
    check(abs(valid_prev - 12.47) < 0.1, f"VALIDATION prevalence shift ~12.47% (actual: {valid_prev}%)")
    check(abs(test_prev - 22.04) < 0.1, f"TEST prevalence shift ~22.04% (actual: {test_prev}%)")

    test_uncal = calib_data["calibration_by_split"]["TEST"]["uncalibrated"]
    test_cal = calib_data["calibration_by_split"]["TEST"]["calibrated"]

    check(test_uncal["ROC_AUC"] == 0.8567, f"TEST Uncalibrated ROC-AUC == 0.8567 (actual: {test_uncal['ROC_AUC']})")
    check(test_uncal["PR_AUC"] == 0.6408, f"TEST Uncalibrated PR-AUC == 0.6408 (actual: {test_uncal['PR_AUC']})")
    check(test_uncal["Brier"] == 0.1173, f"TEST Uncalibrated Brier == 0.1173 (actual: {test_uncal['Brier']})")
    check(test_cal["Brier"] == 0.1178, f"TEST Calibrated Brier == 0.1178 (actual: {test_cal['Brier']})")
    check(len(test_uncal["bins"]) == 10, "TEST Uncalibrated probability bins count == 10")
    check(len(test_cal["bins"]) == 10, "TEST Calibrated probability bins count == 10")

    # 4. Phase 12E Region & Lead Metrics Checks
    print("\nValidating Phase 12E Region & Lead Metrics...")
    reg_metrics = reg_lead_data.get("region_metrics", {})
    lead_metrics = reg_lead_data.get("lead_metrics", {})
    matrix_cells = reg_lead_data.get("region_lead_matrix", {})
    th_by_reg = reg_lead_data.get("trust_horizon_by_region", {})
    bp_dist = reg_lead_data.get("breaking_point_distribution", {})

    check(len(reg_metrics) == 3, f"Region metrics contains 3 regions (actual: {len(reg_metrics)})")
    check(len(lead_metrics) == 10, f"Lead metrics contains 10 leads D1–D10 (actual: {len(lead_metrics)})")
    n_matrix = sum(len(matrix_cells[r]) for r in matrix_cells)
    check(n_matrix == 30, f"Matrix contains exactly 30 cells (actual: {n_matrix})")
    check(len(th_by_reg) == 3, "Trust Horizon distribution covers 3 regions")
    check(len(bp_dist) == 3, "Breaking Point distribution covers 3 regions")

    for r in ["EASTERN_UP_RECT", "NORTHWEST_INDIA_RECT", "CENTRAL_INDIA_RECT"]:
        check(r in reg_metrics, f"Region {r} present in region_metrics")
        check(r in th_by_reg, f"Region {r} present in trust_horizon_by_region")

    # 5. Phase 12F Failure Analysis & Rule Inspection Checks
    print("\nValidating Phase 12F Failure Taxonomy & Rule Inspection...")
    conf = failure_data.get("confusion_matrix_at_0_50", {}).get("overall", {})
    green_bust = failure_data.get("green_band_bust_analysis", {})
    code_insp = failure_data.get("code_logic_inspections", {})
    boot_ci = failure_data.get("statistical_uncertainty_95ci", {})

    check(conf.get("TP") is not None and conf.get("FP") is not None and conf.get("TN") is not None and conf.get("FN") is not None, "Confusion matrix cutoff 0.50 contains TP, FP, TN, FN")
    check("N" in green_bust, "GREEN band bust analysis contains GREEN bust count N")
    g_br_val = round((green_bust.get("N", 0) / 55532.0) * 100.0, 2)
    check(abs(g_br_val - 5.70) < 0.5, f"GREEN band bust rate ~5.70% (actual: {g_br_val}%)")

    expert_check = "expert_review_ood_dependency" in code_insp
    check(expert_check, "Expert Review OOD dependency inspection recorded in code_logic_inspections")

    check("overall_roc_auc_ci" in boot_ci and "green_bust_rate_ci" in boot_ci and "red_bust_rate_ci" in boot_ci, "95% Bootstrap CIs available for ROC-AUC, GREEN bust rate, RED bust rate")

    # 6. Rule Sensitivity Checks
    print("\nValidating Phase 12F Rule Sensitivity...")
    sens_cfgs = sens_data.get("configurations_tested", [])
    check(len(sens_cfgs) >= 6, f"Rule sensitivity contains tested configurations (actual: {len(sens_cfgs)})")

    # 7. Figures Existence Checks
    print("\nValidating Publication Figures in docs/figures/...")
    fig_files = [
        "docs/figures/calibration_curves.png",
        "docs/figures/region_metric_comparison.png",
        "docs/figures/leadwise_roc_prevalence.png",
        "docs/figures/green_vs_red_bust_rate.png",
        "docs/figures/trust_horizon_by_region.png",
        "docs/figures/breaking_point_distribution.png",
        "docs/figures/failure_taxonomy_chart.png",
        "docs/figures/rule_sensitivity_chart.png"
    ]

    for ff in fig_files:
        check(os.path.exists(ff) and os.path.getsize(ff) > 0, f"Publication figure exists: {ff}")

    # Summary
    print("\n============================================")
    print(f"SUMMARY: {passed} PASSED, {failed} FAILED")
    print("============================================")

    if failed == 0:
        print("ALL PHASE 12D + 12E + 12F VALIDATION CHECKS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("VALIDATION FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()
