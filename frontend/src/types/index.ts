export interface Metadata {
  regions: string[];
  forecast_init_dates: string[];
  forecast_runs?: string[];
  lead_days: number[];
  variables: string[];
  grid_extent: {
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  };
  grid_point_count: number;
}

export interface MapPoint {
  latitude: number;
  longitude: number;
  value: number;
  reliability_band: 'GREEN' | 'YELLOW' | 'RED';
  self_audit_status: string;
}

export type GridPointMap = MapPoint;

export interface RegionalSummary {
  region: string;
  forecast_init: string;
  lead_day: number;
  mean_rainfall_mm: number;
  mean_bust_probability: number;
  mean_ffd: number;
  mean_fragility: number;
  median_trust_index: number;
  green_fraction: number;
  yellow_fraction: number;
  red_fraction: number;
  regional_reliability_band: 'GREEN' | 'YELLOW' | 'RED';
  regional_trust_horizon_day: number;
  regional_breaking_point_day: number | null;
  dominant_failure_corridor: string;
  dominant_vulnerability: string;
}

export interface GridDetail {
  forecast_init: string;
  valid_time: string;
  lead_day: number;
  latitude: number;
  longitude: number;
  region: string;
  ensemble_mean_mm: number;
  ensemble_spread_mm: number;
  baseline_p_bust: number;
  ai_risk_category: string;
  ffd: number;
  ffd_failure_found: number;
  fragility_auc: number;
  fragility_category: string;
  stress_evidence: string;
  failure_corridor_label: string;
  failure_fingerprint_label: string;
  fingerprint_moisture: number;
  fingerprint_temperature: number;
  fingerprint_pressure: number;
  fingerprint_wind: number;
  fingerprint_ensemble: number;
  fingerprint_novelty: number;
  analogue_available: number;
  analogue_count: number;
  analogue_mean_bust_rate: number;
  failure_dna_max_sim: number;
  failure_dna_risk_flag: number;
  ensemble_disagreement_score: number;
  ensemble_disagreement_category: string;
  ood_score: number;
  ood_category: string;
  self_audit_status: string;
  self_audit_reason: string;
  trust_index: number;
  reliability_band: 'GREEN' | 'YELLOW' | 'RED';
  trust_horizon_day: number;
  breaking_point_day: number | null;
  primary_vulnerability: string;
  temperature_c?: number;
  humidity_gkg?: number;
  pressure_hpa?: number;
  wind_speed_ms?: number;
  supporting_evidence_count?: number;
  contradicting_evidence_count?: number;
  min_bust_delta_humidity?: number;
  min_bust_delta_temp?: number;
  min_bust_delta_mslp?: number;
  min_bust_delta_wind?: number;
  temp_2m_c_mean?: number;
  specific_humidity_gkg_mean?: number;
  mslp_hpa_mean?: number;
  pwat_mm_mean?: number;
  wind_speed_mean_ms?: number;
}

export type GridPointDetail = GridDetail;

export interface PointTrendItem {
  lead_day: number;
  valid_time: string;
  rainfall: number;
  bust_probability: number;
  ffd: number;
  fragility_auc: number;
  trust_index: number;
  ensemble_spread: number;
  ood_score: number;
  reliability_band: 'GREEN' | 'YELLOW' | 'RED';
  self_audit_status: string;
}

export type TrendPoint = PointTrendItem;

export interface RegionalTrendItem {
  lead_day: number;
  mean_rainfall: number;
  mean_bust_probability: number;
  median_ffd: number;
  median_trust_index: number;
  green_fraction: number;
  yellow_fraction: number;
  red_fraction: number;
  regional_reliability_band: 'GREEN' | 'YELLOW' | 'RED';
}

