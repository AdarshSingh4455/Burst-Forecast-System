import urllib.request
import json
import urllib.parse

base = 'http://127.0.0.1:8000/api'
print('=== AUDITING ALL FASTAPI ENDPOINTS (INCLUDING PHASE 9A, 9B, AND 9C ENDPOINTS) ===')

def check_ep(url_path):
    url = f'{base}{url_path}'
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode('utf-8')
            data = json.loads(body)
            has_nan = 'NaN' in body
            has_inf = 'Infinity' in body
            print(f'[PASS] {url_path} -> HTTP {status} | Valid JSON | NaN: {has_nan} | Inf: {has_inf}')
            return data
    except Exception as e:
        print(f'[FAIL] {url_path} -> Error: {e}')
        return None

def check_post(url_path, payload):
    url = f'{base}{url_path}'
    try:
        data_bytes = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode('utf-8')
            data = json.loads(body)
            has_nan = 'NaN' in body
            has_inf = 'Infinity' in body
            print(f'[PASS] POST {url_path} -> HTTP {status} | Valid JSON | NaN: {has_nan} | Inf: {has_inf}')
            return data
    except Exception as e:
        print(f'[FAIL] POST {url_path} -> Error: {e}')
        return None

# Core Endpoints (1-20)
health = check_ep('/health')
meta = check_ep('/metadata')
regions_resp = check_ep('/regions')
runs_resp = check_ep('/forecast-runs')

regions = regions_resp.get('regions', []) if isinstance(regions_resp, dict) else []
runs = runs_resp.get('forecast_runs', []) if isinstance(runs_resp, dict) else []

first_run = runs[0] if runs else '2019-07-01 00:00:00'
first_region = regions[0] if regions else 'ALL'

q_map = urllib.parse.urlencode({'forecast_init': first_run, 'lead_day': 5, 'metric': 'bust_risk_probability', 'region': first_region})
map_data = check_ep(f'/map?{q_map}')

lat = map_data[0]['latitude'] if map_data and isinstance(map_data, list) else 26.75
lon = map_data[0]['longitude'] if map_data and isinstance(map_data, list) else 83.37

q_grid = urllib.parse.urlencode({'forecast_init': first_run, 'lead_day': 5, 'latitude': lat, 'longitude': lon})
q_point = urllib.parse.urlencode({'forecast_init': first_run, 'latitude': lat, 'longitude': lon})
q_reg = urllib.parse.urlencode({'forecast_init': first_run, 'lead_day': 5})

check_ep(f'/forecast/{urllib.parse.quote(first_region)}?{q_reg}')
check_ep(f'/grid-detail?{q_grid}')
check_ep(f'/trend?{q_point}')
check_ep(f'/regional-trend?{urllib.parse.urlencode({"forecast_init": first_run, "region": first_region})}')
check_ep(f'/stress-test?{q_grid}')
check_ep(f'/failure-corridors?{q_grid}')
check_ep(f'/fingerprint?{q_grid}')
check_ep(f'/analogues?{q_grid}')
check_ep(f'/failure-dna?{q_grid}')
check_ep(f'/ensemble?{q_grid}')
check_ep(f'/novelty?{q_grid}')
check_ep(f'/self-audit?{q_grid}')
check_ep(f'/trust-horizon?{q_point}')
check_ep(f'/trust-horizon/{urllib.parse.quote(first_region)}?{urllib.parse.urlencode({"forecast_init": first_run})}')
check_ep(f'/passport?{q_grid}')

# Phase 9A Reservoir Endpoints (21-25)
print('\n--- Phase 9A Reservoir Endpoints ---')
res_list = check_ep('/reservoirs')
res_id = res_list[0]['reservoir_id'] if res_list and isinstance(res_list, list) else 'RES_MEJA'

check_ep(f'/reservoirs/{res_id}')
check_ep(f'/reservoirs/{res_id}/forecast-context?{urllib.parse.urlencode({"forecast_init": first_run})}')
check_ep(f'/reservoirs/{res_id}/decision-support?{urllib.parse.urlencode({"forecast_init": first_run, "lead_day": 1, "scenario": "NORMAL"})}')
check_post(f'/reservoirs/{res_id}/scenario?{urllib.parse.urlencode({"forecast_init": first_run, "lead_day": 1})}', {'storage_percent': 88.0, 'recent_inflow_cumecs': 1200.0, 'scenario_name': 'High Storage What-If'})

# Phase 9B Agriculture Endpoints (26-30)
print('\n--- Phase 9B Agriculture Endpoints ---')
agri_list = check_ep('/agriculture')
agri_id = agri_list[0]['agri_id'] if agri_list and isinstance(agri_list, list) else 'AGRI_EUP_01'

check_ep(f'/agriculture/{agri_id}')
check_ep(f'/agriculture/{agri_id}/forecast-context?{urllib.parse.urlencode({"forecast_init": first_run})}')
check_ep(f'/agriculture/{agri_id}/decision-support?{urllib.parse.urlencode({"forecast_init": first_run, "lead_day": 1})}')
check_post(f'/agriculture/{agri_id}/scenario?{urllib.parse.urlencode({"forecast_init": first_run, "lead_day": 1})}', {'crop': 'Wheat', 'crop_stage': 'SOWING', 'field_operation': 'SOWING_WINDOW', 'soil_moisture_percent': 25.0, 'scenario_name': 'Rabi Sowing What-If'})

# Phase 9C Disaster Endpoints (31-35)
print('\n--- Phase 9C Disaster Management Endpoints ---')
disaster_list = check_ep('/disaster')
disaster_id = disaster_list[0]['scenario_id'] if disaster_list and isinstance(disaster_list, list) else 'DISASTER_EUP_01'

check_ep(f'/disaster/{disaster_id}')
check_ep(f'/disaster/{disaster_id}/forecast-context?{urllib.parse.urlencode({"forecast_init": first_run})}')
check_ep(f'/disaster/{disaster_id}/decision-support?{urllib.parse.urlencode({"forecast_init": first_run, "lead_day": 1})}')
check_post(f'/disaster/{disaster_id}/scenario?{urllib.parse.urlencode({"forecast_init": first_run, "lead_day": 1})}', {'hazard_context': 'FLOOD_PREPAREDNESS', 'preparedness_mode': 'RESOURCE_REVIEW', 'vulnerability_level': 'HIGH', 'exposure_level': 'HIGH', 'rainfall_mm_override': 65.0, 'scenario_name': 'Heavy Rain What-If'})

# Phase 9D Renewable Grid Endpoints (36-40)
print('\n--- Phase 9D Renewable Energy / Grid Endpoints ---')
renewable_list = check_ep('/renewable')
zone_id = renewable_list[0]['scenario_id'] if renewable_list and isinstance(renewable_list, list) else 'RENEW_EUP_01'


check_ep(f'/renewable/{zone_id}')
check_ep(f'/renewable/{zone_id}/forecast-context?{urllib.parse.urlencode({"forecast_init": first_run})}')
check_ep(f'/renewable/{zone_id}/decision-support?{urllib.parse.urlencode({"forecast_init": first_run, "lead_day": 1})}')
check_post(f'/renewable/{zone_id}/scenario?{urllib.parse.urlencode({"forecast_init": first_run, "lead_day": 1})}', {'wind_speed_multiplier': 1.5, 'temperature_offset_c': 2.0, 'humidity_offset_pct': -5.0, 'rainfall_multiplier': 1.0, 'scenario_name': 'Wind Variability What-If'})

