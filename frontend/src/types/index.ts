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