export interface Passport {
  title: string;
  forecast_init: string;
  valid_time: string;
  lead_day: number;
  latitude: number;
  longitude: number;
  region: string;
  rainfall_mm: number;
  temperature_c: number;
  humidity_gkg: number;
  pressure_hpa: number;
  wind_speed_ms: number;
  bust_probability: number;
  ai_risk_category: string;
  ffd: number;
  fragility_category: string;
  failure_corridor: string;
  failure_fingerprint: string;
  analogue_available: boolean;
  analogue_bust_rate: number;
  dna_similarity: number;
  ensemble_disagreement: string;
  ood_category: string;
  self_audit_status: string;
  self_audit_reason: string;
  trust_index: number;
  reliability_band: 'GREEN' | 'YELLOW' | 'RED';
  trust_horizon_day: number;
  breaking_point_day: number | null;
  primary_vulnerability: string;
  disclaimer: string;
}

export type ReliabilityPassport = Passport;

export interface AnalogueRecord {
  analogue_rank: number;
  analogue_forecast_init: string;
  analogue_latitude: number;
  analogue_longitude: number;
  analogue_dist: number;
  analogue_bust_label: number;
  analogue_corridor_id: number;
}

export interface StressTestResponse {
  forecast_init: string;
  lead_day: number;
  latitude: number;
  longitude: number;
  baseline_p_bust: number;
  ffd: number;
  ffd_failure_found: number;
  fragility_auc: number;
  fragility_category: string;
  stress_evidence: string;
  stress_curve: Array<{ delta: number; p_bust: number; variable: string }>;
}

export interface FailureCorridor {
  corridor_id: number;
  corridor_name: string;
  description: string;
  case_count: number;
  percentage: number;
  moisture_mean: number;
  temp_mean: number;
  wind_mean: number;
}

export interface FingerprintResponse {
  fingerprint_label: string;
  features: {
    moisture: number;
    temperature: number;
    pressure: number;
    wind: number;
    ensemble: number;
    novelty: number;
  };
}

export interface AnalogueResponse {
  available: boolean;
  analogue_count: number;
  analogue_mean_bust_rate: number;
  analogues: AnalogueRecord[];
}

export interface FailureDNAResponse {
  max_similarity: number;
  risk_flag: number;
  match_description: string;
}

export interface SelfAuditResponse {
  self_audit_status: string;
  self_audit_reason: string;
  trust_index: number;
  reliability_band: 'GREEN' | 'YELLOW' | 'RED';
  supporting_evidence_count: number;
  contradicting_evidence_count: number;
}

export interface TrustHorizonResponse {
  trust_horizon_day: number;
  breaking_point_day: number | null;
  sequence_length: number;
  stability_status: string;
}

// Phase 9A Reservoir Decision Support Interfaces
export interface ReservoirSummary {
  reservoir_id: string;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  district: string;
  river: string;
  data_mode: string;
  capacity_mcm: number;
  current_storage_mcm: number;
  storage_percent: number;
  recent_inflow_cumecs: number;
  recent_outflow_cumecs: number;
  in_pilot_coverage: boolean;
}

export interface ReservoirLeadContext {
  lead_day: number;
  rainfall_mm: number;
  bust_probability: number;
  ffd: number;
  ffd_failure_found: boolean;
  fragility_category: string;
  trust_index: number;
  reliability_band: 'GREEN' | 'YELLOW' | 'RED';
  self_audit_status: string;
  attention_status: 'NORMAL_MONITORING' | 'HEIGHTENED_MONITORING' | 'OPERATOR_REVIEW_ADVISED' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW';
}

export interface ReservoirForecastContextResponse {
  reservoir_id: string;
  reservoir_name: string;
  forecast_init: string;
  data_mode: string;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
  context_mode: string;
  reason?: string | null;
  forecast_context?: any;
  lead_contexts?: ReservoirLeadContext[] | null;
}

