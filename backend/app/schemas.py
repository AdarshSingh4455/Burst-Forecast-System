from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    project: str
    phase: int
    data_loaded: bool
    available_forecast_runs: List[str]

class MetadataResponse(BaseModel):
    regions: List[str]
    forecast_init_dates: List[str]
    lead_days: List[int]
    variables: List[str]
    grid_extent: Dict[str, float]
    grid_point_count: int

class MapPoint(BaseModel):
    latitude: float
    longitude: float
    value: float
    reliability_band: str
    self_audit_status: str

class RegionalSummaryResponse(BaseModel):
    region: str
    forecast_init: str
    lead_day: int
    mean_rainfall_mm: float
    mean_bust_probability: float
    mean_ffd: float
    mean_fragility: float
    median_trust_index: float
    green_fraction: float
    yellow_fraction: float
    red_fraction: float
    regional_reliability_band: str
    regional_trust_horizon_day: int
    regional_breaking_point_day: Optional[int] = None
    dominant_failure_corridor: str
    dominant_vulnerability: str

class GridDetailResponse(BaseModel):
    forecast_init: str
    valid_time: str
    lead_day: int
    latitude: float
    longitude: float
    region: str
    ensemble_mean_mm: float
    ensemble_spread_mm: float
    baseline_p_bust: float
    ai_risk_category: str
    ffd: float
    ffd_failure_found: int
    fragility_auc: float
    fragility_category: str
    stress_evidence: str
    failure_corridor_label: str
    failure_fingerprint_label: str
    fingerprint_moisture: float
    fingerprint_temperature: float
    fingerprint_pressure: float
    fingerprint_wind: float
    fingerprint_ensemble: float
    fingerprint_novelty: float
    analogue_available: int
    analogue_count: int
    analogue_mean_bust_rate: float
    failure_dna_max_sim: float
    failure_dna_risk_flag: int
    ensemble_disagreement_score: float
    ensemble_disagreement_category: str
    ood_score: float
    ood_category: str
    self_audit_status: str
    self_audit_reason: str
    trust_index: float
    reliability_band: str
    trust_horizon_day: int
    breaking_point_day: Optional[int] = None
    primary_vulnerability: str

class PassportResponse(BaseModel):
    title: str
    forecast_init: str
    valid_time: str
    lead_day: int
    latitude: float
    longitude: float
    region: str
    rainfall_mm: float
    temperature_c: float
    humidity_gkg: float
    pressure_hpa: float
    wind_speed_ms: float
    bust_probability: float
    ai_risk_category: str
    ffd: float
    fragility_category: str
    failure_corridor: str
    failure_fingerprint: str
    analogue_available: bool
    analogue_bust_rate: float
    dna_similarity: float
    ensemble_disagreement: str
    ood_category: str
    self_audit_status: str
    self_audit_reason: str
    trust_index: float
    reliability_band: str
    trust_horizon_day: int
    breaking_point_day: Optional[int] = None
    primary_vulnerability: str
    disclaimer: str
