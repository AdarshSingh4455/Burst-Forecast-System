import boto3

from botocore import UNSIGNED
from botocore.client import Config


BUCKET = "noaa-gefs-retrospective"

DATE = "2019070100"
YEAR = DATE[:4]
MEMBER = "c00"

FILES = [
    "ugrd_hgt",
    "vgrd_hgt"
]


s3 = boto3.client(
    "s3",
    config=Config(
        signature_version=UNSIGNED
    )
)


print("\n========================================")
print("FORTRESS - WIND INDEX INSPECTOR")
print("========================================\n")


for variable in FILES:

    filename = (
        f"{variable}_{DATE}_{MEMBER}.grib2.idx"
    )

    key = (
        f"GEFSv12/reforecast/{YEAR}/"
        f"{DATE}/"
        f"{MEMBER}/"
        f"Days:1-10/"
        f"{filename}"
    )

    print("\n----------------------------------------")
    print(variable.upper())
    print("----------------------------------------")

    response = s3.get_object(
        Bucket=BUCKET,
        Key=key
    )

    text = (
        response["Body"]
        .read()
        .decode("utf-8")
    )

    lines = text.splitlines()

    matches = [
        line
        for line in lines
        if "10 m above ground" in line.lower()
        or "10 m above ground" in line
    ]

    if matches:

        print(
            f"Found {len(matches)} "
            f"10m wind records:\n"
        )

        for line in matches[:20]:
            print(line)

    else:

        print("No 10m wind records found.")

        print("\nSample index lines:\n")

        for line in lines[:20]:
            print(line)