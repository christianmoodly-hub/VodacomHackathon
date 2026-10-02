"""API Gateway Lambda handler that returns saved SHE-SHIELD hotspots."""

import json

from backend.services.dynamodb import DynamoDBError, list_hotspots


def _response(status_code, payload):
    """Build an API Gateway proxy response with a JSON body."""
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def lambda_handler(event, context):
    """Return hotspot records written by case correlation."""
    del event, context

    try:
        hotspots = list_hotspots()
    except DynamoDBError as error:
        return _response(500, {"error": str(error)})
    except Exception:
        return _response(500, {"error": "Failed to fetch hotspots"})

    return _response(200, {"hotspots": hotspots, "count": len(hotspots)})
