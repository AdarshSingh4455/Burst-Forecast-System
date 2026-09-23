import os
import sys
import boto3
import numpy as np
import pandas as pd
import xarray as xr

from botocore import UNSIGNED
from botocore.client import Config


# ============================================================
# INPUT DATE
# ============================================================

if len(sys.argv) != 2:
    print(
        "\nUsage:\n"
        "python .\\scripts\\run_gefs_date.py YYYYMMDD00\n"
    )
    sys.exit(1)

DATE = sys.argv[1]

if len(DATE) != 10 or not DATE.endswith("00"):
    raise ValueError(
        "Date format must be YYYYMMDD00"
    )

YEAR = DATE[:4]


# ============================================================
# CONFIG
# ============================================================

BUCKET = "noaa-gefs-retrospective"

MEMBERS = [
    "c00",
    "p01",
    "p02",
    "p03",
    "p04"
]

RAW_DIR = os.path.join(
    "data",
    "raw",
    "gefs",
    DATE
)

OUTPUT_DIR = os.path.join(
    "data",
    "processed"
)

os.makedirs(
    RAW_DIR,
    exist_ok=True
)

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


# ============================================================
# S3 CLIENT
# ============================================================

s3 = boto3.client(
    "s3",
    config=Config(
        signature_version=UNSIGNED
    )
)


print("\n============================================")
print("FORTRESS - AUTOMATED GEFS PIPELINE")
print("============================================")
print(f"Forecast date: {DATE}")
print("Region: Eastern UP Pilot")
print("Leads: D1-D10")
print("============================================\n")


# ============================================================
# DOWNLOAD FILES
# ============================================================

for member in MEMBERS:

    filename = (
        f"apcp_sfc_{DATE}_{member}.grib2"
    )

    local_file = os.path.join(
        RAW_DIR,
        filename
    )

    key = (
        f"GEFSv12/reforecast/{YEAR}/"
        f"{DATE}/"
        f"{member}/"
        f"Days:1-10/"
        f"{filename}"
    )

    if os.path.exists(local_file):

        print(
            f"{member}: already downloaded"
        )

        continue

    print(
        f"{member}: downloading..."
    )

    s3.download_file(
        BUCKET,
        key,
        local_file
    )

    size_mb = (
        os.path.getsize(local_file)
        / (1024 * 1024)
    )

    print(
        f"{member}: download complete "
        f"({size_mb:.2f} MB)"
    )


# ============================================================
# PROCESS MEMBERS
# ============================================================

print("\n============================================")
print("PROCESSING ENSEMBLE")
print("============================================\n")


all_members = []


for member in MEMBERS:

    print(
        f"Processing {member}..."
    )

    input_file = os.path.join(
        RAW_DIR,
        f"apcp_sfc_{DATE}_{member}.grib2"
    )

    data_type = (
        "cf"
        if member == "c00"
        else "pf"
    )

    ds = xr.open_dataset(
        input_file,
        engine="cfgrib",
        backend_kwargs={
            "indexpath": "",
            "filter_by_keys": {
                "dataType": data_type
            }
        }
    )

    if "tp" not in ds.data_vars:

        raise ValueError(
            f"tp variable missing for {member}"
        )


    # --------------------------------------------------------
    # EASTERN UP PILOT
    # --------------------------------------------------------

    east_up = ds.sel(
        latitude=slice(
            28.5,
            24.5
        ),
        longitude=slice(
            80.0,
            84.5
        )
    )


    # --------------------------------------------------------
    # DAILY RAIN D1-D10
    # --------------------------------------------------------

    daily_rain = []

    available_steps = set(
        ds.step.values
    )


    for day in range(1, 11):

        start_hour = (
            day - 1
        ) * 24

        endpoints = [
            start_hour + 6,
            start_hour + 12,
            start_hour + 18,
            start_hour + 24
        ]

        steps = [
            np.timedelta64(
                hour,
                "h"
            )
            for hour in endpoints
        ]


        for step in steps:

            if step not in available_steps:

                raise ValueError(
                    f"Missing step {step} "
                    f"for {member}"
                )


        blocks = east_up[
            "tp"
        ].sel(
            step=steps
        )


        rain_24h = blocks.sum(
            dim="step"
        )


        rain_24h = rain_24h.reset_coords(
            drop=True
        )


        rain_24h = rain_24h.expand_dims(
            lead_day=[day]
        )


        daily_rain.append(
            rain_24h
        )


    member_rain = xr.concat(
        daily_rain,
        dim="lead_day"
    )


    member_rain = member_rain.expand_dims(
        member=[member]
    )


    member_rain = member_rain.load()


    all_members.append(
        member_rain
    )


    ds.close()


    print(
        f"{member}: complete"
    )


# ============================================================
# COMBINE MEMBERS
# ============================================================

