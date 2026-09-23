import os
import boto3

from botocore import UNSIGNED
from botocore.client import Config


BUCKET = "noaa-gefs-retrospective"

KEY = (
    "GEFSv12/reforecast/2019/"
    "2019010100/"
    "c00/"
    "Days:1-10/"
    "apcp_sfc_2019010100_c00.grib2"
)

OUTPUT_DIR = "data/raw/gefs"

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "apcp_sfc_2019010100_c00.grib2"
)


os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


s3 = boto3.client(
    "s3",
    config=Config(signature_version=UNSIGNED)
)


print("\nFORTRESS - GEFS DOWNLOADER")
print("--------------------------")
print(f"Downloading:\n{KEY}\n")


s3.download_file(
    BUCKET,
    KEY,
    OUTPUT_FILE
)


size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)

print("Download complete!")
print(f"Saved to: {OUTPUT_FILE}")
print(f"Size: {size_mb:.2f} MB")