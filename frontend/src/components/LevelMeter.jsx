export default function LevelMeter({ filled, label, srPrefix, className = "text-[11.5px] text-ink-muted" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap font-medium ${className}`}>
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={`w-[3px] rounded-[1px] ${step <= filled ? "bg-ink-muted" : "bg-line-strong"}`}
            style={{ height: 3 + step * 2.5 }}
          />
        ))}
      </span>
      <span className="sr-only">{srPrefix}: </span>
      {label}
    </span>
  );
}
