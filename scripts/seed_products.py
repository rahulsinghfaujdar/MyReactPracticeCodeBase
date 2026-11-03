#!/usr/bin/env python3
import argparse
import json
import subprocess
import time
from decimal import Decimal
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_FILE = PROJECT_ROOT / "src/assets/json/sample_products_list.json"
DEFAULT_TABLE_NAME = "MyReactPracticeCodeBaseProducts"


def to_dynamodb_attribute(value):
    if value is None:
        return {"NULL": True}
    if isinstance(value, bool):
        return {"BOOL": value}
    if isinstance(value, (int, Decimal)):
        return {"N": str(value)}
    if isinstance(value, float):
        return {"N": str(Decimal(str(value)))}
    if isinstance(value, str):
        return {"S": value}
    if isinstance(value, list):
        return {"L": [to_dynamodb_attribute(item) for item in value]}
    if isinstance(value, dict):
        return {"M": {key: to_dynamodb_attribute(item) for key, item in value.items()}}
    raise TypeError(f"Unsupported JSON value type: {type(value).__name__}")


def write_batch(table_name, region, requests):
    remaining = requests
    for attempt in range(6):
        result = subprocess.run(
            [
                "aws",
                "dynamodb",
                "batch-write-item",
                "--region",
                region,
                "--request-items",
                json.dumps({table_name: remaining}, separators=(",", ":")),
                "--output",
                "json",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        unprocessed = json.loads(result.stdout).get("UnprocessedItems", {}).get(table_name, [])
        if not unprocessed:
            return
        remaining = unprocessed
        time.sleep(2**attempt)
    raise RuntimeError(f"DynamoDB did not process {len(remaining)} product writes.")


def main():
    parser = argparse.ArgumentParser(description="Load sample products into DynamoDB.")
    parser.add_argument("--region", default="ap-south-1")
    parser.add_argument("--table", default=DEFAULT_TABLE_NAME)
    parser.add_argument("--file", type=Path, default=DEFAULT_DATA_FILE)
    args = parser.parse_args()

    data = json.loads(args.file.read_text(encoding="utf-8"), parse_float=Decimal)
    products = data.get("products") if isinstance(data, dict) else None
    if not isinstance(products, list) or not products:
        raise ValueError(f"{args.file} must contain a non-empty products array.")

    ids = [str(product.get("id")) for product in products if isinstance(product, dict)]
    if len(ids) != len(products) or len(set(ids)) != len(ids):
        raise ValueError("Every product must be an object with a unique id.")

    for start in range(0, len(products), 25):
        batch = products[start : start + 25]
        requests = [
            {"PutRequest": {"Item": {key: to_dynamodb_attribute(value) for key, value in product.items()}}}
            for product in batch
        ]
        write_batch(args.table, args.region, requests)

    print(f"Loaded {len(products)} products into {args.table} in {args.region}.")


if __name__ == "__main__":
    main()
