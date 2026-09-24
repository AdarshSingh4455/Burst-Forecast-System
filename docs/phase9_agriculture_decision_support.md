# FORTRESS Phase 9B — Agriculture Decision Support Documentation

## Overview
Phase 9B introduces end-to-end domain-specific decision support for **Agriculture & Farming Operations** within the FORTRESS system (Forecast Reliability Stress-Testing & Self-Audit System, SIH26079).

It translates scientific forecast reliability intelligence (Bust Risk, Fragility/FFD, Self-Audit Status, Trust Horizon) into actionable operational context for agricultural advisory planning without altering underlying Phase 1–8 scientific models.

---

## 1. Safety & Operational Constraints
- **Separation of 3 Dimensions**: Weather condition (rain, dry spells), forecast reliability (trust index, self-audit status, bust risk), and agricultural sensitivity (crop stage, operations) are evaluated as separate dimensions before being synthesized into an Attention Status.
- **Strict Scientific Scoping**:
  - FORTRESS does **NOT** predict crop yields or loss percentages.
  - FORTRESS does **NOT** prescribe specific chemical, fertilizer, or pesticide dosages.
  - FORTRESS does **NOT** execute automated irrigation or pump control commands.
- **Mandatory Disclaimer**: All agriculture decision support UI views and API responses display the mandatory operational disclaimer emphasizing agronomic advisor authority and pilot boundary limitations.

---

## 2. Data Provenance & Demo Scenarios
- Domain agriculture field data is maintained in `data/domain/agriculture_demo.json`.
- `data_mode` is explicitly set to `"DEMO_SCENARIO"`.
- `soil_moisture_mode` is explicitly marked `"DEMO"`.
- Demoware fields:
  1. `AGRI_EUP_01` — Gorakhpur Paddy Field (Inside Pilot, Kharif Flowering Stage)
  2. `AGRI_EUP_02` — Varanasi Wheat Field (Inside Pilot, Sowing / Germination Stage)
  3. `AGRI_EUP_03` — Prayagraj Vegetable Plot (Inside Pilot, Harvesting Stage)
  4. `AGRI_OUTSIDE_01` — Jhansi Groundnut Field (Outside Eastern UP Pilot Coverage)

---

## 3. Spatial Coverage & Outside-Pilot Rules
- **Pilot Region**: Eastern UP Bounding Box (Latitude 24.5°N – 28.5°N, Longitude 80.0°E – 84.5°E).
- **Inside Pilot Rule**: Fields within the bounding box are snapped to the nearest FORTRESS grid point to retrieve forecast reliability metrics.
- **Outside Pilot Rule**: For any field outside the rectangular pilot (e.g., `AGRI_OUTSIDE_01` at Lon 78.38°E):
  - `coverage_available`: `false`
  - `context_mode`: `"OUTSIDE_PILOT"`
  - Grid snapping is strictly suppressed (`grid_lat: null`, `grid_lon: null`, `grid_distance_km: null`).
  - Scientific forecast context and decision support objects are returned as `null`.
  - explicit reason returned: `"FORTRESS reliability analysis is unavailable outside the current Eastern UP pilot coverage."`

---

## 4. Operational Relevance Gate & Decision Logic
Defined in `configs/agriculture_decision_support.yaml`:

### Agricultural Operational Relevance Gate
Weather conditions are classified as operationally relevant (`agricultural_relevance = true`) if:
- Dry spell length `>= 5 days` OR
- Forecasted rainfall `>= 10.0 mm` OR
- Heat / cold risk triggered.

If `agricultural_relevance = false`, status defaults to `NORMAL_MONITORING`.

### High Uncertainty Override Rule
`HIGH_UNCERTAINTY_EXPERT_REVIEW` triggers **ONLY IF**:
1. `agricultural_relevance == true`, AND
2. Forecast reliability is compromised:
   - `Self-Audit Status` in `["CONFLICT", "POSSIBLE BLIND SPOT", "EXPERT REVIEW"]`, OR
   - `Reliability Band` == `"RED"`, OR
   - `Trust Index < 50.0`, OR
   - `OOD State` == `true`.

### Standard Attention Status Rules
- `WEATHER_SENSITIVE_WINDOW`: High rain (`>= 25.0 mm`) or long dry spell (`>= 7 days`) during sensitive crop stage (sowing, flowering, harvesting).
- `FARM_ADVISORY_REVIEW`: Moderate rain (`>= 10.0 mm`) or dry spell (`>= 5 days`).
- `NORMAL_MONITORING`: Favorable conditions or operationally irrelevant weather.

---

## 5. API Endpoints
All 5 endpoints return HTTP 200 with valid JSON schemas:
1. `GET /api/agriculture`: List all demo agricultural fields with crop metadata and pilot coverage status.
2. `GET /api/agriculture/{id}`: Detailed field metadata including soil moisture (DEMO mode) and operational window.
3. `GET /api/agriculture/{id}/forecast-context`: D1–D10 lead timeline weather context and grid distance.
4. `GET /api/agriculture/{id}/decision-support`: Full decision support evaluation for selected forecast run, lead day, and scenario.
5. `POST /api/agriculture/{id}/scenario`: Interactive custom scenario simulation (e.g., modified rainfall or dry spell length).

---

## 6. UI Features & Light Green Custom Theme
- **Theme Palette**: Background `#EEF9F4`, Card/Header `#F4FAF6`, Border `#C8EAD9`, Primary Accent `#059669`, Dark Text `#044E3A`.
- **Top Controls**: Domain Switcher (Reservoir / Dam vs Agriculture / Farming), Field Selection dropdown, Lead Day selector (D1–D10), Forecast Run selector.
- **Demo Scenario Banner**: Visibly displays `"DEMO AGRICULTURE SCENARIO"` badge and data provenance indicators.
- **Top KPI Cards**: Crop Stage, Soil Moisture % (DEMO), Rain Forecast (mm), Bust Risk %, Reliability Band, Trust Index.
- **Attention Status Card**: Visibly highlights one of the 4 attention statuses with full "WHY THIS STATUS?" scientific explanation bullet points.
- **2D Decision Matrix**: Interactive 3x3 grid highlighting agricultural window sensitivity vs weather forecast reliability.
- **D1–D10 Timeline Table**: Interactive lead day horizon table with rain, bust risk, reliability band, and attention status per day.
- **What-If Scenario Panel**: Interactive sliders for custom rainfall override and dry spell adjustment with reset button.
- **Explanation Assistant Integration**: One-click AI assistant popover pre-populated with agricultural field context.
- **Mandatory Operational Disclaimer**: Prominently rendered at the bottom of the page.

---

## 7. Verification & Audit Results
- **Unit Test Suite**: `tests/test_agriculture_decision_support.py` (12 scientific tests, 100% PASS).
- **Endpoint Audit**: `scripts/audit_backend_endpoints.py` audited all 30 endpoints across Phase 1–9B (100% HTTP 200, valid JSON, no NaN/Inf values).
- **Frontend Build**: `npm run build` executed cleanly with 0 errors.
