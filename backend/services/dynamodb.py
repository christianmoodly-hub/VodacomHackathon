"""Amazon DynamoDB access for SHE-SHIELD Response audit and decision rows.

The table stores placeholder IDs, thresholds, and the audit fields only.
It does not store coordinates, alerts, or anything outside the synthetic file.
"""

import os
from decimal import Decimal

import boto3
from botocore.exceptions import BotoCoreError, ClientError

TABLE_ENV = "AUDIT_TABLE_NAME"
AUDIT_FIELDS = {
    "lead_id",
    "timestamp",
    "item_type",
    "data_file",
    "model_id",
    "reviewer",
    "decision",
    "same_area_days",
    "cross_area_days",
}


class AuditLogError(Exception):
    """Raised when the audit table cannot be read or written."""


def _table():
    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION")
    name = os.environ.get(TABLE_ENV, "").strip()
    if not region:
        raise AuditLogError("AWS_REGION is required")
    if not name:
        raise AuditLogError(f"{TABLE_ENV} is required")
    return boto3.resource("dynamodb", region_name=region).Table(name)


def _plain(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, dict):
        return {key: _plain(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_plain(item) for item in value]
    return value


def _keep(item):
    return {key: value for key, value in item.items() if key in AUDIT_FIELDS and value is not None}


def put_item(item):
    """Insert one audit or decision row. Unexpected keys are dropped."""
    stored = _keep(item)
    if not stored.get("lead_id") or not stored.get("timestamp") or not stored.get("item_type"):
        raise AuditLogError("lead_id, timestamp, and item_type are required")
    try:
        _table().put_item(Item=stored)
    except (BotoCoreError, ClientError) as error:
        raise AuditLogError("Failed to write the audit log") from error
    return stored


def list_recent(limit=50):
    """Return audit and decision rows, newest timestamp first."""
    items = []
    scan_kwargs = {}
    try:
        while True:
            response = _table().scan(**scan_kwargs)
            items.extend(response.get("Items", []))
            token = response.get("LastEvaluatedKey")
            if not token:
                break
            scan_kwargs["ExclusiveStartKey"] = token
    except (BotoCoreError, ClientError) as error:
        raise AuditLogError("Failed to read the audit log") from error
    items.sort(key=lambda item: item.get("timestamp", ""), reverse=True)
    return [_plain(_keep(item)) for item in items[:limit]]