ensemble_rain = xr.concat(
    all_members,
    dim="member"
)


ensemble_rain.name = "rain_mm"


# ============================================================
# FORECAST INIT TIME
# ============================================================

forecast_init = np.datetime64(
    f"{DATE[0:4]}-"
    f"{DATE[4:6]}-"
    f"{DATE[6:8]}"
    f"T00:00:00"
)


valid_times = [

    forecast_init
    + np.timedelta64(
        day,
        "D"
    )

    for day in range(
        1,
        11
    )
]


ensemble_rain = ensemble_rain.assign_coords(
    valid_time=(
        "lead_day",
        valid_times
    )
)


# ============================================================
# ENSEMBLE FEATURES
# ============================================================

ensemble_mean = ensemble_rain.mean(
    dim="member"
)

ensemble_spread = ensemble_rain.std(
    dim="member"
)

ensemble_min = ensemble_rain.min(
    dim="member"
)

ensemble_max = ensemble_rain.max(
    dim="member"
)

member_range = (
    ensemble_max
    - ensemble_min
)


# ============================================================
# FINAL DATASET
# ============================================================

output_ds = xr.Dataset(
    {
        "rain_mm":
            ensemble_rain,

        "ensemble_mean_mm":
            ensemble_mean,

        "ensemble_spread_mm":
            ensemble_spread,

        "ensemble_min_mm":
            ensemble_min,

        "ensemble_max_mm":
            ensemble_max,

        "member_range_mm":
            member_range
    }
)


output_ds.attrs = {
    "project":
        "FORTRESS",

    "source":
        "NOAA GEFSv12 Reforecast",

    "forecast_init":
        DATE,

    "region":
        "Eastern UP Pilot",

    "ensemble_members":
        "c00,p01,p02,p03,p04"
}


# ============================================================
# SAVE NETCDF
# ============================================================

netcdf_file = os.path.join(
    OUTPUT_DIR,
    f"gefs_east_up_ensemble_{DATE}.nc"
)


output_ds.to_netcdf(
    netcdf_file
)


# ============================================================
# CREATE PARQUET
# ============================================================

member_df = (
    ensemble_rain
    .to_dataframe(
        name="rain_mm"
    )
    .reset_index()
)


wide_df = member_df.pivot(
    index=[
        "lead_day",
        "valid_time",
        "latitude",
        "longitude"
    ],

    columns="member",

    values="rain_mm"
).reset_index()


wide_df.columns.name = None


wide_df = wide_df.rename(
    columns={
        "c00":
            "rain_c00_mm",

        "p01":
            "rain_p01_mm",

        "p02":
            "rain_p02_mm",

        "p03":
            "rain_p03_mm",

        "p04":
            "rain_p04_mm"
    }
)


stats_df = (
    output_ds[
        [
            "ensemble_mean_mm",
            "ensemble_spread_mm",
            "ensemble_min_mm",
            "ensemble_max_mm",
            "member_range_mm"
        ]
    ]
    .to_dataframe()
    .reset_index()
)


df = wide_df.merge(
    stats_df,

    on=[
        "lead_day",
        "valid_time",
        "latitude",
        "longitude"
    ],

    how="left"
)


df["forecast_init"] = pd.Timestamp(
    forecast_init
)


df["region"] = (
    "Eastern_UP_Pilot"
)


df["source"] = (
    "NOAA_GEFSv12_Reforecast"
)


columns = [

    "forecast_init",

    "valid_time",

    "lead_day",

    "latitude",

    "longitude",

    "region",

    "rain_c00_mm",

    "rain_p01_mm",

    "rain_p02_mm",

    "rain_p03_mm",

    "rain_p04_mm",

    "ensemble_mean_mm",

    "ensemble_spread_mm",

    "ensemble_min_mm",

    "ensemble_max_mm",

    "member_range_mm",

    "source"
]


df = df[
    columns
]


parquet_file = os.path.join(
    OUTPUT_DIR,
    f"gefs_east_up_ensemble_{DATE}.parquet"
)


df.to_parquet(
    parquet_file,
    index=False
)


# ============================================================
# VALIDATION
# ============================================================

print("\n============================================")
print("PIPELINE COMPLETE")
print("============================================")


print(
    f"\nNetCDF:\n{netcdf_file}"
)


print(
    f"\nParquet:\n{parquet_file}"
)


print(
    f"\nRows: {len(df)}"
)


print(
    "\nRainfall statistics:"
)


print(
    df[
        "ensemble_mean_mm"
    ].describe()
)


print(
    "\nEnsemble spread:"
)


print(
    df[
        "ensemble_spread_mm"
    ].describe()
)


print(
    "\nMaximum forecast rainfall:"
)


print(
    df[
        "ensemble_max_mm"
    ].max()
)


print("\n============================================")
print("FORTRESS DATE PIPELINE READY")
print("============================================\n")