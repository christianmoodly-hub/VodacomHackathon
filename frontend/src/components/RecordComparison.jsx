import { formatGap } from "../leads.js";
import LevelMeter from "./LevelMeter.jsx";

const riskFilled = { Low: 1, Medium: 2, High: 3 };

export default function RecordComparison({ a, b, daysApart }) {
  const sameArea = a.area_code === b.area_code;
  const aNamesB = a.possible_linked_case_ref === b.case_id;
  const bNamesA = b.possible_linked_case_ref === a.case_id;
  const sameRisk = a.risk_indicator === b.risk_indicator;

  const rows = [
    { label: "Record type", highlight: false, render: (record) => record.record_type },
    {
      label: "Date reported",
      note: daysApart === 0 ? "Same day" : formatGap(daysApart).replace(/^./, (char) => char.toUpperCase()),
      highlight: false,
      render: (record) => <span className="tabular-nums">{record.date_reported}</span>,
    },
    {
      label: "Area code",
      note: sameArea ? "Same area" : "Different areas",
      highlight: sameArea,
      render: (record) => record.area_code,
    },
    {
      label: "Risk indicator",
      note: sameRisk ? "Same level" : "Context only",
      highlight: false,
      render: (record) => (
        <LevelMeter
          filled={riskFilled[record.risk_indicator]}
          label={record.risk_indicator}
          srPrefix="Risk indicator"
          className="text-[13.5px] text-ink"
        />
      ),
    },
    {
      label: "Named reference",
      note: aNamesB || bNamesA ? "Refers to the other record" : undefined,
      highlight: aNamesB || bNamesA,
      render: (record) =>
        record.possible_linked_case_ref ? (
          <span className="font-mono text-[13px]">{record.possible_linked_case_ref}</span>
        ) : (
          <span className="text-ink-subtle">None</span>
        ),
    },
  ];

  return (
    <div role="table" aria-label="Side-by-side record comparison" className="grid grid-cols-[136px_minmax(0,1fr)_minmax(0,1fr)] gap-x-3">
      <div role="row" className="contents">
        <div role="columnheader">
          <span className="sr-only">Field</span>
        </div>
        {[a, b].map((record, index) => (
          <div key={record.case_id} role="columnheader" className="rounded-t-lg border border-b-0 border-line bg-surface px-4 pb-3 pt-4">
            <p className="text-[12px] text-ink-subtle">Record {index === 0 ? "A" : "B"}</p>
            <p className="mt-0.5 font-mono text-[15px] font-semibold text-ink">{record.case_id}</p>
          </div>
        ))}
      </div>
      {rows.map((row, index) => {
        const last = index === rows.length - 1;
        return (
          <div key={row.label} role="row" className="contents">
            <div role="rowheader" className="border-t border-line py-3 pr-2">
              <p className="text-[12.5px] font-medium text-ink-muted">{row.label}</p>
              {row.note ? <p className="mt-0.5 text-[11.5px] text-accent">{row.note}</p> : null}
            </div>
            {[a, b].map((record) => (
              <div
                key={record.case_id}
                role="cell"
                className={`flex items-center border-x border-t border-line px-4 py-3 text-[13.5px] text-ink ${last ? "rounded-b-lg border-b" : ""} ${row.highlight ? "bg-accent-soft" : "bg-surface"}`}
              >
                {row.render(record)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
