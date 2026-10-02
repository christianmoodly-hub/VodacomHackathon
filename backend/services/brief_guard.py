"""Guards and the local template for a coordination brief.

The template uses only the synthetic fields supplied to it. It is the fallback
when a model draft contains blocked language or Bedrock cannot be reached.
"""

import re

DATA_FILE = "06_she_shield_response_synthetic_case_data.csv"
REVIEWER = "R-07"
VERIFICATION_SENTENCE = "This requires human verification before any action is taken."
BLOCKED_WORDS = ("confirmed", "proven", "suspect", "perpetrator", "definitely")
RECORD_FIELDS = (
    "case_id",
    "record_type",
    "date_reported",
    "area_code",
    "risk_indicator",
    "possible_linked_case_ref",
)

_BLOCKED = re.compile("|".join(re.escape(word) for word in BLOCKED_WORDS), re.IGNORECASE)


def contains_blocked_language(text):
    """True when the draft states or implies a conclusion."""
    return bool(_BLOCKED.search(text or ""))


def template_brief(payload):
    """Build a brief from the supplied placeholder fields only."""
    left, right = payload["records"]
    thresholds = payload["thresholds"]
    same_area = left["area_code"] == right["area_code"]
    days = payload["days_apart"]
    day_word = "day" if days == 1 else "days"
    area_window = thresholds["same_area_days"]
    cross_window = thresholds["cross_area_days"]
    window = area_window if same_area else cross_window
    named = _named_sentence(left, right)
    lines = [
        "Coordination brief",
        "",
        f"Possible link: {left['case_id']} and {right['case_id']}",
        "Possible investigative lead, not a conclusion.",
        "",
        "Evidence:",
        f"- Area: {left['area_code']} and {right['area_code']} ({'same area' if same_area else 'different areas'})",
        f"- Timing: {days} {day_word} apart ({left['date_reported']} and {right['date_reported']}). The window for {'the same area' if same_area else 'different areas'} is {window} days.",
        f"- Named in data: {named}",
        f"- Thresholds in use: same area within {area_window} days, different areas within {cross_window} days. These windows are reviewer assumptions, not columns in the CSV.",
        f"- record_type: {left['record_type']} and {right['record_type']} (context only, not used as a score)",
        f"- risk_indicator: {left['risk_indicator']} and {right['risk_indicator']} (context only, not used as a score)",
    ]
    if payload.get("source") == "named" and payload.get("supported"):
        lines.append("- Area or timing also matches this pair.")
    if payload.get("source") == "named" and not payload.get("supported"):
        lines.append("- Area and timing do not support this named link.")
    lines.extend(["", VERIFICATION_SENTENCE])
    text = "\n".join(lines)
    if contains_blocked_language(text):
        raise ValueError("Template brief contained blocked language")
    return text


def _named_sentence(left, right):
    left_names = left.get("possible_linked_case_ref") == right["case_id"]
    right_names = right.get("possible_linked_case_ref") == left["case_id"]
    if left_names and right_names:
        return "Each record names the other"
    if left_names:
        return f"{left['case_id']} names {right['case_id']} as a possible related case"
    if right_names:
        return f"{right['case_id']} names {left['case_id']} as a possible related case"
    return "Neither record names the other"


SYSTEM_PROMPT = (
    "Write a short coordination brief for an authorised team using ONLY the supplied fields. "
    "Describe this as a possible investigative lead. Never state or imply a conclusion. "
    f'Include the sentence "{VERIFICATION_SENTENCE}" '
    "Do not use the words confirmed, proven, suspect, perpetrator, or definitely. "
    "record_type and risk_indicator are context only. Do not score them. "
    "The day windows are reviewer assumptions, not columns in the source file."
)
