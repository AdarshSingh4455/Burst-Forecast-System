import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from backend.app.data_service import data_service
from backend.app.reservoir_service import reservoir_service
from backend.app.schemas import ReservoirScenarioRequest

@asynccontextmanager
async def lifespan(app: FastAPI):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    data_service.load_data(base_dir)
    reservoir_service.load_data(base_dir)
    yield

app = FastAPI(
    title="FORTRESS Backend API",
    description="Forecast Reliability Stress-Testing & Self-Audit System (SIH26079)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def get_health():
    return {
        "status": "ok",
        "project": "FORTRESS",
        "phase": 8,
        "data_loaded": data_service.data_loaded,
        "available_forecast_runs": data_service.init_dates
    }

@app.get("/api/metadata")
def get_metadata():
    return data_service.get_metadata()

@app.get("/api/regions")
def get_regions():
    return {"regions": data_service.regions}

@app.get("/api/forecast-runs")
def get_forecast_runs():
    return {"forecast_runs": data_service.init_dates}

@app.get("/api/map")
def get_map_data(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    metric: str = Query("bust_probability"),
    region: str = Query("ALL")
):
    if forecast_init not in data_service.init_dates:
        raise HTTPException(status_code=404, detail=f"Forecast init date {forecast_init} not found.")
    return data_service.get_map_data(forecast_init, lead_day, metric, region)

@app.get("/api/forecast/{region}")
def get_regional_summary(
    region: str,
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10)
):
    res = data_service.get_regional_summary(region, forecast_init, lead_day)
    if res is None:
        raise HTTPException(status_code=404, detail=f"No summary found for region {region}, init {forecast_init}, lead {lead_day}.")
    return res

