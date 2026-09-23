import os
import numpy as np
import xarray as xr


INPUT_FILE = "data/raw/gefs/apcp_sfc_2019010100_c00.grib2"

OUTPUT_DIR = "data/interim"

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "gefs_india_daily_rain_d1_d10.nc"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


print("\n========================================")
print("FORTRESS - DAILY RAINFALL PREPROCESSOR")
print("========================================\n")


# --------------------------------------------------
# 1. READ RAW GEFS GRIB2
# --------------------------------------------------

ds = xr.open_dataset(
    INPUT_FILE,
    engine="cfgrib",
    backend_kwargs={
        "indexpath": ""
    }
)

print("Raw dataset loaded.")
print(dict(ds.sizes))


# --------------------------------------------------
# 2. INDIA SUBSET
# --------------------------------------------------

india = ds.sel(
    latitude=slice(38, 6),
    longitude=slice(68, 98)
)

print("\nIndia subset:")
print(dict(india.sizes))


# --------------------------------------------------
# 3. CREATE CORRECT DAILY RAINFALL
# --------------------------------------------------

daily_rain = []

for day in range(1, 11):

    start_hour = (day - 1) * 24

    # Use only 6-hour accumulation endpoints
    hours = [
        start_hour + 6,
        start_hour + 12,
        start_hour + 18,
        start_hour + 24
    ]

    steps = [
        np.timedelta64(hour, "h")
        for hour in hours
    ]

    print(
        f"D{day}: using forecast hours {hours}"
    )

    six_hour_blocks = india["tp"].sel(
        step=steps
    )

    # Sum four non-overlapping 6-hour blocks
    rain_24h = six_hour_blocks.sum(
        dim="step"
    )

    rain_24h = rain_24h.expand_dims(
        lead_day=[day]
    )

    daily_rain.append(rain_24h)


# --------------------------------------------------
# 4. COMBINE D1-D10
# --------------------------------------------------

rain = xr.concat(
    daily_rain,
    dim="lead_day"
)


# kg m^-2 precipitation is numerically equivalent
# to mm liquid-water precipitation.

rain.name = "rain_mm"

rain.attrs = {
    "long_name": "24-hour accumulated precipitation",
    "units": "mm",
    "source": "NOAA GEFSv12 Reforecast",
    "member": "c00",
    "forecast_init": "2019-01-01 00 UTC",
    "processing":
        "Sum of four non-overlapping 6-hour precipitation accumulations"
}


# --------------------------------------------------
# 5. ADD VALID DATE
# --------------------------------------------------

initial_time = np.datetime64(
    ds["time"].values
)

valid_times = [
    initial_time + np.timedelta64(day, "D")
    for day in range(1, 11)
]

rain = rain.assign_coords(
    valid_time=(
        "lead_day",
        valid_times
    )
)


# --------------------------------------------------
# 6. CREATE DATASET
# --------------------------------------------------

output_ds = rain.to_dataset()


# --------------------------------------------------
# 7. SAVE
# --------------------------------------------------

output_ds.to_netcdf(
    OUTPUT_FILE
)


print("\n========================================")
print("DAILY RAINFALL READY")
print("========================================")

print(f"\nSaved:\n{OUTPUT_FILE}")

print("\nDimensions:")
print(dict(output_ds.sizes))

print("\nLead days:")
print(output_ds.lead_day.values)

print("\nValid times:")
print(output_ds.valid_time.values)

print(
    "\nRainfall range:",
    float(output_ds.rain_mm.min()),
    "to",
    float(output_ds.rain_mm.max()),
    "mm"
)