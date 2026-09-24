import urllib.request
import json
import urllib.parse

base = 'http://127.0.0.1:8000/api'
print('=== AUDITING ALL FASTAPI ENDPOINTS ===')

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
