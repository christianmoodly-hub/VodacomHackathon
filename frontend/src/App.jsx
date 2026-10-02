import { useEffect, useRef, useState } from "react";
import { createCase } from "./api.js";
import { formatSync } from "./format.js";
import DispatchMap from "./components/DispatchMap.jsx";
import Header from "./components/Header.jsx";
import Ledger from "./components/Ledger.jsx";
import ReportPanel from "./components/ReportPanel.jsx";
import { PACK_SUMMARY, SYNTHETIC_CASES, SYNTHETIC_LEADS, SYNTHETIC_ZONES } from "./synthetic.js";

function clusterLabel(count) {
  const value = Number(count) || 0;
  return `${value} ${value === 1 ? "lead" : "leads"}`;
}

export default function App() {
  const headerRef = useRef(null);
  const [headerOffset, setHeaderOffset] = useState(72);
  const [hotspots] = useState(SYNTHETIC_ZONES);
  const [ledgerView, setLedgerView] = useState("zones");
  const [booted] = useState(true);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(
    SYNTHETIC_ZONES.find((zone) => zone.worsening)?.hotspot_id || null,
  );
  const [focusToken, setFocusToken] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);
  const [pin, setPin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [reportKey, setReportKey] = useState(0);
  const [correlating, setCorrelating] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [ledgerExpanded, setLedgerExpanded] = useState(false);

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(() => setHeaderOffset(element.offsetHeight));
    observer.observe(element);
    setHeaderOffset(element.offsetHeight);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape" && reportOpen) {
        setReportOpen(false);
        setPin(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reportOpen]);

  function selectHotspot(id) {
    setSelectedId(id);
    setFocusToken((token) => token + 1);
  }

  function openReport() {
    setReportKey((key) => key + 1);
    setPin(null);
    setSubmitError("");
    setConfirmation(null);
    setReportOpen(true);
    setLedgerExpanded(false);
  }

  function closeReport() {
    setReportOpen(false);
    setPin(null);
  }

  function handleRefresh() {
    setRefreshing(true);
    setLastSync(new Date());
    setError("");
    window.setTimeout(() => setRefreshing(false), 250);
  }

  async function handleSubmit(body) {
    setSubmitting(true);
    setSubmitError("");
    try {
      const created = await createCase(body);
      setConfirmation(created);
    } catch (caught) {
      setSubmitError(caught?.message || "Could not log the case");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCorrelate() {
    setCorrelating(true);
    setAnalysisError("");
    setLedgerView("zones");
    setSelectedId(SYNTHETIC_ZONES.find((zone) => zone.worsening)?.hotspot_id || null);
    setFocusToken((token) => token + 1);
    window.setTimeout(() => {
      setAnalysis({
        analyzed_case_count: SYNTHETIC_CASES.length,
        skipped_case_count: 0,
        cluster_count: SYNTHETIC_LEADS.length,
        headline: PACK_SUMMARY,
      });
      setCorrelating(false);
    }, 280);
  }

  const hasHigh = hotspots.some((item) => item.risk_level === "HIGH");

  return (
    <div
      className={`map-shell relative h-dvh overflow-hidden bg-field text-bone ${
        reportOpen ? "is-reporting" : ""
      }`}
      style={{
        "--chrome-top": `${headerOffset + 10}px`,
        "--panel-top": `${headerOffset + 12}px`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_120px_rgba(18,17,14,0.55)]"
        aria-hidden="true"
      />

      <DispatchMap
        hotspots={hotspots}
        selectedId={selectedId}
        focusToken={focusToken}
        reportOpen={reportOpen}
        pin={reportOpen ? pin : null}
        onSelect={selectHotspot}
        onPlace={setPin}
      />

      <Header
        headerRef={headerRef}
        hasHigh={hasHigh}
        lastSync={lastSync}
        zoneCount={hotspots.length}
        refreshing={refreshing || !booted}
        reportOpen={reportOpen}
        correlating={correlating}
        onRefresh={handleRefresh}
        onToggleReport={() => (reportOpen ? closeReport() : openReport())}
        onCorrelate={handleCorrelate}
      />

      {reportOpen && !pin ? (
        <p
          className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 border border-lime/50 bg-field/95 px-3 py-1.5 text-center font-display text-[12px] tracking-[0.16em] text-lime uppercase"
          style={{ top: headerOffset + 12 }}
        >
          Click the map to place
        </p>
      ) : null}

      <div
        className={`pointer-events-none absolute left-3 z-30 flex flex-col gap-2 max-md:right-16 md:left-[364px] ${
          reportOpen ? "md:right-[384px]" : "md:w-[min(420px,calc(100%-380px))]"
        }`}
        style={{ top: headerOffset + (reportOpen && !pin ? 56 : 12) }}
      >
        {error ? (
          <div
            role="alert"
            className="pointer-events-auto flex items-start gap-3 border border-ember/50 border-l-[3px] bg-field/95 px-3 py-2 text-sm leading-snug"
          >
            <p className="min-w-0 flex-1">
              {lastSync ? `Last sync kept at ${formatSync(lastSync)}. ` : null}
              {error}
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="shrink-0 border border-bone/40 px-2 py-1 font-display text-[12px] tracking-[0.12em] uppercase hover:border-lime hover:text-lime"
            >
              Retry
            </button>
          </div>
        ) : null}

        {analysisError ? (
          <div
            role="alert"
            className="pointer-events-auto border border-ember/50 border-l-[3px] bg-field/95 px-3 py-2 text-sm"
          >
            {analysisError}
          </div>
        ) : null}

        {analysis && !analysisError ? (
          <div
            role="status"
            className="pointer-events-auto border border-lime/40 border-l-[3px] bg-field/95 px-3 py-2 text-sm"
          >
            <span className="font-display tracking-[0.12em] text-lime uppercase">Analysis</span>
            <span className="mt-1 block max-w-xl font-display text-[16px] leading-snug tracking-[0.03em]">
              {analysis.headline ||
                `${Number(analysis.analyzed_case_count) || 0} cases · ${clusterLabel(analysis.cluster_count)}`}
            </span>
            <span className="mt-1 block font-display text-[12px] tracking-[0.12em] text-brass uppercase">
              {SYNTHETIC_CASES.length} cases · {clusterLabel(SYNTHETIC_LEADS.length)} · not conclusions
            </span>
          </div>
        ) : null}

        {correlating ? (
          <p className="pointer-events-none font-display text-[13px] tracking-[0.16em] text-brass uppercase">
            Reading the synthetic pack…
          </p>
        ) : null}
      </div>

      <Ledger
        view={ledgerView}
        onView={setLedgerView}
        hotspots={hotspots}
        cases={SYNTHETIC_CASES}
        leads={SYNTHETIC_LEADS}
        selectedId={selectedId}
        booted={booted}
        error={error}
        lastSync={lastSync}
        expanded={ledgerExpanded}
        hiddenOnMobile={reportOpen}
        onToggleExpanded={() => setLedgerExpanded((open) => !open)}
        onSelect={selectHotspot}
      />

      {reportOpen ? (
        <ReportPanel
          key={reportKey}
          pin={pin}
          submitting={submitting}
          error={submitError}
          confirmation={confirmation}
          onClose={closeReport}
          onSubmit={handleSubmit}
          onLogAnother={openReport}
        />
      ) : null}
    </div>
  );
}
