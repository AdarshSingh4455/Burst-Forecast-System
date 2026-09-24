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

class ReservoirSummary(BaseModel):
    reservoir_id: str
    name: str
    latitude: float
    longitude: float
    state: str
    district: str
    river: str
    data_mode: str
    capacity_mcm: float
    current_storage_mcm: float
    storage_percent: float
    recent_inflow_cumecs: float
    recent_outflow_cumecs: float
    coverage_available: bool = True
    in_pilot_coverage: bool = True

class ReservoirLeadContext(BaseModel):
    lead_day: int
    rainfall_mm: float
    bust_probability: float
    ffd: float
    ffd_failure_found: bool
    fragility_category: str
    trust_index: float
    reliability_band: str
    self_audit_status: str
    attention_status: Optional[str] = None

class ReservoirForecastContextResponse(BaseModel):
    reservoir_id: str
    reservoir_name: str
    forecast_init: str
    data_mode: str
    coverage_available: bool = True
    in_pilot_coverage: bool = True
    context_mode: str
    reason: Optional[str] = None
    forecast_context: Optional[Any] = None
    lead_contexts: Optional[List[ReservoirLeadContext]] = None

class ReservoirDecisionSupportResponse(BaseModel):
    reservoir_id: str
    reservoir_name: str
    data_mode: str
    forecast_init: str
    lead_day: int
    latitude: float
    longitude: float
    coverage_available: bool = True
    in_pilot_coverage: bool = True
    context_mode: str
    
    # Reservoir state
    capacity_mcm: float
    current_storage_mcm: float
    storage_percent: float
    recent_inflow_cumecs: float
    scenario_name: str
    
    # Weather evidence (Suppressed if coverage_available is False)
    forecast_context: Optional[Any] = None
    decision_support: Optional[Any] = None
    rainfall_mm: Optional[float] = None
    bust_probability: Optional[float] = None
    ffd: Optional[float] = None
    ffd_failure_found: Optional[bool] = None
    fragility_category: Optional[str] = None
    ensemble_disagreement_category: Optional[str] = None
    ood_category: Optional[str] = None
    self_audit_status: Optional[str] = None
    self_audit_reason: Optional[str] = None
    trust_index: Optional[float] = None
    reliability_band: Optional[str] = None
    trust_horizon_day: Optional[int] = None
    breaking_point_day: Optional[int] = None
    
    # Decision output (Suppressed if coverage_available is False)
    attention_status: Optional[str] = None
    reasons: List[str]
    limitations: List[str]
    disclaimer: str

class ReservoirScenarioRequest(BaseModel):
    scenario_name: Optional[str] = "Custom What-If Scenario"
    storage_percent: float
    recent_inflow_cumecs: Optional[float] = 300.0

class ReservoirScenarioResponse(BaseModel):
    reservoir_id: str
    scenario_name: str
    storage_percent: float
    current_storage_mcm: float
    recent_inflow_cumecs: float
    coverage_available: bool = True
    attention_status: Optional[str] = None
    reasons: List[str]
    data_mode: str


