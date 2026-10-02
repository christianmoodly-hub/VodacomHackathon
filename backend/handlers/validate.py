"""Validate synthetic placeholder fields before a Lambda writes anything."""

import re

from services.brief_guard import DATA_FILE, RECORD_FIELDS, REVIEWER

CASE_ID = re.compile(r"^CASE-SYN-\d{4}$")
LEAD_ID = re.compile(r"^(at|nl):[A-Za-z0-9|>._-]{1,80}$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
RECORD_TYPES = {"Missing person report", "Case record", "Hotspot report"}
RISKS = {"Low", "Medium", "High"}
AREAS = {"Area-1", "Area-2", "Area-3", "Area-4", "Area-5"}
DECISIONS = {"verified", "dismissed", "needs_more_info"}


def reviewer(value):
    if value in {REVIEWER, "[reviewer name]"}:
        return REVIEWER
    raise ValueError("reviewer must be the placeholder")


def lead_id(value):
    if not isinstance(value, str) or not LEAD_ID.match(value):
        raise ValueError("lead_id is not a synthetic placeholder")
    return value


def day_window(value, name):
    if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 365:
        raise ValueError(f"{name} must be a whole number of days")
    return value


def thresholds(value):
    if not isinstance(value, dict):
        raise ValueError("thresholds are required")
    return {
        "same_area_days": day_window(value.get("same_area_days"), "same_area_days"),
        "cross_area_days": day_window(value.get("cross_area_days"), "cross_area_days"),
    }


def record(value):
    if not isinstance(value, dict):
        raise ValueError("each record must be an object")
    if set(value) - set(RECORD_FIELDS):
        raise ValueError("record contains a field outside the synthetic file")
    case = value.get("case_id")
    if not isinstance(case, str) or not CASE_ID.match(case):
        raise ValueError("case_id is not a synthetic placeholder")
    record_type = value.get("record_type")
    if record_type not in RECORD_TYPES:
        raise ValueError("record_type is not one of the synthetic types")
    reported = value.get("date_reported")
    if not isinstance(reported, str) or not DATE.match(reported):
        raise ValueError("date_reported must be YYYY-MM-DD")
    area = value.get("area_code")
    if area not in AREAS:
        raise ValueError("area_code must be a synthetic area")
    risk = value.get("risk_indicator")
    if risk not in RISKS:
        raise ValueError("risk_indicator must be Low, Medium, or High")
    linked = value.get("possible_linked_case_ref") or None
    if linked is not None and (not isinstance(linked, str) or not CASE_ID.match(linked)):
        raise ValueError("possible_linked_case_ref is not a synthetic placeholder")
    return {
        "case_id": case,
        "record_type": record_type,
        "date_reported": reported,
        "area_code": area,
        "risk_indicator": risk,
        "possible_linked_case_ref": linked,
    }


def brief_request(body):
    if body.get("data_file") not in {None, DATA_FILE}:
        raise ValueError("data_file must be the synthetic case file")
    records = body.get("records")
    if not isinstance(records, list) or len(records) != 2:
        raise ValueError("a lead requires exactly two records")
    days = body.get("days_apart")
    if isinstance(days, bool) or not isinstance(days, int) or days < 0:
        raise ValueError("days_apart must be a whole number")
    return {
        "lead_id": lead_id(body.get("lead_id")),
        "source": body.get("source") if body.get("source") in {"named", "area-timing"} else "area-timing",
        "supported": bool(body.get("supported")),
        "reason": str(body.get("reason") or "")[:180],
        "days_apart": days,
        "thresholds": thresholds(body.get("thresholds")),
        "records": [record(item) for item in records],
        "data_file": DATA_FILE,
        "reviewer": reviewer(body.get("reviewer") or REVIEWER),
    }


def decision_request(body):
    decision = body.get("decision")
    if decision not in DECISIONS:
        raise ValueError("decision must be verified, dismissed, or needs_more_info")
    parsed = thresholds(body.get("thresholds"))
    return {
        "lead_id": lead_id(body.get("lead_id")),
        "decision": decision,
        "reviewer": reviewer(body.get("reviewer") or REVIEWER),
        "thresholds": parsed,
    }
