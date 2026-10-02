import { useCallback, useEffect, useRef, useState } from "react";
import { correlateCases, createCase, getHotspots } from "./api.js";
import { formatSync } from "./format.js";
import { normalizeHotspot } from "./geo.js";
import DispatchMap from "./components/DispatchMap.jsx";
import Header from "./components/Header.jsx";
import Ledger from "./components/Ledger.jsx";
import ReportPanel from "./components/ReportPanel.jsx";

const POLL_MS = 20000;

function sortHotspots(list) {
  return [...list].sort((a, b) => {
    if (a.risk_level !== b.risk_level) return a.risk_level === "HIGH" ? -1 : 1;
    return b.active_case_count - a.active_case_count;
  });
}

export default function App() {
  const headerRef = useRef(null);
  const abortRef = useRef(null);
  const [headerOffset, setHeaderOffset] = useState(72);
  const [hotspots, setHotspots] = useState([]);
  const [booted, setBooted] = useState(false);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [focusToken, setFocusToken] = useState(0);
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

  const refreshHotspots = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);
    try {
      const data = await getHotspots(controller.signal);
      if (controller.signal.aborted) return;
      const list = sortHotspots(
        (Array.isArray(data.hotspots) ? data.hotspots : [])
          .map(normalizeHotspot)
          .filter(Boolean),
      );
      setHotspots(list);
      setLastSync(new Date());
      setError("");
      setSelectedId((current) =>
        current && list.some((item) => item.hotspot_id === current) ? current : null,
      );
    } catch (caught) {
      const replaced = abortRef.current !== controller;
      if (caught?.name === "AbortError" && replaced) return;
      setError(
        caught?.name === "AbortError"
          ? "The dispatch API timed out"
          : caught?.message || "Could not load hotspots",
      );
    } finally {
      window.clearTimeout(timeoutId);
      if (abortRef.current === controller) setBooted(true);
    }
  }, []);

  useEffect(() => {
    refreshHotspots();
    const timer = window.setInterval(refreshHotspots, POLL_MS);
    return () => {
      window.clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [refreshHotspots]);

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

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshHotspots();
    } finally {
      setRefreshing(false);
    }
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

  async function handleCorrelate() {
    setCorrelating(true);
    setAnalysisError("");
    try {
      const summary = await correlateCases();
      setAnalysis(summary);
      await refreshHotspots();
    } catch (caught) {
      setAnalysisError(caught?.message || "Analysis failed");
    } finally {
      setCorrelating(false);
    }
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
        className={`pointer-events-none absolute left-3 z-30 flex flex-col gap-2 max-md:right-3 md:left-[364px] ${
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
            <span className="mt-1 block font-display text-[16px] tracking-[0.04em] tabular-nums">
              {Number(analysis.analyzed_case_count) || 0} analyzed ·{" "}
              {Number(analysis.cluster_count) || 0} clusters
              {typeof analysis.skipped_case_count === "number"
                ? ` · ${analysis.skipped_case_count} skipped`
                : ""}
            </span>
          </div>
        ) : null}

        {correlating ? (
          <p className="pointer-events-none font-display text-[13px] tracking-[0.16em] text-brass uppercase">
            Clustering open cases…
          </p>
        ) : null}
      </div>

      <Ledger
        hotspots={hotspots}
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
