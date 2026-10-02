"""POST /brief: draft a coordination brief and store its audit row."""

import json
from datetime import datetime, timezone

from handlers.http import read_json, response
from handlers.validate import brief_request
from services.bedrock_brief import write_brief
from services.dynamodb import AuditLogError, put_item


def handler(event, context):
    try:
        payload = brief_request(read_json(event))
    except (json.JSONDecodeError, ValueError, TypeError):
        return response(400, {"error": "The brief request uses only synthetic placeholder fields"})

    brief, model_id = write_brief(payload)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    audit = {
        "data_file": payload["data_file"],
        "run_timestamp": timestamp,
        "model_id": model_id,
        "reviewer": payload["reviewer"],
    }
    item = {
        "lead_id": payload["lead_id"],
        "timestamp": timestamp,
        "item_type": "audit",
        "data_file": audit["data_file"],
        "model_id": audit["model_id"],
        "reviewer": audit["reviewer"],
        "same_area_days": payload["thresholds"]["same_area_days"],
        "cross_area_days": payload["thresholds"]["cross_area_days"],
    }
    try:
        put_item(item)
    except AuditLogError:
        return response(500, {"error": "The audit row could not be stored"})
    return response(200, {"brief": brief, "audit": audit})
