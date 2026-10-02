import { formatHistory } from "../leads.js";

const decisionLabel = {
  verified: "Verified",
  dismissed: "Dismissed",
  needs_more_info: "Needs more info",
};

export default function AuditLog({ items, offline }) {
  return (
    <section aria-labelledby="audit-heading" className="border-t border-line px-5 py-5">
      <h2 id="audit-heading" className="text-[13px] font-semibold text-ink">
        Decision history
      </h2>
      {offline ? (
        <p className="mt-2 text-[12.5px] leading-relaxed text-info">
          Offline mode. Server history is unavailable. A brief is written from the local template.
        </p>
      ) : null}
      {!offline && items.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-ink-subtle">No audit or decision rows yet.</p>
      ) : null}
      {items.length > 0 ? (
        <ol className="mt-3 space-y-4">
          {items.map((item) => (
            <li key={`${item.lead_id}-${item.timestamp}`} className="border-l border-line pl-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12.5px] font-medium text-ink">
                  {item.item_type === "decision" ? decisionLabel[item.decision] || item.decision : "Brief audit"}
                </p>
                <time dateTime={item.timestamp} className="text-[11.5px] tabular-nums text-ink-subtle">
                  {formatHistory(item.timestamp)}
                </time>
              </div>
              <p className="mt-1 break-all font-mono text-[11px] text-ink-muted">{item.lead_id}</p>
              <p className="mt-1 text-[11.5px] text-ink-subtle">
                Reviewer {item.reviewer || "R-07"}
                {item.model_id ? ` · ${item.model_id}` : ""}
                {item.data_file ? ` · ${item.data_file}` : ""}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
