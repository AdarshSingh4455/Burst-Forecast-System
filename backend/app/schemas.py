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

# ============================================================
# PHASE 9B — AGRICULTURE DECISION SUPPORT SCHEMAS
# ============================================================

class AgricultureSummary(BaseModel):
    agri_id: str
    name: str
    latitude: float
    longitude: float
    district_label: str
    state: str
    data_mode: str
    crop: str
    crop_stage: str
    field_operation: str
    soil_moisture_mode: str
    soil_moisture_percent: float
    scenario_name: str
    coverage_available: bool = True
    in_pilot_coverage: bool = True

class AgricultureLeadContext(BaseModel):
    lead_day: int
    rainfall_mm: float
    temperature_c: float
    humidity_gkg: float
    wind_speed_ms: float
    bust_probability: float
    ffd: float
    ffd_failure_found: bool
    fragility_category: str
    trust_index: float
    reliability_band: str
    self_audit_status: str
    attention_status: Optional[str] = None

class AgricultureForecastContextResponse(BaseModel):
    agri_id: str
    agri_name: str
    forecast_init: str
    data_mode: str
    coverage_available: bool = True
    in_pilot_coverage: bool = True
    context_mode: str
    reason: Optional[str] = None
    forecast_context: Optional[Any] = None
    lead_contexts: Optional[List[AgricultureLeadContext]] = None

class AgricultureDecisionSupportResponse(BaseModel):
    agri_id: str
    agri_name: str
    data_mode: str
    forecast_init: str
    lead_day: int
    latitude: float
    longitude: float
    coverage_available: bool = True
    in_pilot_coverage: bool = True
    context_mode: str
    
    # Farm & Crop state
    crop: str
    crop_stage: str
    field_operation: str
    soil_moisture_mode: str
    soil_moisture_percent: float
    scenario_name: str
    
    # Weather & Reliability evidence (Suppressed if coverage_available is False)
    forecast_context: Optional[Any] = None
    decision_support: Optional[Any] = None
    rainfall_mm: Optional[float] = None
    dry_spell_days: Optional[int] = None
    dry_spell_source: Optional[str] = "ACTUAL_DERIVED_FORECAST_SERIES"
    temperature_c: Optional[float] = None
    humidity_gkg: Optional[float] = None
    wind_speed_ms: Optional[float] = None
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
    
    # What-if Override indicators
    is_what_if_override: bool = False
    rainfall_mm_override: Optional[float] = None
    dry_spell_days_override: Optional[int] = None
    
    # Decision output
    attention_status: Optional[str] = None
    weather_flags: List[str]
    reasons: List[str]
    limitations: List[str]
    disclaimer: str

class AgricultureScenarioRequest(BaseModel):
    crop: Optional[str] = None
    crop_stage: Optional[str] = None
    field_operation: Optional[str] = None
    soil_moisture_percent: Optional[float] = None
    rainfall_mm_override: Optional[float] = None
    dry_spell_days_override: Optional[int] = None
    scenario_name: Optional[str] = "Custom What-If Scenario"

class AgricultureScenarioResponse(BaseModel):
    agri_id: str
    scenario_name: str
    crop: str
    crop_stage: str
    field_operation: str
    soil_moisture_percent: float
    soil_moisture_mode: str = "DEMO"
    coverage_available: bool = True
    is_what_if_override: bool = True
    actual_rainfall_mm: Optional[float] = None
    rainfall_mm_override: Optional[float] = None
    actual_dry_spell_days: Optional[int] = None
    dry_spell_days_override: Optional[int] = None
    attention_status: Optional[str] = None
    weather_flags: List[str]
    reasons: List[str]
    data_mode: str

# Phase 9C Disaster Management Decision Support Schemas
class DisasterSummary(BaseModel):
    scenario_id: str
    name: str
    latitude: float
    longitude: float
    district_label: str
    state: str
    data_mode: str
    hazard_context: str
    preparedness_mode: str
    vulnerability_level: str
    exposure_level: str
    population_exposure_mode: str
    population_exposure_value: int
    coverage_available: bool = True
    in_pilot_coverage: bool = True

class DisasterLeadContext(BaseModel):
    lead_day: int
    rainfall_mm: float
    multi_day_rainfall_mm: float
    temperature_c: float
    humidity_gkg: float
    wind_speed_ms: float
    bust_probability: float
    ffd: float
    ffd_failure_found: bool
    fragility_category: str
    trust_index: float
    reliability_band: str
    self_audit_status: str
    attention_status: Optional[str] = None

class DisasterForecastContextResponse(BaseModel):
    scenario_id: str
    scenario_name: str
    forecast_init: str
    data_mode: str
    coverage_available: bool = True
    in_pilot_coverage: bool = True
    context_mode: str
    reason: Optional[str] = None
    forecast_context: Optional[Any] = None
    lead_contexts: Optional[List[DisasterLeadContext]] = None

