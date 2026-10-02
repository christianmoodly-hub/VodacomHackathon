"""Amazon Bedrock draft of a coordination brief, with a template fallback."""

import json
import os

from services.brief_guard import SYSTEM_PROMPT, contains_blocked_language, template_brief

MODEL_ENV = "BEDROCK_MODEL_ID"
TEMPLATE_MODEL_ID = "template-fallback"


def _region():
    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION")
    if not region:
        raise RuntimeError("AWS_REGION is required")
    return region


def _model_id():
    model_id = os.environ.get(MODEL_ENV, "").strip()
    if not model_id:
        raise RuntimeError(f"{MODEL_ENV} is required")
    return model_id


def _user_prompt(payload):
    allowed = {
        "lead_id": payload["lead_id"],
        "source": payload.get("source"),
        "supported": payload.get("supported"),
        "reason": payload.get("reason"),
        "days_apart": payload["days_apart"],
        "thresholds": payload["thresholds"],
        "records": payload["records"],
    }
    return (
        "Write the brief from these synthetic placeholder fields only:\n"
        + json.dumps(allowed, indent=2)
    )


def _draft(client, model_id, user_text):
    response = client.converse(
        modelId=model_id,
        system=[{"text": SYSTEM_PROMPT}],
        messages=[{"role": "user", "content": [{"text": user_text}]}],
        inferenceConfig={"maxTokens": 500, "temperature": 0.2},
    )
    parts = response.get("output", {}).get("message", {}).get("content", [])
    return "".join(part.get("text", "") for part in parts).strip()


def write_brief(payload):
    """Return (brief_text, model_id). Falls back to the template after one retry."""
    fallback = template_brief(payload)
    try:
        import boto3
        from botocore.exceptions import BotoCoreError, ClientError
    except ImportError:
        return fallback, TEMPLATE_MODEL_ID
    try:
        model_id = _model_id()
        client = boto3.client("bedrock-runtime", region_name=_region())
        draft = _draft(client, model_id, _user_prompt(payload))
        if contains_blocked_language(draft):
            draft = _draft(
                client,
                model_id,
                _user_prompt(payload)
                + "\n\nRewrite the brief. Remove any conclusion, and do not use blocked words.",
            )
        if draft and not contains_blocked_language(draft):
            return draft, model_id
    except (BotoCoreError, ClientError, RuntimeError, KeyError, json.JSONDecodeError):
        return fallback, TEMPLATE_MODEL_ID
    return fallback, TEMPLATE_MODEL_ID
