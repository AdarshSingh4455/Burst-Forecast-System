import os
import boto3

from botocore import UNSIGNED
from botocore.client import Config


BUCKET = "noaa-gefs-retrospective"
DATE = "2019010100"

MEMBERS = [
    "p01",
    "p02",
    "p03",
    "p04"
]

OUTPUT_DIR = "data/raw/gefs"

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

s3 = boto3.client(
    "s3",
    config=Config(signature_version=UNSIGNED)
)


print("\n====================================")
print("FORTRESS - ENSEMBLE DOWNLOADER")
print("====================================\n")


for member in MEMBERS:

    key = (
        f"GEFSv12/reforecast/2019/"
        f"{DATE}/"
        f"{member}/"
        f"Days:1-10/"
        f"apcp_sfc_{DATE}_{member}.grib2"
    )

    output_file = os.path.join(
        OUTPUT_DIR,
        f"apcp_sfc_{DATE}_{member}.grib2"
    )

    print(f"Downloading {member}...")

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
        f"OK -> {output_file} "
        f"({size_mb:.2f} MB)\n"
    )


print("====================================")
print("ALL ENSEMBLE MEMBERS DOWNLOADED")
print("====================================")