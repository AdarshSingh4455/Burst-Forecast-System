import os
import sys
import builtins

# Ensure Windows conda environment DLL path for ecCodes/cfgrib is registered
if sys.platform == "win32":
    conda_env_bin = os.path.join(sys.prefix, "Library", "bin")
    if os.path.exists(conda_env_bin):
        os.environ["PATH"] = conda_env_bin + os.pathsep + os.environ.get("PATH", "")
        if hasattr(os, "add_dll_directory"):
            try:
                os.add_dll_directory(conda_env_bin)
            except Exception:
                pass

# Ensure stdout prints cleanly and flushes immediately
sys.stdout.reconfigure(encoding='utf-8')
def print_log(*args, **kwargs):
    kwargs['flush'] = True
    builtins.print(*args, **kwargs)

print = print_log

import argparse
import json
import time
import datetime
import yaml
import boto3
import numpy as np
import pandas as pd
import xarray as xr
from botocore import UNSIGNED
from botocore.client import Config

def parse_args():
    parser = argparse.ArgumentParser(description="FORTRESS Phase 11 Multi-Year GEFS Data Expansion Pipeline")

    parser.add_argument("--config", type=str, default="configs/phase11_multiyear_data.yaml", help="Path to Phase 11 config file")
    parser.add_argument("--dry-run", action="store_true", help="Perform a dry run without downloading or writing data")
    parser.add_argument("--limit", type=int, default=None, help="Limit maximum number of forecast dates to process")
    parser.add_argument("--resume", action="store_true", default=True, help="Resume by skipping existing completed date files")
    parser.add_argument("--no-resume", action="store_false", dest="resume", help="Overwrite existing intermediate files")
    parser.add_argument("--smoke-test", type=str, default=None, help="Run smoke test for a single YYYYMMDD00 date and compare against Phase 1 pipeline")
    return parser.parse_args()

def load_config(config_path):
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def generate_date_list(config):
    history_cfg = config.get("history", {})
    mode = history_cfg.get("mode", "explicit")
    if mode == "explicit":
        dates = history_cfg.get("explicit_dates", [])
    elif mode == "frequency":
        years = history_cfg.get("years", [2017, 2018, 2019])
        freq = history_cfg.get("frequency", "monthly")
        dates = []
        for yr in years:
            if freq == "monthly":
                for mo in range(1, 13):
                    dates.append(f"{yr}{mo:02d}0100")
            elif freq == "weekly":
                # Sample weekly (1st, 8th, 15th, 22nd)
                for mo in range(1, 13):
                    for dy in [1, 8, 15, 22]:
                        dates.append(f"{yr}{mo:02d}{dy:02d}00")
            else:
                for mo in range(1, 13):
                    dates.append(f"{yr}{mo:02d}0100")
    else:
        dates = history_cfg.get("explicit_dates", [])
    return sorted(list(set(dates)))

