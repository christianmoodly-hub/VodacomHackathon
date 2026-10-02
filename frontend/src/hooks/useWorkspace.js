import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAudit, postBrief, postDecision } from "../api.js";
import { fictionalExamples } from "../examples.js";
import {
  analyseRecords,
  coordinationBrief,
  DATA_FILE,
  DEFAULT_CROSS_AREA_DAYS,
  DEFAULT_SAME_AREA_DAYS,
  REVIEWER_ID,
} from "../leads.js";
import { SOURCE_RECORDS } from "../synthetic.js";

const ANALYSIS_DURATION_MS = 650;
const API_DECISION = {
  Verified: "verified",
  Dismissed: "dismissed",
  "Needs more info": "needs_more_info",
};

function placeholderRecord(record) {
  return {
    case_id: record.case_id,
    record_type: record.record_type,
    date_reported: record.date_reported,
    area_code: record.area_code,
    risk_indicator: record.risk_indicator,
    possible_linked_case_ref: record.possible_linked_case_ref || null,
  };
}

export function useWorkspace() {
  const [records, setRecords] = useState(SOURCE_RECORDS);
  const [analysedRecords, setAnalysedRecords] = useState(SOURCE_RECORDS);
  const [sameAreaWindowDays, setSameAreaWindowDays] = useState(DEFAULT_SAME_AREA_DAYS);
  const [crossAreaWindowDays, setCrossAreaWindowDays] = useState(DEFAULT_CROSS_AREA_DAYS);
  const [ranAt, setRanAt] = useState(() => new Date());
  const [isRunning, setIsRunning] = useState(false);
  const [reviews, setReviews] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [briefFor, setBriefs] = useState({});
  const [briefPending, setBriefPending] = useState(false);
  const [offline, setOffline] = useState(false);
  const [auditItems, setAuditItems] = useState([]);
  const timer = useRef(undefined);
  const briefRequest = useRef(0);
  const recordsRef = useRef(records);
  recordsRef.current = records;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const rules = useMemo(
    () => ({ sameAreaWindowDays, crossAreaWindowDays }),
    [sameAreaWindowDays, crossAreaWindowDays],
  );

  const { areaLeads, namedLeads } = useMemo(
    () => analyseRecords(analysedRecords, rules),
    [analysedRecords, rules],
  );
  const allLeads = useMemo(() => [...areaLeads, ...namedLeads], [areaLeads, namedLeads]);
  const recordMap = useMemo(() => new Map(analysedRecords.map((record) => [record.case_id, record])), [analysedRecords]);

  const statusFor = useCallback((id) => reviews[id]?.status ?? "Unreviewed", [reviews]);

  const matchesFilter = useCallback(
    (lead) => {
      if (filter === "all") return true;
      const reviewed = statusFor(lead.id) !== "Unreviewed";
      return filter === "reviewed" ? reviewed : !reviewed;
    },
    [filter, statusFor],
  );

  const selectedLead = allLeads.find((lead) => lead.id === selectedId) ?? allLeads[0] ?? null;
  const relatedLeads = selectedLead
    ? allLeads.filter(
        (lead) =>
          lead.id !== selectedLead.id &&
          [lead.caseA, lead.caseB].some((id) => id === selectedLead.caseA || id === selectedLead.caseB),
      )
    : [];

  const brief = selectedLead ? briefFor[selectedLead.id] || "" : "";

  const refreshAudit = useCallback(async () => {
    try {
      const data = await getAudit();
      setAuditItems(Array.isArray(data.items) ? data.items : []);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    refreshAudit();
  }, [refreshAudit]);

  const runAnalysis = useCallback(() => {
    window.clearTimeout(timer.current);
    setIsRunning(true);
    timer.current = window.setTimeout(() => {
      setAnalysedRecords(recordsRef.current);
      setRanAt(new Date());
      setIsRunning(false);
    }, ANALYSIS_DURATION_MS);
  }, []);

  const reset = useCallback(() => {
    window.clearTimeout(timer.current);
    setIsRunning(false);
    setRecords(SOURCE_RECORDS);
    setAnalysedRecords(SOURCE_RECORDS);
    setSameAreaWindowDays(DEFAULT_SAME_AREA_DAYS);
    setCrossAreaWindowDays(DEFAULT_CROSS_AREA_DAYS);
    setReviews({});
    setSelectedId(null);
    setFilter("all");
    setBriefs({});
    setBriefPending(false);
    setRanAt(new Date());
  }, []);

  const addedCount = records.length - SOURCE_RECORDS.length;
  const nextExample = fictionalExamples[addedCount];

  const addExample = useCallback(() => {
    if (!nextExample) return;
    setRecords((prev) => [...prev, nextExample]);
  }, [nextExample]);

  const saveDecision = useCallback(
    (leadId, status, note) => {
      setReviews((prev) => ({
        ...prev,
        [leadId]: {
          status,
          history: [
            { status, note: note.trim(), at: new Date().toISOString(), reviewer: REVIEWER_ID },
            ...(prev[leadId]?.history ?? []),
          ],
        },
      }));
      const decision = API_DECISION[status];
      if (!decision) return;
      postDecision({
        lead_id: leadId,
        decision,
        reviewer: REVIEWER_ID,
        thresholds: {
          same_area_days: sameAreaWindowDays,
          cross_area_days: crossAreaWindowDays,
        },
      })
        .then(() => refreshAudit())
        .catch(() => setOffline(true));
    },
    [crossAreaWindowDays, refreshAudit, sameAreaWindowDays],
  );

  function localBrief(lead) {
    const recordA = recordMap.get(lead.caseA);
    const recordB = recordMap.get(lead.caseB);
    const current = reviews[lead.id];
    return coordinationBrief({
      lead,
      recordA,
      recordB,
      rules,
      runAt: new Date(),
      decision: current?.status,
      note: current?.history?.[0]?.note || "",
    });
  }

  function showBrief() {
    if (!selectedLead) return;
    const lead = selectedLead;
    const recordA = recordMap.get(lead.caseA);
    const recordB = recordMap.get(lead.caseB);
    if (!recordA || !recordB) return;
    const request = briefRequest.current + 1;
    briefRequest.current = request;
    setBriefPending(true);
    postBrief({
      lead_id: lead.id,
      source: lead.source,
      supported: lead.supported,
      reason: lead.reason,
      days_apart: lead.daysApart,
      data_file: DATA_FILE,
      reviewer: REVIEWER_ID,
      thresholds: {
        same_area_days: rules.sameAreaWindowDays,
        cross_area_days: rules.crossAreaWindowDays,
      },
      records: [placeholderRecord(recordA), placeholderRecord(recordB)],
    })
      .then((data) => {
        if (briefRequest.current !== request) return;
        setBriefs((prev) => ({ ...prev, [lead.id]: data.brief || localBrief(lead) }));
        return refreshAudit();
      })
      .catch(() => {
        if (briefRequest.current !== request) return;
        setOffline(true);
        setBriefs((prev) => ({ ...prev, [lead.id]: localBrief(lead) }));
      })
      .finally(() => {
        if (briefRequest.current === request) setBriefPending(false);
      });
  }

  function applyWindow(value, current, setter) {
    const next = Number(value);
    if (!Number.isInteger(next) || next < 1 || next > 365 || next === current) return;
    setter(next);
    setRanAt(new Date());
  }

  return {
    rules,
    records,
    recordMap,
    areaLeads: areaLeads.filter(matchesFilter),
    namedLeads: namedLeads.filter(matchesFilter),
    totalLeads: allLeads.length,
    reviewedCount: allLeads.filter((lead) => statusFor(lead.id) !== "Unreviewed").length,
    selectedLead,
    relatedLeads,
    reviews,
    statusFor,
    filter,
    setFilter,
    select: setSelectedId,
    isRunning,
    ranAt,
    pendingRecords: records.length - analysedRecords.length,
    canAddExample: Boolean(nextExample),
    runAnalysis,
    reset,
    addExample,
    saveDecision,
    reviewerId: REVIEWER_ID,
    originalCount: SOURCE_RECORDS.length,
    setSameAreaDays: (value) => applyWindow(value, sameAreaWindowDays, setSameAreaWindowDays),
    setCrossAreaDays: (value) => applyWindow(value, crossAreaWindowDays, setCrossAreaWindowDays),
    brief,
    briefPending,
    showBrief,
    offline,
    auditItems,
  };
}
