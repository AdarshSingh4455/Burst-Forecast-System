import numpy as np
import pandas as pd
import xarray as xr


date = "2019070100"

u_file = f"data/raw/gefs/{date}/ugrd_10m_{date}_c00.grib2"
v_file = f"data/raw/gefs/{date}/vgrd_10m_{date}_c00.grib2"

feature_file = f"data/processed/fortress_features_{date}.parquet"

output_file = f"data/processed/fortress_features_wind_{date}.parquet"


print("Reading wind files...")

u_ds = xr.open_dataset(
    u_file,
    engine="cfgrib",
    backend_kwargs={"indexpath": ""}
)

v_ds = xr.open_dataset(
    v_file,
    engine="cfgrib",
    backend_kwargs={"indexpath": ""}
)


# Eastern UP area
u = u_ds["u10"].sel(
    latitude=slice(28.5, 24.5),
    longitude=slice(80.0, 84.5)
)

v = v_ds["v10"].sel(
    latitude=slice(28.5, 24.5),
    longitude=slice(80.0, 84.5)
)


print("Eastern UP wind data selected.")


all_days = []

forecast_date = np.datetime64("2019-07-01T00:00:00")


for day in range(1, 11):

    start_hour = (day - 1) * 24

    hours = list(
        range(
            start_hour + 3,
            start_hour + 25,
            3
        )
    )

    steps = [
        np.timedelta64(hour, "h")
        for hour in hours
    ]

    # select 8 values for one day
    u_day = u.sel(step=steps)
    v_day = v.sel(step=steps)

    # wind speed = sqrt(u^2 + v^2)
    speed = np.sqrt(
        (u_day ** 2) +
        (v_day ** 2)
    )

    # daily values
    u_mean = u_day.mean(dim="step")
    v_mean = v_day.mean(dim="step")

    speed_mean = speed.mean(dim="step")
    speed_std = speed.std(dim="step")
    speed_min = speed.min(dim="step")
    speed_max = speed.max(dim="step")


    wind_ds = xr.Dataset({
        "u10_mean_ms": u_mean,
        "v10_mean_ms": v_mean,
        "wind_speed_mean_ms": speed_mean,
        "wind_speed_std_ms": speed_std,
        "wind_speed_min_ms": speed_min,
        "wind_speed_max_ms": speed_max
    })


    wind_df = wind_ds.to_dataframe().reset_index()

    wind_df["lead_day"] = day

    wind_df["valid_time"] = pd.Timestamp(
        forecast_date +
        np.timedelta64(day, "D")
    )


    wind_df = wind_df[
        [
            "lead_day",
            "valid_time",
            "latitude",
            "longitude",
            "u10_mean_ms",
            "v10_mean_ms",
            "wind_speed_mean_ms",
            "wind_speed_std_ms",
            "wind_speed_min_ms",
            "wind_speed_max_ms"
        ]
    ]

    all_days.append(wind_df)

    print(f"D{day} complete")


# combine D1-D10
wind_df = pd.concat(
    all_days,
    ignore_index=True
)


print("\nWind rows:", len(wind_df))


# read existing feature table
df = pd.read_parquet(
    feature_file
)

print("Old feature rows:", len(df))
print("Old columns:", len(df.columns))


# merge wind
df = df.merge(
    wind_df,
    on=[
        "lead_day",
        "valid_time",
        "latitude",
        "longitude"
    ],
    how="left"
)


print("\nNew rows:", len(df))
print("New columns:", len(df.columns))


# check missing values
missing = df.isnull().sum()
missing = missing[missing > 0]

if len(missing) == 0:
    print("No missing values.")
else:
    print("Missing values:")
    print(missing)


# save
df.to_parquet(
    output_file,
    index=False
)


print("\nSaved:")
print(output_file)


print("\nWind speed statistics:")

print(
    df["wind_speed_mean_ms"].describe()
)


print("\nMaximum wind speed:")

print(
    df["wind_speed_max_ms"].max()
)


print("\nFinal columns:")

print(
    df.columns.tolist()
)


u_ds.close()
v_ds.close()


print("\nFORTRESS WIND FEATURES READY")