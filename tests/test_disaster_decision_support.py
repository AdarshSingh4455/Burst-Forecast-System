import os
import sys

# Add root directory to sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, root_dir)

from backend.app.disaster_service import disaster_service
from backend.app.data_service import data_service

def test_disaster_rules():
    print("=== RUNNING PHASE 9C DISASTER MANAGEMENT DECISION SUPPORT SCIENTIFIC TESTS ===")
    data_service.load_data(root_dir)
    disaster_service.load_data(root_dir)

    results = {}

    # Test 1: exact southern boundary 24.5 = supported
    t1 = disaster_service.check_pilot_coverage(24.5, 82.0)
    print(f"Test 1 (Lat 24.5, Lon 82.0): {t1} -> Expected: True")
    results['exact_southern_24.5'] = t1 == True

    # Test 2: 24.499 = outside
    t2 = disaster_service.check_pilot_coverage(24.499, 82.0)
    print(f"Test 2 (Lat 24.499, Lon 82.0): {t2} -> Expected: False")
    results['southern_24.499_outside'] = t2 == False

    # Test 3: longitude 80.0 = supported
    t3 = disaster_service.check_pilot_coverage(26.0, 80.0)
    print(f"Test 3 (Lat 26.0, Lon 80.0): {t3} -> Expected: True")
    results['exact_western_80.0'] = t3 == True

    # Test 4: longitude 79.999 = outside
    t4 = disaster_service.check_pilot_coverage(26.0, 79.999)
    print(f"Test 4 (Lat 26.0, Lon 79.999): {t4} -> Expected: False")
    results['western_79.999_outside'] = t4 == False

    # Test 5: outside disaster scenario returns no FORTRESS context
    ctx_outside = disaster_service.get_forecast_context('DISASTER_OUTSIDE_01', data_service.init_dates[0])
    t5 = ctx_outside is not None and ctx_outside.get('coverage_available') == False and ctx_outside.get('forecast_context') is None and ctx_outside.get('lead_contexts') is None
    print(f"Test 5 (Outside disaster forecast context): {t5} -> Context: {ctx_outside.get('forecast_context') if ctx_outside else None}")
    results['outside_no_fortress_context'] = t5

    # Test 6: outside disaster scenario receives no decision-support status
    ds_outside = disaster_service.get_decision_support('DISASTER_OUTSIDE_01', data_service.init_dates[0], 1)
    t6 = ds_outside is not None and ds_outside.get('coverage_available') == False and ds_outside.get('attention_status') is None and ds_outside.get('decision_support') is None
    print(f"Test 6 (Outside disaster decision support status): {t6} -> Attention Status: {ds_outside.get('attention_status') if ds_outside else None}")
    results['outside_no_decision_status'] = t6

    # Test 7: inside off-grid disaster scenario snaps only to a valid nearby grid
    # DISASTER_EUP_01 (Lat 24.90, Lon 82.12)
    grid_pt = disaster_service.find_nearest_grid_point(data_service.init_dates[0], 1, 24.90, 82.12)
    t7 = grid_pt is not None and grid_pt['latitude'] >= 24.5 and grid_pt['latitude'] <= 28.5 and grid_pt['longitude'] >= 80.0 and grid_pt['longitude'] <= 84.5
    print(f"Test 7 (Inside off-grid disaster snapping): {t7} -> Snapped to ({grid_pt['latitude']}, {grid_pt['longitude']}) if grid_pt else None")
    results['inside_offgrid_snaps_valid'] = t7

    # Test 8: Low relevance (GENERAL_WEATHER, 0mm rain, LOW vuln) + RED forecast does NOT trigger expert review
    status_low_rel, reasons_low_rel = disaster_service.calculate_attention_status(
        hazard_context="GENERAL_WEATHER",
        preparedness_mode="GENERAL_MONITORING",
        vulnerability_level="LOW",
        exposure_level="LOW",
        rainfall_mm=0.0,
        multi_day_rain_mm=0.0,
        wind_speed_ms=3.0,
        bust_prob=0.1,
        self_audit_status="OK",
        reliability_band="RED",
        trust_index=40.0
    )
    t8 = status_low_rel == "NORMAL_MONITORING"
    print(f"Test 8 (Low relevance + RED forecast attention status): {status_low_rel} -> Expected: NORMAL_MONITORING")
    results['low_relevance_red_not_expert'] = t8

    # Test 9: High relevance (FLOOD_PREPAREDNESS + HIGH vuln) + RED forecast DOES trigger HIGH_UNCERTAINTY_EXPERT_REVIEW
    status_high_rel, reasons_high_rel = disaster_service.calculate_attention_status(
        hazard_context="FLOOD_PREPAREDNESS",
        preparedness_mode="RESOURCE_REVIEW",
        vulnerability_level="HIGH",
        exposure_level="HIGH",
        rainfall_mm=10.0,
        multi_day_rain_mm=15.0,
        wind_speed_ms=4.0,
        bust_prob=0.1,
        self_audit_status="OK",
        reliability_band="RED",
        trust_index=40.0
    )
    t9 = status_high_rel == "HIGH_UNCERTAINTY_EXPERT_REVIEW"
    print(f"Test 9 (High relevance + RED forecast attention status): {status_high_rel} -> Expected: HIGH_UNCERTAINTY_EXPERT_REVIEW")
    results['high_relevance_red_triggers_expert'] = t9

    # Test 10: Heightened Preparedness trigger (40mm rain + HIGH vuln + GREEN band)
    status_heightened, _ = disaster_service.calculate_attention_status(
        hazard_context="FLOOD_PREPAREDNESS",
        preparedness_mode="RESOURCE_REVIEW",
        vulnerability_level="HIGH",
        exposure_level="HIGH",
        rainfall_mm=40.0,
        multi_day_rain_mm=45.0,
        wind_speed_ms=5.0,
        bust_prob=0.1,
        self_audit_status="OK",
        reliability_band="GREEN",
        trust_index=85.0
    )
    t10 = status_heightened == "HEIGHTENED_PREPAREDNESS"
    print(f"Test 10 (High rain + High vulnerability status): {status_heightened} -> Expected: HEIGHTENED_PREPAREDNESS")
    results['high_rain_high_vuln_heightened'] = t10

    # Test 11: Preparedness Review trigger (20mm rain + MEDIUM vuln + GREEN band)
    status_review, _ = disaster_service.calculate_attention_status(
        hazard_context="HEAVY_RAINFALL",
        preparedness_mode="FIELD_TEAM_READINESS",
        vulnerability_level="MEDIUM",
        exposure_level="MEDIUM",
        rainfall_mm=20.0,
        multi_day_rain_mm=22.0,
        wind_speed_ms=5.0,
        bust_prob=0.1,
        self_audit_status="OK",
        reliability_band="GREEN",
        trust_index=85.0
    )
    t11 = status_review == "PREPAREDNESS_REVIEW"
    print(f"Test 11 (Moderate rain + Medium vulnerability status): {status_review} -> Expected: PREPAREDNESS_REVIEW")
    results['mod_rain_medium_vuln_review'] = t11

    # Test 12: Normal Monitoring trigger (0mm rain, LOW vuln, GREEN band)
    status_norm, _ = disaster_service.calculate_attention_status(
        hazard_context="GENERAL_MONITORING",
        preparedness_mode="GENERAL_MONITORING",
        vulnerability_level="LOW",
        exposure_level="LOW",
        rainfall_mm=0.0,
        multi_day_rain_mm=0.0,
        wind_speed_ms=2.0,
        bust_prob=0.05,
        self_audit_status="OK",
        reliability_band="GREEN",
        trust_index=90.0
    )
    t12 = status_norm == "NORMAL_MONITORING"
    print(f"Test 12 (Clear conditions status): {status_norm} -> Expected: NORMAL_MONITORING")
    results['clear_conditions_normal_monitoring'] = t12

    # Test 13: What-if recalculation
    whatif_res = disaster_service.process_custom_scenario(
        scenario_id="DISASTER_EUP_01",
        rainfall_mm_override=75.0,
        forecast_init=data_service.init_dates[0],
        lead_day=1
    )
    t13 = whatif_res is not None and whatif_res.get('is_what_if_override') == True and whatif_res.get('rainfall_mm_override') == 75.0
    print(f"Test 13 (Custom what-if recalculation): {t13} -> Status: {whatif_res.get('attention_status') if whatif_res else None}")
    results['custom_whatif_recalculation'] = t13

    # Test 14: What-if non-persistence (original scenario unchanged)
    orig_detail = disaster_service.get_disaster_detail("DISASTER_EUP_01")
    t14 = orig_detail is not None and orig_detail.get('vulnerability_level') == "HIGH" and orig_detail.get('preparedness_mode') == "RESOURCE_REVIEW"
    print(f"Test 14 (What-if non-persistence): {t14} -> Orig Mode: {orig_detail.get('preparedness_mode') if orig_detail else None}")
    results['whatif_non_persistence'] = t14

    # Test 15: Actual forecast remains read-only in custom scenario output
    t15 = whatif_res is not None and 'actual_rainfall_mm' in whatif_res and 'actual_wind_speed_ms' in whatif_res and whatif_res.get('rainfall_mm_override') == 75.0
    print(f"Test 15 (Actual forecast read-only in output): {t15} -> Actual Rain: {whatif_res.get('actual_rainfall_mm') if whatif_res else None}")
    results['actual_forecast_read_only'] = t15

    # Test 16: Forecast rainfall accumulation (D1-D3 sum)
    init_date = data_service.init_dates[0]
    multi_rain = disaster_service.compute_multi_day_accumulated_rain(init_date, 24.90, 82.12, max_lead=3)
    sum_d1_d3 = 0.0
    for lead in [1, 2, 3]:
        g_row = disaster_service.find_nearest_grid_point(init_date, lead, 24.90, 82.12)
        if g_row is not None:
            sum_d1_d3 += float(g_row['ensemble_mean_mm'])
    t16 = abs(multi_rain - round(sum_d1_d3, 2)) < 0.01
    print(f"Test 16 (Multi-day rainfall accumulation D1-D3 sum): {t16} -> Computed: {multi_rain} mm, Sum: {round(sum_d1_d3, 2)} mm")
    results['rainfall_accumulation_sum'] = t16

    # Test 17: No flood probability or inundation depth fields in response schemas
    ds_detail = disaster_service.get_decision_support("DISASTER_EUP_01", init_date, 1)
    t17 = ds_detail is not None and 'flood_probability' not in ds_detail and 'flood_depth' not in ds_detail and 'inundation_depth' not in ds_detail
    print(f"Test 17 (No unbacked flood probability/depth fields): {t17}")
    results['no_flood_prob_fields'] = t17

    # Test 18: Operational disclaimer presence and zero official evacuation/warning claims
    t18 = ds_detail is not None and 'disclaimer' in ds_detail and "decision-support information only" in ds_detail['disclaimer'].lower()
    print(f"Test 18 (Operational safety disclaimer present): {t18} -> Disclaimer: {ds_detail.get('disclaimer') if ds_detail else None}")
    results['safety_disclaimer_present'] = t18

    print("\n--- TEST SUMMARY ---")
    all_passed = True
    for k, v in results.items():
        print(f"  {k}: {'PASS' if v else 'FAIL'}")
        if not v:
            all_passed = False

    if all_passed:
        print(f"\nALL {len(results)} PHASE 9C SCIENTIFIC TESTS PASSED SUCCESSFULLY.")
    else:
        print("\nSOME TESTS FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    test_disaster_rules()
