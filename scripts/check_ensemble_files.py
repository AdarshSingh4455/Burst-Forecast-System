import boto3
from botocore import UNSIGNED
from botocore.client import Config

BUCKET = "noaa-gefs-retrospective"
DATE = "2019010100"

MEMBERS = [
    "c00",
    "p01",
    "p02",
    "p03",
    "p04"
]

s3 = boto3.client(
    "s3",
    config=Config(signature_version=UNSIGNED)
)

print("\nFORTRESS - ENSEMBLE FILE CHECKER\n")

for member in MEMBERS:

    prefix = (
        f"GEFSv12/reforecast/2019/"
        f"{DATE}/"
        f"{member}/"
        f"Days:1-10/"
    )

    response = s3.list_objects_v2(
        Bucket=BUCKET,
        Prefix=prefix,
        MaxKeys=200
    )

    files = response.get("Contents", [])

    apcp_files = [
        item["Key"]
        for item in files
        if "apcp_sfc" in item["Key"]
        and item["Key"].endswith(".grib2")
    ]

    print(f"{member}:")

    if apcp_files:
        for file in apcp_files:
            print("   ", file)
    else:
        print("    APCP FILE NOT FOUND")

    print()