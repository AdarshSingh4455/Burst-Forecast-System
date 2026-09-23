import os
import sys
import boto3
import numpy as np
import pandas as pd
import xarray as xr
from botocore import UNSIGNED
from botocore.client import Config

if len(sys.argv) != 2:
    print("Usage: python scripts/build_one_date.py YYYYMMDD00")
    sys.exit(1)

DATE = sys.argv[1]
if len(DATE) != 10 or not DATE.endswith("00"):
    raise ValueError("Date format must be YYYYMMDD00")

YEAR = DATE[:4]
MEMBERS = ["c00", "p01", "p02", "p03", "p04"]
BUCKET = "noaa-gefs-retrospective"

RAW_DIR = os.path.join("data", "raw", "gefs", DATE)
OUTPUT_DIR = os.path.join("data", "processed")
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

s3 = boto3.client("s3", config=Config(signature_version=UNSIGNED))

print("============================================")
print("FORTRESS - ONE DATE PIPELINE")
print(f"Date: {DATE}")
print("============================================")

print("Step 1: Downloading rainfall ensemble GRIBs...")
for member in MEMBERS:
    filename = f"apcp_sfc_{DATE}_{member}.grib2"
    local_file = os.path.join(RAW_DIR, filename)
    key = f"GEFSv12/reforecast/{YEAR}/{DATE}/{member}/Days:1-10/{filename}"
    if not os.path.exists(local_file):
        print(f"Downloading {member} rainfall...")
        s3.download_file(BUCKET, key, local_file)
    else:
        print(f"Rainfall {member} already present.")

print("Step 2: Downloading atmospheric predictors GRIBs...")
predictors = ["tmp_2m", "spfh_2m", "pres_msl", "pwat_eatm"]
for pred in predictors:
    filename = f"{pred}_{DATE}_c00.grib2"
    local_file = os.path.join(RAW_DIR, filename)
    key = f"GEFSv12/reforecast/{YEAR}/{DATE}/c00/Days:1-10/{filename}"
    if not os.path.exists(local_file):
        print(f"Downloading {pred}...")
        s3.download_file(BUCKET, key, local_file)
    else:
        print(f"Predictor {pred} already present.")

print("Step 3: Downloading 10m wind GRIBs...")
wind_vars = {"ugrd_hgt": "u10", "vgrd_hgt": "v10"}
for file_prefix, var_name in wind_vars.items():
    output_filename = f"{var_name}_10m_{DATE}_c00.grib2"
    local_file = os.path.join(RAW_DIR, output_filename)
    if os.path.exists(local_file):
        print(f"Wind {var_name} already present.")
        continue

    grib_filename = f"{file_prefix}_{DATE}_c00.grib2"
    idx_filename = f"{grib_filename}.idx"
    grib_key = f"GEFSv12/reforecast/{YEAR}/{DATE}/c00/Days:1-10/{grib_filename}"
    idx_key = f"GEFSv12/reforecast/{YEAR}/{DATE}/c00/Days:1-10/{idx_filename}"

    print(f"Fetching index for {file_prefix}...")
    idx_resp = s3.get_object(Bucket=BUCKET, Key=idx_key)
    idx_text = idx_resp["Body"].read().decode("utf-8")
    lines = [l.strip() for l in idx_text.splitlines() if l.strip()]

    records = []
    for line in lines:
        parts = line.split(":")
        records.append({"offset": int(parts[1]), "line": line})

    meta = s3.head_object(Bucket=BUCKET, Key=grib_key)
    file_size = meta["ContentLength"]

    search_target = "UGRD:10 m above ground" if file_prefix == "ugrd_hgt" else "VGRD:10 m above ground"
    ranges = []
    for i, rec in enumerate(records):
        if search_target in rec["line"]:
            start_byte = rec["offset"]
            end_byte = records[i + 1]["offset"] - 1 if i + 1 < len(records) else file_size - 1
            ranges.append((start_byte, end_byte))

    print(f"Downloading {len(ranges)} 10m wind byte ranges for {var_name}...")
    with open(local_file, "wb") as f:
        for sb, eb in ranges:
            obj = s3.get_object(Bucket=BUCKET, Key=grib_key, Range=f"bytes={sb}-{eb}")
            f.write(obj["Body"].read())

