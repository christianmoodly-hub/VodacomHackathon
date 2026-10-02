import { Loader2, Play, Plus, Shield } from "lucide-react";
import { formatClock } from "../leads.js";
import ResetButton from "./ResetButton.jsx";

export default function TopBar({
  recordCount,
  originalCount,
  leadCount,
  isRunning,
  pendingRecords,
  ranAt,
  canAddExample,
  onRun,
  onReset,
  onAddExample,
  offline,
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-line bg-surface px-4">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-accent" strokeWidth={2} aria-hidden="true" />
        <span className="whitespace-nowrap text-[14px] font-semibold tracking-tight text-ink">SHE-SHIELD Response</span>
      </div>
      <span className="whitespace-nowrap rounded border border-line bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
        Synthetic data
      </span>
      {offline ? (
        <span className="whitespace-nowrap rounded border border-info/30 bg-info-soft px-1.5 py-0.5 text-[11px] font-medium text-info">
          Offline mode
        </span>
      ) : null}
      <span className="h-4 w-px bg-line" aria-hidden="true" />
      <p className="whitespace-nowrap text-[12.5px] text-ink-muted">
        <span className="font-medium text-ink">{recordCount}</span> records
        <span className="mx-1.5 text-ink-subtle">·</span>
        <span className="font-medium text-ink">{leadCount}</span> possible leads
      </p>
      <p className="truncate text-[12px] text-ink-subtle" role="status" aria-live="polite">
        {isRunning ? (
          `Analysing ${recordCount} records…`
        ) : pendingRecords > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-info">
            <span className="h-1.5 w-1.5 rounded-full bg-info" aria-hidden="true" />
            {pendingRecords} new {pendingRecords === 1 ? "record" : "records"} not yet analysed
          </span>
        ) : (
          `Last run ${formatClock(ranAt)}`
        )}
      </p>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onAddExample}
          disabled={!canAddExample || isRunning}
          title={canAddExample ? undefined : "All fictional examples have been added"}
          className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium text-ink-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add fictional example
        </button>
        <ResetButton originalCount={originalCount} onConfirm={onReset} />
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className="ml-1 inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md bg-accent px-3 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-80"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isRunning ? "Analysing…" : "Run analysis"}
        </button>
      </div>
    </header>
  );
}
