import os
import sys
import json
import time
import urllib.request
import numpy as np
import pandas as pd
import yaml

sys.stdout.reconfigure(encoding="utf-8")

def load_config(config_path="configs/phase11_multiyear_data.yaml", regions_path="configs/phase11_regions.yaml"):
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    with open(regions_path, "r", encoding="utf-8") as f:
        rcfg = yaml.safe_load(f)
    cfg["regions_spec"] = rcfg.get("regions", {})
    return cfg

def fetch_obs_for_region(forecast_df, region_id, obs_cache_dir):
    os.makedirs(obs_cache_dir, exist_ok=True)
    coords_df = forecast_df[["latitude", "longitude"]].drop_duplicates().reset_index(drop=True)

    forecast_df["valid_date_str"] = pd.to_datetime(forecast_df["valid_time"]).dt.strftime("%Y-%m-%d")
    start_date = forecast_df["valid_date_str"].min()
    end_date = forecast_df["valid_date_str"].max()

    cache_file = os.path.join(obs_cache_dir, f"obs_cache_{region_id}_{start_date}_{end_date}.json")
    
    obs_records = []
    fetched_coords = set()
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                obs_records = json.load(f)
            for r in obs_records:
                fetched_coords.add((r["latitude"], r["longitude"]))
            print(f"  Found existing cache for {region_id} with {len(fetched_coords)} grid points already fetched.")
        except Exception:
            obs_records = []

    remaining_coords = coords_df[~coords_df.apply(lambda row: (row["latitude"], row["longitude"]) in fetched_coords, axis=1)].reset_index(drop=True)

    if len(remaining_coords) == 0:
        print(f"  All observations for {region_id} loaded from cache ({len(obs_records):,} records).")
    else:
        print(f"  Fetching Open-Meteo ERA5 reference rainfall for {region_id} ({len(remaining_coords)} remaining points out of {len(coords_df)}, {start_date} to {end_date})...")
        batch_size = 25
        for i in range(0, len(remaining_coords), batch_size):
            chunk = remaining_coords.iloc[i:i+batch_size]
            lats = ",".join(chunk["latitude"].astype(str))
            lons = ",".join(chunk["longitude"].astype(str))
            url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lats}&longitude={lons}&start_date={start_date}&end_date={end_date}&daily=precipitation_sum&timezone=UTC"
            
            res = None
            for attempt in range(15):
                try:
                    req = urllib.request.urlopen(url, timeout=40)
                    res = json.loads(req.read().decode("utf-8"))
                    break
                except urllib.error.HTTPError as e:
                    if e.code == 429:
                        print(f"    [HTTP 429 Rate Limit] Attempt {attempt+1}/15 for batch {i//batch_size+1}. Waiting 65s for Open-Meteo window reset...")
                        time.sleep(65)
                    else:
                        backoff = (attempt + 1) * 10
                        print(f"    [HTTP {e.code}] Attempt {attempt+1}/15 for batch {i//batch_size+1}: {e}. Retrying in {backoff}s...")
                        time.sleep(backoff)
                except Exception as e:
                    backoff = (attempt + 1) * 10
                    print(f"    Attempt {attempt+1}/15 failed for batch {i//batch_size+1}: {e}. Retrying in {backoff}s...")
                    time.sleep(backoff)
            
            if res is None:
                raise RuntimeError(f"Failed to fetch genuine ERA5 observations from Open-Meteo for batch {i//batch_size+1} after 15 attempts. Synthetic fallbacks are forbidden.")

            if not isinstance(res, list):
                res = [res]
                
            for coord_row, item in zip(chunk.to_dict("records"), res):
                lat = coord_row["latitude"]
                lon = coord_row["longitude"]
                dates = item["daily"]["time"]
                precip = item["daily"]["precipitation_sum"]
                for d, p in zip(dates, precip):
                    obs_records.append({
                        "region_id": region_id,
                        "latitude": lat,
                        "longitude": lon,
                        "valid_date_str": d,
                        "observed_rain_mm": float(p) if p is not None else np.nan,
                        "obs_source": "OpenMeteo_ERA5_Reanalysis"
                    })
            
            # Save incremental progress
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(obs_records, f)

            print(f"    Processed batch {i//batch_size+1}/{(len(remaining_coords)+batch_size-1)//batch_size} ({len(chunk)} grid points)")
            time.sleep(2.0)

    obs_df = pd.DataFrame(obs_records)
    return obs_df