print("Step 4: Processing rainfall D1-D10...")
all_members = []
for member in MEMBERS:
    input_file = os.path.join(RAW_DIR, f"apcp_sfc_{DATE}_{member}.grib2")
    data_type = "cf" if member == "c00" else "pf"
    ds = xr.open_dataset(
        input_file,
        engine="cfgrib",
        backend_kwargs={"indexpath": "", "filter_by_keys": {"dataType": data_type}}
    )
    east_up = ds.sel(latitude=slice(28.5, 24.5), longitude=slice(80.0, 84.5))
    daily_rain = []
    available_steps = set(ds.step.values)
    for day in range(1, 11):
        start_hour = (day - 1) * 24
        steps = [np.timedelta64(start_hour + h, "h") for h in [6, 12, 18, 24]]
        for step in steps:
            if step not in available_steps:
                raise ValueError(f"Missing step {step} for member {member}")
        rain_24h = east_up["tp"].sel(step=steps).sum(dim="step").reset_coords(drop=True)
        rain_24h = rain_24h.expand_dims(lead_day=[day])
        daily_rain.append(rain_24h)
    member_rain = xr.concat(daily_rain, dim="lead_day").expand_dims(member=[member]).load()
    all_members.append(member_rain)
    ds.close()

ensemble_rain = xr.concat(all_members, dim="member")
ensemble_rain.name = "rain_mm"

forecast_init_dt = np.datetime64(f"{DATE[0:4]}-{DATE[4:6]}-{DATE[6:8]}T00:00:00")
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

print("Step 5: Processing atmospheric predictors...")
pred_configs = [
    ("tmp_2m", "t2m", "temp_2m_c", lambda x: x - 273.15),
    ("spfh_2m", "sh2", "specific_humidity_gkg", lambda x: x * 1000.0),
    ("pres_msl", "msl", "mslp_hpa", lambda x: x / 100.0),
    ("pwat_eatm", "pwat", "pwat_mm", lambda x: x)
]

pred_dfs = []
for file_prefix, var_name, out_prefix, conv_func in pred_configs:
    path = os.path.join(RAW_DIR, f"{file_prefix}_{DATE}_c00.grib2")
    ds = xr.open_dataset(path, engine="cfgrib", backend_kwargs={"indexpath": "", "filter_by_keys": {"dataType": "cf"}})
    region_ds = ds.sel(latitude=slice(28.5, 24.5), longitude=slice(80.0, 84.5))
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

print("Step 6: Processing 10m wind features...")
u_path = os.path.join(RAW_DIR, f"u10_10m_{DATE}_c00.grib2")
v_path = os.path.join(RAW_DIR, f"v10_10m_{DATE}_c00.grib2")
u_ds = xr.open_dataset(u_path, engine="cfgrib", backend_kwargs={"indexpath": ""})
v_ds = xr.open_dataset(v_path, engine="cfgrib", backend_kwargs={"indexpath": ""})
u_reg = u_ds["u10"].sel(latitude=slice(28.5, 24.5), longitude=slice(80.0, 84.5))
v_reg = v_ds["v10"].sel(latitude=slice(28.5, 24.5), longitude=slice(80.0, 84.5))

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

print("Step 7: Merging feature table...")
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
    raise ValueError(f"Found {missing_count} missing values in final feature dataset!")

output_parquet = os.path.join(OUTPUT_DIR, f"fortress_features_wind_{DATE}.parquet")
final_df.to_parquet(output_parquet, index=False)

print("============================================")
print("SUCCESS - FEATURE BUILDING COMPLETE")
print(f"Output File: {output_parquet}")
print(f"Total Rows: {len(final_df)}")
print(f"Total Columns: {len(final_df.columns)}")
print(f"Missing Values: {missing_count}")
print("============================================")
