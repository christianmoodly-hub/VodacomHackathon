import LeadGroup from "./LeadGroup.jsx";

const filters = [
  { value: "all", label: "All" },
  { value: "unreviewed", label: "Unreviewed" },
  { value: "reviewed", label: "Reviewed" },
];

export default function LeadsList({
  areaLeads,
  namedLeads,
  rules,
  filter,
  onFilterChange,
  onSameAreaDays,
  onCrossAreaDays,
  selectedId,
  statusFor,
  onSelect,
  isRunning,
}) {
  const emptyText = filter === "all" ? "No leads found by this rule." : "No leads in this view.";

  return (
    <div className={`transition-opacity duration-200 ease-out ${isRunning ? "opacity-50" : "opacity-100"}`} aria-busy={isRunning}>
      <div className="sticky top-0 z-10 border-b border-line bg-surface px-4 pb-3 pt-4">
        <h1 className="text-[15px] font-semibold tracking-tight text-ink">Possible leads</h1>
        <div role="radiogroup" aria-label="Filter leads by review status" className="mt-3 grid grid-cols-3 rounded-md bg-canvas p-0.5">
          {filters.map((item) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onFilterChange(item.value)}
                className={`h-7 rounded-[5px] text-[12px] font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  active ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] font-medium text-ink-subtle">Same area, days</span>
            <input
              type="number"
              min="1"
              max="365"
              value={rules.sameAreaWindowDays}
              onChange={(event) => onSameAreaDays(event.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-line bg-surface px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-ink-subtle">Different areas, days</span>
            <input
              type="number"
              min="1"
              max="365"
              value={rules.crossAreaWindowDays}
              onChange={(event) => onCrossAreaDays(event.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-line bg-surface px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-ink-subtle">Reviewer assumptions, not columns in the CSV.</p>
      </div>

      <LeadGroup
        id="group-area-timing"
        title="Area / timing leads"
        description={`Same area within ${rules.sameAreaWindowDays} days, or different areas within ${rules.crossAreaWindowDays} days.`}
        leads={areaLeads}
        emptyText={emptyText}
        selectedId={selectedId}
        statusFor={statusFor}
        onSelect={onSelect}
      />
      <div className="mx-4 h-px bg-line" aria-hidden="true" />
      <LeadGroup
        id="group-named"
        title="Links named in the data"
        description="A record names another case as possibly related. Shown whether or not area and timing agree."
        leads={namedLeads}
        emptyText={emptyText}
        selectedId={selectedId}
        statusFor={statusFor}
        onSelect={onSelect}
      />
    </div>
  );
}
