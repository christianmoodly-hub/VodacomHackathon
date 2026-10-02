"""GET /audit: recent brief audits and reviewer decisions, newest first."""

from handlers.http import response
from services.dynamodb import AuditLogError, list_recent


def handler(event, context):
    try:
        items = list_recent()
    except AuditLogError:
        return response(500, {"error": "The audit log could not be read"})
    return response(200, {"items": items, "count": len(items)})
