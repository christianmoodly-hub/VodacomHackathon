export const DATA_FILE = "06_she_shield_response_synthetic_case_data.csv";
export const DEFAULT_SAME_AREA_DAYS = 21;
export const DEFAULT_CROSS_AREA_DAYS = 7;
export const REVIEWER_ID = "R-07";
const STRONG_WITHIN_DAYS = 7;

const strengthRank = { Strong: 0, Moderate: 1, Weak: 2 };

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",").map((cell) => cell.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    return {
      case_id: row.case_id,
      record_type: row.record_type,
      date_reported: row.date_reported,
      area_code: row.area_code,
      risk_indicator: row.risk_indicator,
      possible_linked_case_ref: row.possible_linked_case_ref || null,
    };
  });
}

export function daysBetween(left, right) {
  return Math.round(Math.abs(Date.parse(left) - Date.parse(right)) / 86400000);
}

export function formatGap(days) {
  if (days === 0) return "same day";
  return `${days} ${days === 1 ? "day" : "days"} apart`;
}

export function formatClock(date) {
  return date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatHistory(iso) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day} ${formatClock(date)}`;
}

export function formatAudit(date) {
  if (!date) return "—";
  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function pairKey(left, right) {
  return [left, right].sort().join("|");
}

function describePair(left, right, days) {
  const area = left.area_code === right.area_code ? left.area_code : `${left.area_code} and ${right.area_code}`;
  return `${area}, ${formatGap(days)}`;
}

function areaTimingStrength(sameArea, days, rules) {
  if (sameArea) {
    if (days > rules.sameAreaWindowDays) return null;
    return days <= STRONG_WITHIN_DAYS ? "Strong" : "Moderate";
  }
  return days <= rules.crossAreaWindowDays ? "Weak" : null;
}

export function findAreaTimingLeads(records, rules) {
  const leads = [];
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const [left, right] = [records[i], records[j]].sort(
        (a, b) => a.date_reported.localeCompare(b.date_reported) || a.case_id.localeCompare(b.case_id),
      );
      const days = daysBetween(left.date_reported, right.date_reported);
      const sameArea = left.area_code === right.area_code;
      const strength = areaTimingStrength(sameArea, days, rules);
      if (!strength) continue;
      leads.push({
        id: `at:${pairKey(left.case_id, right.case_id)}`,
        source: "area-timing",
        caseA: left.case_id,
        caseB: right.case_id,
        reason: describePair(left, right, days),
        strength,
        daysApart: days,
        sameArea,
        supported: true,
      });
    }
  }
  return leads.sort((left, right) => strengthRank[left.strength] - strengthRank[right.strength] || left.daysApart - right.daysApart);
}

export function findNamedLeads(records, rules) {
  const byId = new Map(records.map((record) => [record.case_id, record]));
  return records.flatMap((record) => {
    const ref = record.possible_linked_case_ref;
    if (!ref || ref === record.case_id) return [];
    const target = byId.get(ref);
    if (!target) return [];
    const days = daysBetween(record.date_reported, target.date_reported);
    const sameArea = record.area_code === target.area_code;
    const strength = areaTimingStrength(sameArea, days, rules);
    return [
      {
        id: `nl:${record.case_id}>${target.case_id}`,
        source: "named",
        caseA: record.case_id,
        caseB: target.case_id,
        reason: describePair(record, target, days),
        strength: strength ?? "Weak",
        daysApart: days,
        sameArea,
        supported: strength !== null,
      },
    ];
  });
}

export function analyseRecords(records, rules) {
  return {
    areaLeads: findAreaTimingLeads(records, rules),
    namedLeads: findNamedLeads(records, rules),
  };
}

export function assessEvidence(left, right, rules) {
  const days = daysBetween(left.date_reported, right.date_reported);
  const sameArea = left.area_code === right.area_code;
  const window = sameArea ? rules.sameAreaWindowDays : rules.crossAreaWindowDays;
  const leftNamesRight = left.possible_linked_case_ref === right.case_id;
  const rightNamesLeft = right.possible_linked_case_ref === left.case_id;

  let named = "Neither record names the other";
  if (leftNamesRight && rightNamesLeft) named = "Each record names the other";
  else if (leftNamesRight) named = `${left.case_id} names ${right.case_id} as a possible related case`;
  else if (rightNamesLeft) named = `${right.case_id} names ${left.case_id} as a possible related case`;

  return [
    {
      label: "Area",
      finding: sameArea ? `Both records are in ${left.area_code}` : `${left.area_code} and ${right.area_code} are different areas`,
      supports: sameArea,
    },
    {
      label: "Timing",
      finding: `Reported ${days === 0 ? "on the same day" : formatGap(days)}. The window for ${sameArea ? "the same area" : "different areas"} is ${window} ${window === 1 ? "day" : "days"}.`,
      supports: days <= window,
    },
    { label: "Named in data", finding: named, supports: leftNamesRight || rightNamesLeft },
  ];
}

export function coordinationBrief({ lead, recordA, recordB, rules, runAt, decision, note }) {
  const evidence = assessEvidence(recordA, recordB, rules);
  const decisionText = decision && decision !== "Unreviewed" ? decision : "not yet reviewed";
  const lines = [
    "Coordination brief",
    "",
    `Possible link: ${lead.caseA} and ${lead.caseB}`,
    "Possible investigative lead, not a conclusion.",
    "",
    "Evidence:",
    ...evidence.map((item) => `- ${item.label}: ${item.finding}`),
    `- Thresholds in use: same area within ${rules.sameAreaWindowDays} days, different areas within ${rules.crossAreaWindowDays} days. These windows are reviewer assumptions, not columns in the CSV.`,
    `- record_type: ${recordA.record_type} and ${recordB.record_type} (context only, not used as a score)`,
    `- risk_indicator: ${recordA.risk_indicator} and ${recordB.risk_indicator} (context only, not used as a score)`,
  ];
  if (lead.source === "named" && lead.supported) lines.push("- Area or timing also matches this pair.");
  if (lead.source === "named" && !lead.supported) lines.push("- Area and timing do not support this named link.");
  lines.push(
    "",
    "This requires human verification before any action is taken.",
    "",
    `Audit: data file ${DATA_FILE} · run ${formatAudit(runAt)} · reviewer: ${REVIEWER_ID} · decision: ${decisionText}${note ? ` · note: ${note}` : ""}`,
  );
  return lines.join("\n");
}
