import boto3

from botocore import UNSIGNED
from botocore.client import Config


BUCKET = "noaa-gefs-retrospective"

DATE = "2019070100"
MEMBER = "c00"

PREFIX = (
    f"GEFSv12/reforecast/2019/"
    f"{DATE}/"
    f"{MEMBER}/"
    f"Days:1-10/"
)

KEYWORDS = [
    "tmp",
    "spfh",
    "rh",
    "pres",
    "ugrd",
    "vgrd",
    "pwat",
    "hgt"
]


s3 = boto3.client(
    "s3",
    config=Config(
        signature_version=UNSIGNED
    )
)


print("\n============================================")
print("FORTRESS - WEATHER VARIABLE INSPECTOR")
print("============================================\n")


paginator = s3.get_paginator(
    "list_objects_v2"
)


found = []


for page in paginator.paginate(
    Bucket=BUCKET,
    Prefix=PREFIX
):

    for item in page.get(
        "Contents",
        []
    ):

        key = item["Key"]

        if not key.endswith(
            ".grib2"
        ):
            continue

        filename = key.split("/")[-1]

        if any(
            keyword in filename
            for keyword in KEYWORDS
        ):

            size_mb = (
                item["Size"]
                / (1024 * 1024)
            )

            found.append(
                (
                    filename,
                    size_mb
                )
            )


for filename, size_mb in found:

    print(
        f"{filename:<50} "
        f"{size_mb:>8.2f} MB"
    )


print(
    f"\nTotal matching files: "
    f"{len(found)}"
)