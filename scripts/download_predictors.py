import os
import boto3

from botocore import UNSIGNED
from botocore.client import Config


DATE = "2019070100"
YEAR = DATE[:4]
MEMBER = "c00"

BUCKET = "noaa-gefs-retrospective"

VARIABLES = [
    "tmp_2m",
    "spfh_2m",
    "pres_msl",
    "pwat_eatm"
]

OUTPUT_DIR = os.path.join(
    "data",
    "raw",
    "gefs",
    DATE
)

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


s3 = boto3.client(
    "s3",
    config=Config(
        signature_version=UNSIGNED
    )
)


print("\n========================================")
print("FORTRESS - PREDICTOR DOWNLOADER")
print("========================================")
print(f"Forecast date: {DATE}")
print(f"Member: {MEMBER}\n")


for variable in VARIABLES:

    filename = (
        f"{variable}_{DATE}_{MEMBER}.grib2"
    )

    key = (
        f"GEFSv12/reforecast/{YEAR}/"
        f"{DATE}/"
        f"{MEMBER}/"
        f"Days:1-10/"
        f"{filename}"
    )

    output_file = os.path.join(
        OUTPUT_DIR,
        filename
    )

    if os.path.exists(output_file):

        print(
            f"{variable}: already downloaded"
        )

        continue

    print(
        f"{variable}: downloading..."
    )

    s3.download_file(
        BUCKET,
        key,
        output_file
    )

    size_mb = (
        os.path.getsize(output_file)
        / (1024 * 1024)
    )

    print(
        f"{variable}: complete "
        f"({size_mb:.2f} MB)\n"
    )


print("========================================")
print("ALL CORE PREDICTORS DOWNLOADED")
print("========================================")