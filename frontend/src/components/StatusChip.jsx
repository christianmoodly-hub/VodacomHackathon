import { Check, CircleDashed, HelpCircle, Minus } from "lucide-react";

const styles = {
  Unreviewed: { cls: "border-line-strong bg-surface text-ink-muted", Icon: CircleDashed },
  Verified: { cls: "border-transparent bg-verified-soft text-verified", Icon: Check },
  "Needs more info": { cls: "border-transparent bg-info-soft text-info", Icon: HelpCircle },
  Dismissed: { cls: "border-transparent bg-dismissed-soft text-dismissed", Icon: Minus },
};

export default function StatusChip({ status }) {
  const { cls, Icon } = styles[status];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" strokeWidth={2.25} aria-hidden="true" />
      {status}
    </span>
  );
}
