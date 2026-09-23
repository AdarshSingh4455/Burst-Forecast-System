import os
import numpy as np
import pandas as pd
import xarray as xr


# ============================================================
# CONFIGURATION
# ============================================================

DATE = "2019010100"

MEMBERS = [
    "c00",
    "p01",
    "p02",
    "p03",
    "p04"
]

INPUT_DIR = "data/raw/gefs"
OUTPUT_DIR = "data/processed"

NETCDF_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "gefs_east_up_ensemble_d1_d10.nc"
)

PARQUET_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "gefs_east_up_ensemble_d1_d10.parquet"
)

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


print("\n============================================")
print("FORTRESS - ENSEMBLE DATASET BUILDER")
print("============================================\n")


# ============================================================
# STORAGE FOR ALL MEMBERS
# ============================================================

all_members = []


# ============================================================
# PROCESS EACH ENSEMBLE MEMBER
# ============================================================

for member in MEMBERS:

    print("--------------------------------------------")
    print(f"Processing member: {member}")
    print("--------------------------------------------")

    input_file = os.path.join(
        INPUT_DIR,
        f"apcp_sfc_{DATE}_{member}.grib2"
    )

    # --------------------------------------------------------
    # Check file exists
    # --------------------------------------------------------

    if not os.path.exists(input_file):
        raise FileNotFoundError(
            f"File not found:\n{input_file}"
        )

    # --------------------------------------------------------
    # GEFS data type
    #
    # c00      = control forecast (cf)
    # p01-p04  = perturbed forecast (pf)
    # --------------------------------------------------------

    data_type = (
        "cf"
        if member == "c00"
        else "pf"
    )

    # --------------------------------------------------------
    # Read GRIB2
    # --------------------------------------------------------

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

    print("GRIB file opened successfully.")

    print(
        "Raw dimensions:",
        dict(ds.sizes)
    )

    # --------------------------------------------------------
    # Check precipitation variable
    # --------------------------------------------------------

    if "tp" not in ds.data_vars:
        raise ValueError(
            f"'tp' precipitation variable not found for {member}"
        )

    # --------------------------------------------------------
    # EASTERN UP PILOT BOUNDING BOX
    #
    # Approximate rectangular pilot region.
    # Final project can later use actual administrative polygon.
    # --------------------------------------------------------

    east_up = ds.sel(
        latitude=slice(28.5, 24.5),
        longitude=slice(80.0, 84.5)
    )

    print(
        "Eastern UP dimensions:",
        dict(east_up.sizes)
    )

    # --------------------------------------------------------
    # BUILD D1-D10 DAILY RAINFALL
    #
    # GEFS APCP contains alternating 3h / 6h accumulations.
    #
    # We use four non-overlapping 6-hour blocks:
    #
    # D1 = 0-6 + 6-12 + 12-18 + 18-24
    # D2 = 24-30 + 30-36 + 36-42 + 42-48
    # ...
    # --------------------------------------------------------

    daily_rain = []

    for day in range(1, 11):

        start_hour = (
            day - 1
        ) * 24

        six_hour_endpoints = [
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
            for hour in six_hour_endpoints
        ]

        print(
            f"D{day}: "
            f"{six_hour_endpoints}"
        )

        # Check that required forecast steps exist

        available_steps = set(
            ds.step.values
        )

        for step in steps:

            if step not in available_steps:
                raise ValueError(
                    f"Missing forecast step {step} "
                    f"for member {member}"
                )

        # Select four 6-hour accumulation endpoints

        blocks = east_up["tp"].sel(
            step=steps
        )

        # Sum four 6-hour blocks
        # = 24-hour rainfall

        rain_24h = blocks.sum(
            dim="step"
        )

        # Remove scalar GRIB metadata coordinates
        # such as number/time/surface

        rain_24h = rain_24h.reset_coords(
            drop=True
        )

        # Add lead day dimension

        rain_24h = rain_24h.expand_dims(
            lead_day=[day]
        )

        daily_rain.append(
            rain_24h
        )

    # --------------------------------------------------------
    # Combine D1-D10 for this member
    # --------------------------------------------------------

    member_rain = xr.concat(
        daily_rain,
        dim="lead_day"
    )

    # Add ensemble-member dimension

    member_rain = member_rain.expand_dims(
        member=[member]
    )

    # Load into memory before closing source GRIB file

    member_rain = member_rain.load()

    all_members.append(
        member_rain
    )

    ds.close()

    print(
        f"\n{member} complete.\n"
    )


# ============================================================
# COMBINE ALL ENSEMBLE MEMBERS
# ============================================================