@app.get("/api/grid-detail")
def get_grid_detail(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    res = data_service.get_grid_detail(forecast_init, lead_day, latitude, longitude)
    if res is None:
        raise HTTPException(status_code=404, detail="Grid point detail not found.")
    return res

@app.get("/api/trend")
def get_point_trend(
    forecast_init: str = Query(...),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    return data_service.get_point_trend(forecast_init, latitude, longitude)

@app.get("/api/regional-trend")
def get_regional_trend(
    forecast_init: str = Query(...),
    region: str = Query("Eastern_UP_Pilot")
):
    return data_service.get_regional_trend(forecast_init, region)

@app.get("/api/stress-test")
def get_stress_test(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    detail = data_service.get_grid_detail(forecast_init, lead_day, latitude, longitude)
    if detail is None:
        raise HTTPException(status_code=404, detail="Stress test data not found.")
    return {
        "ffd": detail["ffd"],
        "ffd_failure_found": detail["ffd_failure_found"],
        "min_bust_delta_humidity": detail["min_bust_delta_humidity"],
        "min_bust_delta_temp": detail["min_bust_delta_temp"],
        "min_bust_delta_mslp": detail["min_bust_delta_mslp"],
        "min_bust_delta_wind": detail["min_bust_delta_wind"],
        "fragility_curve": [
            {"stress_radius": 0.0, "bust_fraction": detail["baseline_p_bust"]},
            {"stress_radius": 0.2, "bust_fraction": detail["fragility_20"]},
            {"stress_radius": 0.4, "bust_fraction": detail["fragility_40"]},
            {"stress_radius": 0.6, "bust_fraction": detail["fragility_60"]},
            {"stress_radius": 0.8, "bust_fraction": detail["fragility_80"]},
            {"stress_radius": 1.0, "bust_fraction": detail["fragility_100"]}
        ],
        "fragility_auc": detail["fragility_auc"],
        "fragility_category": detail["fragility_category"],
        "stress_evidence": detail["stress_evidence"],
        "disclaimer": "Nearest tested vulnerability scenario — prototype metric."
    }

@app.get("/api/failure-corridors")
def get_failure_corridors(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    detail = data_service.get_grid_detail(forecast_init, lead_day, latitude, longitude)
    if detail is None:
        raise HTTPException(status_code=404, detail="Failure corridor data not found.")
    return {
        "corridor_id": detail["failure_corridor_id"],
        "corridor_label": detail["failure_corridor_label"],
        "sensitivities": {
            "humidity": detail["sens_humidity"],
            "temperature": detail["sens_temperature"],
            "pressure": detail["sens_pressure"],
            "wind": detail["sens_wind"]
        },
        "fingerprint_label": detail["failure_fingerprint_label"]
    }

@app.get("/api/fingerprint")
def get_fingerprint(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    detail = data_service.get_grid_detail(forecast_init, lead_day, latitude, longitude)
    if detail is None:
        raise HTTPException(status_code=404, detail="Fingerprint data not found.")
    return {
        "moisture": detail["fingerprint_moisture"],
        "temperature": detail["fingerprint_temperature"],
        "pressure": detail["fingerprint_pressure"],
        "wind": detail["fingerprint_wind"],
        "ensemble": detail["fingerprint_ensemble"],
        "novelty": detail["fingerprint_novelty"],
        "label": detail["failure_fingerprint_label"]
    }

@app.get("/api/analogues")
def get_analogues(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    return data_service.get_analogues(forecast_init, lead_day, latitude, longitude)

@app.get("/api/failure-dna")
def get_failure_dna(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    detail = data_service.get_grid_detail(forecast_init, lead_day, latitude, longitude)
    if detail is None:
        raise HTTPException(status_code=404, detail="Failure DNA data not found.")
    return {
        "max_similarity": detail["failure_dna_max_sim"],
        "top3_mean_similarity": detail["failure_dna_top3_mean_sim"],
        "risk_flag": detail["failure_dna_risk_flag"],
        "nearest_corridor": detail["failure_dna_nearest_corridor"],
        "disclaimer": "Prototype heuristic threshold on positive percentile rank vectors."
    }

@app.get("/api/ensemble")
def get_ensemble(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    detail = data_service.get_grid_detail(forecast_init, lead_day, latitude, longitude)
    if detail is None:
        raise HTTPException(status_code=404, detail="Ensemble data not found.")
    return {
        "c00_mm": detail["rain_c00_mm"],
        "p01_mm": detail["rain_p01_mm"],
        "p02_mm": detail["rain_p02_mm"],
        "p03_mm": detail["rain_p03_mm"],
        "p04_mm": detail["rain_p04_mm"],
        "ensemble_mean": detail["ensemble_mean_mm"],
        "ensemble_spread": detail["ensemble_spread_mm"],
        "ensemble_min": detail["ensemble_min_mm"],
        "ensemble_max": detail["ensemble_max_mm"],
        "member_range": detail["member_range_mm"],
        "disagreement_score": detail["ensemble_disagreement_score"],
        "disagreement_category": detail["ensemble_disagreement_category"]
    }

@app.get("/api/novelty")
def get_novelty(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    detail = data_service.get_grid_detail(forecast_init, lead_day, latitude, longitude)
    if detail is None:
        raise HTTPException(status_code=404, detail="Novelty data not found.")
    return {
        "ood_score": detail["ood_score"],
        "ood_category": detail["ood_category"],
        "disclaimer": "Prototype OOD diagnostic based on training-reference Isolation Forest."
    }

@app.get("/api/self-audit")
def get_self_audit(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    detail = data_service.get_grid_detail(forecast_init, lead_day, latitude, longitude)
    if detail is None:
        raise HTTPException(status_code=404, detail="Self-Audit data not found.")
    return {
        "ai_risk_category": detail["ai_risk_category"],
        "stress_evidence": detail["stress_evidence"],
        "history_evidence": detail["history_evidence"],
        "dna_evidence": detail["dna_evidence"],
        "ensemble_disagreement_category": detail["ensemble_disagreement_category"],
        "ood_category": detail["ood_category"],
        "supporting_evidence_count": detail["supporting_evidence_count"],
        "contradicting_evidence_count": detail["contradicting_evidence_count"],
        "self_audit_status": detail["self_audit_status"],
        "self_audit_reason": detail["self_audit_reason"],
        "trust_index": detail["trust_index"],
        "reliability_band": detail["reliability_band"]
    }

@app.get("/api/trust-horizon")
def get_trust_horizon(
    forecast_init: str = Query(...),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    trend = data_service.get_point_trend(forecast_init, latitude, longitude)
    if len(trend) == 0:
        raise HTTPException(status_code=404, detail="Trust horizon data not found.")
    detail = data_service.get_grid_detail(forecast_init, 1, latitude, longitude)
    return {
        "lead_timeline": [
            {"lead_day": t["lead_day"], "reliability_band": t["reliability_band"], "trust_index": t["trust_index"]}
            for t in trend
        ],
        "trust_horizon_day": detail["trust_horizon_day"] if detail else 10,
        "breaking_point_day": detail["breaking_point_day"] if detail else None
    }

@app.get("/api/trust-horizon/{region}")
def get_regional_trust_horizon(
    region: str,
    forecast_init: str = Query(...)
):
    trend = data_service.get_regional_trend(forecast_init, region)
    if len(trend) == 0:
        raise HTTPException(status_code=404, detail="Regional trust horizon data not found.")
    summary = data_service.get_regional_summary(region, forecast_init, 1)
    return {
        "regional_sequence": trend,
        "regional_trust_horizon_day": summary["regional_trust_horizon_day"] if summary else 10,
        "regional_breaking_point_day": summary["regional_breaking_point_day"] if summary else None
    }

@app.get("/api/passport")
def get_passport(
    forecast_init: str = Query(...),
    lead_day: int = Query(..., ge=1, le=10),
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    passport = data_service.get_passport(forecast_init, lead_day, latitude, longitude)
    if passport is None:
        raise HTTPException(status_code=404, detail="Reliability passport data not found.")
    return passport

# ============================================================
# PHASE 9A — RESERVOIR DECISION SUPPORT ENDPOINTS
# ============================================================

@app.get("/api/reservoirs")
def get_reservoirs():
    return reservoir_service.get_reservoirs_summary()

@app.get("/api/reservoirs/{reservoir_id}")
def get_reservoir_detail(reservoir_id: str):
    res = reservoir_service.get_reservoir_detail(reservoir_id)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Reservoir '{reservoir_id}' not found.")
    return res

@app.get("/api/reservoirs/{reservoir_id}/forecast-context")
def get_reservoir_forecast_context(
    reservoir_id: str,
    forecast_init: str = Query(...)
):
    ctx = reservoir_service.get_forecast_context(reservoir_id, forecast_init)
    if ctx is None:
        raise HTTPException(status_code=404, detail=f"Forecast context for reservoir '{reservoir_id}' not found.")
    return ctx

@app.get("/api/reservoirs/{reservoir_id}/decision-support")
def get_reservoir_decision_support(
    reservoir_id: str,
    forecast_init: str = Query(...),
    lead_day: int = Query(1, ge=1, le=10),
    scenario: str = Query("NORMAL")
):
    ds = reservoir_service.get_decision_support(reservoir_id, forecast_init, lead_day, scenario)
    if ds is None:
        raise HTTPException(status_code=404, detail=f"Decision support for reservoir '{reservoir_id}' not found.")
    return ds

@app.post("/api/reservoirs/{reservoir_id}/scenario")
def post_reservoir_scenario(
    reservoir_id: str,
    body: ReservoirScenarioRequest,
    forecast_init: str = Query(...),
    lead_day: int = Query(1, ge=1, le=10)
):
    res = reservoir_service.process_custom_scenario(
        reservoir_id,
        storage_percent=body.storage_percent,
        recent_inflow_cumecs=body.recent_inflow_cumecs or 300.0,
        scenario_name=body.scenario_name or "Custom What-If Scenario",
        forecast_init=forecast_init,
        lead_day=lead_day
    )
    if res is None:
        raise HTTPException(status_code=404, detail=f"Reservoir '{reservoir_id}' not found.")
    return res

