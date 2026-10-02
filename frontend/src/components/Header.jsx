import { formatSync, padCount } from "../format.js";

export default function Header({
  headerRef,
  lastSync,
  caseCount,
  refreshing,
  reportOpen,
  correlating,
  onRefresh,
  onToggleReport,
  onCorrelate,
}) {
  return (
    <header
      ref={headerRef}
      className="border-b border-brass/30 bg-field text-bone"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="min-w-0 leading-none">
          <p className="font-display text-[26px] font-semibold tracking-[0.08em] sm:text-[30px]">
            SHE-SHIELD
          </p>
          <p className="mt-0.5 font-display text-[11px] tracking-[0.28em] text-brass uppercase">
            Response
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:ml-2">
          <p className="flex items-center gap-2 font-display text-[13px] tracking-[0.22em] text-lime">
            <span className="relative flex size-2.5" aria-hidden="true">
              <span className="signal-ring absolute inline-flex size-2.5 bg-lime" />
              <span className="relative inline-flex size-2.5 bg-lime" />
            </span>
            SYNTHETIC
          </p>
          <p className="font-display text-[13px] tracking-[0.16em] text-brass tabular-nums">
            <span className="sr-only">Loaded at </span>
            {lastSync ? formatSync(lastSync) : refreshing ? "…" : "—"}
          </p>
          <p className="font-display text-[13px] tracking-[0.16em] text-bone tabular-nums">
            {padCount(caseCount)} CASES
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="border border-brass/40 px-3 py-2 font-display text-[13px] tracking-[0.14em] text-brass uppercase hover:border-bone hover:text-bone disabled:cursor-wait disabled:opacity-50"
          >
            {refreshing ? "Resetting" : "Reset pack"}
          </button>
          <button
            type="button"
            onClick={onToggleReport}
            aria-pressed={reportOpen}
            className={`px-3 py-2 font-display text-[13px] tracking-[0.14em] uppercase ${
              reportOpen
                ? "border border-lime bg-transparent text-lime hover:bg-lime/10"
                : "bg-lime text-field hover:bg-lime/85"
            }`}
          >
            {reportOpen ? "Close example" : "Add fictional example"}
          </button>
          <button
            type="button"
            onClick={onCorrelate}
            disabled={correlating}
            aria-busy={correlating}
            className="border border-bone/50 px-3 py-2 font-display text-[13px] tracking-[0.14em] text-bone uppercase hover:border-lime hover:text-lime disabled:cursor-wait disabled:opacity-50"
          >
            {correlating ? "Reading…" : "Run analysis"}
          </button>
        </div>
      </div>
    </header>
  );
}
