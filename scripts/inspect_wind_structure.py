import xarray as xr

u_file = "data/raw/gefs/2019070100/ugrd_10m_2019070100_c00.grib2"
v_file = "data/raw/gefs/2019070100/vgrd_10m_2019070100_c00.grib2"

print("Checking U wind file...")

u_ds = xr.open_dataset(
    u_file,
    engine="cfgrib",
    backend_kwargs={"indexpath": ""}
)

print(u_ds)
print("Variables:", list(u_ds.data_vars))

print("\nChecking V wind file...")

v_ds = xr.open_dataset(
    v_file,
    engine="cfgrib",
    backend_kwargs={"indexpath": ""}
)

print(v_ds)
print("Variables:", list(v_ds.data_vars))