import os
import numpy as np
import pandas as pd
import xarray as xr


# ============================================================
# CONFIG
# ============================================================

DATE = "2019070100"

RAW_DIR = os.path.join(
    "data",
    "raw",
    "gefs",
    DATE
)

PROCESSED_DIR = os.path.join(
    "data",
    "processed"
)

RAIN_FILE = os.path.join(
    PROCESSED_DIR,
    f"gefs_east_up_ensemble_{DATE}.parquet"
)

OUTPUT_FILE = os.path.join(
    PROCESSED_DIR,
    f"fortress_features_{DATE}.parquet"
)


# ============================================================
# BASIC CHECK
# ============================================================

if not os.path.exists(RAIN_FILE):
    raise FileNotFoundError(
        f"Rainfall ensemble dataset not found:\n{RAIN_FILE}"
    )


print("\n============================================")
print("FORTRESS - FEATURE TABLE BUILDER")
print("============================================")
print(f"Forecast date: {DATE}\n")


# ============================================================
# LOAD RAINFALL ENSEMBLE FEATURES
# ============================================================

rain_df = pd.read_parquet(
    RAIN_FILE
)

print(
    f"Rainfall dataset loaded: "
    f"{len(rain_df)} rows"
)


# ============================================================
# FUNCTION: READ ONE PREDICTOR
# ============================================================

def build_daily_predictor(
    filename,
    variable_name,
    output_prefix,
    conversion
):

    path = os.path.join(
        RAW_DIR,
        filename
    )

    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Missing predictor file:\n{path}"
        )

    print(
        f"\nProcessing {output_prefix}..."
    )

    ds = xr.open_dataset(
        path,
        engine="cfgrib",
        backend_kwargs={
            "indexpath": "",
            "filter_by_keys": {
                "dataType": "cf"
            }
        }
    )

    if variable_name not in ds.data_vars:
        raise ValueError(
            f"{variable_name} not found in {filename}"
        )

    # --------------------------------------------------------
    # Eastern UP pilot
    # --------------------------------------------------------

    region = ds.sel(
        latitude=slice(
            28.5,
            24.5
        ),
        longitude=slice(
            80.0,
            84.5
        )
    )

    daily_frames = []

    forecast_init = np.datetime64(
        "2019-07-01T00:00:00"
    )

    # --------------------------------------------------------
    # D1-D10
    # --------------------------------------------------------

    for day in range(
        1,
        11
    ):

        start_hour = (
            day - 1
        ) * 24

        # 8 x three-hourly instantaneous states
        hours = list(
            range(
                start_hour + 3,
                start_hour + 25,
                3
            )
        )

        steps = [
            np.timedelta64(
                hour,
                "h"
            )
            for hour in hours
        ]

        data = region[
            variable_name
        ].sel(
            step=steps
        )

        # Unit conversion
        data = conversion(
            data
        )

        # --------------------------------------------
        # Daily statistics
        # --------------------------------------------

        daily_mean = data.mean(
            dim="step"
        )

        daily_std = data.std(
            dim="step"
        )

        daily_min = data.min(
            dim="step"
        )

        daily_max = data.max(
            dim="step"
        )

        valid_time = (
            forecast_init
            + np.timedelta64(
                day,
                "D"
            )
        )

        temp_ds = xr.Dataset(
            {
                f"{output_prefix}_mean":
                    daily_mean,

                f"{output_prefix}_std":
                    daily_std,

                f"{output_prefix}_min":
                    daily_min,

                f"{output_prefix}_max":
                    daily_max
            }
        )

        temp_df = (
            temp_ds
            .to_dataframe()
            .reset_index()
        )

        temp_df[
            "lead_day"
        ] = day

        temp_df[
            "valid_time"
        ] = pd.Timestamp(
            valid_time
        )

        # Keep only required columns
        temp_df = temp_df[
            [
                "lead_day",
                "valid_time",
                "latitude",
                "longitude",

                f"{output_prefix}_mean",
                f"{output_prefix}_std",
                f"{output_prefix}_min",
                f"{output_prefix}_max"
            ]
        ]

        daily_frames.append(
            temp_df
        )

    ds.close()

    result = pd.concat(
        daily_frames,
        ignore_index=True
    )

    print(
        f"{output_prefix}: "
        f"{len(result)} rows"
    )

    return result