print("\n============================================")
print("COMBINING ENSEMBLE MEMBERS")
print("============================================\n")


ensemble_rain = xr.concat(
    all_members,
    dim="member"
)


ensemble_rain.name = "rain_mm"


ensemble_rain.attrs = {
    "long_name":
        "24-hour accumulated precipitation",

    "units":
        "mm",

    "source":
        "NOAA GEFSv12 Reforecast",

    "processing":
        "Sum of four non-overlapping 6-hour precipitation accumulations"
}


print(
    "Combined dimensions:",
    dict(ensemble_rain.sizes)
)


# ============================================================
# ADD VALID TIMES
# ============================================================

forecast_init = np.datetime64(
    "2019-01-01T00:00:00"
)


valid_times = [
    forecast_init
    + np.timedelta64(
        day,
        "D"
    )
    for day in range(1, 11)
]


ensemble_rain = ensemble_rain.assign_coords(
    valid_time=(
        "lead_day",
        valid_times
    )
)


# ============================================================
# CALCULATE ENSEMBLE STATISTICS
# ============================================================

print("\nCalculating ensemble statistics...")


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
# CREATE FINAL XARRAY DATASET
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
        "2019-01-01 00 UTC",

    "region":
        "Eastern UP Pilot",

    "ensemble_members":
        "c00,p01,p02,p03,p04",

    "note":
        "Eastern UP region currently uses an approximate pilot bounding box"
}


# ============================================================
# SAVE NETCDF
# ============================================================

output_ds.to_netcdf(
    NETCDF_OUTPUT
)


print(
    f"\nNetCDF saved successfully:\n"
    f"{NETCDF_OUTPUT}"
)


# ============================================================
# CREATE ML-FRIENDLY PARQUET
# ============================================================

print("\nCreating ML-friendly Parquet dataset...")


# ------------------------------------------------------------
# Individual ensemble member rainfall
# ------------------------------------------------------------

member_df = (
    ensemble_rain
    .to_dataframe(
        name="rain_mm"
    )
    .reset_index()
)


# Convert members from rows to columns

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


# ------------------------------------------------------------
# Ensemble statistics table
# ------------------------------------------------------------

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


# ------------------------------------------------------------
# Merge rainfall + ensemble statistics
# ------------------------------------------------------------

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


# ============================================================
# ADD METADATA
# ============================================================

df["forecast_init"] = pd.Timestamp(
    "2019-01-01 00:00:00"
)


df["region"] = (
    "Eastern_UP_Pilot"
)


df["source"] = (
    "NOAA_GEFSv12_Reforecast"
)


# ============================================================
# COLUMN ORDER
# ============================================================

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


# ============================================================
# BASIC DATA VALIDATION
# ============================================================

if df.isnull().any().any():

    print(
        "\nWARNING:"
        " Dataset contains missing values."
    )

else:

    print(
        "\nNo missing values detected."
    )


if (
    df[
        [
            "rain_c00_mm",
            "rain_p01_mm",
            "rain_p02_mm",
            "rain_p03_mm",
            "rain_p04_mm"
        ]
    ]
    < 0
).any().any():

    print(
        "WARNING:"
        " Negative rainfall values detected."
    )


# ============================================================
# SAVE PARQUET
# ============================================================

df.to_parquet(
    PARQUET_OUTPUT,
    index=False
)


print(
    f"\nParquet saved successfully:\n"
    f"{PARQUET_OUTPUT}"
)


# ============================================================
# FINAL VALIDATION OUTPUT
# ============================================================

print("\n============================================")
print("ENSEMBLE DATASET VALIDATION")
print("============================================")


print("\nDimensions:")

print(
    dict(
        output_ds.sizes
    )
)


print("\nMembers:")

print(
    output_ds.member.values
)


print("\nLead days:")

print(
    output_ds.lead_day.values
)


print("\nValid times:")

print(
    output_ds.valid_time.values
)


print("\nRows in Parquet:")

print(
    len(df)
)


print("\nColumns:")

print(
    df.columns.tolist()
)


print("\nEnsemble Mean statistics:")

print(
    df[
        "ensemble_mean_mm"
    ].describe()
)


print("\nEnsemble Spread statistics:")

print(
    df[
        "ensemble_spread_mm"
    ].describe()
)


print("\nMember Range statistics:")

print(
    df[
        "member_range_mm"
    ].describe()
)


print("\nFirst 5 rows:")

print(
    df.head()
)


print("\n============================================")
print("FORTRESS ENSEMBLE DATASET READY")
print("============================================\n")