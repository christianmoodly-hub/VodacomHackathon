import { ArrowLeftRight, ArrowRight, Info } from "lucide-react";
import StatusChip from "./StatusChip.jsx";
import StrengthLabel from "./StrengthLabel.jsx";

export default function LeadCard({ lead, status, selected, onSelect }) {
  const isNamed = lead.source === "named";
  const PairIcon = isNamed ? ArrowRight : ArrowLeftRight;

  return (
    <button
      type="button"
      onClick={() => onSelect(lead.id)}
      aria-current={selected ? "true" : undefined}
      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
        selected ? "border-accent/40 bg-accent-soft" : "border-line bg-surface hover:border-line-strong hover:bg-canvas"
      }`}
    >
      <span className="flex items-center gap-1.5 font-mono text-[12.5px] font-medium text-ink">
        <span>{lead.caseA}</span>
        <PairIcon className="h-3 w-3 shrink-0 text-ink-subtle" aria-hidden="true" />
        <span className="sr-only">{isNamed ? "names" : "and"}</span>
        <span>{lead.caseB}</span>
      </span>
      <span className="mt-1 block truncate text-[12.5px] text-ink-muted">{lead.reason}</span>
      {isNamed && !lead.supported ? (
        <span className="mt-1.5 flex items-center gap-1 text-[11.5px] text-ink-subtle">
          <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
          Not supported by area/timing
        </span>
      ) : null}
      <span className="mt-2 flex items-center justify-between gap-2">
        <StrengthLabel strength={lead.strength} />
        <StatusChip status={status} />
      </span>
    </button>
  );
}
