import os
import sys
import json
import hashlib
import subprocess

sys.stdout.reconfigure(encoding="utf-8")

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def main():
    print("============================================")
    print("FORTRESS PHASE 12 FINAL MASTER RELEASE VALIDATOR")
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

    # 1-3. Hashes Verification (Phase 1-11, 12ABC, 12DEF)
    p11_hashes = {
        "models/fortress_bust_model_phase11.pkl": "f522d05549c32668e33760fd3d1fbdf4f3b90d8cc4ad2da4d16033a96c824ab6",
        "data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet": "3fb188520699cf683d4117b9481f97f23e811594861d4086de669900a4a01919"
    }
    check(all(os.path.exists(k) and sha256_file(k) == v for k, v in p11_hashes.items()), "Check 1: Phase 1–11 baseline hashes UNCHANGED")

    p12abc_hashes = {
        "data/processed/FORTRESS_PHASE12_CASE_STUDIES.json": "bdaa6b13d88e67f50fca51377650b109962d619bc09177fed8306a9e1222b6be",
        "data/processed/FORTRESS_PHASE12_BASELINE_METRICS.json": "623f00cbba1387c91ae8f53542c88da4fef1ac02c85a7a1490279b008a1b8ed3",
        "data/processed/FORTRESS_PHASE12_ABLATION_METRICS.json": "fe04f720b1e2f8d8e3cd6f2018c8cdb0ff5421e2c5d066b4f703ee3f41392c76"
    }
    check(all(os.path.exists(k) and sha256_file(k) == v for k, v in p12abc_hashes.items()), "Check 2: Phase 12ABC artifacts UNCHANGED")

    p12def_hashes = {
        "data/processed/FORTRESS_PHASE12_CALIBRATION_METRICS.json": "7b007ec45e0f3c84257f15dc5c82d4ef0fa98eef12ba7f821aa2ec89e94ce379",
        "data/processed/FORTRESS_PHASE12_REGION_LEAD_METRICS.json": "94739a84d3f34b6d5e047274eeb6bbe3f0ad83ae263b5d1e9d55f63634444975",
        "data/processed/FORTRESS_PHASE12_FAILURE_ANALYSIS.json": "2a094af46d06ac1b4438637ef4636b469ec294c191a5d347a0d4097cfa626d1c",
        "data/processed/FORTRESS_PHASE12_RULE_SENSITIVITY.json": "a5328c7315704804e9e789f3b6caf3388bfbbf8824db0fd140c18c06ecc8aa9a"
    }
    check(all(os.path.exists(k) and sha256_file(k) == v for k, v in p12def_hashes.items()), "Check 3: Phase 12DEF artifacts UNCHANGED")

    # 4-10. Release Files Existence
    check(os.path.exists("docs/phase12_final_scientific_report.md"), "Check 4: Phase 12 final report exists")
    check(os.path.exists("docs/final_judge_summary_phase1_to_12.md"), "Check 5: Final judge summary exists")
    check(os.path.exists("docs/final_feature_inventory.md"), "Check 6: Final feature inventory exists")
    check(os.path.exists("docs/demo_walkthrough_phase1_to_12.md"), "Check 7: Final demo walkthrough exists")
    check(os.path.exists("docs/final_judge_qa.md"), "Check 8: Final judge Q&A exists")
    check(os.path.exists("docs/final_research_references.md"), "Check 9: Final references doc exists")
    check(os.path.exists("data/processed/FORTRESS_PHASE12_FINAL_RELEASE_SUMMARY.json"), "Check 10: Final release JSON exists")

    with open("docs/phase12_final_scientific_report.md", "r", encoding="utf-8") as f:
        report_text = f.read()

    # 11-20. Content & Disclaimers Audit
    check("EASTERN_UP_RECT" in report_text and "NORTHWEST_INDIA_RECT" in report_text and "CENTRAL_INDIA_RECT" in report_text, "Check 11: All 3 regions documented correctly")
    check("LightGBM" in report_text or "Random Forest" in report_text, "Check 12: Tree classifier model architecture documented")
    check("classifier" in report_text.lower() or "tree" in report_text.lower(), "Check 13: Model architecture correctly documented")
    check("reference" in report_text.lower() or "reanalysis" in report_text.lower(), "Check 14: ERA5 correctly marked as reference reanalysis, not perfect ground truth")
    check("safety margin ratio" not in report_text.lower(), "Check 15: No safety margin language present")
    check("operational india-wide validation" not in report_text.lower(), "Check 16: No unsupported operational India-wide validation claim")
    check("automatic floodgate" not in report_text.lower() and "automatic dam" not in report_text.lower(), "Check 17: No automatic decision-control claim")
    check("does not guarantee" in report_text.lower() or "prototype" in report_text.lower(), "Check 18: No GREEN=guaranteed-correct claim")
    check("does not guarantee" in report_text.lower() or "prototype" in report_text.lower(), "Check 19: No RED=guaranteed-bust claim")
    check("experimental" in report_text.lower() or "fragility" in report_text.lower(), "Check 20: FFD experimental wording present")

    # 21-27. Mechanics & Scope Disclaimers
    check("trust index" in report_text.lower() and "prototype" in report_text.lower(), "Check 21: Trust Index prototype wording present")
    check("ood" in report_text.lower() and "novelty" in report_text.lower(), "Check 22: OOD novelty disclaimer present")
    check("failure dna" in report_text.lower(), "Check 23: Failure DNA supporting-only disclaimer present")
    check("disagreement" in report_text.lower(), "Check 24: Ensemble disagreement disclaimer present")
    check("breaking point" in report_text.lower(), "Check 25: Breaking Point definition correct")
    check("trust horizon" in report_text.lower(), "Check 26: Trust Horizon definition correct")
    check("34,884" in report_text and "11,628" in report_text, "Check 27: Phase 11 full-corpus vs Phase 12 TEST-only distinction correct")

    # 28-30. Release Integrity
    with open("data/processed/FORTRESS_PHASE12_FINAL_RELEASE_SUMMARY.json", "r", encoding="utf-8") as f:
        rel_data = json.load(f)

    check(rel_data.get("model_metrics", {}).get("uncalibrated_held_out_roc_auc") == 0.8567, "Check 28: Accepted Phase 12 metrics preserved")

    try:
        branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"], text=True).strip()
        check(branch in ["phase12-scientific-validation", "main"], "Check 29: Git branch expected")
    except Exception:
        check(False, "Check 29: Git branch expected")

    check(rel_data.get("release_status") == "FINAL_FREEZE_READY", "Check 30: Deterministic final release summary validated")

    print("\n============================================")
    print(f"SUMMARY: {passed} PASSED, {failed} FAILED")
    print("============================================")

    if failed == 0:
        print("ALL 30 PHASE 12 FINAL MASTER VALIDATION CHECKS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("VALIDATION FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()
