import os
import sys

# Add root directory to sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, root_dir)

from backend.app.agriculture_service import agriculture_service
from backend.app.data_service import data_service

def test_agriculture_rules():
    print("=== RUNNING PHASE 9B AGRICULTURE DECISION SUPPORT SCIENTIFIC TESTS ===")
    data_service.load_data(root_dir)
    agriculture_service.load_data(root_dir)

    results = {}

    # Test 1: exact southern boundary 24.5 = supported
    t1 = agriculture_service.check_pilot_coverage(24.5, 82.0)
    print(f"Test 1 (Lat 24.5, Lon 82.0): {t1} -> Expected: True")
    results['exact_southern_24.5'] = t1 == True

    # Test 2: 24.499 = outside
    t2 = agriculture_service.check_pilot_coverage(24.499, 82.0)
    print(f"Test 2 (Lat 24.499, Lon 82.0): {t2} -> Expected: False")
    results['southern_24.499_outside'] = t2 == False

    # Test 3: longitude 80.0 = supported
    t3 = agriculture_service.check_pilot_coverage(26.0, 80.0)
    print(f"Test 3 (Lat 26.0, Lon 80.0): {t3} -> Expected: True")
    results['exact_western_80.0'] = t3 == True

    # Test 4: longitude 79.999 = outside
    t4 = agriculture_service.check_pilot_coverage(26.0, 79.999)
    print(f"Test 4 (Lat 26.0, Lon 79.999): {t4} -> Expected: False")
    results['western_79.999_outside'] = t4 == False

    # Test 5: outside agriculture scenario returns no FORTRESS context
    ctx_outside = agriculture_service.get_forecast_context('AGRI_OUTSIDE_01', data_service.init_dates[0])
    t5 = ctx_outside is not None and ctx_outside.get('coverage_available') == False and ctx_outside.get('forecast_context') is None and ctx_outside.get('lead_contexts') is None
    print(f"Test 5 (Outside agriculture forecast context): {t5} -> Context: {ctx_outside.get('forecast_context') if ctx_outside else None}")
    results['outside_no_fortress_context'] = t5

    # Test 6: outside agriculture scenario receives no decision-support status
    ds_outside = agriculture_service.get_decision_support('AGRI_OUTSIDE_01', data_service.init_dates[0], 1)
    t6 = ds_outside is not None and ds_outside.get('coverage_available') == False and ds_outside.get('attention_status') is None and ds_outside.get('decision_support') is None
    print(f"Test 6 (Outside agriculture decision support status): {t6} -> Attention Status: {ds_outside.get('attention_status') if ds_outside else None}")
    results['outside_no_decision_status'] = t6

    # Test 7: inside off-grid agriculture scenario snaps only to a valid nearby grid
    # AGRI_EUP_01 (Lat 24.90, Lon 82.12)
    grid_pt = agriculture_service.find_nearest_grid_point(data_service.init_dates[0], 1, 24.90, 82.12)
    t7 = grid_pt is not None and grid_pt['latitude'] >= 24.5 and grid_pt['latitude'] <= 28.5 and grid_pt['longitude'] >= 80.0 and grid_pt['longitude'] <= 84.5
    print(f"Test 7 (Inside off-grid agriculture snapping): {t7} -> Snapped to ({grid_pt['latitude']}, {grid_pt['longitude']}) if grid_pt else None")
    results['inside_offgrid_snaps_valid'] = t7

    # Test 8: Low relevance (VEGETATIVE, 0mm rain) + RED forecast does NOT automatically produce expert-review status
    status_low_rel, reasons_low_rel = agriculture_service.calculate_attention_status(
        crop="Maize",
        crop_stage="VEGETATIVE",
        field_operation="GENERAL_MONITORING",
        soil_moisture_percent=60.0,
        rainfall_mm=0.0,
        temperature_c=28.0,
        wind_speed_ms=3.0,
        bust_prob=0.1,
        self_audit_status="OK",
        reliability_band="RED",
        trust_index=40.0
    )
    t8 = status_low_rel == "NORMAL_MONITORING"
    print(f"Test 8 (Low relevance + RED forecast attention status): {status_low_rel} -> Expected: NORMAL_MONITORING")
    results['low_relevance_red_not_expert'] = t8

    # Test 9: High relevance (HARVEST_WINDOW, 10mm rain) + RED forecast DOES produce HIGH_UNCERTAINTY_EXPERT_REVIEW
    status_high_rel, reasons_high_rel = agriculture_service.calculate_attention_status(
        crop="Rice",
        crop_stage="HARVEST",
        field_operation="HARVEST_WINDOW",
        soil_moisture_percent=40.0,
        rainfall_mm=10.0,
        temperature_c=28.0,
        wind_speed_ms=4.0,
        bust_prob=0.1,
        self_audit_status="OK",
        reliability_band="RED",
        trust_index=40.0
    )
    t9 = status_high_rel == "HIGH_UNCERTAINTY_EXPERT_REVIEW"
    print(f"Test 9 (High relevance + RED forecast attention status): {status_high_rel} -> Expected: HIGH_UNCERTAINTY_EXPERT_REVIEW")
    results['high_relevance_red_triggers_expert'] = t9

    # Test 10: Weather sensitive window (HARVEST_WINDOW + 20mm rain + GREEN band)
    status_sens, _ = agriculture_service.calculate_attention_status(
        crop="Rice",
        crop_stage="HARVEST",
        field_operation="HARVEST_WINDOW",
        soil_moisture_percent=40.0,
        rainfall_mm=20.0,
        temperature_c=28.0,
        wind_speed_ms=4.0,
        bust_prob=0.1,
        self_audit_status="OK",
        reliability_band="GREEN",
        trust_index=85.0
    )
    t10 = status_sens == "WEATHER_SENSITIVE_WINDOW"
    print(f"Test 10 (Weather sensitive window status): {status_sens} -> Expected: WEATHER_SENSITIVE_WINDOW")
    results['weather_sensitive_window'] = t10

    # Test 11: Farm advisory review (VEGETATIVE + 18mm rain + GREEN band)
    status_adv, _ = agriculture_service.calculate_attention_status(
        crop="Maize",
        crop_stage="VEGETATIVE",
        field_operation="GENERAL_MONITORING",
        soil_moisture_percent=50.0,
        rainfall_mm=18.0,
        temperature_c=28.0,
        wind_speed_ms=3.0,
        bust_prob=0.1,
        self_audit_status="OK",
        reliability_band="GREEN",
        trust_index=85.0
    )
    t11 = status_adv == "FARM_ADVISORY_REVIEW"
    print(f"Test 11 (Farm advisory review status): {status_adv} -> Expected: FARM_ADVISORY_REVIEW")
    results['farm_advisory_review'] = t11

    # Test 12: What-if custom scenario recalculation & non-persistence
    scen_res = agriculture_service.process_custom_scenario(
        'AGRI_EUP_01',
        crop_stage="SOWING",
        field_operation="SOWING_WINDOW",
        soil_moisture_percent=20.0,
        forecast_init=data_service.init_dates[0],
        lead_day=1
    )
    t12 = scen_res is not None and scen_res.get('crop_stage') == "SOWING" and scen_res.get('coverage_available') == True
    # Ensure source dataset remains unmutated
    orig_detail = agriculture_service.get_agriculture_detail('AGRI_EUP_01')
    t12 = t12 and orig_detail['crop_stage'] == "HARVEST"
    print(f"Test 12 (What-if scenario recalculation & non-persistence): {t12} -> Original stage retained: {orig_detail['crop_stage']}")
    results['what_if_recalculation_non_persistent'] = t12

    all_passed = all(results.values())
    print(f"\nALL 12 AGRICULTURE SCIENTIFIC TESTS PASSED: {all_passed}")
    return all_passed

if __name__ == '__main__':
    passed = test_agriculture_rules()
    sys.exit(0 if passed else 1)
