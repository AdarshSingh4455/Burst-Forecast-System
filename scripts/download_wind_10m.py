import os
import boto3

from botocore import UNSIGNED
from botocore.client import Config


# ============================================================
# CONFIG
# ============================================================

DATE = "2019070100"
YEAR = DATE[:4]
MEMBER = "c00"

BUCKET = "noaa-gefs-retrospective"

VARIABLES = {
    "ugrd_hgt": "UGRD",
    "vgrd_hgt": "VGRD"
}

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
print("FORTRESS - 10M WIND RANGE DOWNLOADER")
print("========================================")
print(f"Forecast date: {DATE}")
print(f"Member: {MEMBER}\n")


# ============================================================
# PROCESS U AND V WIND
# ============================================================

for file_prefix, grib_variable in VARIABLES.items():

    grib_filename = (
        f"{file_prefix}_{DATE}_{MEMBER}.grib2"
    )

    idx_filename = (
        f"{grib_filename}.idx"
    )

    grib_key = (
        f"GEFSv12/reforecast/{YEAR}/"
        f"{DATE}/"
        f"{MEMBER}/"
        f"Days:1-10/"
        f"{grib_filename}"
    )

    idx_key = (
        f"GEFSv12/reforecast/{YEAR}/"
        f"{DATE}/"
        f"{MEMBER}/"
        f"Days:1-10/"
        f"{idx_filename}"
    )

    output_file = os.path.join(
        OUTPUT_DIR,
        f"{grib_variable.lower()}_10m_{DATE}_{MEMBER}.grib2"
    )

    print("----------------------------------------")
    print(f"Processing {grib_variable} 10m")
    print("----------------------------------------")

    # --------------------------------------------------------
    # Download index
    # --------------------------------------------------------

    response = s3.get_object(
        Bucket=BUCKET,
        Key=idx_key
    )

    index_text = (
        response["Body"]
        .read()
        .decode("utf-8")
    )

    lines = [
        line.strip()
        for line in index_text.splitlines()
        if line.strip()
    ]

    # --------------------------------------------------------
    # Parse every GRIB message offset
    # --------------------------------------------------------

    records = []

    for line in lines:

        parts = line.split(":")

        message_number = int(
            parts[0]
        )

        byte_offset = int(
            parts[1]
        )

        records.append(
            {
                "message_number": message_number,
                "offset": byte_offset,
                "line": line
            }
        )

    # --------------------------------------------------------
    # Get original GRIB file size
    # --------------------------------------------------------

    metadata = s3.head_object(
        Bucket=BUCKET,
        Key=grib_key
    )

    file_size = metadata[
        "ContentLength"
    ]

    # --------------------------------------------------------
    # Locate only 10m records
    # --------------------------------------------------------

    selected = []

    search_text = (
        f"{grib_variable}:10 m above ground"
    )

    for i, record in enumerate(records):

        if search_text not in record["line"]:
            continue

        start_byte = record[
            "offset"
        ]

        # End byte = start of next GRIB message - 1
        if i + 1 < len(records):

            end_byte = (
                records[i + 1]["offset"]
                - 1
            )

        else:

            end_byte = (
                file_size - 1
            )

        selected.append(
            {
                "start": start_byte,
                "end": end_byte,
                "line": record["line"]
            }
        )

    print(
        f"10m records found: {len(selected)}"
    )

    if len(selected) != 80:

        print(
            "WARNING: Expected 80 records."
        )

    # --------------------------------------------------------
    # Download only selected byte ranges
    # --------------------------------------------------------

    with open(
        output_file,
        "wb"
    ) as output:

        for count, record in enumerate(
            selected,
            start=1
        ):

            byte_range = (
                f"bytes="
                f"{record['start']}-"
                f"{record['end']}"
            )

            response = s3.get_object(
                Bucket=BUCKET,
                Key=grib_key,
                Range=byte_range
            )

            chunk = response[
                "Body"
            ].read()

            output.write(
                chunk
            )

            if (
                count == 1
                or count % 10 == 0
                or count == len(selected)
            ):

                print(
                    f"{grib_variable}: "
                    f"{count}/{len(selected)} records"
                )

    size_mb = (
        os.path.getsize(output_file)
        / (1024 * 1024)
    )

    print(
        f"\nSaved:\n{output_file}"
    )

    print(
        f"Downloaded size: "
        f"{size_mb:.2f} MB\n"
    )


print("========================================")
print("10M WIND DOWNLOAD COMPLETE")
print("========================================")