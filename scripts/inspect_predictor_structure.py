import os
import xarray as xr


DATE = "2019070100"

BASE_DIR = os.path.join(
    "data",
    "raw",
    "gefs",
    DATE
)

FILES = {
    "temperature_2m":
        f"tmp_2m_{DATE}_c00.grib2",

    "specific_humidity_2m":
        f"spfh_2m_{DATE}_c00.grib2",

    "mean_sea_level_pressure":
        f"pres_msl_{DATE}_c00.grib2",

    "precipitable_water":
        f"pwat_eatm_{DATE}_c00.grib2"
}


print("\n========================================")
print("FORTRESS - PREDICTOR STRUCTURE INSPECTOR")
print("========================================\n")


for label, filename in FILES.items():

    path = os.path.join(
        BASE_DIR,
        filename
    )

    print("\n========================================")
    print(label.upper())
    print("========================================")

    print(f"File: {filename}")

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

    print("\nDimensions:")
    print(dict(ds.sizes))

    print("\nVariables:")
    print(list(ds.data_vars))

    print("\nCoordinates:")
    print(list(ds.coords))

    for variable in ds.data_vars:

        print(
            f"\nVariable: {variable}"
        )

        attrs = ds[variable].attrs

        print(
            "GRIB name:",
            attrs.get(
                "GRIB_name"
            )
        )

        print(
            "GRIB short name:",
            attrs.get(
                "GRIB_shortName"
            )
        )

        print(
            "Step type:",
            attrs.get(
                "GRIB_stepType"
            )
        )

        print(
            "Units:",
            attrs.get(
                "GRIB_units"
            )
        )

        print(
            "Long name:",
            attrs.get(
                "long_name"
            )
        )

    if "step" in ds.coords:

        print(
            "\nNumber of forecast steps:",
            ds.sizes["step"]
        )

        print(
            "First 10 steps:"
        )

        print(
            ds.step.values[:10]
        )

        print(
            "Last 5 steps:"
        )

        print(
            ds.step.values[-5:]
        )

    ds.close()