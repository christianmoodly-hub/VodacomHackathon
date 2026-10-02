import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { formatHistory } from "../leads.js";
import StatusChip from "./StatusChip.jsx";

const options = [
  { status: "Unreviewed", description: "No decision recorded yet." },
  { status: "Verified", description: "Checked and worth pursuing. Does not mean the records are connected." },
  { status: "Needs more info", description: "Cannot decide without further records or context." },
  { status: "Dismissed", description: "Reviewed and not worth pursuing." },
];

export default function ReviewPanel({ lead, review, reviewerId, reviewedCount, totalCount, onSave }) {
  const current = review?.status ?? "Unreviewed";
  const [draft, setDraft] = useState(current);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = window.setTimeout(() => setSaved(false), 2400);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const canSave = draft !== current || note.trim().length > 0;
  const progress = totalCount === 0 ? 0 : (reviewedCount / totalCount) * 100;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSave) return;
    onSave(lead.id, draft, note);
    setNote("");
    setSaved(true);
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[12.5px] font-medium text-ink-muted">Review progress</p>
          <p className="text-[12.5px] tabular-nums text-ink-muted">
            <span className="font-semibold text-ink">{reviewedCount}</span> of {totalCount} reviewed
          </p>
        </div>
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-canvas"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-valuenow={reviewedCount}
          aria-label="Leads reviewed"
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">Reviewer decision</h2>
        <p className="mt-0.5 font-mono text-[12px] text-ink-subtle">
          {lead.caseA} · {lead.caseB}
        </p>

        <fieldset className="mt-4">
          <legend className="sr-only">Decision for this lead</legend>
          <div className="space-y-1.5">
            {options.map((option) => {
              const active = draft === option.status;
              return (
                <label
                  key={option.status}
                  className={`flex cursor-pointer gap-2.5 rounded-lg border px-3 py-2.5 transition-colors duration-150 ease-out has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40 ${
                    active ? "border-accent/40 bg-accent-soft" : "border-line hover:bg-canvas"
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    value={option.status}
                    checked={active}
                    onChange={() => setDraft(option.status)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                      active ? "border-accent" : "border-line-strong"
                    }`}
                  >
                    {active ? <span className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                  </span>
                  <span>
                    <span className="block text-[13px] font-medium text-ink">{option.status}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-ink-muted">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label htmlFor="reviewer-note" className="mt-5 block text-[12.5px] font-medium text-ink">
          Reviewer note <span className="font-normal text-ink-subtle">(optional)</span>
        </label>
        <textarea
          id="reviewer-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder="What did you check? What would change your view?"
          className="mt-1.5 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
        />

        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex h-8 items-center whitespace-nowrap rounded-md bg-accent px-3.5 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-muted"
          >
            Record decision
          </button>
          {saved ? (
            <span role="status" className="inline-flex items-center gap-1 text-[12.5px] text-verified">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Decision recorded
            </span>
          ) : null}
        </div>
      </form>

      <section aria-labelledby="history-heading" className="border-t border-line px-5 py-5">
        <h3 id="history-heading" className="text-[13px] font-semibold text-ink">
          This lead
        </h3>
        {!review || review.history.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-ink-subtle">No decisions recorded for this lead yet.</p>
        ) : (
          <ol className="mt-3 space-y-4">
            {review.history.map((entry) => (
              <li key={entry.at} className="relative border-l border-line pl-3">
                <div className="flex items-center justify-between gap-2">
                  <StatusChip status={entry.status} />
                  <time dateTime={entry.at} className="text-[11.5px] tabular-nums text-ink-subtle">
                    {formatHistory(entry.at)}
                  </time>
                </div>
                <p className="mt-1 text-[11.5px] text-ink-subtle">
                  Reviewer {entry.reviewer}
                  {entry.reviewer === reviewerId ? " (you)" : ""}
                </p>
                {entry.note ? <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink">{entry.note}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