def process_one_gefs_date(date_str, config, s3_client, raw_dir, intermediate_dir):
    """
    Downloads and builds feature dataset for a single GEFS forecast initialization.
    INVARIANT: 4 non-overlapping 6-hour precipitation accumulation windows per lead day.
    Daily rainfall = sum of 4 independent 6-hour precipitation windows ([6, 12, 18, 24] hours from start_hour).
    """
    year_str = date_str[:4]
    forecast_cfg = config.get("forecast", {})
    members = forecast_cfg.get("members", ["c00", "p01", "p02", "p03", "p04"])
    bucket = forecast_cfg.get("bucket", "noaa-gefs-retrospective")
    region_cfg = config.get("region", {})
    lat_min = region_cfg.get("lat_min", 24.5)
    lat_max = region_cfg.get("lat_max", 28.5)
    lon_min = region_cfg.get("lon_min", 80.0)
    lon_max = region_cfg.get("lon_max", 84.5)

    date_raw_dir = os.path.join(raw_dir, date_str)
    os.makedirs(date_raw_dir, exist_ok=True)
    os.makedirs(intermediate_dir, exist_ok=True)

    # Helper to resolve existing raw file location
    def get_raw_file(filename):
        p1 = os.path.join(date_raw_dir, filename)
        if os.path.exists(p1):
            return p1
        p2 = os.path.join("data", "raw", "gefs", date_str, filename)
        if os.path.exists(p2):
            return p2
        return p1

    # 1. Download Rainfall GRIBs and Atmospheric Predictors in parallel
    print("  Downloading/verifying rainfall & predictor GRIBs (parallel)...")
    dl_tasks = []
    for member in members:
        filename = f"apcp_sfc_{date_str}_{member}.grib2"
        local_file = get_raw_file(filename)
        key = f"GEFSv12/reforecast/{year_str}/{date_str}/{member}/Days:1-10/{filename}"
        if not os.path.exists(local_file):
            dl_tasks.append((bucket, key, local_file))

    predictors = ["tmp_2m", "spfh_2m", "pres_msl", "pwat_eatm"]
    for pred in predictors:
        filename = f"{pred}_{date_str}_c00.grib2"
        local_file = get_raw_file(filename)
        key = f"GEFSv12/reforecast/{year_str}/{date_str}/c00/Days:1-10/{filename}"
        if not os.path.exists(local_file):
            dl_tasks.append((bucket, key, local_file))

    if dl_tasks:
        def _exec_dl(item):
            b, k, lf = item
            if not os.path.exists(lf):
                cli = boto3.client("s3", config=Config(signature_version=UNSIGNED, max_pool_connections=20))
                cli.download_file(b, k, lf)

        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=8) as executor:
            list(executor.map(_exec_dl, dl_tasks))


    # 2. Download 10m Wind GRIBs via S3 byte index range
    print("  Downloading/verifying 10m wind byte ranges...")

    wind_vars = {"ugrd_hgt": "u10", "vgrd_hgt": "v10"}
    for file_prefix, var_name in wind_vars.items():
        output_filename = f"{var_name}_10m_{date_str}_c00.grib2"
        local_file = get_raw_file(output_filename)
        if not os.path.exists(local_file):

            grib_filename = f"{file_prefix}_{date_str}_c00.grib2"
            idx_filename = f"{grib_filename}.idx"
            grib_key = f"GEFSv12/reforecast/{year_str}/{date_str}/c00/Days:1-10/{grib_filename}"
            idx_key = f"GEFSv12/reforecast/{year_str}/{date_str}/c00/Days:1-10/{idx_filename}"

            idx_resp = s3_client.get_object(Bucket=bucket, Key=idx_key)
            idx_text = idx_resp["Body"].read().decode("utf-8")
            lines = [l.strip() for l in idx_text.splitlines() if l.strip()]

            records = []
            for line in lines:
                parts = line.split(":")
                records.append({"offset": int(parts[1]), "line": line})

            meta = s3_client.head_object(Bucket=bucket, Key=grib_key)
            file_size = meta["ContentLength"]

            search_target = "UGRD:10 m above ground" if file_prefix == "ugrd_hgt" else "VGRD:10 m above ground"
            ranges = []
            for i, rec in enumerate(records):
                if search_target in rec["line"]:
                    start_byte = rec["offset"]
                    end_byte = records[i + 1]["offset"] - 1 if i + 1 < len(records) else file_size - 1
                    ranges.append((i, start_byte, end_byte))

            def _fetch_one_range(item):
                idx, sb, eb = item
                cli = boto3.client("s3", config=Config(signature_version=UNSIGNED, max_pool_connections=20))
                obj = cli.get_object(Bucket=bucket, Key=grib_key, Range=f"bytes={sb}-{eb}")
                return idx, obj["Body"].read()

            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=10) as executor:
                results = list(executor.map(_fetch_one_range, ranges))

            results.sort(key=lambda x: x[0])

            with open(local_file, "wb") as f:
                for idx, chunk_bytes in results:
                    f.write(chunk_bytes)




    # 4. Process Rainfall (Invariant check: 4 non-overlapping 6h windows)
    all_members = []
    for member in members:
        input_file = get_raw_file(f"apcp_sfc_{date_str}_{member}.grib2")
        data_type = "cf" if member == "c00" else "pf"
        ds = xr.open_dataset(
            input_file,
            engine="cfgrib",
            backend_kwargs={"indexpath": "", "filter_by_keys": {"dataType": data_type}}
        )
        east_up = ds.sel(latitude=slice(lat_max, lat_min), longitude=slice(lon_min, lon_max))
        daily_rain = []
        available_steps = set(ds.step.values)
        for day in range(1, 11):
            start_hour = (day - 1) * 24
            steps = [np.timedelta64(start_hour + h, "h") for h in [6, 12, 18, 24]]
            for step in steps:
                if step not in available_steps:
                    raise ValueError(f"Missing precipitation step {step} for member {member}")
            rain_24h = east_up["tp"].sel(step=steps).sum(dim="step").reset_coords(drop=True)
            rain_24h = rain_24h.expand_dims(lead_day=[day])
            daily_rain.append(rain_24h)
        member_rain = xr.concat(daily_rain, dim="lead_day").expand_dims(member=[member]).load()
        all_members.append(member_rain)
        ds.close()

    ensemble_rain = xr.concat(all_members, dim="member")
    ensemble_rain.name = "rain_mm"

    forecast_init_dt = np.datetime64(f"{date_str[0:4]}-{date_str[4:6]}-{date_str[6:8]}T00:00:00")
    valid_times = [forecast_init_dt + np.timedelta64(day, "D") for day in range(1, 11)]
    ensemble_rain = ensemble_rain.assign_coords(valid_time=("lead_day", valid_times))

    ensemble_mean = ensemble_rain.mean(dim="member")
    ensemble_spread = ensemble_rain.std(dim="member")
    ensemble_min = ensemble_rain.min(dim="member")
    ensemble_max = ensemble_rain.max(dim="member")
    member_range = ensemble_max - ensemble_min

    output_ds = xr.Dataset({
        "rain_mm": ensemble_rain,
        "ensemble_mean_mm": ensemble_mean,
        "ensemble_spread_mm": ensemble_spread,
        "ensemble_min_mm": ensemble_min,
        "ensemble_max_mm": ensemble_max,
        "member_range_mm": member_range
    })

    member_df = ensemble_rain.to_dataframe(name="rain_mm").reset_index()
    wide_df = member_df.pivot(
        index=["lead_day", "valid_time", "latitude", "longitude"],
        columns="member",
        values="rain_mm"
    ).reset_index()
    wide_df.columns.name = None
    wide_df = wide_df.rename(columns={
        "c00": "rain_c00_mm",
        "p01": "rain_p01_mm",
        "p02": "rain_p02_mm",
        "p03": "rain_p03_mm",
        "p04": "rain_p04_mm"
    })

    stats_df = output_ds[[
        "ensemble_mean_mm", "ensemble_spread_mm", "ensemble_min_mm", "ensemble_max_mm", "member_range_mm"
    ]].to_dataframe().reset_index()

    rain_feature_df = wide_df.merge(stats_df, on=["lead_day", "valid_time", "latitude", "longitude"], how="left")
    rain_feature_df["forecast_init"] = pd.Timestamp(forecast_init_dt)
    rain_feature_df["region"] = "Eastern_UP_Pilot"
    rain_feature_df["source"] = "NOAA_GEFSv12_Reforecast"

    # 5. Process Atmospheric Predictors (c00)
    pred_configs = [
        ("tmp_2m", "t2m", "temp_2m_c", lambda x: x - 273.15),
        ("spfh_2m", "sh2", "specific_humidity_gkg", lambda x: x * 1000.0),
        ("pres_msl", "msl", "mslp_hpa", lambda x: x / 100.0),
        ("pwat_eatm", "pwat", "pwat_mm", lambda x: x)
    ]

    pred_dfs = []
    for file_prefix, var_name, out_prefix, conv_func in pred_configs:
        path = get_raw_file(f"{file_prefix}_{date_str}_c00.grib2")
        ds = xr.open_dataset(path, engine="cfgrib", backend_kwargs={"indexpath": "", "filter_by_keys": {"dataType": "cf"}})
        region_ds = ds.sel(latitude=slice(lat_max, lat_min), longitude=slice(lon_min, lon_max))
        daily_frames = []
        for day in range(1, 11):
            start_hour = (day - 1) * 24
            steps = [np.timedelta64(start_hour + h, "h") for h in range(3, 25, 3)]
            data = conv_func(region_ds[var_name].sel(step=steps))
            daily_ds = xr.Dataset({
                f"{out_prefix}_mean": data.mean(dim="step"),
                f"{out_prefix}_std": data.std(dim="step"),
                f"{out_prefix}_min": data.min(dim="step"),
                f"{out_prefix}_max": data.max(dim="step")
            })
            vtime = forecast_init_dt + np.timedelta64(day, "D")
            df_day = daily_ds.to_dataframe().reset_index()
            df_day["lead_day"] = day
            df_day["valid_time"] = pd.Timestamp(vtime)
            keep_cols = ["lead_day", "valid_time", "latitude", "longitude",
                         f"{out_prefix}_mean", f"{out_prefix}_std", f"{out_prefix}_min", f"{out_prefix}_max"]
            df_day = df_day[keep_cols]
            daily_frames.append(df_day)
        ds.close()
        combined_pred = pd.concat(daily_frames, ignore_index=True)
        pred_dfs.append(combined_pred)

    # 6. Process 10m Wind Features
    u_path = get_raw_file(f"u10_10m_{date_str}_c00.grib2")
    v_path = get_raw_file(f"v10_10m_{date_str}_c00.grib2")

    u_ds = xr.open_dataset(u_path, engine="cfgrib", backend_kwargs={"indexpath": ""})
    v_ds = xr.open_dataset(v_path, engine="cfgrib", backend_kwargs={"indexpath": ""})
    u_reg = u_ds["u10"].sel(latitude=slice(lat_max, lat_min), longitude=slice(lon_min, lon_max))
    v_reg = v_ds["v10"].sel(latitude=slice(lat_max, lat_min), longitude=slice(lon_min, lon_max))

    wind_frames = []
    for day in range(1, 11):
        start_hour = (day - 1) * 24
        steps = [np.timedelta64(start_hour + h, "h") for h in range(3, 25, 3)]
        u_day = u_reg.sel(step=steps)
        v_day = v_reg.sel(step=steps)
        speed_day = np.sqrt((u_day ** 2) + (v_day ** 2))
        wind_ds = xr.Dataset({
            "u10_mean_ms": u_day.mean(dim="step"),
            "v10_mean_ms": v_day.mean(dim="step"),
            "wind_speed_mean_ms": speed_day.mean(dim="step"),
            "wind_speed_std_ms": speed_day.std(dim="step"),
            "wind_speed_min_ms": speed_day.min(dim="step"),
            "wind_speed_max_ms": speed_day.max(dim="step")
        })
        df_w = wind_ds.to_dataframe().reset_index()
        df_w["lead_day"] = day
        df_w["valid_time"] = pd.Timestamp(forecast_init_dt + np.timedelta64(day, "D"))
        keep_w_cols = ["lead_day", "valid_time", "latitude", "longitude",
                      "u10_mean_ms", "v10_mean_ms", "wind_speed_mean_ms",
                      "wind_speed_std_ms", "wind_speed_min_ms", "wind_speed_max_ms"]
        df_w = df_w[keep_w_cols]
        wind_frames.append(df_w)
    u_ds.close()
    v_ds.close()
    combined_wind = pd.concat(wind_frames, ignore_index=True)

    # 7. Merge Feature Table
    final_df = rain_feature_df.copy()
    for pdf in pred_dfs:
        final_df = final_df.merge(pdf, on=["lead_day", "valid_time", "latitude", "longitude"], how="left")
    final_df = final_df.merge(combined_wind, on=["lead_day", "valid_time", "latitude", "longitude"], how="left")

    final_columns = [
        "forecast_init", "valid_time", "lead_day", "latitude", "longitude", "region",
        "rain_c00_mm", "rain_p01_mm", "rain_p02_mm", "rain_p03_mm", "rain_p04_mm",
        "ensemble_mean_mm", "ensemble_spread_mm", "ensemble_min_mm", "ensemble_max_mm", "member_range_mm",
        "source",
        "temp_2m_c_mean", "temp_2m_c_std", "temp_2m_c_min", "temp_2m_c_max",
        "specific_humidity_gkg_mean", "specific_humidity_gkg_std", "specific_humidity_gkg_min", "specific_humidity_gkg_max",
        "mslp_hpa_mean", "mslp_hpa_std", "mslp_hpa_min", "mslp_hpa_max",
        "pwat_mm_mean", "pwat_mm_std", "pwat_mm_min", "pwat_mm_max",
        "u10_mean_ms", "v10_mean_ms", "wind_speed_mean_ms", "wind_speed_std_ms", "wind_speed_min_ms", "wind_speed_max_ms"
    ]

    final_df = final_df[final_columns]

    missing_count = final_df.isnull().sum().sum()
    if missing_count > 0:
        raise ValueError(f"Found {missing_count} missing values in final feature dataset for date {date_str}!")

    if len(final_df) != 3230:
        raise ValueError(f"Expected 3,230 rows for date {date_str}, got {len(final_df)}!")

    out_file = os.path.join(intermediate_dir, f"fortress_gefs_{date_str}.parquet")
    final_df.to_parquet(out_file, index=False)
    return out_file, len(final_df)

