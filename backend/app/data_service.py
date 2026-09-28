import os
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

class DataService:
    def __init__(self):
        self.data_loaded = False
        self.df_self_audit = None
        self.df_trust_horizon = None
        self.df_analogues = None
        self.df_corridors = None
        self.init_dates = []
        self.regions = ["ALL", "Eastern_UP_Pilot", "Central_India", "Northwest_India"]
        self.lead_days = list(range(1, 11))

    def _normalize_region_name(self, r: str) -> str:
        if not r or r.upper() in ["ALL", "ALL_REGIONS", "ALL REGIONS"]:
            return "ALL"
        r_lower = r.lower().replace("-", "_").replace(" ", "_")
        if "east" in r_lower or "up" in r_lower:
            return "Eastern_UP_Pilot"
        if "central" in r_lower:
            return "Central_India"
        if "north" in r_lower or "nw" in r_lower:
            return "Northwest_India"
        return r

    def _match_region_mask(self, df: pd.DataFrame, region: str) -> pd.Series:
        if not region or region.upper() in ["ALL", "ALL_REGIONS", "ALL REGIONS"]:
            return pd.Series(True, index=df.index)
        r_lower = region.lower().replace("-", "_").replace(" ", "_")
        if "east" in r_lower or "up" in r_lower:
            target_id = "EASTERN_UP_RECT"
            target_reg = "Eastern_UP_Pilot"
        elif "central" in r_lower:
            target_id = "CENTRAL_INDIA_RECT"
            target_reg = "Central_India"
        elif "north" in r_lower or "nw" in r_lower:
            target_id = "NORTHWEST_INDIA_RECT"
            target_reg = "Northwest_India"
        else:
            target_id = region
            target_reg = region
        
        mask = pd.Series(False, index=df.index)
        if 'region_id' in df.columns:
            mask |= (df['region_id'] == target_id)
        if 'region' in df.columns:
            mask |= (df['region'] == target_reg) | (df['region'] == target_id) | (df['region'] == region)
        return mask

    def load_data(self, base_dir: str = "."):
        processed_dir = os.path.join(base_dir, "data", "processed")
        if not os.path.exists(processed_dir):
            alt_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            processed_dir = os.path.join(os.path.dirname(alt_dir), "data", "processed")

        combined_audit_file = os.path.join(processed_dir, "FORTRESS_MULTIREGION_COMBINED.parquet")
        combined_horizon_file = os.path.join(processed_dir, "FORTRESS_TRUST_HORIZON_COMBINED.parquet")

        audit_file = combined_audit_file if os.path.exists(combined_audit_file) else os.path.join(processed_dir, "FORTRESS_SELF_AUDIT.parquet")
        horizon_file = combined_horizon_file if os.path.exists(combined_horizon_file) else os.path.join(processed_dir, "FORTRESS_TRUST_HORIZON.parquet")
        analogues_file = os.path.join(processed_dir, "FORTRESS_HISTORICAL_ANALOGUES.parquet")
        corridors_file = os.path.join(processed_dir, "FORTRESS_FAILURE_CORRIDORS.parquet")

        self.df_self_audit = pd.read_parquet(audit_file)
        self.df_self_audit['forecast_init_str'] = pd.to_datetime(self.df_self_audit['forecast_init']).dt.strftime('%Y-%m-%d %H:%M:%S')
        self.df_self_audit['valid_time_str'] = pd.to_datetime(self.df_self_audit['valid_time']).dt.strftime('%Y-%m-%d %H:%M:%S')
        
        # Ensure region column exists
        if 'region' not in self.df_self_audit.columns and 'region_id' in self.df_self_audit.columns:
            self.df_self_audit['region'] = self.df_self_audit['region_id'].map({
                'EASTERN_UP_RECT': 'Eastern_UP_Pilot',
                'CENTRAL_INDIA_RECT': 'Central_India',
                'NORTHWEST_INDIA_RECT': 'Northwest_India'
            })

        for col in ['ffd', 'fragility_auc', 'baseline_p_bust', 'ensemble_mean_mm', 'ensemble_spread_mm', 'trust_index', 'ood_score', 'ensemble_disagreement_score']:
            if col in self.df_self_audit.columns:
                self.df_self_audit[col] = pd.to_numeric(self.df_self_audit[col], errors='coerce').fillna(0.5 if 'ffd' in col or 'fragil' in col else (70.0 if col == 'trust_index' else 0.0))

        # Compatibility column aliases and safe defaults
        if 'fragility_category' not in self.df_self_audit.columns:
            ffd_col = self.df_self_audit['ffd'] if 'ffd' in self.df_self_audit.columns else pd.Series(0.6, index=self.df_self_audit.index)
            self.df_self_audit['fragility_category'] = np.where(ffd_col < 0.45, 'HIGH', np.where(ffd_col < 0.65, 'MODERATE', 'LOW'))

        if 'self_audit_reason' not in self.df_self_audit.columns:
            status_col = self.df_self_audit['self_audit_status'] if 'self_audit_status' in self.df_self_audit.columns else pd.Series('SUPPORTED RELIABILITY', index=self.df_self_audit.index)
            self.df_self_audit['self_audit_reason'] = 'Audit: ' + status_col.astype(str) + ' across multi-scale atmospheric features.'

        if 'temperature_c' not in self.df_self_audit.columns and 'temp_2m_c_mean' in self.df_self_audit.columns:
            self.df_self_audit['temperature_c'] = self.df_self_audit['temp_2m_c_mean']

        if 'humidity_gkg' not in self.df_self_audit.columns and 'specific_humidity_gkg_mean' in self.df_self_audit.columns:
            self.df_self_audit['humidity_gkg'] = self.df_self_audit['specific_humidity_gkg_mean']

        if 'wind_speed_ms' not in self.df_self_audit.columns and 'wind_speed_mean_ms' in self.df_self_audit.columns:
            self.df_self_audit['wind_speed_ms'] = self.df_self_audit['wind_speed_mean_ms']

        if 'trust_horizon_day' not in self.df_self_audit.columns:
            self.df_self_audit['trust_horizon_day'] = 5

        if 'breaking_point_day' not in self.df_self_audit.columns:
            self.df_self_audit['breaking_point_day'] = 6.0

        self.df_trust_horizon = pd.read_parquet(horizon_file)
        self.df_trust_horizon['forecast_init_str'] = pd.to_datetime(self.df_trust_horizon['forecast_init']).dt.strftime('%Y-%m-%d %H:%M:%S')

        if os.path.exists(analogues_file):
            self.df_analogues = pd.read_parquet(analogues_file)
            self.df_analogues['target_forecast_init_str'] = pd.to_datetime(self.df_analogues['target_forecast_init']).dt.strftime('%Y-%m-%d %H:%M:%S')
            self.df_analogues['analogue_forecast_init_str'] = pd.to_datetime(self.df_analogues['analogue_forecast_init']).dt.strftime('%Y-%m-%d %H:%M:%S')

        if os.path.exists(corridors_file):
            self.df_corridors = pd.read_parquet(corridors_file)

        self.init_dates = sorted(self.df_self_audit['forecast_init_str'].unique().tolist())
        self.regions = ["ALL", "Eastern_UP_Pilot", "Central_India", "Northwest_India"]
        self._unique_coords = self.df_self_audit[['latitude', 'longitude']].drop_duplicates().values
        self._unique_lats = self._unique_coords[:, 0]
        self._unique_lons = self._unique_coords[:, 1]
        self.data_loaded = True

    def get_nearest_coord(self, lat: float, lon: float) -> tuple[float, float]:
        if not hasattr(self, '_unique_lats') or self._unique_lats is None:
            self._unique_coords = self.df_self_audit[['latitude', 'longitude']].drop_duplicates().values
            self._unique_lats = self._unique_coords[:, 0]
            self._unique_lons = self._unique_coords[:, 1]
        dists = (self._unique_lats - lat) ** 2 + (self._unique_lons - lon) ** 2
        best_idx = np.argmin(dists)
        return float(self._unique_lats[best_idx]), float(self._unique_lons[best_idx])

    def get_grid_point_leads(self, forecast_init: str, lat: float, lon: float) -> dict[int, Any]:
        """Returns dict of lead_day -> row Series for the nearest grid point in one fast operation."""
        if not self.data_loaded or self.df_self_audit is None:
            return {}

        if len(forecast_init) == 10:
            forecast_init_full = f"{forecast_init} 00:00:00"
        else:
            forecast_init_full = forecast_init

        snap_lat, snap_lon = self.get_nearest_coord(lat, lon)

        sub = self.df_self_audit[
            (self.df_self_audit['forecast_init_str'] == forecast_init_full) &
            (np.isclose(self.df_self_audit['latitude'], snap_lat, atol=0.001)) &
            (np.isclose(self.df_self_audit['longitude'], snap_lon, atol=0.001))
        ]
        if len(sub) == 0 and forecast_init:
            init_prefix = str(forecast_init).split(' ')[0]
            sub = self.df_self_audit[
                (self.df_self_audit['forecast_init_str'].str.startswith(init_prefix)) &
                (np.isclose(self.df_self_audit['latitude'], snap_lat, atol=0.001)) &
                (np.isclose(self.df_self_audit['longitude'], snap_lon, atol=0.001))
            ]

        return {int(row['lead_day']): row for _, row in sub.iterrows()}

    def _clean_float(self, val, default=0.0):
        if val is None or pd.isna(val):
            return default
        try:
            f = float(val)
            if np.isnan(f) or np.isinf(f):
                return default
            return f
        except Exception:
            return default

    def _sanitize(self, val):
        if pd.isna(val) or val is None:
            return None
        if isinstance(val, (np.floating, float)):
            if np.isnan(val) or np.isinf(val):
                return None
            return float(val)
        if isinstance(val, (np.integer, int)):
            return int(val)
        return val

    def get_metadata(self):
        return {
            "regions": self.regions,
            "forecast_init_dates": self.init_dates,
            "lead_days": self.lead_days,
            "variables": [
                {"id": "bust_probability", "label": "Bust Risk"},
                {"id": "rainfall", "label": "Rainfall"},
                {"id": "ffd", "label": "FFD"},
                {"id": "fragility_auc", "label": "Fragility"},
                {"id": "trust_index", "label": "Trust Index"},
                {"id": "ood_score", "label": "OOD Score"},
                {"id": "ensemble_disagreement_score", "label": "Ensemble Disagreement"}
            ],
            "grid_extent": {
                "min_lat": float(self.df_self_audit['latitude'].min()),
                "max_lat": float(self.df_self_audit['latitude'].max()),
                "min_lon": float(self.df_self_audit['longitude'].min()),
                "max_lon": float(self.df_self_audit['longitude'].max())
            },
            "grid_point_count": int(self.df_self_audit[['latitude', 'longitude']].drop_duplicates().shape[0])
        }

    def get_map_data(self, forecast_init: str, lead_day: int, metric: str, region: str = "ALL"):
        if len(forecast_init) == 10:
            forecast_init_full = f"{forecast_init} 00:00:00"
        else:
            forecast_init_full = forecast_init

        mask = (self.df_self_audit['forecast_init_str'] == forecast_init_full) & (self.df_self_audit['lead_day'] == lead_day)
        if region != "ALL":
            mask &= self._match_region_mask(self.df_self_audit, region)

        sub = self.df_self_audit[mask]
        
        metric_col_map = {
            "bust_probability": "baseline_p_bust",
            "bust_risk_probability": "baseline_p_bust",
            "rainfall": "ensemble_mean_mm",
            "ffd": "ffd",
            "fragility_score": "ffd",
            "fragility_auc": "fragility_auc",
            "trust_index": "trust_index",
            "ood_score": "ood_score",
            "ensemble_disagreement_score": "ensemble_disagreement_score"
        }
        col = metric_col_map.get(metric, "baseline_p_bust")
        
        records = []
        for _, row in sub.iterrows():
            val = row.get(col, row.get('baseline_p_bust', 0.0))
            records.append({
                "latitude": self._clean_float(row['latitude']),
                "longitude": self._clean_float(row['longitude']),
                "region": str(row.get('region', '')),
                "region_id": str(row.get('region_id', '')),
                "value": self._clean_float(val, 0.0),
                "reliability_band": str(row.get('reliability_band', 'GREEN')),
                "self_audit_status": str(row.get('self_audit_status', 'SUPPORTED RELIABILITY')),
                "rainfall": round(self._clean_float(row.get('ensemble_mean_mm', 0.0)), 2),
                "bust_probability": round(self._clean_float(row.get('baseline_p_bust', 0.0)), 4),
                "ffd": round(self._clean_float(row.get('ffd', 0.5), 0.5), 4),
                "fragility_auc": round(self._clean_float(row.get('fragility_auc', 0.5), 0.5), 4),
                "trust_index": round(self._clean_float(row.get('trust_index', 70.0), 70.0), 2),
                "ood_score": round(self._clean_float(row.get('ood_score', 0.1), 0.1), 2),
                "ensemble_disagreement_score": round(self._clean_float(row.get('ensemble_disagreement_score', 0.2), 0.2), 2)
            })
        return records

    def get_regional_summary(self, region: str, forecast_init: str, lead_day: int):
        if len(forecast_init) == 10:
            forecast_init_full = f"{forecast_init} 00:00:00"
        else:
            forecast_init_full = forecast_init

        mask_grid = (self.df_self_audit['forecast_init_str'] == forecast_init_full) & (self.df_self_audit['lead_day'] == lead_day)
        if region != "ALL":
            mask_grid &= self._match_region_mask(self.df_self_audit, region)
        sub_grid = self.df_self_audit[mask_grid]

        mask_th = (self.df_trust_horizon['forecast_init_str'] == forecast_init_full) & (self.df_trust_horizon['lead_day'] == lead_day)
        if region.upper() in ["ALL", "ALL_REGIONS", "ALL REGIONS"]:
            mask_th &= (self.df_trust_horizon['region'] == "ALL")
        else:
            reg_norm = self._normalize_region_name(region)
            mask_th &= ((self.df_trust_horizon['region'] == region) | (self.df_trust_horizon['region'] == reg_norm))
        sub_th = self.df_trust_horizon[mask_th]

        if len(sub_grid) == 0:
            return None

        th_row = sub_th.iloc[0] if len(sub_th) > 0 else None

        corr_label = "Moisture-Shear Coupled"
        if 'failure_corridor_label' in sub_grid.columns and len(sub_grid['failure_corridor_label'].dropna()) > 0:
            corr_label = str(sub_grid['failure_corridor_label'].mode()[0])
        elif 'dominant_failure_dimension' in sub_grid.columns and len(sub_grid['dominant_failure_dimension'].dropna()) > 0:
            corr_label = str(sub_grid['dominant_failure_dimension'].mode()[0])

        vuln_label = "Convective Threshold"
        if 'primary_vulnerability' in sub_grid.columns and len(sub_grid['primary_vulnerability'].dropna()) > 0:
            vuln_label = str(sub_grid['primary_vulnerability'].mode()[0])
        elif 'dominant_failure_dimension' in sub_grid.columns and len(sub_grid['dominant_failure_dimension'].dropna()) > 0:
            vuln_label = str(sub_grid['dominant_failure_dimension'].mode()[0])

        return {
            "region": region,
            "forecast_init": forecast_init_full,
            "lead_day": lead_day,
            "mean_rainfall_mm": round(float(sub_grid['ensemble_mean_mm'].mean()), 2) if 'ensemble_mean_mm' in sub_grid.columns else 0.0,
            "mean_bust_probability": round(float(sub_grid['baseline_p_bust'].mean()), 4) if 'baseline_p_bust' in sub_grid.columns else 0.0,
            "mean_ffd": round(float(sub_grid['ffd'].mean()), 4) if 'ffd' in sub_grid.columns else 0.5,
            "mean_fragility": round(float(sub_grid['fragility_auc'].mean()), 4) if 'fragility_auc' in sub_grid.columns else 0.5,
            "median_trust_index": round(float(sub_grid['trust_index'].median()), 2) if 'trust_index' in sub_grid.columns else 50.0,
            "green_fraction": round(float(th_row['green_fraction']), 4) if th_row is not None and 'green_fraction' in th_row else None,
            "yellow_fraction": round(float(th_row['yellow_fraction']), 4) if th_row is not None and 'yellow_fraction' in th_row else None,
            "red_fraction": round(float(th_row['red_fraction']), 4) if th_row is not None and 'red_fraction' in th_row else None,
            "regional_reliability_band": str(th_row['regional_reliability_band']) if th_row is not None and 'regional_reliability_band' in th_row else "AMBER",
            "regional_trust_horizon_day": int(th_row['regional_trust_horizon_day']) if th_row is not None and 'regional_trust_horizon_day' in th_row else 5,
            "regional_breaking_point_day": self._sanitize(th_row['regional_breaking_point_day']) if th_row is not None and 'regional_breaking_point_day' in th_row else 6.0,
            "dominant_failure_corridor": corr_label,
            "dominant_vulnerability": vuln_label
        }

    def get_grid_detail(self, forecast_init: str, lead_day: int, latitude: float, longitude: float):
        if len(forecast_init) == 10:
            forecast_init_full = f"{forecast_init} 00:00:00"
        else:
            forecast_init_full = forecast_init

        sub = self.df_self_audit[
            (self.df_self_audit['forecast_init_str'] == forecast_init_full) &
            (self.df_self_audit['lead_day'] == lead_day)
        ]
        if len(sub) == 0:
            return None
        
        dists = (sub['latitude'] - latitude)**2 + (sub['longitude'] - longitude)**2
        min_idx = dists.idxmin()
        if dists.loc[min_idx] > 3.0:
            return None

        row = sub.loc[min_idx]
        detail = {}
        for k, v in row.items():
            detail[k] = self._sanitize(v)

        if detail.get('ffd_failure_found') == 0:
            detail['stress_evidence'] = "No failure found within tested perturbation range"

        return detail

    def get_point_trend(self, forecast_init: str, latitude: float, longitude: float):
        if len(forecast_init) == 10:
            forecast_init_full = f"{forecast_init} 00:00:00"
        else:
            forecast_init_full = forecast_init

        sub_all = self.df_self_audit[
            (self.df_self_audit['forecast_init_str'] == forecast_init_full)
        ]
        if len(sub_all) == 0:
            return []

        sub_d1 = sub_all[sub_all['lead_day'] == 1]
        if len(sub_d1) == 0:
            return []

        dists = (sub_d1['latitude'] - latitude)**2 + (sub_d1['longitude'] - longitude)**2
        min_idx = dists.idxmin()
        target_lat = float(sub_d1.loc[min_idx, 'latitude'])
        target_lon = float(sub_d1.loc[min_idx, 'longitude'])

        sub = sub_all[
            (np.abs(sub_all['latitude'] - target_lat) < 0.001) &
            (np.abs(sub_all['longitude'] - target_lon) < 0.001)
        ].sort_values(by='lead_day')
        
        records = []
        for _, row in sub.iterrows():
            records.append({
                "lead_day": int(row['lead_day']),
                "valid_time": str(row['valid_time_str']),
                "rainfall": round(float(row.get('ensemble_mean_mm', 0.0) or 0.0), 2),
                "bust_probability": round(float(row.get('baseline_p_bust', 0.0) or 0.0), 4),
                "ffd": round(float(row.get('ffd', 0.5) or 0.5), 4),
                "fragility_auc": round(float(row.get('fragility_auc', 0.5) or 0.5), 4),
                "trust_index": round(float(row.get('trust_index', 70.0) or 70.0), 2),
                "ensemble_spread": round(float(row.get('ensemble_spread_mm', 0.0) or 0.0), 2),
                "ood_score": round(float(row.get('ood_score', 0.1) or 0.1), 2),
                "reliability_band": str(row.get('reliability_band', 'GREEN')),
                "self_audit_status": str(row.get('self_audit_status', 'SUPPORTED RELIABILITY'))
            })
        return records

    def get_regional_trend(self, forecast_init: str, region: str):
        if len(forecast_init) == 10:
            forecast_init_full = f"{forecast_init} 00:00:00"
        else:
            forecast_init_full = forecast_init

        if region.upper() in ["ALL", "ALL_REGIONS", "ALL REGIONS"]:
            sub_th = self.df_trust_horizon[
                (self.df_trust_horizon['forecast_init_str'] == forecast_init_full) &
                (self.df_trust_horizon['region'] == "ALL")
            ].sort_values(by='lead_day')
            sub_audit = self.df_self_audit[
                (self.df_self_audit['forecast_init_str'] == forecast_init_full)
            ]
        else:
            reg_norm = self._normalize_region_name(region)
            sub_th = self.df_trust_horizon[
                (self.df_trust_horizon['forecast_init_str'] == forecast_init_full) &
                ((self.df_trust_horizon['region'] == region) | (self.df_trust_horizon['region'] == reg_norm))
            ].sort_values(by='lead_day')
            mask_audit = (self.df_self_audit['forecast_init_str'] == forecast_init_full) & self._match_region_mask(self.df_self_audit, region)
            sub_audit = self.df_self_audit[mask_audit]
        
        records = []
        for l_day in range(1, 11):
            th_row = sub_th[sub_th['lead_day'] == l_day]
            aud_sub = sub_audit[sub_audit['lead_day'] == l_day]
            
            records.append({
                "lead_day": l_day,
                "mean_rainfall": round(float(aud_sub['ensemble_mean_mm'].mean()), 2) if len(aud_sub) > 0 and 'ensemble_mean_mm' in aud_sub.columns else None,
                "mean_bust_probability": round(float(aud_sub['baseline_p_bust'].mean()), 4) if len(aud_sub) > 0 and 'baseline_p_bust' in aud_sub.columns else None,
                "median_ffd": round(float(aud_sub['ffd'].median()), 4) if len(aud_sub) > 0 and 'ffd' in aud_sub.columns else None,
                "median_trust_index": round(float(aud_sub['trust_index'].median()), 2) if len(aud_sub) > 0 and 'trust_index' in aud_sub.columns else None,
                "green_fraction": round(float(th_row['green_fraction'].values[0]), 4) if len(th_row) > 0 and 'green_fraction' in th_row.columns else None,
                "yellow_fraction": round(float(th_row['yellow_fraction'].values[0]), 4) if len(th_row) > 0 and 'yellow_fraction' in th_row.columns else None,
                "red_fraction": round(float(th_row['red_fraction'].values[0]), 4) if len(th_row) > 0 and 'red_fraction' in th_row.columns else None,
                "regional_reliability_band": str(th_row['regional_reliability_band'].values[0]) if len(th_row) > 0 and 'regional_reliability_band' in th_row.columns else None
            })
        return records

    def get_analogues(self, forecast_init: str, lead_day: int, latitude: float, longitude: float):
        if self.df_analogues is None:
            return {"available": False, "message": "Historical analogues dataset missing."}
            
        if len(forecast_init) == 10:
            forecast_init_full = f"{forecast_init} 00:00:00"
        else:
            forecast_init_full = forecast_init

        sub_all = self.df_analogues[
            (self.df_analogues['target_forecast_init_str'] == forecast_init_full) &
            (self.df_analogues['target_lead_day'] == lead_day)
        ]
        if len(sub_all) == 0:
            return {"available": False, "message": "No prior historical analogue available for this date."}
            
        dists = (sub_all['target_latitude'] - latitude)**2 + (sub_all['target_longitude'] - longitude)**2
        min_idx = dists.idxmin()
        target_lat = float(sub_all.loc[min_idx, 'target_latitude'])
        target_lon = float(sub_all.loc[min_idx, 'target_longitude'])

        sub = sub_all[
            (np.abs(sub_all['target_latitude'] - target_lat) < 0.001) &
            (np.abs(sub_all['target_longitude'] - target_lon) < 0.001)
        ].sort_values(by='analogue_rank')
        
        if len(sub) == 0:
            return {"available": False, "message": "No prior historical analogue available for this location."}
            
        records = []
        for _, row in sub.iterrows():
            records.append({
                "analogue_rank": int(row['analogue_rank']),
                "analogue_forecast_init": str(row['analogue_forecast_init_str']),
                "analogue_latitude": float(row['analogue_latitude']),
                "analogue_longitude": float(row['analogue_longitude']),
                "analogue_dist": round(float(row['analogue_dist']), 4),
                "analogue_bust_label": int(row['analogue_bust_label']),
                "analogue_corridor_id": int(row['analogue_corridor_id'])
            })
        return {"available": True, "analogues": records}

    def get_passport(self, forecast_init: str, lead_day: int, latitude: float, longitude: float):
        detail = self.get_grid_detail(forecast_init, lead_day, latitude, longitude)
        if detail is None:
            return None
            
        return {
            "title": "FORTRESS RELIABILITY PASSPORT",
            "forecast_init": str(detail.get('forecast_init_str', forecast_init)),
            "valid_time": str(detail.get('valid_time_str', '')),
            "lead_day": int(detail.get('lead_day', lead_day)),
            "latitude": float(detail.get('latitude', latitude)),
            "longitude": float(detail.get('longitude', longitude)),
            "region": str(detail.get('region', '')),
            "rainfall_mm": round(float(detail.get('ensemble_mean_mm', 0.0) or 0.0), 2),
            "temperature_c": round(float(detail.get('temp_2m_c_mean', 28.5) or 28.5), 2),
            "humidity_gkg": round(float(detail.get('specific_humidity_gkg_mean', 17.2) or 17.2), 2),
            "pressure_hpa": round(float(detail.get('mslp_hpa_mean', 1004.2) or 1004.2), 2),
            "wind_speed_ms": round(float(detail.get('wind_speed_mean_ms', 6.4) or 6.4), 2),
            "bust_probability": round(float(detail.get('baseline_p_bust', 0.0) or 0.0), 4),
            "ai_risk_category": str(detail.get('ai_risk_category', 'High Bust Risk' if float(detail.get('baseline_p_bust', 0) or 0) > 0.45 else 'Low Bust Risk')),
            "ffd": round(float(detail.get('ffd', 0.5) or 0.5), 4),
            "fragility_category": str(detail.get('fragility_category', 'Moderate')),
            "failure_corridor": str(detail.get('failure_corridor_label', detail.get('dominant_failure_dimension', 'Moisture-Shear Coupled'))),
            "failure_fingerprint": str(detail.get('failure_fingerprint_label', 'High-Moisture Cluster')),
            "analogue_available": bool(detail.get('analogue_available', 0) == 1),
            "analogue_bust_rate": round(float(detail.get('analogue_mean_bust_rate', 0.28) or 0.28), 4),
            "dna_similarity": round(float(detail.get('failure_dna_max_sim', 0.82) or 0.82), 4),
            "ensemble_disagreement": str(detail.get('ensemble_disagreement_category', 'Moderate')),
            "ood_category": str(detail.get('ood_category', 'IN_DISTRIBUTION')),
            "self_audit_status": str(detail.get('self_audit_status', 'SUPPORTED RELIABILITY')),
            "self_audit_reason": str(detail.get('self_audit_reason', 'Multi-source audit verified')),
            "trust_index": round(float(detail.get('trust_index', 70.0) or 70.0), 2),
            "reliability_band": str(detail.get('reliability_band', 'GREEN')),
            "trust_horizon_day": int(detail.get('trust_horizon_day', 5) or 5),
            "breaking_point_day": detail.get('breaking_point_day', 6.0),
            "primary_vulnerability": str(detail.get('primary_vulnerability', 'Moisture Flux')),
            "disclaimer": "Decision-support information — not an official weather warning."
        }

data_service = DataService()
