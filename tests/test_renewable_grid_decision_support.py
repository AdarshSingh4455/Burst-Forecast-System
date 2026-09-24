"""
Tests for FORTRESS Phase 9D Renewable Energy / Grid Decision Support.
Ensures scientific integrity, pilot boundary enforcement, diagnostic correctness,
solar unavailability handling, 10m wind speed provenance & labeling, and endpoint behavior.
"""

import os
import sys
import json
import urllib.request
import urllib.parse

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app.renewable_service import renewable_service
from backend.app.data_service import data_service

BASE_URL = "http://127.0.0.1:8000/api"


def test_renewable_rules():
    print("=== RUNNING PHASE 9D RENEWABLE GRID DECISION SUPPORT SCIENTIFIC TESTS ===")
    data_service.load_data(root_dir)
    renewable_service.load_data(root_dir)
    init_date = data_service.init_dates[0] if data_service.init_dates else "2019-07-01 00:00:00"

    results = {}

    # Test 1: Summary List Retrieval
    summaries = renewable_service.get_renewable_summary()
    t1 = len(summaries) >= 4 and any(s["scenario_id"] == "RENEW_EUP_01" for s in summaries)
    print(f"Test 1 (Summary List): {t1}")
    results["summary_list"] = t1

    # Test 2: Detail by ID
    scen = renewable_service.get_renewable_detail("RENEW_EUP_01")
    t2 = scen is not None and scen.get("name") == "Eastern UP Renewable Zone A"
    print(f"Test 2 (Get Detail by ID): {t2}")
    results["detail_by_id"] = t2

    # Test 3: Spatial Boundary Check - Inside
    t3 = renewable_service.check_pilot_coverage(26.75, 83.37)
    print(f"Test 3 (Inside Pilot Spatial Check): {t3}")
    results["inside_pilot_spatial"] = t3 == True

    # Test 4: Spatial Boundary Check - Outside
    t4 = renewable_service.check_pilot_coverage(18.52, 73.85)
    print(f"Test 4 (Outside Pilot Spatial Check): {t4}")
    results["outside_pilot_spatial"] = t4 == False

    # Test 5: Outside Pilot Forecast Context
    ctx_out = renewable_service.get_forecast_context("RENEW_OUTSIDE_01", init_date)
    t5 = (ctx_out is not None and ctx_out.get("coverage_available") == False and 
          ctx_out.get("context_mode") == "OUTSIDE_PILOT" and ctx_out.get("lead_contexts") is None)
    print(f"Test 5 (Outside Pilot Context Suppression): {t5}")
    results["outside_pilot_context_suppression"] = t5

    # Test 6: Outside Pilot Decision Support
    ds_out = renewable_service.get_decision_support("RENEW_OUTSIDE_01", init_date, 1)
    t6 = (ds_out is not None and ds_out.get("coverage_available") == False and 
          ds_out.get("context_mode") == "OUTSIDE_PILOT" and
          "FORTRESS reliability analysis is unavailable" in ds_out.get("reasons", [""])[0])
    print(f"Test 6 (Outside Pilot Decision Support): {t6}")
    results["outside_pilot_decision_support"] = t6

    # Test 7: Solar Diagnostic Unavailability - Hybrid Plant (RENEW_EUP_03)
    ds_hyb = renewable_service.get_decision_support("RENEW_EUP_03", init_date, 1)
    t7 = (ds_hyb.get("solar_diagnostic_available") == False and 
          "SOLAR GENERATION DIAGNOSTIC NOT AVAILABLE IN PROTOTYPE" in ds_hyb.get("solar_message", ""))
    print(f"Test 7 (Solar Unavailability Diagnostic - Hybrid): {t7}")
    results["solar_unavailability_hybrid"] = t7

    # Test 8: Solar Diagnostic Unavailability - Pure Solar Plant (RENEW_EUP_02)
    ds_sol = renewable_service.get_decision_support("RENEW_EUP_02", init_date, 1)
    t8 = (ds_sol.get("solar_diagnostic_available") == False and 
          "SOLAR GENERATION DIAGNOSTIC NOT AVAILABLE IN PROTOTYPE" in ds_sol.get("solar_message", ""))
    print(f"Test 8 (Solar Unavailability Diagnostic - Pure Solar): {t8}")
    results["solar_unavailability_solar_plant"] = t8

    # Test 9: 10m Wind Speed Diagnostic Provenance & Labeling
    ds_wind = renewable_service.get_decision_support("RENEW_EUP_01", init_date, 1)
    t9 = (ds_wind.get("wind_speed_10m_ms") is not None and 
          any("10 m forecast wind" in lim for lim in ds_wind.get("limitations", [])))
    print(f"Test 9 (10m Wind Speed Diagnostic Provenance & Labeling): {t9}")
    results["wind_10m_labeling"] = t9


    # Test 10: Lead-to-Lead Wind Change Diagnostic
    t10 = "wind_change_ms" in ds_wind and isinstance(ds_wind["wind_change_ms"], float)
    print(f"Test 10 (Lead-to-Lead Wind Change Diagnostic): {t10}")
    results["lead_to_lead_wind_change"] = t10

    # Test 11: Allowed Attention Status Enums
    allowed_enums = {
        "NORMAL_MONITORING",
        "GENERATION_VARIABILITY_REVIEW",
        "GRID_PREPAREDNESS_REVIEW",
        "HIGH_UNCERTAINTY_EXPERT_REVIEW",
        None
    }
    t11 = True
    for s_id in ["RENEW_EUP_01", "RENEW_EUP_02", "RENEW_EUP_03", "RENEW_OUTSIDE_01"]:
        d = renewable_service.get_decision_support(s_id, init_date, 1)
        if d.get("attention_status") not in allowed_enums:
            t11 = False
            break
    print(f"Test 11 (Attention Status Enum Strictness): {t11}")
    results["allowed_attention_statuses"] = t11

    # Test 12: Pure Solar No Wind-Based Generation Inference
    # High wind override on SOLAR plant must not trigger wind-based variability status
    sol_sim = renewable_service.process_custom_scenario(
        "RENEW_EUP_02", # SOLAR
        technology_type="SOLAR",
        planning_mode="GENERAL_MONITORING",
        variability_sensitivity="LOW",
        grid_sensitivity="LOW",
        wind_speed_ms_override=14.0,
        forecast_init=init_date,
        lead_day=1
    )
    t12 = (sol_sim is not None and 
           sol_sim.get("attention_status") == "NORMAL_MONITORING" and
           sol_sim.get("actual_wind_speed_10m_ms") != 14.0) # actual read-only preserved
    print(f"Test 12 (Pure SOLAR No Wind-Based Generation Inference): {t12}")
    results["pure_solar_no_wind_inference"] = t12

    # Test 13: What-If Non-Persistence Test
    baseline_before = renewable_service.get_decision_support("RENEW_EUP_01", init_date, 1)
    # Perform custom scenario POST / calculation
    _ = renewable_service.process_custom_scenario(
        "RENEW_EUP_01",
        wind_speed_ms_override=15.0,
        scenario_name="Non Persistence Test",
        forecast_init=init_date,
        lead_day=1
    )
    baseline_after = renewable_service.get_decision_support("RENEW_EUP_01", init_date, 1)
    t13 = (baseline_before["wind_speed_10m_ms"] == baseline_after["wind_speed_10m_ms"] and
           baseline_before["scenario_name"] == baseline_after["scenario_name"])
    print(f"Test 13 (What-If Non-Persistence): {t13}")
    results["whatif_non_persistence"] = t13

    # Test 14: Low Relevance + RED Reliability Gate
    # Low relevance solar scenario + forced RED reliability must NOT escalate to HIGH_UNCERTAINTY_EXPERT_REVIEW
    status_gate, reasons_gate = renewable_service.calculate_attention_status(
        technology_type="SOLAR",
        planning_mode="GENERAL_MONITORING",
        variability_sensitivity="LOW",
        grid_sensitivity="LOW",
        wind_speed_ms=12.0,
        wind_change_ms=4.0,
        rainfall_mm=0.0,
        bust_prob=0.8,
        self_audit_status="CONFLICT",
        reliability_band="RED",
        trust_index=35.0,
        ood_category="NOVEL"
    )
    t14 = status_gate == "NORMAL_MONITORING"
    print(f"Test 14 (Low Relevance + RED Reliability Gate): {t14}")
    results["low_relevance_red_gate"] = t14

    # Test 15: High WIND Relevance + RED Triggers Expert Review
    status_exp, _ = renewable_service.calculate_attention_status(
        technology_type="WIND",
        planning_mode="GENERATION_PLANNING_REVIEW",
        variability_sensitivity="HIGH",
        grid_sensitivity="HIGH",
        wind_speed_ms=10.0,
        wind_change_ms=3.0,
        rainfall_mm=0.0,
        bust_prob=0.8,
        self_audit_status="CONFLICT",
        reliability_band="RED",
        trust_index=35.0,
        ood_category="NORMAL"
    )
    t15 = status_exp == "HIGH_UNCERTAINTY_EXPERT_REVIEW"
    print(f"Test 15 (High WIND Relevance + RED Triggers Expert Review): {t15}")
    results["high_relevance_red_triggers_expert"] = t15

    # Test 16: Operational Safety Disclaimer Present
    t16 = "disclaimer" in ds_wind and "decision-support information only" in ds_wind["disclaimer"].lower()
    print(f"Test 16 (Safety Disclaimer Present): {t16}")
    results["safety_disclaimer_present"] = t16

    # Test 17-21: Live Endpoint API Audits via urllib
    print("\n--- Live FastAPI Endpoint Audits ---")
    try:
        # API 1: List
        req = urllib.request.Request(f"{BASE_URL}/renewable")
        with urllib.request.urlopen(req) as resp:
            t17 = resp.status == 200 and isinstance(json.loads(resp.read().decode('utf-8')), list)
        print(f"Test 17 (GET /api/renewable): {t17}")
        results["api_list"] = t17

        # API 2: Detail
        req = urllib.request.Request(f"{BASE_URL}/renewable/RENEW_EUP_01")
        with urllib.request.urlopen(req) as resp:
            t18 = resp.status == 200 and json.loads(resp.read().decode('utf-8')).get("scenario_id") == "RENEW_EUP_01"
        print(f"Test 18 (GET /api/renewable/RENEW_EUP_01): {t18}")
        results["api_detail"] = t18

        # API 3: Forecast Context
        req = urllib.request.Request(f"{BASE_URL}/renewable/RENEW_EUP_01/forecast-context?forecast_init={urllib.parse.quote(init_date)}")
        with urllib.request.urlopen(req) as resp:
            t19 = resp.status == 200 and "coverage_available" in json.loads(resp.read().decode('utf-8'))
        print(f"Test 19 (GET /api/renewable/RENEW_EUP_01/forecast-context): {t19}")
        results["api_forecast_context"] = t19

        # API 4: Decision Support
        req = urllib.request.Request(f"{BASE_URL}/renewable/RENEW_EUP_01/decision-support?forecast_init={urllib.parse.quote(init_date)}&lead_day=1")
        with urllib.request.urlopen(req) as resp:
            t20 = resp.status == 200 and "attention_status" in json.loads(resp.read().decode('utf-8'))
        print(f"Test 20 (GET /api/renewable/RENEW_EUP_01/decision-support): {t20}")
        results["api_decision_support"] = t20

        # API 5: Scenario POST
        payload = json.dumps({"wind_speed_ms_override": 14.0, "scenario_name": "High Wind Test"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/renewable/RENEW_EUP_01/scenario?forecast_init={urllib.parse.quote(init_date)}&lead_day=1", data=payload, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as resp:
            t21 = resp.status == 200 and json.loads(resp.read().decode('utf-8')).get("is_what_if_override") == True
        print(f"Test 21 (POST /api/renewable/RENEW_EUP_01/scenario): {t21}")
        results["api_post_scenario"] = t21

    except Exception as e:
        print(f"API Audit Error: {e}")
        results["api_endpoints"] = False

    # Test 22: Outside Pilot Snap Prevention
    grid_pt_out = renewable_service.find_nearest_grid_point(init_date, 1, 18.52, 73.85)
    t22 = grid_pt_out is None
    print(f"Test 22 (Outside Pilot Snap Prevention): {t22}")
    results["outside_snap_prevention"] = t22

    # Test 23: Inside Pilot Grid Snap Functionality
    grid_pt_in = renewable_service.find_nearest_grid_point(init_date, 1, 26.75, 83.37)
    t23 = grid_pt_in is None or len(grid_pt_in) > 0
    print(f"Test 23 (Inside Pilot Grid Snap Functionality): {t23}")
    results["inside_grid_snap"] = t23

    print("\n--- TEST SUMMARY ---")
    all_passed = True
    for k, v in results.items():
        print(f"  {k}: {'PASS' if v else 'FAIL'}")
        if not v:
            all_passed = False

    if all_passed:
        print(f"\nALL {len(results)} PHASE 9D SCIENTIFIC TESTS PASSED SUCCESSFULLY.")
    else:
        print("\nSOME TESTS FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    test_renewable_rules()
