import AuditLog from "./components/AuditLog.jsx";
import LeadDetail from "./components/LeadDetail.jsx";
import LeadsList from "./components/LeadsList.jsx";
import ReviewPanel from "./components/ReviewPanel.jsx";
import TopBar from "./components/TopBar.jsx";
import { useWorkspace } from "./hooks/useWorkspace.js";

export default function App() {
  const workspace = useWorkspace();
  const lead = workspace.selectedLead;
  const recordA = lead ? workspace.recordMap.get(lead.caseA) : undefined;
  const recordB = lead ? workspace.recordMap.get(lead.caseB) : undefined;

  return (
    <div className="flex h-dvh w-full min-w-[1180px] flex-col bg-canvas font-sans text-ink antialiased">
      <TopBar
        recordCount={workspace.records.length}
        originalCount={workspace.originalCount}
        leadCount={workspace.totalLeads}
        isRunning={workspace.isRunning}
        pendingRecords={workspace.pendingRecords}
        ranAt={workspace.ranAt}
        canAddExample={workspace.canAddExample}
        onRun={workspace.runAnalysis}
        onReset={workspace.reset}
        onAddExample={workspace.addExample}
        offline={workspace.offline}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[340px_minmax(0,1fr)_340px]">
        <aside aria-label="Leads" className="min-h-0 overflow-y-auto border-r border-line bg-surface">
          <LeadsList
            areaLeads={workspace.areaLeads}
            namedLeads={workspace.namedLeads}
            rules={workspace.rules}
            filter={workspace.filter}
            onFilterChange={workspace.setFilter}
            onSameAreaDays={workspace.setSameAreaDays}
            onCrossAreaDays={workspace.setCrossAreaDays}
            selectedId={lead?.id ?? null}
            statusFor={workspace.statusFor}
            onSelect={workspace.select}
            isRunning={workspace.isRunning}
          />
        </aside>

        <main className="min-h-0 overflow-y-auto">
          {lead && recordA && recordB ? (
            <LeadDetail
              lead={lead}
              recordA={recordA}
              recordB={recordB}
              status={workspace.statusFor(lead.id)}
              rules={workspace.rules}
              relatedLeads={workspace.relatedLeads}
              statusFor={workspace.statusFor}
              onSelect={workspace.select}
              brief={workspace.brief}
              briefPending={workspace.briefPending}
              onGenerate={workspace.showBrief}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-8">
              <div className="max-w-sm text-center">
                <p className="text-[14px] font-semibold text-ink">No possible leads to review</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  The current rules found no leads. Add a fictional example or adjust the rules, then run analysis again.
                </p>
              </div>
            </div>
          )}
        </main>

        <aside aria-label="Reviewer decision" className="min-h-0 overflow-y-auto border-l border-line bg-surface">
          {lead ? (
            <ReviewPanel
              key={lead.id}
              lead={lead}
              review={workspace.reviews[lead.id]}
              reviewerId={workspace.reviewerId}
              reviewedCount={workspace.reviewedCount}
              totalCount={workspace.totalLeads}
              onSave={workspace.saveDecision}
            />
          ) : null}
          <AuditLog items={workspace.auditItems} offline={workspace.offline} />
        </aside>
      </div>

      <footer className="shrink-0 border-t border-line bg-surface px-4 py-2 text-center text-[12px] text-ink-muted">
        Synthetic data only. For authorised human review. No action should be taken from this output.
      </footer>
    </div>
  );
}
