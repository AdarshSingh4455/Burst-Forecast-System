import boto3
from botocore import UNSIGNED
from botocore.client import Config


BUCKET = "noaa-gefs-retrospective"

DATE = "2019070100"

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


print("\n========================================")
print("FORTRESS - MONSOON SAMPLE CHECK")
print("========================================\n")


for member in MEMBERS:

    key = (
        f"GEFSv12/reforecast/2019/"
        f"{DATE}/"
        f"{member}/"
        f"Days:1-10/"
        f"apcp_sfc_{DATE}_{member}.grib2"
    )

    try:

        response = s3.head_object(
            Bucket=BUCKET,
            Key=key
        )

        size_mb = (
            response["ContentLength"]
            / (1024 * 1024)
        )

        print(
            f"{member}: FOUND "
            f"({size_mb:.2f} MB)"
        )

    except Exception:

        print(
            f"{member}: NOT FOUND"
        )