import { formatCoord } from "../format.js";

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function ReportPanel({
  pin,
  submitting,
  error,
  confirmation,
  onClose,
  onSubmit,
  onLogAnother,
}) {
  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const description = String(data.get("description") || "").trim();
    const severity = String(data.get("severity") || "");
    if (!pin || !description || !SEVERITIES.some((item) => item.value === severity)) return;
    onSubmit({
      description,
      severity,
      coordinates: {
        latitude: pin.latitude,
        longitude: pin.longitude,
      },
    });
  }

  return (
    <aside
      role="region"
      aria-labelledby="report-title"
      className="z-40 flex max-h-[52vh] flex-col overflow-y-auto border border-brass/35 bg-ink text-bone shadow-[0_24px_60px_rgba(0,0,0,0.45)] max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:border-x-0 max-md:border-b-0 md:absolute md:right-3 md:top-[var(--panel-top)] md:max-h-[calc(100dvh-var(--panel-top)-12px)] md:w-[360px]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-brass/20 px-4 py-3">
        <div>
          <p className="font-display text-[11px] tracking-[0.24em] text-brass uppercase">New case</p>
          <h2 id="report-title" className="font-display text-[26px] leading-none tracking-[0.06em]">
            Report a case
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="border border-brass/40 px-2 py-1 font-display text-[12px] tracking-[0.14em] text-brass uppercase hover:border-bone hover:text-bone"
        >
          Close
        </button>
      </div>

      <form className="flex flex-col gap-4 px-4 py-4" onSubmit={handleSubmit} autoComplete="off">
        <div>
          <p className="font-display text-[11px] tracking-[0.2em] text-brass uppercase">Location</p>
          {pin ? (
            <p className="mt-1 font-display text-[18px] tracking-[0.06em] text-lime tabular-nums">
              {formatCoord(pin.latitude, pin.longitude)}
            </p>
          ) : (
            <p className="mt-1 text-sm leading-snug text-bone/85">
              Click the map to set coordinates. Clicks do nothing until this panel is open.
            </p>
          )}
        </div>

        <label className="block">
          <span className="font-display text-[11px] tracking-[0.2em] text-brass uppercase">
            Description
          </span>
          <textarea
            name="description"
            required
            rows={4}
            disabled={submitting || Boolean(confirmation)}
            placeholder="Who was last seen, and where"
            className="mt-1 w-full resize-y border border-brass/40 bg-field px-3 py-2 text-sm text-bone outline-none placeholder:text-brass/70 focus:border-lime disabled:opacity-60"
          />
        </label>

        <label className="block">
          <span className="font-display text-[11px] tracking-[0.2em] text-brass uppercase">
            Severity
          </span>
          <select
            name="severity"
            required
            defaultValue=""
            disabled={submitting || Boolean(confirmation)}
            className="mt-1 w-full border border-brass/40 bg-field px-3 py-2 text-sm text-bone outline-none focus:border-lime disabled:opacity-60"
          >
            <option value="" disabled>
              Select severity
            </option>
            {SEVERITIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p role="alert" className="border border-ember/50 bg-ember/10 px-3 py-2 text-sm leading-snug">
            {error}
          </p>
        ) : null}

        {confirmation ? (
          <div role="status" className="border border-lime/50 bg-lime/10 px-3 py-3">
            <p className="font-display text-[11px] tracking-[0.2em] text-lime uppercase">Case logged</p>
            <p className="mt-1 break-all font-display text-[18px] tracking-[0.04em]">
              {confirmation.case_id || "The API did not return a case id"}
            </p>
            {confirmation.status ? (
              <p className="mt-1 font-display text-[13px] tracking-[0.14em] text-brass">
                {confirmation.status}
              </p>
            ) : null}
          </div>
        ) : null}

        {confirmation ? (
          <button
            type="button"
            onClick={onLogAnother}
            className="bg-lime px-3 py-2.5 font-display text-[14px] tracking-[0.14em] text-field uppercase hover:bg-lime/85"
          >
            Log another
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting || !pin}
            aria-busy={submitting}
            className="bg-lime px-3 py-2.5 font-display text-[14px] tracking-[0.14em] text-field uppercase hover:bg-lime/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Logging case…" : "Log case"}
          </button>
        )}
      </form>
    </aside>
  );
}