class DisasterDecisionSupportResponse(BaseModel):
    scenario_id: str
    scenario_name: str
    data_mode: str
    forecast_init: str
    lead_day: int
    latitude: float
    longitude: float
    coverage_available: bool = True
    in_pilot_coverage: bool = True
    context_mode: str
    
    hazard_context: str
    preparedness_mode: str
    vulnerability_level: str
    exposure_level: str
    critical_assets: str
    population_exposure_mode: str
    population_exposure_value: int
    
    forecast_context: Optional[Any] = None
    decision_support: Optional[Any] = None
    rainfall_mm: Optional[float] = None
    multi_day_rainfall_mm: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_gkg: Optional[float] = None
    wind_speed_ms: Optional[float] = None
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
    
    is_what_if_override: bool = False
    rainfall_mm_override: Optional[float] = None
    wind_speed_override: Optional[float] = None
    
    attention_status: Optional[str] = None
    weather_flags: List[str]
    reasons: List[str]
    limitations: List[str]
    disclaimer: str

class DisasterScenarioRequest(BaseModel):
    hazard_context: Optional[str] = None
    preparedness_mode: Optional[str] = None
    vulnerability_level: Optional[str] = None
    exposure_level: Optional[str] = None
    rainfall_mm_override: Optional[float] = None
    wind_speed_override: Optional[float] = None
    scenario_name: Optional[str] = "Custom Disaster What-If Scenario"

class DisasterScenarioResponse(BaseModel):
    scenario_id: str
    scenario_name: str
    hazard_context: str
    preparedness_mode: str
    vulnerability_level: str
    exposure_level: str
    coverage_available: bool = True
    is_what_if_override: bool = True
    actual_rainfall_mm: Optional[float] = None
    rainfall_mm_override: Optional[float] = None
    actual_wind_speed_ms: Optional[float] = None
    wind_speed_override: Optional[float] = None
    attention_status: Optional[str] = None
    weather_flags: List[str]
    reasons: List[str]
    data_mode: str

# ============================================================
# PHASE 9D — RENEWABLE ENERGY / GRID DECISION SUPPORT SCHEMAS
# ============================================================

class RenewableSummary(BaseModel):
    scenario_id: str
    name: str
    latitude: float
    longitude: float
    district_label: str
    state: str
    data_mode: str
    technology_type: str
    planning_mode: str
    variability_sensitivity: str
    grid_sensitivity: str
    installed_capacity_mode: str
    installed_capacity_mw: float
    solar_irradiance_available: bool = False
    coverage_available: bool = True
    in_pilot_coverage: bool = True

class RenewableLeadContext(BaseModel):
    lead_day: int
    wind_speed_10m_ms: float
    wind_change_ms: float
    rainfall_mm: float
    temperature_c: float
    humidity_gkg: float
    bust_probability: float
    ffd: float
    ffd_failure_found: bool
    fragility_category: str
    trust_index: float
    reliability_band: str
    self_audit_status: str
    attention_status: Optional[str] = None

class RenewableForecastContextResponse(BaseModel):
    scenario_id: str
    scenario_name: str
    forecast_init: str
    data_mode: str
    coverage_available: bool = True
    in_pilot_coverage: bool = True
    context_mode: str
    reason: Optional[str] = None
    forecast_context: Optional[str] = None
    lead_contexts: Optional[List[RenewableLeadContext]] = None

class RenewableDecisionSupportResponse(BaseModel):
    scenario_id: str
    scenario_name: str
    data_mode: str
    forecast_init: str
    lead_day: int
    latitude: float
    longitude: float
    coverage_available: bool = True
    in_pilot_coverage: bool = True
    context_mode: str
    
    technology_type: str
    planning_mode: str
    variability_sensitivity: str
    grid_sensitivity: str
    installed_capacity_mode: str
    installed_capacity_mw: float
    solar_diagnostic_available: bool = False
    solar_message: str = "SOLAR GENERATION DIAGNOSTIC NOT AVAILABLE IN PROTOTYPE"
    
    forecast_context: Optional[Any] = None
    decision_support: Optional[Any] = None
    wind_speed_10m_ms: Optional[float] = None
    wind_change_ms: Optional[float] = None
    wind_range_d1_d3_ms: Optional[float] = None
    rainfall_mm: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_gkg: Optional[float] = None
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
    
    is_what_if_override: bool = False
    wind_speed_ms_override: Optional[float] = None
    
    attention_status: Optional[str] = None
    weather_flags: List[str]
    reasons: List[str]
    limitations: List[str]
    disclaimer: str

class RenewableScenarioRequest(BaseModel):
    technology_type: Optional[str] = None
    planning_mode: Optional[str] = None
    variability_sensitivity: Optional[str] = None
    grid_sensitivity: Optional[str] = None
    wind_speed_ms_override: Optional[float] = None
    scenario_name: Optional[str] = "Custom Renewable What-If Scenario"

class RenewableScenarioResponse(BaseModel):
    scenario_id: str
    scenario_name: str
    technology_type: str
    planning_mode: str
    variability_sensitivity: str
    grid_sensitivity: str
    coverage_available: bool = True
    is_what_if_override: bool = True
    actual_wind_speed_10m_ms: Optional[float] = None
    wind_speed_ms_override: Optional[float] = None
    attention_status: Optional[str] = None
    weather_flags: List[str]
    reasons: List[str]
    data_mode: str




