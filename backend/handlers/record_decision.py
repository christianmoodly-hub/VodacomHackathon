"""POST /decision: store a reviewer decision for one lead."""

import json
from datetime import datetime, timezone

from handlers.http import read_json, response
from handlers.validate import decision_request
from services.dynamodb import AuditLogError, put_item


def handler(event, context):
    try:
        payload = decision_request(read_json(event))
    except (json.JSONDecodeError, ValueError, TypeError):
        return response(400, {"error": "The decision request uses only a placeholder lead and a reviewer decision"})

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    item = {
        "lead_id": payload["lead_id"],
        "timestamp": timestamp,
        "item_type": "decision",
        "decision": payload["decision"],
        "reviewer": payload["reviewer"],
        "same_area_days": payload["thresholds"]["same_area_days"],
        "cross_area_days": payload["thresholds"]["cross_area_days"],
    }
    try:
        put_item(item)
    except AuditLogError:
        return response(500, {"error": "The decision could not be stored"})
    return response(200, {"stored": item})
