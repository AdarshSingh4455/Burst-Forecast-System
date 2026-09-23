import os
import xarray as xr
import pandas as pd


INPUT_FILE = "data/interim/gefs_india_daily_rain_d1_d10.nc"

OUTPUT_DIR = "data/processed"

NETCDF_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "gefs_east_up_daily_rain_d1_d10.nc"
)

PARQUET_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "gefs_east_up_daily_rain_d1_d10.parquet"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


print("\n========================================")
print("FORTRESS - EAST UP DATASET BUILDER")
print("========================================\n")


# -----------------------------------------
# 1. LOAD INDIA DATA
# -----------------------------------------

ds = xr.open_dataset(INPUT_FILE)

print("India dataset loaded:")
print(dict(ds.sizes))


# -----------------------------------------
# 2. EASTERN UP PILOT BOUNDING BOX
# -----------------------------------------
#
# Approximate pilot box only.
# Later we will replace this with an
# exact administrative boundary polygon.
#
# Latitude: 24.5N - 28.5N
# Longitude: 80E - 84.5E
#

east_up = ds.sel(
    latitude=slice(28.5, 24.5),
    longitude=slice(80.0, 84.5)
)


print("\nEastern UP pilot subset:")
print(dict(east_up.sizes))


# -----------------------------------------
# 3. SAVE NETCDF
# -----------------------------------------

east_up.to_netcdf(NETCDF_OUTPUT)

print(f"\nNetCDF saved:\n{NETCDF_OUTPUT}")


# -----------------------------------------
# 4. CONVERT TO TABLE
# -----------------------------------------

df = east_up[
    ["rain_mm"]
].to_dataframe().reset_index()


# -----------------------------------------
# 5. ADD PROJECT METADATA
# -----------------------------------------

df["region"] = "Eastern_UP_Pilot"
df["forecast_init"] = "2019-01-01 00:00:00"
df["member"] = "c00"
df["source"] = "NOAA_GEFSv12_Reforecast"


# Reorder columns

columns = [
    "forecast_init",
    "valid_time",
    "lead_day",
    "latitude",
    "longitude",
    "region",
    "member",
    "rain_mm",
    "source"
]

df = df[columns]


# -----------------------------------------
# 6. SAVE PARQUET
# -----------------------------------------

df.to_parquet(
    PARQUET_OUTPUT,
    index=False
)


print(f"\nParquet saved:\n{PARQUET_OUTPUT}")


# -----------------------------------------
# 7. BASIC VALIDATION
# -----------------------------------------

print("\n========================================")
print("DATASET VALIDATION")
print("========================================")

print("\nRows:")
print(len(df))

print("\nColumns:")
print(df.columns.tolist())

print("\nLead days:")
print(sorted(df["lead_day"].unique()))

print("\nRainfall statistics:")
print(df["rain_mm"].describe())

print("\nFirst 10 rows:")
print(df.head(10))


# -----------------------------------------
# 8. REGION-WISE DAILY SUMMARY
# -----------------------------------------

summary = (
    df.groupby(
        ["lead_day", "valid_time"]
    )["rain_mm"]
    .agg(
        mean_rain_mm="mean",
        max_rain_mm="max",
        min_rain_mm="min"
    )
    .reset_index()
)

print("\n========================================")
print("EAST UP DAILY SUMMARY")
print("========================================\n")

print(summary)