# ============================================================
# UNIT CONVERSIONS
# ============================================================

def kelvin_to_celsius(data):
    return data - 273.15


def kgkg_to_gkg(data):
    return data * 1000.0


def pa_to_hpa(data):
    return data / 100.0


def pwat_to_mm(data):
    # 1 kg/m² liquid water ≈ 1 mm
    return data


# ============================================================
# BUILD TEMPERATURE
# ============================================================

temp_df = build_daily_predictor(

    filename=
        f"tmp_2m_{DATE}_c00.grib2",

    variable_name=
        "t2m",

    output_prefix=
        "temp_2m_c",

    conversion=
        kelvin_to_celsius
)


# ============================================================
# BUILD SPECIFIC HUMIDITY
# ============================================================

humidity_df = build_daily_predictor(

    filename=
        f"spfh_2m_{DATE}_c00.grib2",

    variable_name=
        "sh2",

    output_prefix=
        "specific_humidity_gkg",

    conversion=
        kgkg_to_gkg
)


# ============================================================
# BUILD MSL PRESSURE
# ============================================================

pressure_df = build_daily_predictor(

    filename=
        f"pres_msl_{DATE}_c00.grib2",

    variable_name=
        "msl",

    output_prefix=
        "mslp_hpa",

    conversion=
        pa_to_hpa
)


# ============================================================
# BUILD PRECIPITABLE WATER
# ============================================================

pwat_df = build_daily_predictor(

    filename=
        f"pwat_eatm_{DATE}_c00.grib2",

    variable_name=
        "pwat",

    output_prefix=
        "pwat_mm",

    conversion=
        pwat_to_mm
)


# ============================================================
# MERGE ALL FEATURES
# ============================================================

merge_keys = [
    "lead_day",
    "valid_time",
    "latitude",
    "longitude"
]


df = rain_df.merge(
    temp_df,
    on=merge_keys,
    how="left"
)


df = df.merge(
    humidity_df,
    on=merge_keys,
    how="left"
)


df = df.merge(
    pressure_df,
    on=merge_keys,
    how="left"
)


df = df.merge(
    pwat_df,
    on=merge_keys,
    how="left"
)


# ============================================================
# VALIDATION
# ============================================================

print("\n============================================")
print("FINAL FEATURE TABLE")
print("============================================")


print(
    f"\nRows: {len(df)}"
)

print(
    f"Columns: {len(df.columns)}"
)


missing = (
    df.isnull()
    .sum()
)

missing = missing[
    missing > 0
]


if len(missing) == 0:

    print(
        "\nNo missing values detected."
    )

else:

    print(
        "\nMissing values:"
    )

    print(
        missing
    )


# ============================================================
# SAVE
# ============================================================

df.to_parquet(
    OUTPUT_FILE,
    index=False
)


print(
    f"\nSaved:\n{OUTPUT_FILE}"
)


# ============================================================
# SUMMARY
# ============================================================

print("\nTemperature mean (C):")

print(
    df[
        "temp_2m_c_mean"
    ].describe()
)


print("\nSpecific humidity mean (g/kg):")

print(
    df[
        "specific_humidity_gkg_mean"
    ].describe()
)


print("\nMSLP mean (hPa):")

print(
    df[
        "mslp_hpa_mean"
    ].describe()
)


print("\nPWAT mean (mm):")

print(
    df[
        "pwat_mm_mean"
    ].describe()
)


print("\nRain ensemble spread (mm):")

print(
    df[
        "ensemble_spread_mm"
    ].describe()
)


print("\nFinal columns:")

print(
    df.columns.tolist()
)


print("\n============================================")
print("FORTRESS FEATURE TABLE READY")
print("============================================\n")