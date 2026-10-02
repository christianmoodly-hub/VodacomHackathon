function WarningMark() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0 text-ember" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 1.4 15 14.2H1L8 1.4Zm0 4.1c-.4 0-.7.3-.7.7v3.3c0 .4.3.7.7.7s.7-.3.7-.7V6.2c0-.4-.3-.7-.7-.7Zm0 6.1a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z"
      />
    </svg>
  );
}

function padCount(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
}

export default function Ledger({
  view,
  onView,
  hotspots,
  cases,
  leads,
  selectedId,
  booted,
  error,
  expanded,
  hiddenOnMobile,
  onToggleExpanded,
  onSelect,
}) {
  const showingCases = view === "cases";
  const count = showingCases ? leads.length : hotspots.length;

  return (
    <aside
      aria-label={showingCases ? "Synthetic cases and possible leads" : "Synthetic safety zones"}
      className={`z-20 flex flex-col border border-brass/30 bg-ink text-bone max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:border-x-0 max-md:border-b-0 md:absolute md:bottom-3 md:left-3 md:top-[var(--panel-top)] md:w-[380px] ${
        hiddenOnMobile ? "max-md:hidden" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-brass/20 px-4 py-3">
        <div>
          <p className="font-display text-[11px] tracking-[0.24em] text-brass uppercase">
            {showingCases ? "Possible leads" : "Zone watch"}
          </p>
          <p className="font-display text-[28px] leading-none tracking-[0.06em] tabular-nums">
            {padCount(count)}
          </p>
        </div>
        <button
          type="button"
          className="border border-brass/40 px-3 py-2 font-display text-[12px] tracking-[0.16em] text-brass uppercase md:hidden"
          aria-expanded={expanded}
          onClick={onToggleExpanded}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div className="flex border-b border-brass/20 font-display text-[13px] tracking-[0.14em] uppercase">
        <button
          type="button"
          onClick={() => onView("zones")}
          aria-pressed={!showingCases}
          className={`flex-1 px-3 py-2 ${!showingCases ? "bg-bone/10 text-lime" : "text-brass"}`}
        >
          Zones
        </button>
        <button
          type="button"
          onClick={() => onView("cases")}
          aria-pressed={showingCases}
          className={`flex-1 border-l border-brass/20 px-3 py-2 ${
            showingCases ? "bg-bone/10 text-lime" : "text-brass"
          }`}
        >
          Cases
        </button>
      </div>

      <div
        className={`ledger-scroll min-h-0 flex-1 overflow-y-auto ${
          expanded ? "max-h-[48vh] md:max-h-none" : "max-h-[34vh] md:max-h-none"
        }`}
      >
        {!booted ? (
          <p className="px-4 py-6 font-display text-[15px] tracking-[0.12em] text-brass uppercase">
            Reading the board…
          </p>
        ) : null}

        {error && hotspots.length === 0 ? (
          <div className="flex gap-2 px-4 py-5 text-sm leading-snug">
            <WarningMark />
            <p>{error}</p>
          </div>
        ) : null}

        {!showingCases ? <ZoneList hotspots={hotspots} selectedId={selectedId} onSelect={onSelect} /> : null}
        {showingCases ? <CaseList cases={cases} leads={leads} /> : null}
      </div>

      <p
        className="border-t border-brass/20 px-4 py-2.5 text-[12px] leading-snug text-brass"
      >
        {showingCases
          ? "Placeholder IDs only. Links are possible leads, not conclusions."
          : "The pack has no GPS. Pins are display anchors for the three named zones."}
      </p>
    </aside>
  );
}

function ZoneList({ hotspots, selectedId, onSelect }) {
  if (hotspots.length === 0) {
    return <p className="px-4 py-6 text-sm">No zones in the synthetic pack.</p>;
  }

  return (
    <ul>
      {hotspots.map((hotspot) => {
        const high = hotspot.risk_level === "HIGH";
        const selected = hotspot.hotspot_id === selectedId;
        return (
          <li key={hotspot.hotspot_id}>
            <button
              type="button"
              onClick={() => onSelect(hotspot.hotspot_id)}
              aria-pressed={selected}
              className={`w-full border-b border-brass/15 px-3 py-3 text-left hover:bg-bone/5 ${
                selected ? "bg-bone/[0.07] shadow-[inset_3px_0_0_#d6f25c]" : ""
              }`}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-display text-[16px] leading-tight tracking-[0.03em]">
                  {hotspot.hotspot_id}
                </span>
                <span
                  className={`shrink-0 font-display text-[12px] tracking-[0.16em] ${
                    high ? "text-ember" : "text-amber"
                  }`}
                >
                  {high ? "WORSENING" : hotspot.risk_level}
                </span>
              </span>
              <span className="mt-1 block font-display text-[13px] tracking-[0.06em] text-brass tabular-nums">
                Week 4 · {hotspot.active_case_count} incidents · {hotspot.lights}% lights ·{" "}
                {hotspot.footfall} footfall
              </span>
              {selected ? (
                <span className="mt-2 block text-[13px] leading-snug text-bone/90">{hotspot.summary}</span>
              ) : null}
              {selected && hotspot.weeks ? (
                <span className="mt-2 grid grid-cols-4 gap-1 text-center font-display text-[11px] tracking-[0.04em] text-brass">
                  {hotspot.weeks.map((week) => (
                    <span key={week.week} className="border border-brass/25 px-1 py-1 tabular-nums">
                      W{week.week}
                      <span className="mt-0.5 block text-bone">{week.incidents}</span>
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CaseList({ cases, leads }) {
  return (
    <div>
      <ul>
        {leads.map((lead) => (
          <li key={lead.ids.join("-")} className="border-b border-brass/15 px-3 py-3">
            <p className="font-display text-[14px] leading-tight tracking-[0.03em]">
              {lead.ids.join(" · ")}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-bone/90">
              {lead.reasons.join(" ")}
              {lead.reasons.some((reason) => reason.includes("apart"))
                ? ""
                : ` ${lead.days} days between reports.`}
            </p>
          </li>
        ))}
      </ul>
      <p className="px-3 pt-4 font-display text-[11px] tracking-[0.18em] text-brass uppercase">
        All {cases.length} records
      </p>
      <ul>
        {cases.map((item) => (
          <li key={item.case_id} className="border-b border-brass/10 px-3 py-2">
            <p className="flex items-baseline justify-between gap-2 font-display text-[14px] tracking-[0.04em]">
              <span>{item.case_id}</span>
              <span className="text-[12px] tracking-[0.12em] text-brass">{item.risk_indicator}</span>
            </p>
            <p className="text-[12px] text-brass">
              {item.date_reported} · {item.area_code} · {item.record_type}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
