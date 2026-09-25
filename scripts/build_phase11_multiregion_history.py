import os
import sys
import json
import time
import numpy as np
import pandas as pd
import xarray as xr
import yaml
import boto3
from botocore import UNSIGNED
from botocore.config import Config
from concurrent.futures import ThreadPoolExecutor

# Ensure ecCodes DLL on Windows
dll_dir = os.path.join(sys.prefix, "Library", "bin")
if os.path.exists(dll_dir):
    os.environ["PATH"] = dll_dir + os.path.pathsep + os.environ.get("PATH", "")
    if hasattr(os, "add_dll_directory"):
        try:
            os.add_dll_directory(dll_dir)
        except Exception:
            pass

sys.stdout.reconfigure(encoding="utf-8")

def load_config(config_path="configs/phase11_multiyear_data.yaml", regions_path="configs/phase11_regions.yaml"):
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    with open(regions_path, "r", encoding="utf-8") as f:
        rcfg = yaml.safe_load(f)
    cfg["regions_spec"] = rcfg.get("regions", {})
    return cfg

def process_one_date_for_region(date_str, region_id, region_cfg, base_cfg, s3_client, raw_dir, inter_dir):
    out_file = os.path.join(inter_dir, f"fortress_gefs_{region_id}_{date_str}.parquet")
    if os.path.exists(out_file):
        df_existing = pd.read_parquet(out_file)
        if len(df_existing) == 3230:
            return out_file, 3230

    os.makedirs(inter_dir, exist_ok=True)

    # Fast path for EASTERN_UP_RECT using already built multiyear file
    if region_id == "EASTERN_UP_RECT":
        eup_file = base_cfg.get("paths", {}).get("output_path", "data/processed/FORTRESS_GEFS_MULTIYEAR.parquet")
        if os.path.exists(eup_file):
            eup_full = pd.read_parquet(eup_file)
            ts = pd.Timestamp(f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]} 00:00:00")
            eup_date = eup_full[eup_full["forecast_init"] == ts].copy()
            if len(eup_date) == 3230:
                eup_date.insert(0, "region_id", "EASTERN_UP_RECT")
                eup_date.to_parquet(out_file, index=False)
                return out_file, 3230

    lat_min = region_cfg["lat_min"]
    lat_max = region_cfg["lat_max"]
    lon_min = region_cfg["lon_min"]
    lon_max = region_cfg["lon_max"]

    year_str = date_str[:4]
    bucket = base_cfg["forecast"]["bucket"]
    date_raw_dir = os.path.join(raw_dir, date_str)
    os.makedirs(date_raw_dir, exist_ok=True)

    members = base_cfg["forecast"]["members"]

    def get_raw_file(filename):
        p1 = os.path.join(date_raw_dir, filename)
        if os.path.exists(p1):
            return p1
        p2 = os.path.join("data", "raw", "gefs", date_str, filename)
        if os.path.exists(p2):
            return p2
        return p1

    # Parallel download for GRIB files (rain + 4 predictors)
    dl_tasks = []
    for member in members:
        filename = f"apcp_sfc_{date_str}_{member}.grib2"
        local_file = get_raw_file(filename)
        key = f"GEFSv12/reforecast/{year_str}/{date_str}/{member}/Days:1-10/{filename}"
        if not os.path.exists(local_file) or os.path.getsize(local_file) < 1000:
            dl_tasks.append((bucket, key, local_file))

    predictors = ["tmp_2m", "spfh_2m", "pres_msl", "pwat_eatm"]
    for pred in predictors:
        filename = f"{pred}_{date_str}_c00.grib2"
        local_file = get_raw_file(filename)
        key = f"GEFSv12/reforecast/{year_str}/{date_str}/c00/Days:1-10/{filename}"
        if not os.path.exists(local_file) or os.path.getsize(local_file) < 1000:
            dl_tasks.append((bucket, key, local_file))

    if dl_tasks:
        def _exec_dl(item):
            b, k, lf = item
            cli = boto3.client("s3", config=Config(signature_version=UNSIGNED, max_pool_connections=20))
            cli.download_file(b, k, lf)

        with ThreadPoolExecutor(max_workers=8) as executor:
            list(executor.map(_exec_dl, dl_tasks))

    # Download 10m wind GRIBs (ugrd_hgt / vgrd_hgt)
    wind_vars = {"ugrd_hgt": "u10", "vgrd_hgt": "v10"}
    for file_prefix, var_name in wind_vars.items():
        output_filename = f"{var_name}_10m_{date_str}_c00.grib2"
        local_file = get_raw_file(output_filename)
        if not os.path.exists(local_file) or os.path.getsize(local_file) < 1000:
            grib_filename = f"{file_prefix}_{date_str}_c00.grib2"
            idx_filename = f"{grib_filename}.idx"
            grib_key = f"GEFSv12/reforecast/{year_str}/{date_str}/c00/Days:1-10/{grib_filename}"
            idx_key = f"GEFSv12/reforecast/{year_str}/{date_str}/c00/Days:1-10/{idx_filename}"
            try:
                idx_resp = s3_client.get_object(Bucket=bucket, Key=idx_key)
                lines = [l.strip() for l in idx_resp["Body"].read().decode("utf-8").splitlines() if l.strip()]
                records = [{"offset": int(l.split(":")[1]), "line": l} for l in lines]
                meta = s3_client.head_object(Bucket=bucket, Key=grib_key)
                file_size = meta["ContentLength"]
                search_target = "UGRD:10 m above ground" if file_prefix == "ugrd_hgt" else "VGRD:10 m above ground"
                ranges = []
                for i, rec in enumerate(records):
                    if search_target in rec["line"]:
                        sb = rec["offset"]
                        eb = records[i + 1]["offset"] - 1 if i + 1 < len(records) else file_size - 1
                        ranges.append((i, sb, eb))
                
                def _fetch_range(item):
                    idx, sb, eb = item
                    cli = boto3.client("s3", config=Config(signature_version=UNSIGNED, max_pool_connections=20))
                    obj = cli.get_object(Bucket=bucket, Key=grib_key, Range=f"bytes={sb}-{eb}")
                    return idx, obj["Body"].read()

                with ThreadPoolExecutor(max_workers=10) as executor:
                    res_bytes = list(executor.map(_fetch_range, ranges))
                res_bytes.sort(key=lambda x: x[0])
                with open(local_file, "wb") as f_out:
                    for _, b_data in res_bytes:
                        f_out.write(b_data)
            except Exception:
                s3_client.download_file(bucket, grib_key, local_file)

    # Process Precipitation Ensemble
    all_members = []
    for member in members:
        path = get_raw_file(f"apcp_sfc_{date_str}_{member}.grib2")
        data_type = "cf" if member == "c00" else "pf"
        ds = xr.open_dataset(path, engine="cfgrib", backend_kwargs={"indexpath": "", "filter_by_keys": {"dataType": data_type}})
        reg_ds = ds.sel(latitude=slice(lat_max, lat_min), longitude=slice(lon_min, lon_max))
        daily_rain = []
        for day in range(1, 11):
            start_h = (day - 1) * 24
            steps = [np.timedelta64(start_h + h, "h") for h in [6, 12, 18, 24]]
            rain_24h = reg_ds["tp"].sel(step=steps).sum(dim="step").reset_coords(drop=True)
            rain_24h = rain_24h.expand_dims(lead_day=[day])
            daily_rain.append(rain_24h)
        member_rain = xr.concat(daily_rain, dim="lead_day").expand_dims(member=[member]).load()
        all_members.append(member_rain)
        ds.close()

    ensemble_rain = xr.concat(all_members, dim="member")
    forecast_init_dt = np.datetime64(f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}T00:00:00")
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
        "c00": "rain_c00_mm", "p01": "rain_p01_mm", "p02": "rain_p02_mm", "p03": "rain_p03_mm", "p04": "rain_p04_mm"
    })

    stats_df = output_ds[[
        "ensemble_mean_mm", "ensemble_spread_mm", "ensemble_min_mm", "ensemble_max_mm", "member_range_mm"
    ]].to_dataframe().reset_index()

    rain_feature_df = wide_df.merge(stats_df, on=["lead_day", "valid_time", "latitude", "longitude"], how="left")
    rain_feature_df["forecast_init"] = pd.Timestamp(forecast_init_dt)
    rain_feature_df["region_id"] = region_id
    rain_feature_df["region"] = region_cfg["name"]
    rain_feature_df["source"] = "NOAA_GEFSv12_Reforecast"

    # Atmospheric Predictors
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
        reg_ds = ds.sel(latitude=slice(lat_max, lat_min), longitude=slice(lon_min, lon_max))
        daily_frames = []
        for day in range(1, 11):
            start_h = (day - 1) * 24
            steps = [np.timedelta64(start_h + h, "h") for h in range(3, 25, 3)]
            data = conv_func(reg_ds[var_name].sel(step=steps))
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
            daily_frames.append(df_day[keep_cols])
        ds.close()
        pred_dfs.append(pd.concat(daily_frames, ignore_index=True))

    # 10m Wind Features
    u_path = get_raw_file(f"u10_10m_{date_str}_c00.grib2")
    v_path = get_raw_file(f"v10_10m_{date_str}_c00.grib2")

    u_ds = xr.open_dataset(u_path, engine="cfgrib", backend_kwargs={"indexpath": ""})
    v_ds = xr.open_dataset(v_path, engine="cfgrib", backend_kwargs={"indexpath": ""})
    u_reg = u_ds["u10"].sel(latitude=slice(lat_max, lat_min), longitude=slice(lon_min, lon_max))
    v_reg = v_ds["v10"].sel(latitude=slice(lat_max, lat_min), longitude=slice(lon_min, lon_max))

    wind_frames = []
    for day in range(1, 11):
        start_h = (day - 1) * 24
        steps = [np.timedelta64(start_h + h, "h") for h in range(3, 25, 3)]
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
        wind_frames.append(df_w[keep_w_cols])
    u_ds.close()
    v_ds.close()
    combined_wind = pd.concat(wind_frames, ignore_index=True)

    final_df = rain_feature_df.copy()
    for pdf in pred_dfs:
        final_df = final_df.merge(pdf, on=["lead_day", "valid_time", "latitude", "longitude"], how="left")
    final_df = final_df.merge(combined_wind, on=["lead_day", "valid_time", "latitude", "longitude"], how="left")

    final_columns = [
        "region_id", "forecast_init", "valid_time", "lead_day", "latitude", "longitude", "region",
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
    if len(final_df) != 3230:
        raise ValueError(f"Expected 3,230 rows for {region_id} {date_str}, got {len(final_df)}")

    final_df.to_parquet(out_file, index=False)
    return out_file, len(final_df)

def main():
    config = load_config()
    s3_client = boto3.client("s3", config=Config(signature_version=UNSIGNED))
    dates = config.get("history", {}).get("explicit_dates", [])
    regions = config["regions_spec"]

    raw_dir = "data/phase11/raw"
    inter_dir = "data/phase11/intermediate_multiregion"
    output_path = "data/processed/FORTRESS_GEFS_MULTIYEAR_MULTIREGION.parquet"

    print("============================================")
    print("FORTRESS PHASE 11D MULTI-REGION BUILDER")
    print(f"Regions: {list(regions.keys())}")
    print(f"Dates count: {len(dates)}")
    print(f"Total region-runs: {len(regions) * len(dates)}")
    print("============================================")

    all_dfs = []

    for reg_id, reg_cfg in regions.items():
        print(f"\n--- Processing Region: {reg_id} ({reg_cfg['name']}) ---")
        for i, d_str in enumerate(dates):
            print(f"[{i+1}/{len(dates)}] {reg_id} {d_str}...", end="", flush=True)
            try:
                out_file, rows = process_one_date_for_region(d_str, reg_id, reg_cfg, config, s3_client, raw_dir, inter_dir)
                df_reg = pd.read_parquet(out_file)
                all_dfs.append(df_reg)
                print(" PASS")
            except Exception as e:
                print(f" FAIL ({e})")

    if all_dfs:
        combined_df = pd.concat(all_dfs, ignore_index=True)
        combined_df.to_parquet(output_path, index=False)
        print(f"\nSaved multi-region forecast dataset to: {output_path}")
        print(f"Total Rows: {len(combined_df):,} | Total Columns: {len(combined_df.columns)}")

if __name__ == "__main__":
    main()
