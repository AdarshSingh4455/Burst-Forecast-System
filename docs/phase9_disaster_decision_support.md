# FORTRESS Phase 9C — Disaster Management Decision Support Documentation

## Overview
Phase 9C introduces end-to-end domain-specific decision support for **Disaster Management & Preparedness Review** within the FORTRESS system (Forecast Reliability Stress-Testing & Self-Audit System, SIH26079).

It translates scientific forecast reliability intelligence (Bust Risk, Fragility/FFD, Self-Audit Status, Trust Horizon) into actionable operational context for disaster preparedness planning without altering underlying Phase 1–8 scientific models.

---

## 1. Safety & Operational Constraints
- **Separation of 3 Dimensions**: Weather condition (rain, multi-day rain accumulation, wind speed), forecast reliability (trust index, self-audit status, bust risk), and preparedness sensitivity (vulnerability level, exposure level, preparedness mode) are evaluated as separate dimensions before being synthesized into an Attention Status.
- **Strict Scientific Scoping**:
  - FORTRESS does **NOT** run hydrological routing or flood inundation models.
  - FORTRESS does **NOT** predict flood water depths or inundation boundaries.
  - FORTRESS does **NOT** issue automatic evacuation orders or emergency dispatch commands.
  - Rainfall forecast does not directly equal flooding.
- **Mandatory Disclaimer**: All disaster management decision support UI views and API responses display the mandatory operational disclaimer emphasizing NDMA/SDMA/IMD authority and pilot boundary limitations.

---

## 2. Data Provenance & Demo Scenarios
- Domain disaster scenario data is maintained in `data/domain/disaster_demo.json`.
- `data_mode` is explicitly set to `"DEMO_SCENARIO"`.
- `population_exposure_mode` is explicitly marked `"DEMO"`.
- Demoware disaster scenarios:
  1. `DISASTER_EUP_01` — Gorakhpur Flood Preparedness Zone (Inside Pilot, Flood Preparedness, Resource Review)
  2. `DISASTER_EUP_02` — Varanasi Urban Drainage Sector (Inside Pilot, Heavy Rainfall, Field Team Readiness)
  3. `DISASTER_EUP_03` — Prayagraj Low-Lying Embankment (Inside Pilot, Multi-Hazard Weather, Emergency Coordination)
  4. `DISASTER_OUTSIDE_01` — Bundelkhand Out-of-Pilot Sector (Outside Eastern UP Pilot Coverage)

---

## 3. Spatial Coverage & Outside-Pilot Rules
- **Pilot Region**: Eastern UP Bounding Box (Latitude 24.5°N – 28.5°N, Longitude 80.0°E – 84.5°E).
- **Inside Pilot Rule**: Scenarios within the bounding box are snapped to the nearest FORTRESS grid point to retrieve forecast reliability metrics.
- **Outside Pilot Rule**: For any scenario outside the rectangular pilot (e.g., `DISASTER_OUTSIDE_01` at Lon 78.38°E):
  - `coverage_available`: `false`
  - `context_mode`: `"OUTSIDE_PILOT"`
  - Grid snapping is strictly suppressed (`grid_lat: null`, `grid_lon: null`, `grid_distance_km: null`).
  - Scientific forecast context and decision support objects are returned as `null`.
  - Explicit reason returned: `"FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage."`

---

## 4. Operational Relevance Gate & Decision Logic
Defined in `configs/disaster_decision_support.yaml`:

### Disaster Operational Relevance Gate
Weather conditions are classified as operationally relevant (`disaster_relevance = true`) if:
- Forecasted rainfall `>= 15.0 mm` OR
- Multi-day D1-D3 rainfall accumulation `>= 50.0 mm` OR
- Wind speed `>= 8.0 m/s` OR
- Hazard context in `["FLOOD_PREPAREDNESS", "HEAVY_RAINFALL", "MULTI_HAZARD_WEATHER"]` OR
- Preparedness mode in `["RESOURCE_REVIEW", "FIELD_TEAM_READINESS", "CRITICAL_ASSET_MONITORING", "EMERGENCY_COORDINATION_REVIEW"]`.