def get_split(forecast_init_ts):
    year = forecast_init_ts.year
    month = forecast_init_ts.month
    if year == 2017 or (year == 2018 and month <= 6):
        return "TRAIN"
    elif year == 2018 and month >= 7:
        return "VALIDATION"
    elif year == 2019:
        return "TEST"
    else:
        return "UNKNOWN"

def main():
    forecast_multi_file = "data/processed/FORTRESS_GEFS_MULTIYEAR_MULTIREGION.parquet"
    if not os.path.exists(forecast_multi_file):
        print(f"Multi-region forecast dataset not found at {forecast_multi_file}")
        sys.exit(1)

    print("============================================")
    print("FORTRESS PHASE 11C/D OBSERVATIONS & BUST LABELS BUILDER")
    print("============================================")

    f_df = pd.read_parquet(forecast_multi_file)
    print(f"Loaded multi-region forecast dataset: {len(f_df):,} rows, {len(f_df.columns)} columns.")

    obs_cache_dir = "data/phase11/observations"
    all_obs = []
    for reg_id in f_df["region_id"].unique():
        sub_f = f_df[f_df["region_id"] == reg_id].copy()
        obs_sub = fetch_obs_for_region(sub_f, reg_id, obs_cache_dir)
        all_obs.append(obs_sub)

    combined_obs = pd.concat(all_obs, ignore_index=True)
    obs_out_file = "data/processed/FORTRESS_OBS_MULTIYEAR_MULTIREGION.parquet"
    combined_obs.to_parquet(obs_out_file, index=False)
    print(f"Saved observations dataset: {obs_out_file} ({len(combined_obs):,} rows)")

    # Save single-region observation file for Region 1
    obs_eup = combined_obs[combined_obs["region_id"] == "EASTERN_UP_RECT"].copy()
    obs_eup_file = "data/processed/FORTRESS_OBS_MULTIYEAR.parquet"
    obs_eup.to_parquet(obs_eup_file, index=False)
    print(f"Saved region 1 observation dataset: {obs_eup_file} ({len(obs_eup):,} rows)")

    # Merge forecast with observations
    f_df["valid_date_str"] = pd.to_datetime(f_df["valid_time"]).dt.strftime("%Y-%m-%d")
    merged_df = f_df.merge(combined_obs, on=["region_id", "latitude", "longitude", "valid_date_str"], how="left")
    merged_df = merged_df.drop(columns=["valid_date_str"])

    # Calculate error
    merged_df["rain_error_mm"] = (merged_df["ensemble_mean_mm"] - merged_df["observed_rain_mm"]).abs()

    # Assign Temporal Splits
    merged_df["split"] = merged_df["forecast_init"].apply(get_split)

    # Save Error Dataset
    error_out_file = "data/processed/FORTRESS_ERROR_MULTIYEAR_MULTIREGION.parquet"
    merged_df.to_parquet(error_out_file, index=False)
    print(f"Saved error dataset: {error_out_file} ({len(merged_df):,} rows)")

    # ZERO LEAKAGE: Calculate threshold from TRAIN split ONLY
    train_subset = merged_df[merged_df["split"] == "TRAIN"].copy()
    threshold_by_lead = train_subset.groupby("lead_day")["rain_error_mm"].quantile(0.95).to_dict()
    print("\nLEAKAGE-SAFE BUST THRESHOLDS (Calculated from TRAIN split ONLY):")
    for d in range(1, 11):
        print(f"  D{d:02d}: {threshold_by_lead[d]:.4f} mm absolute error")

    merged_df["bust_threshold"] = merged_df["lead_day"].map(threshold_by_lead)
    merged_df["bust_label"] = (merged_df["rain_error_mm"] > merged_df["bust_threshold"]).astype(int)

    # Save Bust Dataset
    bust_out_file = "data/processed/FORTRESS_BUST_MULTIYEAR_MULTIREGION.parquet"
    merged_df.to_parquet(bust_out_file, index=False)
    print(f"\nSaved multi-region bust dataset: {bust_out_file} ({len(merged_df):,} rows)")

    print("\nSPLIT BREAKDOWN & BUST PREVALENCE:")
    for split_name in ["TRAIN", "VALIDATION", "TEST"]:
        s_df = merged_df[merged_df["split"] == split_name]
        n_rows = len(s_df)
        n_busts = s_df["bust_label"].sum()
        p_rate = (n_busts / n_rows * 100.0) if n_rows > 0 else 0.0
        n_inits = s_df["forecast_init"].nunique()
        print(f"  {split_name:10s}: {n_inits:2d} inits ({n_rows:6,} rows) | Busts: {n_busts:5,} ({p_rate:.2f}%)")

if __name__ == "__main__":
    main()
