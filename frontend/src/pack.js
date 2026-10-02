/**
 * SHE-SHIELD Response lead rules.
 *
 * A pair is a possible investigative lead when the resource already names a
 * link, the two records share an area within 21 days, or they fall in
 * different areas within 7 days. None of these are conclusions.
 */

const SAME_AREA_DAYS = 21;
const CROSS_AREA_DAYS = 7;

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function splitCsvLine(line) {
  return line.split(",").map((cell) => cell.trim());
}

function daySpan(left, right) {
  const start = Date.parse(`${left}T00:00:00Z`);
  const end = Date.parse(`${right}T00:00:00Z`);
  return Math.round(Math.abs(end - start) / 86400000);
}

function dayLabel(days) {
  return days === 1 ? "1 day" : `${days} days`;
}

function pairKey(left, right) {
  return [left, right].sort().join("|");
}

export function findLeads(cases) {
  const byId = new Map(cases.map((item) => [item.case_id, item]));
  const pairs = new Map();

  function add(leftId, rightId, reason) {
    const left = byId.get(leftId);
    const right = byId.get(rightId);
    if (!left || !right || leftId === rightId) return;
    const key = pairKey(leftId, rightId);
    const current = pairs.get(key) || {
      ids: [leftId, rightId].sort(),
      days: daySpan(left.date_reported, right.date_reported),
      reasons: [],
    };
    if (!current.reasons.includes(reason)) current.reasons.push(reason);
    pairs.set(key, current);
  }

  for (const item of cases) {
    const linked = item.possible_linked_case_ref;
    if (linked) {
      add(item.case_id, linked, "The record names a possible link to another placeholder ID.");
    }
  }

  for (let i = 0; i < cases.length; i += 1) {
    for (let j = i + 1; j < cases.length; j += 1) {
      const left = cases[i];
      const right = cases[j];
      const days = daySpan(left.date_reported, right.date_reported);
      if (days <= 0) continue;
      if (left.area_code === right.area_code && days <= SAME_AREA_DAYS) {
        add(left.case_id, right.case_id, `Same area (${left.area_code}), ${dayLabel(days)} apart.`);
      } else if (left.area_code !== right.area_code && days <= CROSS_AREA_DAYS) {
        add(
          left.case_id,
          right.case_id,
          `Different areas (${left.area_code} and ${right.area_code}), ${dayLabel(days)} apart.`,
        );
      }
    }
  }

  return [...pairs.values()].sort(
    (left, right) => left.days - right.days || left.ids[0].localeCompare(right.ids[0]),
  );
}

export function normalizeCases(rows) {
  return rows
    .map((row) => ({
      case_id: row.case_id,
      record_type: row.record_type,
      date_reported: row.date_reported,
      area_code: row.area_code,
      risk_indicator: row.risk_indicator,
      possible_linked_case_ref: row.possible_linked_case_ref || "",
      fictional: Boolean(row.fictional),
    }))
    .sort((left, right) => left.date_reported.localeCompare(right.date_reported) || left.case_id.localeCompare(right.case_id));
}

export function nextFictionalId(cases) {
  const numbers = cases.map((item) => Number(String(item.case_id).replace(/\D/g, "")));
  const highest = numbers.reduce((max, value) => (Number.isFinite(value) ? Math.max(max, value) : max), 1000);
  return `CASE-SYN-${highest + 1}`;
}
