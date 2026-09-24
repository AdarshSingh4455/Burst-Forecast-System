import os
import sys

# Add root directory to sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, root_dir)

from backend.app.reservoir_service import reservoir_service
from backend.app.data_service import data_service

def test_reservoir_rules():
    print("=== RUNNING PHASE 9A RESERVOIR DECISION SUPPORT SCIENTIFIC TESTS ===")
    data_service.load_data(root_dir)
    reservoir_service.load_data(root_dir)

    results = {}

    # Test 1: exact southern boundary 24.5 = supported
    t1 = reservoir_service.check_pilot_coverage(24.5, 82.0)
    print(f"Test 1 (Lat 24.5, Lon 82.0): {t1} -> Expected: True")
    results['exact_southern_24.5'] = t1 == True

    # Test 2: 24.499 = outside
    t2 = reservoir_service.check_pilot_coverage(24.499, 82.0)
    print(f"Test 2 (Lat 24.499, Lon 82.0): {t2} -> Expected: False")
    results['southern_24.499_outside'] = t2 == False

    # Test 3: longitude 80.0 = supported
    t3 = reservoir_service.check_pilot_coverage(26.0, 80.0)
    print(f"Test 3 (Lat 26.0, Lon 80.0): {t3} -> Expected: True")
    results['exact_western_80.0'] = t3 == True

    # Test 4: longitude 79.999 = outside
    t4 = reservoir_service.check_pilot_coverage(26.0, 79.999)
    print(f"Test 4 (Lat 26.0, Lon 79.999): {t4} -> Expected: False")
    results['western_79.999_outside'] = t4 == False

    # Test 5: outside reservoir returns no FORTRESS context
    ctx_outside = reservoir_service.get_forecast_context('RES_RIHAND', data_service.init_dates[0])
    t5 = ctx_outside is not None and ctx_outside.get('coverage_available') == False and ctx_outside.get('forecast_context') is None and ctx_outside.get('lead_contexts') is None
    print(f"Test 5 (Outside reservoir forecast context): {t5} -> Context: {ctx_outside.get('forecast_context') if ctx_outside else None}")
    results['outside_no_fortress_context'] = t5

    # Test 6: outside reservoir receives no decision-support status
    ds_outside = reservoir_service.get_decision_support('RES_RIHAND', data_service.init_dates[0], 1, 'NORMAL')
    t6 = ds_outside is not None and ds_outside.get('coverage_available') == False and ds_outside.get('attention_status') is None and ds_outside.get('decision_support') is None
    print(f"Test 6 (Outside reservoir decision support status): {t6} -> Attention Status: {ds_outside.get('attention_status') if ds_outside else None}")
    results['outside_no_decision_status'] = t6

    # Test 7: inside off-grid reservoir snaps only to a valid nearby grid
    # RES_MEJA is inside pilot (Lat 24.90, Lon 82.12)
    grid_pt = reservoir_service.find_nearest_grid_point(data_service.init_dates[0], 1, 24.90, 82.12)
    t7 = grid_pt is not None and grid_pt['latitude'] >= 24.5 and grid_pt['latitude'] <= 28.5 and grid_pt['longitude'] >= 80.0 and grid_pt['longitude'] <= 84.5
    print(f"Test 7 (Inside off-grid reservoir snapping): {t7} -> Snapped to ({grid_pt['latitude']}, {grid_pt['longitude']}) if grid_pt else None")
    results['inside_offgrid_snaps_valid'] = t7

    # Test 8: low reservoir + low rainfall + RED forecast does NOT automatically produce reservoir expert-review status
    # storage 50%, rain 5mm, RED forecast -> Should be NORMAL_MONITORING
    status_low_op, reasons_low_op = reservoir_service.calculate_attention_status(
        storage_percent=50.0,
        rainfall_mm=5.0,
        bust_prob=0.1,
        self_audit_status="OK",
        reliability_band="RED",
        trust_index=40.0,
        recent_inflow_cumecs=100.0
    )
    t8 = status_low_op == "NORMAL_MONITORING"
    print(f"Test 8 (Low storage/rain + RED forecast attention status): {status_low_op} -> Expected: NORMAL_MONITORING")
    results['low_op_red_forecast_not_expert'] = t8

    # Test 9: high storage/significant rainfall + RED/conflict DOES produce HIGH_UNCERTAINTY_EXPERT_REVIEW
    # storage 80% (>=75%), rain 5mm, RED forecast -> Should be HIGH_UNCERTAINTY_EXPERT_REVIEW
    status_high_op, reasons_high_op = reservoir_service.calculate_attention_status(
        storage_percent=80.0,
        rainfall_mm=5.0,
        bust_prob=0.1,
        self_audit_status="OK",
        reliability_band="RED",
        trust_index=40.0,
        recent_inflow_cumecs=100.0
    )
    t9 = status_high_op == "HIGH_UNCERTAINTY_EXPERT_REVIEW"
    print(f"Test 9 (High storage/rain + RED forecast attention status): {status_high_op} -> Expected: HIGH_UNCERTAINTY_EXPERT_REVIEW")
    results['high_op_red_forecast_triggers_expert'] = t9

    all_passed = all(results.values())
    print(f"\nALL 9 TESTS PASSED: {all_passed}")
    return all_passed

if __name__ == '__main__':
    passed = test_reservoir_rules()
    sys.exit(0 if passed else 1)
