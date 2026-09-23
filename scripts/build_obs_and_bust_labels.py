import os
import urllib.request
import json
import numpy as np
import pandas as pd

history_file = os.path.join("data", "processed", "FORTRESS_GEFS_HISTORY.parquet")
output_file = os.path.join("data", "processed", "FORTRESS_BUST_INDIA.parquet")

if not os.path.exists(history_file):
    raise FileNotFoundError(f"Master feature file not found: {history_file}")

print("Loading master GEFS history dataset...")
df = pd.read_parquet(history_file)
print(f"Loaded {len(df)} rows.")

coords_df = df[["latitude", "longitude"]].drop_duplicates().reset_index(drop=True)

df["valid_date_str"] = pd.to_datetime(df["valid_time"]).dt.strftime("%Y-%m-%d")
start_date = df["valid_date_str"].min()
end_date = df["valid_date_str"].max()

print(f"Batch fetching reference rainfall from {start_date} to {end_date} for {len(coords_df)} grid points...")

batch_size = 50
obs_records = []

for i in range(0, len(coords_df), batch_size):
    chunk = coords_df.iloc[i:i+batch_size]
    lats = ",".join(chunk["latitude"].astype(str))
    lons = ",".join(chunk["longitude"].astype(str))
    url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lats}&longitude={lons}&start_date={start_date}&end_date={end_date}&daily=precipitation_sum&timezone=UTC"
    
    req = urllib.request.urlopen(url)
    res = json.loads(req.read().decode("utf-8"))
    
    if not isinstance(res, list):
        res = [res]
        
    for coord_row, item in zip(chunk.to_dict("records"), res):
        lat = coord_row["latitude"]
        lon = coord_row["longitude"]
        dates = item["daily"]["time"]
        precip = item["daily"]["precipitation_sum"]
        for d, p in zip(dates, precip):
            obs_records.append({
                "latitude": lat,
                "longitude": lon,
                "valid_date_str": d,
                "observed_rain_mm": p if p is not None else 0.0
            })

obs_df = pd.DataFrame(obs_records)
print(f"Downloaded {len(obs_df)} observational rainfall records.")

df = df.merge(obs_df, on=["latitude", "longitude", "valid_date_str"], how="left")
df = df.drop(columns=["valid_date_str"])

df["rain_error_mm"] = (df["ensemble_mean_mm"] - df["observed_rain_mm"]).abs()

threshold_by_lead = df.groupby("lead_day")["rain_error_mm"].quantile(0.95).to_dict()
df["bust_threshold"] = df["lead_day"].map(threshold_by_lead)

df["bust_label"] = (df["rain_error_mm"] > df["bust_threshold"]).astype(int)

df["error_percentile"] = df.groupby("lead_day")["rain_error_mm"].rank(pct=True) * 100.0

missing_count = df.isnull().sum().sum()
if missing_count > 0:
    raise ValueError(f"Found {missing_count} missing values in target dataset!")

df.to_parquet(output_file, index=False)

print("============================================")
print("PHASE 2 - BUST DATASET GENERATED SUCCESSFULLY")
print(f"Output File: {output_file}")
print(f"Total Rows: {len(df)}")
print(f"Total Columns: {len(df.columns)}")
print(f"Total Bust Labels (1s): {df['bust_label'].sum()}")
print(f"Total Non-Bust Labels (0s): {(df['bust_label'] == 0).sum()}")
print("============================================")
