import LeadCard from "./LeadCard.jsx";

export default function LeadGroup({ id, title, description, leads, emptyText, selectedId, statusFor, onSelect }) {
  return (
    <section aria-labelledby={id} className="px-4 py-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={id} className="text-[13px] font-semibold text-ink">
          {title}
        </h2>
        <span className="text-[12px] tabular-nums text-ink-subtle">{leads.length}</span>
      </div>
      <p className="mt-0.5 text-[12px] leading-snug text-ink-subtle">{description}</p>
      {leads.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-line px-3 py-4 text-center text-[12.5px] text-ink-subtle">
          {emptyText}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {leads.map((lead) => (
            <li key={lead.id}>
              <LeadCard lead={lead} status={statusFor(lead.id)} selected={lead.id === selectedId} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
