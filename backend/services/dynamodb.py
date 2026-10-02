"""Amazon DynamoDB access for SHE-SHIELD case and hotspot records.

Table names and region come from the environment so the same module can run
in any account:

- CASES_TABLE_NAME
- HOTSPOTS_TABLE_NAME
- AWS_REGION
"""

import os
import time
from decimal import Decimal

import boto3
from botocore.exceptions import BotoCoreError, ClientError


# Open and in-progress cases are the ones hotspot analysis should see.
ACTIVE_STATUSES = ("open", "investigating")

# Cap how many active cases we return. A full-table scan stays bounded in Lambda.
RECENT_CASES_LIMIT = 100

CASES_TABLE_ENV = "CASES_TABLE_NAME"
HOTSPOTS_TABLE_ENV = "HOTSPOTS_TABLE_NAME"
REGION_ENV = "AWS_REGION"

# Attributes a hotspot update is allowed to write. Unexpected keys are ignored.
HOTSPOT_FIELDS = ("radius", "risk_level", "active_case_count")


class DynamoDBError(Exception):
    """Raised when a DynamoDB call fails or the payload is incomplete."""


def _required_env(name):
    """Return an environment variable or fail with a clear configuration error."""
    value = os.environ.get(name)
    if not value:
        raise DynamoDBError(f"Missing required environment variable: {name}")
    return value


def _to_decimal(value):
    """Convert a number to Decimal. DynamoDB rejects Python floats."""
    if isinstance(value, Decimal):
        return value
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        raise DynamoDBError(f"Expected a number, got {type(value).__name__}")
    return Decimal(str(value))


def _from_decimal(value):
    """Turn DynamoDB Decimals into plain ints and floats for JSON responses."""
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, dict):
        return {key: _from_decimal(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_from_decimal(item) for item in value]
    return value


class DynamoDBService:
    """Thin wrapper around the Cases and Hotspots tables."""

    def __init__(self):
        self.region = _required_env(REGION_ENV)
        self.cases_table_name = _required_env(CASES_TABLE_ENV)
        self.hotspots_table_name = _required_env(HOTSPOTS_TABLE_ENV)

        resource = boto3.resource("dynamodb", region_name=self.region)
        self.cases_table = resource.Table(self.cases_table_name)
        self.hotspots_table = resource.Table(self.hotspots_table_name)

    def create_case_record(self, case_data):
        """Insert one case item into the Cases table.

        Required: case_id, description, severity, and coordinates with
        latitude and longitude. timestamp defaults to the current time in
        milliseconds. status defaults to "open".
        """
        if not isinstance(case_data, dict):
            raise DynamoDBError("case_data must be an object")

        case_id = case_data.get("case_id")
        if not isinstance(case_id, str) or not case_id.strip():
            raise DynamoDBError("case_id is required and must be a string")

        coordinates = case_data.get("coordinates")
        if not isinstance(coordinates, dict):
            raise DynamoDBError("coordinates must include latitude and longitude")

        try:
            item = {
                "case_id": case_id.strip(),
                "timestamp": _to_decimal(
                    case_data.get("timestamp", int(time.time() * 1000))
                ),
                "status": case_data.get("status") or "open",
                "description": case_data.get("description") or "",
                "severity": case_data.get("severity") or "medium",
                "coordinates": {
                    "latitude": _to_decimal(coordinates["latitude"]),
                    "longitude": _to_decimal(coordinates["longitude"]),
                },
            }
        except KeyError as error:
            raise DynamoDBError(f"coordinates missing {error.args[0]}") from error
        except DynamoDBError:
            raise
        except (TypeError, ValueError) as error:
            raise DynamoDBError(f"Invalid case coordinates or timestamp: {error}") from error

        try:
            self.cases_table.put_item(Item=item)
        except (ClientError, BotoCoreError) as error:
            raise DynamoDBError(f"Failed to create case record: {error}") from error

        return _from_decimal(item)

    def get_recent_cases(self):
        """Return recent active cases across every partition.

        The Cases table is keyed by case_id, so a single hotspot view cannot
        use Query. Scan plus a status filter is the MVP path, then items are
        sorted newest-first and capped.
        """
        collected = []
        scan_kwargs = {
            "FilterExpression": "#status IN (:open, :investigating)",
            "ExpressionAttributeNames": {"#status": "status"},
            "ExpressionAttributeValues": {
                ":open": ACTIVE_STATUSES[0],
                ":investigating": ACTIVE_STATUSES[1],
            },
        }

        try:
            while True:
                response = self.cases_table.scan(**scan_kwargs)
                collected.extend(response.get("Items", []))
                last_key = response.get("LastEvaluatedKey")
                if not last_key or len(collected) >= RECENT_CASES_LIMIT:
                    break
                scan_kwargs["ExclusiveStartKey"] = last_key
        except (ClientError, BotoCoreError) as error:
            raise DynamoDBError(f"Failed to fetch recent cases: {error}") from error

        collected.sort(key=lambda item: item.get("timestamp", 0), reverse=True)
        return [_from_decimal(item) for item in collected[:RECENT_CASES_LIMIT]]

    def update_hotspot_record(self, hotspot_id, data):
        """Create or update one hotspot. Only known hotspot fields are written."""
        if not isinstance(hotspot_id, str) or not hotspot_id.strip():
            raise DynamoDBError("hotspot_id is required and must be a string")
        if not isinstance(data, dict):
            raise DynamoDBError("hotspot data must be an object")

        updates = {}
        for field in HOTSPOT_FIELDS:
            if field not in data or data[field] is None:
                continue
            value = data[field]
            if field == "risk_level":
                if not isinstance(value, str) or not value.strip():
                    raise DynamoDBError("risk_level must be a string")
                updates[field] = value.strip()
            else:
                try:
                    updates[field] = _to_decimal(value)
                except DynamoDBError as error:
                    raise DynamoDBError(f"{field} must be a number") from error

        if not updates:
            raise DynamoDBError(
                "hotspot data must include radius, risk_level, or active_case_count"
            )

        # UpdateItem inserts the item when hotspot_id does not exist yet.
        expression_names = {f"#{field}": field for field in updates}
        expression_values = {f":{field}": value for field, value in updates.items()}
        set_clause = ", ".join(
            f"#{field} = :{field}" for field in updates
        )

        try:
            response = self.hotspots_table.update_item(
                Key={"hotspot_id": hotspot_id.strip()},
                UpdateExpression=f"SET {set_clause}",
                ExpressionAttributeNames=expression_names,
                ExpressionAttributeValues=expression_values,
                ReturnValues="ALL_NEW",
            )
        except (ClientError, BotoCoreError) as error:
            raise DynamoDBError(f"Failed to update hotspot record: {error}") from error

        return _from_decimal(response.get("Attributes", {}))


_service = None


def _get_service():
    """Reuse one client for the life of the Lambda container."""
    global _service
    if _service is None:
        _service = DynamoDBService()
    return _service


def create_case_record(case_data):
    """Insert a new record into the Cases table."""
    return _get_service().create_case_record(case_data)


def get_recent_cases():
    """Fetch recent active incidents for hotspot analysis."""
    return _get_service().get_recent_cases()


def update_hotspot_record(hotspot_id, data):
    """Update or save an active hotspot in the Hotspots table."""
    return _get_service().update_hotspot_record(hotspot_id, data)