If `disaster_relevance = false`, status defaults to `NORMAL_MONITORING`.

### High Uncertainty Override Rule
`HIGH_UNCERTAINTY_EXPERT_REVIEW` triggers **ONLY IF**:
1. `disaster_relevance == true`, AND
2. Forecast reliability is compromised:
   - `Self-Audit Status` in `["CONFLICT", "POSSIBLE BLIND SPOT", "EXPERT REVIEW"]`, OR
   - `Reliability Band` == `"RED"`, OR
   - `Trust Index < 50.0`, OR
   - `OOD State` == `true`.

### Standard Attention Status Rules
- `HEIGHTENED_PREPAREDNESS`: Significant weather signal (Rain `>= 35.0 mm` or Multi-day Rain `>= 50.0 mm` or Wind `>= 15.0 m/s`) + High vulnerability / exposure.
- `PREPAREDNESS_REVIEW`: Moderate weather signal (Rain `>= 15.0 mm` or Multi-day Rain `>= 30.0 mm` or Bust Prob `>= 40%`) + Medium/High vulnerability.
- `NORMAL_MONITORING`: Favorable conditions or operationally irrelevant weather.

---

## 5. API Endpoints
All 5 endpoints return HTTP 200 with valid JSON schemas:
1. `GET /api/disaster`: List all demo disaster management scenarios with metadata and pilot coverage status.
2. `GET /api/disaster/{id}`: Detailed scenario metadata including population exposure (DEMO mode) and hazard context.
3. `GET /api/disaster/{id}/forecast-context`: D1–D10 lead timeline weather context, multi-day accumulation, and grid distance.
4. `GET /api/disaster/{id}/decision-support`: Full decision support evaluation for selected forecast run, lead day, and scenario.
5. `POST /api/disaster/{id}/scenario`: Interactive custom scenario simulation (e.g., modified rainfall override or wind speed).

---

## 6. UI Features & Dark Red Custom Theme
- **Theme Palette**: Background `#FFF5F5`, Card/Header `#FDF2F2`, Border `#FECDD3`, Primary Accent `#DC2626`, Dark Text `#991B1B`.
- **Top Controls**: Domain Switcher (Reservoir / Dam vs Agriculture / Farming vs Disaster / Preparedness), Scenario Selection dropdown, Lead Day selector (D1–D10), Forecast Run selector.
- **Demo Scenario Banner**: Visibly displays `"DEMO DISASTER SCENARIO"` badge and data provenance indicators.
- **Top KPI Cards**: Hazard Context, Preparedness Mode, Rain Forecast (mm), Multi-Day Rain Accumulation (mm), Bust Risk %, Reliability Band, Trust Index.
- **Attention Status Card**: Visibly highlights one of the 4 attention statuses with full "WHY THIS STATUS?" scientific explanation bullet points.
- **2D Decision Matrix**: Interactive 3x3 grid highlighting preparedness sensitivity vs weather forecast reliability.
- **D1–D10 Timeline Table**: Interactive lead day horizon table with rain, multi-day accumulation, bust risk, reliability band, and attention status per day.
- **What-If Scenario Panel**: Interactive sliders for custom rainfall override and wind speed adjustment with reset button.
- **Explanation Assistant Integration**: One-click AI assistant popover pre-populated with disaster scenario context.
- **Mandatory Operational Disclaimer**: Prominently rendered at the bottom of the page.

---

## 7. Verification & Audit Results
- **Unit Test Suite**: `tests/test_disaster_decision_support.py` (12 scientific tests, 100% PASS).
- **Endpoint Audit**: `scripts/audit_backend_endpoints.py` audited all 35 endpoints across Phase 1–9C (100% HTTP 200, valid JSON, no NaN/Inf values).
- **Frontend Build**: `npm run build` executed cleanly with 0 errors.
