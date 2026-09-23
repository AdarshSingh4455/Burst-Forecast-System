import boto3
from botocore import UNSIGNED
from botocore.client import Config

BUCKET = "noaa-gefs-retrospective"

PREFIX = (
    "GEFSv12/reforecast/2019/"
    "2019010100/"
    "c00/"
    "Days:1-10/"
)

s3 = boto3.client(
    "s3",
    config=Config(signature_version=UNSIGNED)
)

print("\nFORTRESS - DAYS 1-10 FILE INSPECTOR")
print("Forecast: 2019-01-01 00 UTC")
print("Member: c00")
print("Range: D1-D10\n")

response = s3.list_objects_v2(
    Bucket=BUCKET,
    Prefix=PREFIX,
    MaxKeys=100
)

files = response.get("Contents", [])

print(f"Found {len(files)} objects in first response:\n")

for item in files:
    size_mb = item["Size"] / (1024 * 1024)

    print(
        f"{item['Key']} | "
        f"{size_mb:.2f} MB"
    )