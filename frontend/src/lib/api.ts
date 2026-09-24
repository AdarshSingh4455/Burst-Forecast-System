import {
  Metadata,
  MapPoint,
  RegionalSummary,
  GridDetail,
  PointTrendItem,
  RegionalTrendItem,
  StressTestResponse,
  FailureCorridor,
  FingerprintResponse,
  AnalogueResponse,
  FailureDNAResponse,
  SelfAuditResponse,
  TrustHorizonResponse,
  Passport,
  ReservoirSummary,
  ReservoirForecastContextResponse,
  ReservoirDecisionSupportResponse,
  ReservoirScenarioResponse,
  AgricultureSummary,
  AgricultureForecastContextResponse,
  AgricultureDecisionSupportResponse,
  AgricultureScenarioResponse
} from '../types';

const API_BASE = (((import.meta as any).env?.VITE_API_URL as string) || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

async function apiFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error (${res.status}): ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/health');
}

export async function fetchMetadata(): Promise<Metadata> {
  return apiFetch<Metadata>('/metadata');
}

export async function fetchForecastRuns(): Promise<string[]> {
  const meta = await fetchMetadata();
  return meta.forecast_init_dates || [];
}

export async function fetchGridMap(forecastInit: string, leadDay: number, region: string = 'ALL', metric: string = 'bust_probability'): Promise<MapPoint[] | { grid_points: MapPoint[] }> {
  return apiFetch<MapPoint[] | { grid_points: MapPoint[] }>('/map', {
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    metric: metric,
    region: region
  });
}

export async function fetchMapData(forecastInit: string, leadDay: number, metric: string = 'bust_probability') {
  return fetchGridMap(forecastInit, leadDay, 'ALL', metric);
}

export async function fetchRegionalSummary(forecastInit: string, leadDay: number, region: string = 'ALL'): Promise<RegionalSummary> {
  return apiFetch<RegionalSummary>(`/forecast/${encodeURIComponent(region)}`, {
    forecast_init: forecastInit,
    lead_day: leadDay.toString()
  });
}

