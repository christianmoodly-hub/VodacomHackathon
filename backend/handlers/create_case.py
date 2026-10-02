"""API Gateway Lambda handler for reporting a new SHE-SHIELD case."""

import json
import time
import uuid

from backend.services.dynamodb import DynamoDBError, create_case_record


def _response(status_code, payload):
    """Build an API Gateway proxy response with a JSON body."""
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def _parse_body(event):
    """Read the JSON body from an API Gateway event."""
    if not isinstance(event, dict):
        raise ValueError("Request event must be an object")

    body = event.get("body")
    if body is None or body == "":
        raise ValueError("Request body is required")

    if isinstance(body, str):
        try:
            body = json.loads(body)
        except json.JSONDecodeError as error:
            raise ValueError("Request body must be valid JSON") from error

    if not isinstance(body, dict):
        raise ValueError("Request body must be a JSON object")

    return body


def _case_fields(body):
    """Validate the fields a reporter must send."""
    description = body.get("description")
    if not isinstance(description, str) or not description.strip():
        raise ValueError("description is required and must be a string")

    severity = body.get("severity")
    if not isinstance(severity, str) or not severity.strip():
        raise ValueError("severity is required and must be a string")

    coordinates = body.get("coordinates")
    if not isinstance(coordinates, dict):
        raise ValueError("coordinates must include latitude and longitude")

    try:
        latitude = float(coordinates["latitude"])
        longitude = float(coordinates["longitude"])
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError(
            "coordinates must include numeric latitude and longitude"
        ) from error

    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError("coordinates are outside the valid latitude/longitude range")

    return {
        "description": description.strip(),
        "severity": severity.strip(),
        "coordinates": {"latitude": latitude, "longitude": longitude},
    }


def lambda_handler(event, context):
    """Create a missing-person or emergency case and return it."""
    try:
        fields = _case_fields(_parse_body(event))
    except ValueError as error:
        return _response(400, {"error": str(error)})

    case_data = {
        "case_id": str(uuid.uuid4()),
        "timestamp": int(time.time() * 1000),
        "status": "OPEN",
        **fields,
    }

    try:
        created = create_case_record(case_data)
    except DynamoDBError as error:
        return _response(500, {"error": str(error)})
    except Exception:
        return _response(500, {"error": "Failed to create case"})

    return _response(201, created)
