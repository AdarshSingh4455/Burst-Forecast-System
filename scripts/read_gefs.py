import cfgrib

FILE = "data/raw/gefs/apcp_sfc_2019010100_c00.grib2"

print("\n====================================")
print("FORTRESS - GEFS GRIB2 READER")
print("====================================\n")

print(f"Reading:\n{FILE}\n")

datasets = cfgrib.open_datasets(
    FILE,
    backend_kwargs={
        "indexpath": ""
    }
)

print(f"Number of datasets found: {len(datasets)}\n")

for i, ds in enumerate(datasets):

    print("=" * 60)
    print(f"DATASET {i + 1}")
    print("=" * 60)

    print(ds)

    print("\nData variables:")
    print(list(ds.data_vars))

    print("\nCoordinates:")
    print(list(ds.coords))

    print("\nDimensions:")
    print(dict(ds.sizes))

    if "latitude" in ds.coords:
        print(
            "\nLatitude range:",
            float(ds.latitude.min()),
            "to",
            float(ds.latitude.max())
        )

    if "longitude" in ds.coords:
        print(
            "Longitude range:",
            float(ds.longitude.min()),
            "to",
            float(ds.longitude.max())
        )

    if "step" in ds.coords:
        print("\nForecast steps:")
        print(ds.step.values[:20])

    print()