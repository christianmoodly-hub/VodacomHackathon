import { formatRadius, padCount } from "../format.js";

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

export default function Ledger({
  hotspots,
  selectedId,
  booted,
  error,
  lastSync,
  expanded,
  hiddenOnMobile,
  onToggleExpanded,
  onSelect,
}) {
  const showFailure = booted && hotspots.length === 0 && error && !lastSync;
  const showEmpty = booted && hotspots.length === 0 && !showFailure;

  return (
    <aside
      aria-label="Active hotspots"
      className={`z-20 flex flex-col border border-brass/30 bg-ink text-bone max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:border-x-0 max-md:border-b-0 md:absolute md:bottom-3 md:left-3 md:top-[var(--panel-top)] md:w-[340px] ${
        hiddenOnMobile ? "max-md:hidden" : ""
      }`}
    >

      <div className="flex items-center justify-between gap-3 border-b border-brass/20 px-4 py-3">
        <div>
          <p className="font-display text-[11px] tracking-[0.24em] text-brass uppercase">
            Active zones
          </p>
          <p className="font-display text-[28px] leading-none tracking-[0.06em] tabular-nums">
            {padCount(hotspots.length)}
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

      <div
        className={`ledger-scroll min-h-0 flex-1 overflow-y-auto ${
          expanded ? "max-h-[48vh] md:max-h-none" : "hidden md:block"
        }`}
      >
        {!booted ? (
          <p className="px-4 py-6 font-display text-[15px] tracking-[0.12em] text-brass uppercase">
            Reading the board…
          </p>
        ) : null}

        {showFailure ? (
          <div className="flex gap-2 px-4 py-5 text-sm leading-snug">
            <WarningMark />
            <p>{error}</p>
          </div>
        ) : null}

        {showEmpty ? (
          <p className="px-4 py-6 text-sm leading-relaxed text-bone/90">
            No active hotspots. Report a case, then run analysis.
          </p>
        ) : null}

        {hotspots.length > 0 ? (
          <ul>
            {hotspots.map((hotspot) => {
              const high = hotspot.risk_level === "HIGH";
              const selected = hotspot.hotspot_id === selectedId;
              const cases = hotspot.active_case_count;
              return (
                <li key={hotspot.hotspot_id}>
                  <button
                    type="button"
                    onClick={() => onSelect(hotspot.hotspot_id)}
                    aria-pressed={selected}
                    title={hotspot.hotspot_id}
                    className={`flex w-full gap-3 border-b border-brass/15 px-3 py-3 text-left transition-colors hover:bg-bone/5 ${
                      selected ? "bg-bone/[0.07] shadow-[inset_3px_0_0_#d6f25c]" : ""
                    }`}
                  >
                    <span
                      className={`mt-1 h-9 w-[3px] shrink-0 ${
                        high ? "bg-ember shadow-[0_0_12px_#e23b2b]" : "bg-amber"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-display text-[17px] tracking-[0.04em]">
                          {hotspot.hotspot_id}
                        </span>
                        <span
                          className={`shrink-0 font-display text-[12px] tracking-[0.16em] ${
                            high ? "text-ember" : "text-amber"
                          }`}
                        >
                          {hotspot.risk_level}
                        </span>
                      </span>
                      <span className="mt-1 flex justify-between font-display text-[13px] tracking-[0.08em] text-brass tabular-nums">
                        <span>
                          {cases} {cases === 1 ? "case" : "cases"}
                        </span>
                        <span>{formatRadius(hotspot.radius)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div
        className={`items-center gap-4 border-t border-brass/20 px-4 py-2.5 font-display text-[11px] tracking-[0.16em] text-brass ${
          expanded ? "flex" : "hidden md:flex"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <i className="inline-block size-2 bg-ember" aria-hidden="true" />
          HIGH
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block size-2 bg-amber" aria-hidden="true" />
          MODERATE
        </span>
      </div>
    </aside>
  );
}
