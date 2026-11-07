import json
import os
import boto3

table = boto3.resource("dynamodb").Table(os.environ["PRODUCTS_TABLE_NAME"])
response_headers = {
    "content-type": "application/json",
    "cache-control": "no-store",
}

def handler(event, context):
    try:
        products = []
        result = table.scan()
        while True:
            for item in result.get("Items", []):
                products.append({
                    "id": int(item["id"]),
                    "title": item["title"],
                    "description": item["description"],
                    "availabilityStatus": item.get("availabilityStatus", ""),
                    "thumbnail": item["thumbnail"],
                })
            if "LastEvaluatedKey" not in result:
                break
            result = table.scan(ExclusiveStartKey=result["LastEvaluatedKey"])

        products.sort(key=lambda product: product["id"])
        return {
            "statusCode": 200,
            "headers": response_headers,
            "body": json.dumps({"products": products}),
        }
    except Exception:
        print("Failed to load products from DynamoDB")
        raise
