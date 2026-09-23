import os
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
        self.regions = []
        self.lead_days = list(range(1, 11))

    def load_data(self, base_dir: str = "."):
        processed_dir = os.path.join(base_dir, "data", "processed")
        
        audit_file = os.path.join(processed_dir, "FORTRESS_SELF_AUDIT.parquet")
        horizon_file = os.path.join(processed_dir, "FORTRESS_TRUST_HORIZON.parquet")
        analogues_file = os.path.join(processed_dir, "FORTRESS_HISTORICAL_ANALOGUES.parquet")
        corridors_file = os.path.join(processed_dir, "FORTRESS_FAILURE_CORRIDORS.parquet")

        if not os.path.exists(audit_file):
            alt_dir = os.path.join(base_dir, "FORTRESS", "data", "processed")
            audit_file = os.path.join(alt_dir, "FORTRESS_SELF_AUDIT.parquet")
            horizon_file = os.path.join(alt_dir, "FORTRESS_TRUST_HORIZON.parquet")
            analogues_file = os.path.join(alt_dir, "FORTRESS_HISTORICAL_ANALOGUES.parquet")
            corridors_file = os.path.join(alt_dir, "FORTRESS_FAILURE_CORRIDORS.parquet")

        self.df_self_audit = pd.read_parquet(audit_file)
        self.df_self_audit['forecast_init_str'] = pd.to_datetime(self.df_self_audit['forecast_init']).dt.strftime('%Y-%m-%d %H:%M:%S')
        self.df_self_audit['valid_time_str'] = pd.to_datetime(self.df_self_audit['valid_time']).dt.strftime('%Y-%m-%d %H:%M:%S')
        
        self.df_trust_horizon = pd.read_parquet(horizon_file)
        self.df_trust_horizon['forecast_init_str'] = pd.to_datetime(self.df_trust_horizon['forecast_init']).dt.strftime('%Y-%m-%d %H:%M:%S')

        if os.path.exists(analogues_file):
            self.df_analogues = pd.read_parquet(analogues_file)
            self.df_analogues['target_forecast_init_str'] = pd.to_datetime(self.df_analogues['target_forecast_init']).dt.strftime('%Y-%m-%d %H:%M:%S')
            self.df_analogues['analogue_forecast_init_str'] = pd.to_datetime(self.df_analogues['analogue_forecast_init']).dt.strftime('%Y-%m-%d %H:%M:%S')

        if os.path.exists(corridors_file):
            self.df_corridors = pd.read_parquet(corridors_file)

        self.init_dates = sorted(self.df_self_audit['forecast_init_str'].unique().tolist())
        self.regions = sorted(self.df_self_audit['region'].unique().tolist())
        self.data_loaded = True

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
            "variables": ["Rainfall", "Bust Risk", "FFD", "Fragility", "Trust Index", "OOD", "Ensemble Disagreement"],
            "grid_extent": {
                "min_lat": float(self.df_self_audit['latitude'].min()),
                "max_lat": float(self.df_self_audit['latitude'].max()),
                "min_lon": float(self.df_self_audit['longitude'].min()),
                "max_lon": float(self.df_self_audit['longitude'].max())
            },
            "grid_point_count": int(self.df_self_audit[['latitude', 'longitude']].drop_duplicates().shape[0])
        }

    def get_map_data(self, forecast_init: str, lead_day: int, metric: str):
        sub = self.df_self_audit[
            (self.df_self_audit['forecast_init_str'] == forecast_init) &
            (self.df_self_audit['lead_day'] == lead_day)
        ]
        
        metric_col_map = {
            "bust_probability": "baseline_p_bust",
            "rainfall": "ensemble_mean_mm",
            "ffd": "ffd",
            "fragility_auc": "fragility_auc",
            "trust_index": "trust_index",
            "ood_score": "ood_score",
            "ensemble_disagreement_score": "ensemble_disagreement_score"
        }
        col = metric_col_map.get(metric, "baseline_p_bust")
        
        records = []
        for _, row in sub.iterrows():
            records.append({
                "latitude": float(row['latitude']),
                "longitude": float(row['longitude']),
                "value": float(row[col]),
                "reliability_band": str(row['reliability_band']),
                "self_audit_status": str(row['self_audit_status'])
            })
        return records

    def get_regional_summary(self, region: str, forecast_init: str, lead_day: int):
        sub_grid = self.df_self_audit[
            (self.df_self_audit['region'] == region) &
            (self.df_self_audit['forecast_init_str'] == forecast_init) &
            (self.df_self_audit['lead_day'] == lead_day)
        ]
        sub_th = self.df_trust_horizon[
            (self.df_trust_horizon['region'] == region) &
            (self.df_trust_horizon['forecast_init_str'] == forecast_init) &
            (self.df_trust_horizon['lead_day'] == lead_day)
        ]
        
        if len(sub_grid) == 0:
            return None

        th_row = sub_th.iloc[0] if len(sub_th) > 0 else None
        
        return {
            "region": region,
            "forecast_init": forecast_init,
            "lead_day": lead_day,
            "mean_rainfall_mm": round(float(sub_grid['ensemble_mean_mm'].mean()), 2),
            "mean_bust_probability": round(float(sub_grid['baseline_p_bust'].mean()), 4),
            "mean_ffd": round(float(sub_grid['ffd'].mean()), 4),
            "mean_fragility": round(float(sub_grid['fragility_auc'].mean()), 4),
            "median_trust_index": round(float(sub_grid['trust_index'].median()), 2),
            "green_fraction": round(float(th_row['green_fraction']), 4) if th_row is not None else 0.0,
            "yellow_fraction": round(float(th_row['yellow_fraction']), 4) if th_row is not None else 0.0,
            "red_fraction": round(float(th_row['red_fraction']), 4) if th_row is not None else 0.0,
            "regional_reliability_band": str(th_row['regional_reliability_band']) if th_row is not None else "GREEN",
            "regional_trust_horizon_day": int(th_row['regional_trust_horizon_day']) if th_row is not None else 10,
            "regional_breaking_point_day": self._sanitize(th_row['regional_breaking_point_day']) if th_row is not None else None,
            "dominant_failure_corridor": str(sub_grid['failure_corridor_label'].mode()[0]),
            "dominant_vulnerability": str(sub_grid['primary_vulnerability'].mode()[0])
        }

    def get_grid_detail(self, forecast_init: str, lead_day: int, latitude: float, longitude: float):
        sub = self.df_self_audit[
            (self.df_self_audit['forecast_init_str'] == forecast_init) &
            (self.df_self_audit['lead_day'] == lead_day) &
            (np.abs(self.df_self_audit['latitude'] - latitude) < 0.01) &
            (np.abs(self.df_self_audit['longitude'] - longitude) < 0.01)
        ]
        if len(sub) == 0:
            return None
        row = sub.iloc[0]
        
        detail = {}
        for k, v in row.items():
            detail[k] = self._sanitize(v)
        return detail

    def get_point_trend(self, forecast_init: str, latitude: float, longitude: float):
        sub = self.df_self_audit[
            (self.df_self_audit['forecast_init_str'] == forecast_init) &
            (np.abs(self.df_self_audit['latitude'] - latitude) < 0.01) &
            (np.abs(self.df_self_audit['longitude'] - longitude) < 0.01)
        ].sort_values(by='lead_day')
        
        records = []
        for _, row in sub.iterrows():
            records.append({
                "lead_day": int(row['lead_day']),
                "valid_time": str(row['valid_time_str']),
                "rainfall": round(float(row['ensemble_mean_mm']), 2),
                "bust_probability": round(float(row['baseline_p_bust']), 4),
                "ffd": round(float(row['ffd']), 4),
                "fragility_auc": round(float(row['fragility_auc']), 4),
                "trust_index": round(float(row['trust_index']), 2),
                "ensemble_spread": round(float(row['ensemble_spread_mm']), 2),
                "ood_score": round(float(row['ood_score']), 2),
                "reliability_band": str(row['reliability_band']),
                "self_audit_status": str(row['self_audit_status'])
            })
        return records

    def get_regional_trend(self, forecast_init: str, region: str):
        sub = self.df_trust_horizon[
            (self.df_trust_horizon['forecast_init_str'] == forecast_init) &
            (self.df_trust_horizon['region'] == region)
        ].sort_values(by='lead_day')
        
        sub_audit = self.df_self_audit[
            (self.df_self_audit['forecast_init_str'] == forecast_init) &
            (self.df_self_audit['region'] == region)
        ]
        
        records = []
        for l_day in range(1, 11):
            th_row = sub[sub['lead_day'] == l_day]
            aud_sub = sub_audit[sub_audit['lead_day'] == l_day]
            
            records.append({
                "lead_day": l_day,
                "mean_rainfall": round(float(aud_sub['ensemble_mean_mm'].mean()), 2) if len(aud_sub) > 0 else 0.0,
                "mean_bust_probability": round(float(aud_sub['baseline_p_bust'].mean()), 4) if len(aud_sub) > 0 else 0.0,
                "median_ffd": round(float(aud_sub['ffd'].median()), 4) if len(aud_sub) > 0 else 1.0,
                "median_trust_index": round(float(aud_sub['trust_index'].median()), 2) if len(aud_sub) > 0 else 100.0,
                "green_fraction": round(float(th_row['green_fraction'].values[0]), 4) if len(th_row) > 0 else 0.0,
                "yellow_fraction": round(float(th_row['yellow_fraction'].values[0]), 4) if len(th_row) > 0 else 0.0,
                "red_fraction": round(float(th_row['red_fraction'].values[0]), 4) if len(th_row) > 0 else 0.0,
                "regional_reliability_band": str(th_row['regional_reliability_band'].values[0]) if len(th_row) > 0 else "GREEN"
            })
        return records

    def get_analogues(self, forecast_init: str, lead_day: int, latitude: float, longitude: float):
        if self.df_analogues is None:
            return {"available": False, "message": "Historical analogues dataset missing."}
            
        sub = self.df_analogues[
            (self.df_analogues['target_forecast_init_str'] == forecast_init) &
            (self.df_analogues['target_lead_day'] == lead_day) &
            (np.abs(self.df_analogues['target_latitude'] - latitude) < 0.01) &
            (np.abs(self.df_analogues['target_longitude'] - longitude) < 0.01)
        ].sort_values(by='analogue_rank')
        
        if len(sub) == 0:
            return {"available": False, "message": "No prior historical analogue available for this date/location."}
            
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
            "forecast_init": str(detail['forecast_init_str']),
            "valid_time": str(detail['valid_time_str']),
            "lead_day": int(detail['lead_day']),
            "latitude": float(detail['latitude']),
            "longitude": float(detail['longitude']),
            "region": str(detail['region']),
            "rainfall_mm": round(float(detail['ensemble_mean_mm']), 2),
            "temperature_c": round(float(detail['temp_2m_c_mean']), 2),
            "humidity_gkg": round(float(detail['specific_humidity_gkg_mean']), 2),
            "pressure_hpa": round(float(detail['mslp_hpa_mean']), 2),
            "wind_speed_ms": round(float(detail['wind_speed_mean_ms']), 2),
            "bust_probability": round(float(detail['baseline_p_bust']), 4),
            "ai_risk_category": str(detail['ai_risk_category']),
            "ffd": round(float(detail['ffd']), 4),
            "fragility_category": str(detail['fragility_category']),
            "failure_corridor": str(detail['failure_corridor_label']),
            "failure_fingerprint": str(detail['failure_fingerprint_label']),
            "analogue_available": bool(detail['analogue_available'] == 1),
            "analogue_bust_rate": round(float(detail['analogue_mean_bust_rate']), 4),
            "dna_similarity": round(float(detail['failure_dna_max_sim']), 4),
            "ensemble_disagreement": str(detail['ensemble_disagreement_category']),
            "ood_category": str(detail['ood_category']),
            "self_audit_status": str(detail['self_audit_status']),
            "self_audit_reason": str(detail['self_audit_reason']),
            "trust_index": round(float(detail['trust_index']), 2),
            "reliability_band": str(detail['reliability_band']),
            "trust_horizon_day": int(detail['trust_horizon_day']),
            "breaking_point_day": detail['breaking_point_day'],
            "primary_vulnerability": str(detail['primary_vulnerability']),
            "disclaimer": "Decision-support information — not an official weather warning."
        }

data_service = DataService()
