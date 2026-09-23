import os
import sys
import subprocess
import glob
import pandas as pd

dates = [
    "2019010100",
    "2019060100",
    "2019061500",
    "2019070100",
    "2019071500",
    "2019073100",
    "2019080100",
    "2019081500",
    "2019083000",
    "2019090100",
    "2019091500",
    "2019093000"
]

python_exe = sys.executable

for dt in dates:
    output_file = os.path.join("data", "processed", f"fortress_features_wind_{dt}.parquet")
    if os.path.exists(output_file):
        print(f"Skipping {dt}, output file already exists.")
        continue

    print(f"Processing date: {dt}")
    cmd = [python_exe, os.path.join("scripts", "build_one_date.py"), dt]
    result = subprocess.run(cmd)
    if result.returncode != 0:
        raise RuntimeError(f"Failed processing for date {dt}")

print("All dates processed successfully!")

print("Combining into master dataset: data/processed/FORTRESS_GEFS_HISTORY.parquet")
parquet_files = sorted(glob.glob(os.path.join("data", "processed", "fortress_features_wind_*.parquet")))

dfs = []
for pf in parquet_files:
    df = pd.read_parquet(pf)
    dfs.append(df)

master_df = pd.concat(dfs, ignore_index=True)

missing_count = master_df.isnull().sum().sum()
if missing_count > 0:
    raise ValueError(f"Found {missing_count} missing values in master dataset!")

dups = master_df.duplicated(subset=["forecast_init", "valid_time", "lead_day", "latitude", "longitude"]).sum()
if dups > 0:
    raise ValueError(f"Found {dups} duplicate rows in master dataset!")

master_output = os.path.join("data", "processed", "FORTRESS_GEFS_HISTORY.parquet")
master_df.to_parquet(master_output, index=False)

print("============================================")
print("MASTER GEFS DATASET CREATED SUCCESSFULLY")
print(f"Master Output: {master_output}")
print(f"Total Combined Rows: {len(master_df)}")
print(f"Total Columns: {len(master_df.columns)}")
print(f"Unique Forecast Initialization Dates: {master_df['forecast_init'].nunique()}")
print("============================================")