def run_smoke_test(smoke_date, config, s3_client):
    print("============================================")
    print(f"SMOKE TEST: Comparing output for date {smoke_date}")
    print("============================================")
    
    raw_dir = "data/phase11/raw"
    inter_dir = "data/phase11/intermediate"
    
    # Process using Phase 11 engine
    out_file, rows = process_one_gefs_date(smoke_date, config, s3_client, raw_dir, inter_dir)
    p11_df = pd.read_parquet(out_file)

    # Check if Phase 1 file exists for this date
    p1_file = os.path.join("data", "processed", f"fortress_features_wind_{smoke_date}.parquet")
    if not os.path.exists(p1_file):
        print(f"Phase 1 reference file {p1_file} not found. Running phase 1 check against master dataset.")
        master_p1 = pd.read_parquet("data/processed/FORTRESS_GEFS_HISTORY.parquet")
        p1_df = master_p1[master_p1["forecast_init"] == pd.Timestamp(f"{smoke_date[:4]}-{smoke_date[4:6]}-{smoke_date[6:8]}")]
    else:
        p1_df = pd.read_parquet(p1_file)

    print(f"Phase 11 rows: {len(p11_df)}, Phase 1 rows: {len(p1_df)}")
    print(f"Phase 11 cols: {len(p11_df.columns)}, Phase 1 cols: {len(p1_df.columns)}")

    # Check column match
    cols_match = list(p11_df.columns) == list(p1_df.columns)
    print(f"Column Names Match: {cols_match}")

    # Numeric tolerance comparison
    numeric_cols = p11_df.select_dtypes(include=[np.number]).columns
    max_diff = 0.0
    for col in numeric_cols:
        diff = np.abs(p11_df[col].values - p1_df[col].values).max()
        if diff > max_diff:
            max_diff = diff
    
    print(f"Max Floating Difference across numeric columns: {max_diff:.8f}")
    if max_diff < 1e-4 and cols_match and len(p11_df) == 3230:
        print("SMOKE TEST RESULT: MATCH (Phase 11 pipeline output is identical to Phase 1 baseline)")
        return True
    else:
        print("SMOKE TEST RESULT: DIFFERENCE DETECTED")
        return False

