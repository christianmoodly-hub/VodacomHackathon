import { formatSync, padCount } from "../format.js";

function Pulse({ high }) {
  const color = high ? "bg-ember" : "bg-lime";
  return (
    <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
      <span className={`signal-ring absolute inline-flex size-2.5 ${color}`} />
      <span className={`relative inline-flex size-2.5 ${color}`} />
    </span>
  );
}

export default function Header({
  headerRef,
  hasHigh,
  lastSync,
  zoneCount,
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
      className="absolute inset-x-0 top-0 z-30 border-b border-brass/30 bg-field text-bone"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-4">
        <div className="min-w-0 leading-none">
          <p className="font-display text-[26px] font-semibold tracking-[0.08em] sm:text-[30px]">
            SHE-SHIELD
          </p>
          <p className="mt-0.5 font-display text-[11px] tracking-[0.28em] text-brass uppercase">
            Johannesburg dispatch
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:ml-2">
          <p
            className={`flex items-center gap-2 font-display text-[13px] tracking-[0.22em] ${
              hasHigh ? "text-ember" : "text-lime"
            }`}
            title={
              hasHigh
                ? "Ember pulse: at least one zone is HIGH"
                : "Lime pulse: no high-risk zone on the board"
            }
          >
            <Pulse high={hasHigh} />
            LIVE
            {hasHigh ? <span className="tracking-[0.16em]">HIGH ZONE</span> : null}
          </p>
          <p className="font-display text-[13px] tracking-[0.16em] text-brass tabular-nums">
            <span className="sr-only">Last successful sync </span>
            SYNC {lastSync ? formatSync(lastSync) : refreshing ? "…" : "—"}
          </p>
          <p className="font-display text-[13px] tracking-[0.16em] text-bone tabular-nums">
            {padCount(zoneCount)} ZONES
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="border border-brass/40 px-3 py-2 font-display text-[13px] tracking-[0.14em] text-brass uppercase transition-colors hover:border-bone hover:text-bone disabled:cursor-wait disabled:opacity-50"
          >
            {refreshing ? "Syncing" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={onToggleReport}
            aria-pressed={reportOpen}
            className={`px-3 py-2 font-display text-[13px] tracking-[0.14em] uppercase transition-colors ${
              reportOpen
                ? "border border-lime bg-transparent text-lime hover:bg-lime/10"
                : "bg-lime text-field hover:bg-lime/85"
            }`}
          >
            {reportOpen ? "Close report" : "Report a case"}
          </button>
          <button
            type="button"
            onClick={onCorrelate}
            disabled={correlating}
            aria-busy={correlating}
            className="border border-bone/50 px-3 py-2 font-display text-[13px] tracking-[0.14em] text-bone uppercase transition-colors hover:border-lime hover:text-lime disabled:cursor-wait disabled:opacity-50"
          >
            {correlating ? "Analyzing…" : "Run analysis"}
          </button>
        </div>
      </div>
    </header>
  );
}
