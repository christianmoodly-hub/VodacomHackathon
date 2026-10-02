import { ArrowLeftRight, ArrowRight, Check, Info, Minus } from "lucide-react";
import { assessEvidence } from "../leads.js";
import RecordComparison from "./RecordComparison.jsx";
import StatusChip from "./StatusChip.jsx";
import StrengthLabel from "./StrengthLabel.jsx";

export default function LeadDetail({
  lead,
  recordA,
  recordB,
  status,
  rules,
  relatedLeads,
  statusFor,
  onSelect,
  brief,
  briefPending,
  onGenerate,
}) {
  const isNamed = lead.source === "named";
  const evidence = assessEvidence(recordA, recordB, rules);

  return (
    <article key={lead.id} className="mx-auto w-full max-w-[900px] px-8 py-7" aria-labelledby="lead-title">
      <p className="text-[12.5px] text-ink-muted">
        Possible lead · {isNamed ? "Named in the data" : "Found by area / timing rule"}
      </p>
      <h2 id="lead-title" className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[20px] font-semibold tracking-tight text-ink">
        {lead.caseA}
        {isNamed ? (
          <ArrowRight className="h-4 w-4 text-ink-subtle" aria-label="names" />
        ) : (
          <ArrowLeftRight className="h-4 w-4 text-ink-subtle" aria-label="and" />
        )}
        {lead.caseB}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[13.5px] text-ink">{lead.reason}</span>
        <StrengthLabel strength={lead.strength} className="text-[12.5px] text-ink-muted" />
        <StatusChip status={status} />
      </div>

      <div className="mt-5 flex gap-2.5 rounded-lg border border-line bg-surface px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <div className="text-[12.5px] leading-relaxed text-ink-muted">
          <p>
            <span className="font-medium text-ink">Needs verification.</span> This lead was raised automatically from
            synthetic data. It is not a finding. A reviewer decides whether it is worth pursuing.
          </p>
          {isNamed && !lead.supported ? (
            <p className="mt-1.5">
              <span className="font-medium text-ink">Not supported by area/timing.</span> {lead.caseA} names {lead.caseB},
              but they are in different areas or too far apart in time. It is shown here so a reviewer can assess it.
            </p>
          ) : null}
        </div>
      </div>

      <section aria-labelledby="compare-heading" className="mt-8">
        <h3 id="compare-heading" className="mb-3 text-[14px] font-semibold text-ink">
          Records side by side
        </h3>
        <RecordComparison a={recordA} b={recordB} daysApart={lead.daysApart} />
      </section>

      <section aria-labelledby="evidence-heading" className="mt-8">
        <h3 id="evidence-heading" className="text-[14px] font-semibold text-ink">
          Why this lead was raised
        </h3>
        <dl className="mt-3 divide-y divide-line border-y border-line">
          {evidence.map((item) => (
            <div key={item.label} className="grid grid-cols-[136px_minmax(0,1fr)_auto] items-center gap-3 py-3">
              <dt className="text-[12.5px] font-medium text-ink-muted">{item.label}</dt>
              <dd className="text-[13.5px] text-ink">{item.finding}</dd>
              <dd
                className={`inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-medium ${
                  item.supports ? "text-accent" : "text-ink-subtle"
                }`}
              >
                {item.supports ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {item.supports ? "Supports lead" : "Does not support"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="brief-heading" className="mt-8">
        <h3 id="brief-heading" className="text-[14px] font-semibold text-ink">
          Coordination brief
        </h3>
        <button
          type="button"
          onClick={onGenerate}
          disabled={briefPending}
          className="mt-3 inline-flex h-8 items-center rounded-md bg-accent px-3.5 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-wait disabled:opacity-70"
        >
          {briefPending ? "Generating…" : "Generate coordination brief"}
        </button>
        {brief ? (
          <div role="status" aria-live="polite" className="mt-3 rounded-lg border border-line bg-surface px-4 py-3">
            <pre className="font-sans text-[13px] leading-relaxed whitespace-pre-wrap text-ink">{brief}</pre>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="related-heading" className="mt-8">
        <h3 id="related-heading" className="text-[14px] font-semibold text-ink">
          Other possible leads involving these records
        </h3>
        {relatedLeads.length === 0 ? (
          <p className="mt-2 text-[13px] text-ink-subtle">No other leads involve {lead.caseA} or {lead.caseB}.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {relatedLeads.map((related) => (
              <li key={related.id}>
                <button
                  type="button"
                  onClick={() => onSelect(related.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-1 py-2.5 text-left transition-colors duration-150 ease-out hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <span className="min-w-0">
                    <span className="font-mono text-[12.5px] font-medium text-ink">
                      {related.caseA} {related.source === "named" ? "→" : "·"} {related.caseB}
                    </span>
                    <span className="ml-3 text-[12.5px] text-ink-muted">
                      {related.source === "named" ? "Named in data" : "Area / timing"} · {related.reason}
                    </span>
                  </span>
                  <StrengthLabel strength={related.strength} />
                  <StatusChip status={statusFor(related.id)} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
