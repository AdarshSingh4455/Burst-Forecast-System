const API_BASE = 'http://127.0.0.1:8000/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchMetadata() {
  const res = await fetch(`${API_BASE}/metadata`);
  return res.json();
}

export async function fetchGridMap(forecastInit: string, leadDay: number, region: string = 'ALL') {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    region: region
  });
  const res = await fetch(`${API_BASE}/map?${params}`);
  return res.json();
}

export async function fetchMapData(forecastInit: string, leadDay: number, metric: string = 'bust_risk_probability') {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    metric: metric
  });
  const res = await fetch(`${API_BASE}/map?${params}`);
  return res.json();
}

export async function fetchRegionalSummary(forecastInit: string, leadDay: number, region: string = 'ALL') {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString()
  });
  const res = await fetch(`${API_BASE}/forecast/${encodeURIComponent(region)}?${params}`);
  return res.json();
}

export async function fetchGridDetail(forecastInit: string, lat: number, lon: number, leadDay: number) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
  const res = await fetch(`${API_BASE}/grid-detail?${params}`);
  return res.json();
}

export async function fetchTrend(forecastInit: string, lat: number, lon: number) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    latitude: lat.toString(),
    longitude: lon.toString()
  });
  const res = await fetch(`${API_BASE}/trend?${params}`);
  return res.json();
}

export async function fetchPointTrend(forecastInit: string, lat: number, lon: number) {
  return fetchTrend(forecastInit, lat, lon);
}

export async function fetchRegionalTrend(forecastInit: string, region: string) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    region: region
  });
  const res = await fetch(`${API_BASE}/regional-trend?${params}`);
  return res.json();
}

export async function fetchStressTestData(forecastInit: string, lat: number, lon: number, leadDay: number) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
  const res = await fetch(`${API_BASE}/stress-test?${params}`);
  return res.json();
}

export async function fetchStressTest(forecastInit: string, leadDay: number, lat: number, lon: number) {
  return fetchStressTestData(forecastInit, lat, lon, leadDay);
}

export async function fetchFailureCorridors(forecastInit: string, lat: number, lon: number, leadDay: number) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
  const res = await fetch(`${API_BASE}/failure-corridors?${params}`);
  return res.json();
}

export async function fetchFingerprint(forecastInit: string, lat: number, lon: number, leadDay: number) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
  const res = await fetch(`${API_BASE}/fingerprint?${params}`);
  return res.json();
}

export async function fetchAnalogues(forecastInit: string, lat: number, lon: number, leadDay: number) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
  const res = await fetch(`${API_BASE}/analogues?${params}`);
  return res.json();
}

export async function fetchFailureDNA(forecastInit: string, lat: number, lon: number, leadDay: number) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
  const res = await fetch(`${API_BASE}/failure-dna?${params}`);
  return res.json();
}

export async function fetchSelfAuditData(forecastInit: string, lat: number, lon: number, leadDay: number) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
  const res = await fetch(`${API_BASE}/self-audit?${params}`);
  return res.json();
}

export async function fetchTrustHorizonData(forecastInit: string, lat: number, lon: number) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    latitude: lat.toString(),
    longitude: lon.toString()
  });
  const res = await fetch(`${API_BASE}/trust-horizon?${params}`);
  return res.json();
}

export async function fetchPassportData(forecastInit: string, lat: number, lon: number, leadDay: number) {
  const params = new URLSearchParams({
    forecast_init: forecastInit,
    lead_day: leadDay.toString(),
    latitude: lat.toString(),
    longitude: lon.toString()
  });
  const res = await fetch(`${API_BASE}/passport?${params}`);
  return res.json();
}

export async function fetchPassport(forecastInit: string, leadDay: number, lat: number, lon: number) {
  return fetchPassportData(forecastInit, lat, lon, leadDay);
}