def main():
    args = parse_args()
    config = load_config(args.config)

    s3_client = boto3.client("s3", config=Config(signature_version=UNSIGNED))

    if args.smoke_test:
        success = run_smoke_test(args.smoke_test, config, s3_client)
        sys.exit(0 if success else 1)

    all_dates = generate_date_list(config)
    if args.limit and args.limit > 0:
        all_dates = all_dates[:args.limit]

    paths_cfg = config.get("paths", {})
    raw_dir = paths_cfg.get("raw_dir", "data/phase11/raw")
    intermediate_dir = paths_cfg.get("intermediate_dir", "data/phase11/intermediate")
    output_path = paths_cfg.get("output_path", "data/processed/FORTRESS_GEFS_MULTIYEAR.parquet")
    manifest_path = paths_cfg.get("manifest_path", "data/processed/FORTRESS_GEFS_MULTIYEAR_MANIFEST.json")

    print("============================================")
    print("FORTRESS PHASE 11 DATA PIPELINE BUILDER")
    print(f"Dataset Name: {config.get('dataset_name')}")
    print(f"Region: {config.get('region_name')} (24.5N–28.5N, 80.0E–84.5E)")
    print(f"Total Target Dates: {len(all_dates)}")
    print(f"Dry Run: {args.dry_run}")
    print(f"Resume Mode: {args.resume}")
    print("============================================")

    if args.dry_run:
        expected_rows = len(all_dates) * 323 * 10
        print(f"[DRY-RUN] Planned forecast initializations ({len(all_dates)}):")
        for i, dt in enumerate(all_dates, 1):
            print(f"  [{i}/{len(all_dates)}] {dt[:4]}-{dt[4:6]}-{dt[6:8]}")
        print(f"[DRY-RUN] Expected Grid Points per Run: 323")
        print(f"[DRY-RUN] Expected Lead Days: 10 (D1–D10)")
        print(f"[DRY-RUN] Expected Total Rows: {expected_rows}")
        print(f"[DRY-RUN] Target Output Parquet: {output_path}")
        print(f"[DRY-RUN] Target Manifest: {manifest_path}")
        print("[DRY-RUN] Completed without errors.")
        return

    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(intermediate_dir, exist_ok=True)

    successful_dates = []
    failed_dates = []
    skipped_dates = []

    start_time = time.time()
    for i, date_str in enumerate(all_dates, 1):
        inter_file = os.path.join(intermediate_dir, f"fortress_gefs_{date_str}.parquet")
        if args.resume and os.path.exists(inter_file):
            try:
                check_df = pd.read_parquet(inter_file)
                if len(check_df) == 3230:
                    print(f"[{i}/{len(all_dates)}] {date_str} - SKIPPED (Already completed intermediate file present)")
                    successful_dates.append(date_str)
                    skipped_dates.append(date_str)
                    continue
            except Exception:
                print(f"[{i}/{len(all_dates)}] {date_str} - Existing file corrupted, re-downloading...")

        print(f"[{i}/{len(all_dates)}] Processing forecast date {date_str}...")
        try:
            out_file, row_cnt = process_one_gefs_date(date_str, config, s3_client, raw_dir, intermediate_dir)
            print(f"  -> GEFS Download: PASS | Members: 5/5 | Grid: 323 | Lead: 10 | Rows: {row_cnt}")
            successful_dates.append(date_str)
        except Exception as e:
            print(f"  -> FAILED processing {date_str}: {str(e)}")
            failed_dates.append({"date": date_str, "error": str(e)})

    print("============================================")
    print("INTERMEDIATE PROCESSING SUMMARY")
    print(f"Requested: {len(all_dates)}")
    print(f"Successful: {len(successful_dates)}")
    print(f"Skipped Existing: {len(skipped_dates)}")
    print(f"Failed: {len(failed_dates)}")
    print("============================================")

    if not successful_dates:
        raise RuntimeError("No forecast dates were successfully processed!")

    # Combine all successful per-date intermediate parquet files
    print(f"Combining {len(successful_dates)} successful runs into {output_path}...")
    dfs = []
    for dt in successful_dates:
        inter_file = os.path.join(intermediate_dir, f"fortress_gefs_{dt}.parquet")
        dfs.append(pd.read_parquet(inter_file))

    combined_df = pd.concat(dfs, ignore_index=True)

    # Sanity validations
    expected_total_rows = len(successful_dates) * 3230
    if len(combined_df) != expected_total_rows:
        raise ValueError(f"Combined dataset row count mismatch: Expected {expected_total_rows}, got {len(combined_df)}")

    dups = combined_df.duplicated(subset=["forecast_init", "valid_time", "lead_day", "latitude", "longitude"]).sum()
    if dups > 0:
        raise ValueError(f"Found {dups} duplicate rows in final combined dataset!")

    missing_cnt = combined_df.isnull().sum().sum()
    if missing_cnt > 0:
        raise ValueError(f"Found {missing_cnt} missing values in final combined dataset!")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    combined_df.to_parquet(output_path, index=False)
    print(f"Saved combined parquet dataset to: {output_path}")

    # Build manifest
    years_covered = sorted(list(set(combined_df["forecast_init"].dt.year.tolist())))
    runs_per_year = combined_df.groupby(combined_df["forecast_init"].dt.year)["forecast_init"].nunique().to_dict()

    manifest = {
        "dataset_name": config.get("dataset_name"),
        "creation_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "region": config.get("region_name"),
        "grid_bounds": {
            "lat_min": 24.5, "lat_max": 28.5,
            "lon_min": 80.0, "lon_max": 84.5,
            "resolution_deg": 0.25,
            "unique_grid_points": int(combined_df[["latitude", "longitude"]].drop_duplicates().shape[0])
        },
        "forecast_source": config.get("forecast", {}).get("source"),
        "members": config.get("forecast", {}).get("members"),
        "date_range": {
            "start": combined_df["forecast_init"].min().strftime("%Y-%m-%d"),
            "end": combined_df["forecast_init"].max().strftime("%Y-%m-%d")
        },
        "requested_dates_count": len(all_dates),
        "successful_dates_count": len(successful_dates),
        "failed_dates_count": len(failed_dates),
        "failed_dates_details": failed_dates,
        "years_covered": years_covered,
        "forecast_runs_per_year": runs_per_year,
        "total_forecast_runs": len(successful_dates),
        "grid_count_per_run": 323,
        "lead_range_days": [1, 10],
        "total_rows": len(combined_df),
        "total_columns": len(combined_df.columns),
        "missing_value_count": int(missing_cnt),
        "duplicate_rows": int(dups),
        "columns": list(combined_df.columns),
        "rainfall_construction": "Sum of 4 non-overlapping 6-hour accumulation windows per lead day ([6, 12, 18, 24] hours from start_hour)",
        "pipeline_execution_time_seconds": round(time.time() - start_time, 2)
    }

    os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Saved manifest to: {manifest_path}")

    print("============================================")
    print("PHASE 11 MULTI-YEAR BUILD COMPLETE")
    print(f"Total Rows: {len(combined_df)}")
    print(f"Total Columns: {len(combined_df.columns)}")
    print(f"Years Covered: {years_covered}")
    print(f"Runs Per Year: {runs_per_year}")
    print("============================================")

if __name__ == "__main__":
    main()