export interface ReservoirDecisionSupportResponse {
  reservoir_id: string;
  reservoir_name: string;
  data_mode: string;
  forecast_init: string;
  lead_day: number;
  latitude: number;
  longitude: number;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
  context_mode: string;
  capacity_mcm: number;
  current_storage_mcm: number;
  storage_percent: number;
  recent_inflow_cumecs: number;
  scenario_name: string;
  forecast_context?: any;
  decision_support?: any;
  rainfall_mm?: number | null;
  bust_probability?: number | null;
  ffd?: number | null;
  ffd_failure_found?: boolean | null;
  fragility_category?: string | null;
  ensemble_disagreement_category?: string | null;
  ood_category?: string | null;
  self_audit_status?: string | null;
  self_audit_reason?: string | null;
  trust_index?: number | null;
  reliability_band?: ('GREEN' | 'YELLOW' | 'RED') | null;
  trust_horizon_day?: number | null;
  breaking_point_day?: number | null;
  attention_status?: ('NORMAL_MONITORING' | 'HEIGHTENED_MONITORING' | 'OPERATOR_REVIEW_ADVISED' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
  reasons: string[];
  limitations: string[];
  disclaimer: string;
}

export interface ReservoirScenarioResponse {
  reservoir_id: string;
  scenario_name: string;
  storage_percent: number;
  current_storage_mcm: number;
  recent_inflow_cumecs: number;
  coverage_available: boolean;
  attention_status?: ('NORMAL_MONITORING' | 'HEIGHTENED_MONITORING' | 'OPERATOR_REVIEW_ADVISED' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
  reasons: string[];
  data_mode: string;
}

// Phase 9B Agriculture Decision Support Interfaces
export interface AgricultureSummary {
  agri_id: string;
  name: string;
  latitude: number;
  longitude: number;
  district_label: string;
  state: string;
  data_mode: string;
  crop: string;
  crop_stage: string;
  field_operation: string;
  soil_moisture_mode: string;
  soil_moisture_percent: number;
  scenario_name: string;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
}

export interface AgricultureLeadContext {
  lead_day: number;
  rainfall_mm: number;
  temperature_c: number;
  humidity_gkg: number;
  wind_speed_ms: number;
  bust_probability: number;
  ffd: number;
  ffd_failure_found: boolean;
  fragility_category: string;
  trust_index: number;
  reliability_band: 'GREEN' | 'YELLOW' | 'RED';
  self_audit_status: string;
  attention_status?: ('NORMAL_MONITORING' | 'FARM_ADVISORY_REVIEW' | 'WEATHER_SENSITIVE_WINDOW' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
}

export interface AgricultureForecastContextResponse {
  agri_id: string;
  agri_name: string;
  forecast_init: string;
  data_mode: string;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
  context_mode: string;
  reason?: string | null;
  forecast_context?: any;
  lead_contexts?: AgricultureLeadContext[] | null;
}

export interface AgricultureDecisionSupportResponse {
  agri_id: string;
  agri_name: string;
  data_mode: string;
  forecast_init: string;
  lead_day: number;
  latitude: number;
  longitude: number;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
  context_mode: string;
  crop: string;
  crop_stage: string;
  field_operation: string;
  soil_moisture_mode: string;
  soil_moisture_percent: number;
  scenario_name: string;
  forecast_context?: any;
  decision_support?: any;
  rainfall_mm?: number | null;
  dry_spell_days?: number | null;
  dry_spell_source?: string | null;
  temperature_c?: number | null;
  humidity_gkg?: number | null;
  wind_speed_ms?: number | null;
  bust_probability?: number | null;
  ffd?: number | null;
  ffd_failure_found?: boolean | null;
  fragility_category?: string | null;
  ensemble_disagreement_category?: string | null;
  ood_category?: string | null;
  self_audit_status?: string | null;
  self_audit_reason?: string | null;
  trust_index?: number | null;
  reliability_band?: ('GREEN' | 'YELLOW' | 'RED') | null;
  trust_horizon_day?: number | null;
  breaking_point_day?: number | null;
  is_what_if_override?: boolean;
  rainfall_mm_override?: number | null;
  dry_spell_days_override?: number | null;
  attention_status?: ('NORMAL_MONITORING' | 'FARM_ADVISORY_REVIEW' | 'WEATHER_SENSITIVE_WINDOW' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
  weather_flags: string[];
  reasons: string[];
  limitations: string[];
  disclaimer: string;
}

export interface AgricultureScenarioResponse {
  agri_id: string;
  scenario_name: string;
  crop: string;
  crop_stage: string;
  field_operation: string;
  soil_moisture_percent: number;
  soil_moisture_mode?: string;
  coverage_available: boolean;
  is_what_if_override?: boolean;
  actual_rainfall_mm?: number | null;
  rainfall_mm_override?: number | null;
  actual_dry_spell_days?: number | null;
  dry_spell_days_override?: number | null;
  attention_status?: ('NORMAL_MONITORING' | 'FARM_ADVISORY_REVIEW' | 'WEATHER_SENSITIVE_WINDOW' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
  weather_flags: string[];
  reasons: string[];
  data_mode: string;
}

// Phase 9C Disaster Management Decision Support Interfaces
export interface DisasterSummary {
  scenario_id: string;
  name: string;
  latitude: number;
  longitude: number;
  district_label: string;
  state: string;
  data_mode: string;
  hazard_context: string;
  preparedness_mode: string;
  vulnerability_level: string;
  exposure_level: string;
  population_exposure_mode: string;
  population_exposure_value: number;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
}

export interface DisasterLeadContext {
  lead_day: number;
  rainfall_mm: number;
  multi_day_rainfall_mm: number;
  temperature_c: number;
  humidity_gkg: number;
  wind_speed_ms: number;
  bust_probability: number;
  ffd: number;
  ffd_failure_found: boolean;
  fragility_category: string;
  trust_index: number;
  reliability_band: 'GREEN' | 'YELLOW' | 'RED';
  self_audit_status: string;
  attention_status?: ('NORMAL_MONITORING' | 'PREPAREDNESS_REVIEW' | 'HEIGHTENED_PREPAREDNESS' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
}

export interface DisasterForecastContextResponse {
  scenario_id: string;
  scenario_name: string;
  forecast_init: string;
  data_mode: string;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
  context_mode: string;
  reason?: string | null;
  forecast_context?: any;
  lead_contexts?: DisasterLeadContext[] | null;
}

export interface DisasterDecisionSupportResponse {
  scenario_id: string;
  scenario_name: string;
  data_mode: string;
  forecast_init: string;
  lead_day: number;
  latitude: number;
  longitude: number;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
  context_mode: string;
  hazard_context: string;
  preparedness_mode: string;
  vulnerability_level: string;
  exposure_level: string;
  critical_assets: string;
  population_exposure_mode: string;
  population_exposure_value: number;
  forecast_context?: any;
  decision_support?: any;
  rainfall_mm?: number | null;
  multi_day_rainfall_mm?: number | null;
  temperature_c?: number | null;
  humidity_gkg?: number | null;
  wind_speed_ms?: number | null;
  bust_probability?: number | null;
  ffd?: number | null;
  ffd_failure_found?: boolean | null;
  fragility_category?: string | null;
  ensemble_disagreement_category?: string | null;
  ood_category?: string | null;
  self_audit_status?: string | null;
  self_audit_reason?: string | null;
  trust_index?: number | null;
  reliability_band?: ('GREEN' | 'YELLOW' | 'RED') | null;
  trust_horizon_day?: number | null;
  breaking_point_day?: number | null;
  is_what_if_override?: boolean;
  rainfall_mm_override?: number | null;
  wind_speed_override?: number | null;
  attention_status?: ('NORMAL_MONITORING' | 'PREPAREDNESS_REVIEW' | 'HEIGHTENED_PREPAREDNESS' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
  weather_flags: string[];
  reasons: string[];
  limitations: string[];
  disclaimer: string;
}

export interface DisasterScenarioResponse {
  scenario_id: string;
  scenario_name: string;
  hazard_context: string;
  preparedness_mode: string;
  vulnerability_level: string;
  exposure_level: string;
  coverage_available: boolean;
  is_what_if_override?: boolean;
  actual_rainfall_mm?: number | null;
  rainfall_mm_override?: number | null;
  actual_wind_speed_ms?: number | null;
  wind_speed_override?: number | null;
  attention_status?: ('NORMAL_MONITORING' | 'PREPAREDNESS_REVIEW' | 'HEIGHTENED_PREPAREDNESS' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
  weather_flags: string[];
  reasons: string[];
  data_mode: string;
}

// Phase 9D Renewable Energy / Grid Decision Support Interfaces
export interface RenewableSummary {
  scenario_id: string;
  name: string;
  latitude: number;
  longitude: number;
  district_label: string;
  state: string;
  data_mode: string;
  technology_type: string;
  planning_mode: string;
  variability_sensitivity: string;
  grid_sensitivity: string;
  installed_capacity_mode: string;
  installed_capacity_mw: number;
  solar_irradiance_available: boolean;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
}

export interface RenewableLeadContext {
  lead_day: number;
  wind_speed_10m_ms: number;
  wind_change_ms: number;
  rainfall_mm: number;
  temperature_c: number;
  humidity_gkg: number;
  bust_probability: number;
  ffd: number;
  ffd_failure_found: boolean;
  fragility_category: string;
  trust_index: number;
  reliability_band: string;
  self_audit_status: string;
  attention_status?: ('NORMAL_MONITORING' | 'GENERATION_VARIABILITY_REVIEW' | 'GRID_PREPAREDNESS_REVIEW' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
}

export interface RenewableForecastContextResponse {
  scenario_id: string;
  scenario_name: string;
  forecast_init: string;
  data_mode: string;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
  context_mode: string;
  reason?: string | null;
  forecast_context?: string | null;
  lead_contexts?: RenewableLeadContext[] | null;
}

export interface RenewableDecisionSupportResponse {
  scenario_id: string;
  scenario_name: string;
  data_mode: string;
  forecast_init: string;
  lead_day: number;
  latitude: number;
  longitude: number;
  coverage_available: boolean;
  in_pilot_coverage: boolean;
  context_mode: string;
  technology_type: string;
  planning_mode: string;
  variability_sensitivity: string;
  grid_sensitivity: string;
  installed_capacity_mode: string;
  installed_capacity_mw: number;
  solar_diagnostic_available: boolean;
  solar_message: string;
  forecast_context?: any;
  decision_support?: any;
  wind_speed_10m_ms?: number | null;
  wind_change_ms?: number | null;
  wind_range_d1_d3_ms?: number | null;
  rainfall_mm?: number | null;
  temperature_c?: number | null;
  humidity_gkg?: number | null;
  bust_probability?: number | null;
  ffd?: number | null;
  ffd_failure_found?: boolean | null;
  fragility_category?: string | null;
  ensemble_disagreement_category?: string | null;
  ood_category?: string | null;
  self_audit_status?: string | null;
  self_audit_reason?: string | null;
  trust_index?: number | null;
  reliability_band?: ('GREEN' | 'YELLOW' | 'RED') | null;
  trust_horizon_day?: number | null;
  breaking_point_day?: number | null;
  is_what_if_override?: boolean;
  wind_speed_ms_override?: number | null;
  attention_status?: ('NORMAL_MONITORING' | 'GENERATION_VARIABILITY_REVIEW' | 'GRID_PREPAREDNESS_REVIEW' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
  weather_flags: string[];
  reasons: string[];
  limitations: string[];
  disclaimer: string;
}

export interface RenewableScenarioResponse {
  scenario_id: string;
  scenario_name: string;
  technology_type: string;
  planning_mode: string;
  variability_sensitivity: string;
  grid_sensitivity: string;
  coverage_available: boolean;
  is_what_if_override?: boolean;
  actual_wind_speed_10m_ms?: number | null;
  wind_speed_ms_override?: number | null;
  attention_status?: ('NORMAL_MONITORING' | 'GENERATION_VARIABILITY_REVIEW' | 'GRID_PREPAREDNESS_REVIEW' | 'HIGH_UNCERTAINTY_EXPERT_REVIEW') | null;
  weather_flags: string[];
  reasons: string[];
  data_mode: string;
}

export interface AssistantExplainResponse {
  answer: string;
  detected_language: string;
  intent: string;
  context_used: {
    forecast_init?: string;
    lead_day?: number;
    latitude?: number;
    longitude?: number;
    inside_pilot?: boolean;
    active_view?: string;
    scenario_id?: string | null;
  };
  evidence_used: string[];
  limitations: string[];
  grounded: boolean;
}