export async function fetchGridDetail(forecastInit: string, lat: number, lon: number, leadDay: number): Promise<GridDetail> {
  return apiFetch<GridDetail>('/grid-detail', {
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
}

export async function fetchTrend(forecastInit: string, lat: number, lon: number): Promise<PointTrendItem[] | { trend: PointTrendItem[] }> {
  return apiFetch<PointTrendItem[] | { trend: PointTrendItem[] }>('/trend', {
    forecast_init: forecastInit,
    latitude: lat.toString(),
    longitude: lon.toString()
  });
}

export async function fetchPointTrend(forecastInit: string, lat: number, lon: number) {
  return fetchTrend(forecastInit, lat, lon);
}

export async function fetchRegionalTrend(forecastInit: string, region: string): Promise<RegionalTrendItem[]> {
  return apiFetch<RegionalTrendItem[]>('/regional-trend', {
    forecast_init: forecastInit,
    region: region
  });
}

export async function fetchStressTestData(forecastInit: string, lat: number, lon: number, leadDay: number): Promise<StressTestResponse> {
  return apiFetch<StressTestResponse>('/stress-test', {
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
}

export async function fetchStressTest(forecastInit: string, leadDay: number, lat: number, lon: number) {
  return fetchStressTestData(forecastInit, lat, lon, leadDay);
}

export async function fetchFailureCorridors(forecastInit: string, lat: number, lon: number, leadDay: number): Promise<FailureCorridor[] | { corridors: FailureCorridor[] }> {
  return apiFetch<FailureCorridor[] | { corridors: FailureCorridor[] }>('/failure-corridors', {
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
}

export async function fetchFingerprint(forecastInit: string, lat: number, lon: number, leadDay: number): Promise<FingerprintResponse> {
  return apiFetch<FingerprintResponse>('/fingerprint', {
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
}

export async function fetchAnalogues(forecastInit: string, lat: number, lon: number, leadDay: number): Promise<AnalogueResponse> {
  return apiFetch<AnalogueResponse>('/analogues', {
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
}

export async function fetchFailureDNA(forecastInit: string, lat: number, lon: number, leadDay: number): Promise<FailureDNAResponse> {
  return apiFetch<FailureDNAResponse>('/failure-dna', {
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
}

export async function fetchSelfAuditData(forecastInit: string, lat: number, lon: number, leadDay: number): Promise<SelfAuditResponse> {
  return apiFetch<SelfAuditResponse>('/self-audit', {
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
}

export async function fetchTrustHorizonData(forecastInit: string, lat: number, lon: number): Promise<TrustHorizonResponse> {
  return apiFetch<TrustHorizonResponse>('/trust-horizon', {
    forecast_init: forecastInit,
    latitude: lat.toString(),
    longitude: lon.toString()
  });
}

export async function fetchPassportData(forecastInit: string, lat: number, lon: number, leadDay: number): Promise<Passport> {
  return apiFetch<Passport>('/passport', {
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
}

export async function fetchPassport(forecastInit: string, leadDay: number, lat: number, lon: number) {
  return fetchPassportData(forecastInit, lat, lon, leadDay);
}

// Phase 9A Reservoir API Functions
export async function fetchReservoirs(): Promise<ReservoirSummary[]> {
  return apiFetch<ReservoirSummary[]>('/reservoirs');
}

export async function fetchReservoirDetail(reservoirId: string): Promise<ReservoirSummary> {
  return apiFetch<ReservoirSummary>(`/reservoirs/${reservoirId}`);
}

export async function fetchReservoirForecastContext(reservoirId: string, forecastInit: string): Promise<ReservoirForecastContextResponse> {
  return apiFetch<ReservoirForecastContextResponse>(`/reservoirs/${reservoirId}/forecast-context`, {
    forecast_init: forecastInit
  });
}

export async function fetchReservoirDecisionSupport(
  reservoirId: string,
  forecastInit: string,
  leadDay: number = 1,
  scenario: string = 'NORMAL'
): Promise<ReservoirDecisionSupportResponse> {
  return apiFetch<ReservoirDecisionSupportResponse>(`/reservoirs/${reservoirId}/decision-support`, {
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    scenario
  });
}

export async function postReservoirScenario(
  reservoirId: string,
  storagePercent: number,
  forecastInit: string,
  leadDay: number = 1,
  recentInflowCumecs?: number,
  scenarioName?: string
): Promise<ReservoirScenarioResponse> {
  const url = new URL(`${API_BASE}/reservoirs/${reservoirId}/scenario`);
  url.searchParams.append('forecast_init', forecastInit);
  url.searchParams.append('lead_day', leadDay.toString());

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storage_percent: storagePercent,
      recent_inflow_cumecs: recentInflowCumecs || 300.0,
      scenario_name: scenarioName || 'Custom What-If Scenario'
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

// Phase 9B Agriculture API Functions
export async function fetchAgricultureScenarios(): Promise<AgricultureSummary[]> {
  return apiFetch<AgricultureSummary[]>('/agriculture');
}

export async function fetchAgricultureDetail(agriId: string): Promise<AgricultureSummary> {
  return apiFetch<AgricultureSummary>(`/agriculture/${agriId}`);
}

export async function fetchAgricultureForecastContext(agriId: string, forecastInit: string): Promise<AgricultureForecastContextResponse> {
  return apiFetch<AgricultureForecastContextResponse>(`/agriculture/${agriId}/forecast-context`, {
    forecast_init: forecastInit
  });
}

export async function fetchAgricultureDecisionSupport(
  agriId: string,
  forecastInit: string,
  leadDay: number = 1
): Promise<AgricultureDecisionSupportResponse> {
  return apiFetch<AgricultureDecisionSupportResponse>(`/agriculture/${agriId}/decision-support`, {
    forecast_init: forecastInit,
    lead_day: leadDay.toString()
  });
}

export async function postAgricultureScenario(
  agriId: string,
  forecastInit: string,
  leadDay: number = 1,
  crop?: string,
  cropStage?: string,
  fieldOperation?: string,
  soilMoisturePercent?: number,
  rainfallMmOverride?: number,
  drySpellDaysOverride?: number,
  scenarioName?: string
): Promise<AgricultureScenarioResponse> {
  const url = new URL(`${API_BASE}/agriculture/${agriId}/scenario`);
  url.searchParams.append('forecast_init', forecastInit);
  url.searchParams.append('lead_day', leadDay.toString());

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      crop,
      crop_stage: cropStage,
      field_operation: fieldOperation,
      soil_moisture_percent: soilMoisturePercent,
      rainfall_mm_override: rainfallMmOverride,
      dry_spell_days_override: drySpellDaysOverride,
      scenario_name: scenarioName || 'Custom What-If Scenario'
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}


