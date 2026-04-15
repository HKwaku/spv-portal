'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { STRATEGY_OPTIONS, TPA_OPTIONS, strategyToLabel } from '@/lib/intake-lookups';
import { buildDashboardHref, type DashboardSearch } from '@/lib/dashboard-href';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import type { RunWithChecklistLite } from '@/lib/run-metrics';
import { formatDashboardCaptionTime, formatDashboardTableTime } from '@/lib/format-datetime';
import {
  filterRunsBySearchQuery,
  portfolioMetrics,
  runBlockedCount,
  runPhase,
  runProgressPct,
} from '@/lib/run-metrics';
import { currentStepTeamAbbrev } from '@/lib/team-abbrev';
import NotificationBell from '@/components/NotificationBell';
import OpenTasksTable from '@/components/dashboard/OpenTasksTable';
import type { TodoItemDto } from '@/lib/todos-query';

const PHASE_META: Record<
  string,
  { title: string; sub: string; className: string }
> = {
  intake: { title: 'Intake', sub: 'Not started', className: 'wf-phase--intake' },
  active: { title: 'In motion', sub: 'Work underway', className: 'wf-phase--active' },
  wrap: { title: 'Wrap-up', sub: 'Final stretch', className: 'wf-phase--wrap' },
  done: { title: 'Complete', sub: 'Checklist done', className: 'wf-phase--done' },
};

type TabId = 'pipeline' | 'requests';

function tabToQuery(t: TabId): string | undefined {
  return t === 'requests' ? 'list' : undefined;
}

function queryToTab(raw: string | null): TabId {
  if (raw === 'list' || raw === 'requests') return 'requests';
  return 'pipeline';
}

export default function WorkflowDashboard({
  runs,
  params,
  databaseTotal,
  lastSubmissionAt,
  selectedRunId,
  todos,
  initialTab,
}: {
  runs: RunWithChecklistLite[];
  params: DashboardSearch;
  databaseTotal: number;
  /** ISO string from server (serializable) */
  lastSubmissionAt: string | null;
  selectedRunId?: string | null;
  todos: TodoItemDto[];
  /** From URL `tab` on first render (matches server) */
  initialTab?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [tab, setTab] = useState<TabId>(() => queryToTab(initialTab ?? null));
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const [qInput, setQInput] = useState(params.q ?? '');

  useEffect(() => {
    setQInput(params.q ?? '');
  }, [params.q]);

  useEffect(() => {
    setTab(queryToTab(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('tab') !== 'todos') return;
    const t = window.setTimeout(() => {
      document.getElementById('open-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => clearTimeout(t);
  }, [searchParams]);

  const displayRuns = useMemo(() => filterRunsBySearchQuery(runs, qInput), [runs, qInput]);

  const cur: DashboardSearch = useMemo(
    () => ({
      run: params.run,
      q: qInput.trim() || undefined,
      strategy: params.strategy,
      tpa: params.tpa,
      tab: tabToQuery(tab),
    }),
    [params.run, params.strategy, params.tpa, qInput, tab]
  );

  function selectTab(next: TabId) {
    setTab(next);
    router.replace(
      buildDashboardHref({
        run: params.run,
        q: qInput.trim() || undefined,
        strategy: params.strategy,
        tpa: params.tpa,
        tab: tabToQuery(next),
      }),
      { scroll: false }
    );
  }

  const m = portfolioMetrics(displayRuns);

  const hasFilters = Boolean(qInput.trim() || params.strategy || params.tpa);
  const hasStrategyTpaFilters = Boolean(params.strategy || params.tpa);

  const grouped: Record<string, RunWithChecklistLite[]> = useMemo(() => {
    const g: Record<string, RunWithChecklistLite[]> = {
      intake: [],
      active: [],
      wrap: [],
      done: [],
    };
    for (const r of displayRuns) {
      g[runPhase(r)].push(r);
    }
    return g;
  }, [displayRuns]);

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQInput(v);
    if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
    urlDebounceRef.current = setTimeout(() => {
      router.replace(
        buildDashboardHref({
          run: params.run,
          q: v.trim() || undefined,
          strategy: params.strategy,
          tpa: params.tpa,
          tab: tabToQuery(tabRef.current),
        }),
        { scroll: false }
      );
    }, 320);
  }

  return (
    <div className="wf-dashboard wf-dashboard--split">
      <div className="wf-dashboard-main">
      <section className="wf-bento" aria-label="Portfolio summary">
        <div className="wf-metric wf-metric--accent">
          <span className="wf-metric-value">{displayRuns.length}</span>
          <span className="wf-metric-label">{hasFilters ? 'In this view' : 'Active deals'}</span>
        </div>
        <div className="wf-metric">
          <span className="wf-metric-value">{m.inFlight}</span>
          <span className="wf-metric-label">In progress</span>
        </div>
        <div className="wf-metric">
          <span className="wf-metric-value">{m.done}</span>
          <span className="wf-metric-label">Fully closed</span>
        </div>
        <div className="wf-metric wf-metric--warn">
          <span className="wf-metric-value">{m.blockedSteps}</span>
          <span className="wf-metric-label">Blocked steps</span>
        </div>
        <div className="wf-metric wf-metric--danger">
          <span className="wf-metric-value">{m.n8nIssues}</span>
          <span className="wf-metric-label">Automation issues</span>
        </div>
      </section>

      <p className="wf-caption muted">
        Database <strong>{databaseTotal}</strong> total · <strong>{runs.length}</strong> requests loaded (recent 100, strategy/TPA
        filters) · <strong>{displayRuns.length}</strong> match search
        {lastSubmissionAt ? (
          <>
            {' '}
            · last intake{' '}
            <time dateTime={lastSubmissionAt}>{formatDashboardCaptionTime(lastSubmissionAt)}</time>
          </>
        ) : null}
      </p>

      <p className="wf-portal-primary-callout muted no-print" role="note">
        <strong>Work happens in this app:</strong> use <strong>Open tasks</strong> and the sidebar checklist to advance
        steps. <strong>Team</strong> shows who owns each step. Background automation (for example n8n Gmail nodes in older
        flows) may still notify people, but status updated here is what counts.
      </p>

      <section className="wf-toolbar card">
        <div className="wf-search wf-search--live" role="search">
          <label className="wf-search-wrap">
            <span className="wf-search-icon" aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              value={qInput}
              onChange={onSearchChange}
              placeholder="Filter by entity, strategy, TPA, jurisdiction..."
              className="wf-search-input"
              aria-label="Filter requests as you type"
              autoComplete="off"
            />
          </label>
          {qInput ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setQInput('');
                router.replace(
                  buildDashboardHref({
                    run: params.run,
                    strategy: params.strategy,
                    tpa: params.tpa,
                  }),
                  { scroll: false }
                );
              }}
            >
              Clear search
            </button>
          ) : null}
        </div>

        <div className="wf-filters">
          <span className="wf-filters-label">Strategy</span>
          <div className="wf-chips">
            <Link
              href={buildDashboardHref({ ...cur, strategy: undefined })}
              className={`wf-chip ${!params.strategy ? 'active' : ''}`}
              scroll={false}
            >
              All
            </Link>
            {STRATEGY_OPTIONS.map((o) => (
              <Link
                key={o.value}
                href={buildDashboardHref({ ...cur, strategy: o.value })}
                className={`wf-chip ${params.strategy === o.value ? 'active' : ''}`}
                scroll={false}
              >
                {o.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="wf-filters">
          <span className="wf-filters-label">TPA</span>
          <div className="wf-chips">
            <Link
              href={buildDashboardHref({ ...cur, tpa: undefined })}
              className={`wf-chip ${!params.tpa ? 'active' : ''}`}
              scroll={false}
            >
              All
            </Link>
            {TPA_OPTIONS.map((o) => (
              <Link
                key={o.value}
                href={buildDashboardHref({ ...cur, tpa: o.value })}
                className={`wf-chip ${params.tpa === o.value ? 'active' : ''}`}
                scroll={false}
              >
                {o.label}
              </Link>
            ))}
          </div>
        </div>

        {hasStrategyTpaFilters ? (
          <div className="wf-toolbar-foot">
            <Link
              href={buildDashboardHref({ run: params.run, q: qInput.trim() || undefined })}
              className="btn btn-ghost btn-sm"
              scroll={false}
            >
              Clear strategy &amp; TPA
            </Link>
          </div>
        ) : null}
      </section>

      <section className="wf-pipeline-runs card" aria-label="Pipeline">
        <div className="wf-pipeline-section-head">
          <h2 className="wf-pipeline-section-title">Pipeline</h2>
        </div>
        <div className="wf-tabs" role="tablist" aria-label="Pipeline view">
          <button
            type="button"
            role="tab"
            id="tab-pipeline"
            aria-selected={tab === 'pipeline'}
            aria-controls="panel-pipeline"
            className={`wf-tab ${tab === 'pipeline' ? 'wf-tab--active' : ''}`}
            onClick={() => selectTab('pipeline')}
          >
            Kanban view
          </button>
          <button
            type="button"
            role="tab"
            id="tab-requests"
            aria-selected={tab === 'requests'}
            aria-controls="panel-requests"
            className={`wf-tab ${tab === 'requests' ? 'wf-tab--active' : ''}`}
            onClick={() => selectTab('requests')}
          >
            List view
          </button>
        </div>

        {tab === 'pipeline' ? (
          <div id="panel-pipeline" role="tabpanel" aria-labelledby="tab-pipeline" className="wf-tab-panel">
            <div className="wf-section-head wf-section-head--tabbed">
              <h3 className="wf-section-title">By checklist phase</h3>
              <p className="wf-section-desc muted">Grouped by checklist completion — colour-coded by phase.</p>
            </div>
            <div className="wf-pipeline-cols">
              {(['intake', 'active', 'wrap', 'done'] as const).map((phase) => {
                const meta = PHASE_META[phase];
                const list = grouped[phase];
                return (
                  <div key={phase} className={`wf-pipeline-col ${meta.className}`}>
                    <div className="wf-pipeline-col-head">
                      <span className="wf-pipeline-title">{meta.title}</span>
                      <span className="wf-pipeline-count">{list.length}</span>
                    </div>
                    <p className="wf-pipeline-sub muted">{meta.sub}</p>
                    <ul className="wf-pipeline-list">
                      {list.map((r) => {
                        const intake = r.intake as { entityName?: string };
                        const pct = runProgressPct(r);
                        const sel = selectedRunId === r.id;
                        const teamAbbrev = currentStepTeamAbbrev(r.checklist);
                        return (
                          <li key={r.id}>
                            <Link
                              href={buildDashboardHref({ ...cur, run: r.id })}
                              className={`wf-pipeline-card ${sel ? 'wf-pipeline-card--selected' : ''}`}
                              scroll={false}
                              aria-current={sel ? 'true' : undefined}
                            >
                              <span className="wf-pipeline-entity">{intake.entityName ?? '-'}</span>
                              <span className={`wf-team-pill ${teamAbbrev ? '' : 'wf-team-pill--empty muted'}`}>
                                {teamAbbrev ?? '-'}
                              </span>
                              <span className="wf-pipeline-pct">{pct}%</span>
                              <span className="wf-pipeline-bar">
                                <span className="wf-pipeline-bar-fill" style={{ width: `${pct}%` }} />
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ) : tab === 'requests' ? (
          <div id="panel-requests" role="tabpanel" aria-labelledby="tab-requests" className="wf-tab-panel">
            <div className="wf-section-head wf-section-head--tabbed">
              <h3 className="wf-section-title">Request list</h3>
              <p className="wf-section-desc muted">Select a row to load that request in the sidebar checklist.</p>
            </div>
            <div className="wf-table-wrap">
              <table className="wf-table">
                <thead>
                  <tr>
                    <th>Entity</th>
                    <th>Strategy</th>
                    <th>TPA</th>
                    <th>Jurisdiction</th>
                    <th>Progress</th>
                    <th>Phase</th>
                    <th>Blocked</th>
                    <th>n8n</th>
                    <th>Updated</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {displayRuns.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="wf-empty-row">
                        No requests match your search or filters.{' '}
                        <Link href={buildDashboardHref({ run: params.run })} scroll={false}>
                          Reset view
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    displayRuns.map((r) => {
                      const intake = r.intake as {
                        entityName?: string;
                        strategy?: string;
                        tpa?: string;
                        jurisdiction?: string;
                      };
                      const pct = runProgressPct(r);
                      const blocked = runBlockedCount(r);
                      const phase = runPhase(r);
                      const teamAbbrev = currentStepTeamAbbrev(r.checklist);
                      const sel = selectedRunId === r.id;
                      const rowHref = buildDashboardHref({ ...cur, run: r.id });
                      return (
                        <tr
                          key={r.id}
                          className={`wf-table-row-run ${sel ? 'wf-row-selected' : ''}`}
                          tabIndex={0}
                          aria-current={sel ? 'true' : undefined}
                          onClick={() => router.push(rowHref)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              router.push(rowHref);
                            }
                          }}
                        >
                          <td className="wf-td-entity">
                            <span className="wf-entity-text">{intake.entityName ?? '-'}</span>
                          </td>
                          <td>
                            <span className="wf-tag">{intake.strategy ? strategyToLabel(intake.strategy) : '-'}</span>
                          </td>
                          <td className="muted">{intake.tpa ?? '-'}</td>
                          <td className="muted">{intake.jurisdiction ?? '-'}</td>
                          <td>
                            <div className="wf-td-progress">
                              <span className="wf-td-bar">
                                <span style={{ width: `${pct}%` }} />
                              </span>
                              <span className="wf-td-pct">{pct}%</span>
                            </div>
                          </td>
                          <td className="wf-td-phase">
                            <div className="wf-phase-cell">
                              <span className="wf-phase-pill">{PHASE_META[phase].title}</span>
                              <span className={`wf-team-pill ${teamAbbrev ? '' : 'wf-team-pill--empty muted'}`}>
                                {teamAbbrev ?? '-'}
                              </span>
                            </div>
                          </td>
                          <td>{blocked > 0 ? <span className="wf-blocked">{blocked}</span> : '-'}</td>
                          <td>
                            {r.n8nOk === true ? <span className="wf-n8n ok">OK</span> : null}
                            {r.n8nOk === false ? (
                              <span className="wf-n8n bad" title={r.n8nError ?? ''}>
                                !
                              </span>
                            ) : null}
                            {r.n8nOk == null ? <span className="muted">-</span> : null}
                          </td>
                          <td className="wf-td-date muted">{formatDashboardTableTime(r.updatedAt)}</td>
                          <td className="wf-td-record" onClick={(e) => e.stopPropagation()}>
                            <Link href={`/runs/${r.id}`} className="wf-link-sub">
                              Record
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
      </div>

      <aside className="wf-dashboard-charts" aria-label="Charts and open tasks">
        <section className="card wf-open-tasks-rail no-print" id="open-tasks" aria-label="Open tasks">
          <div className="wf-open-tasks-rail-head">
            <div className="wf-open-tasks-rail-lead">
              <div className="wf-open-tasks-title-row">
                <h2 className="wf-open-tasks-rail-title">Open tasks</h2>
                <NotificationBell variant="rail" showViewAllButton />
              </div>
              <p className="muted wf-open-tasks-rail-desc">
                Actionable steps across all deals. <strong>Team</strong> is the owning group—open a row and update status
                in the checklist (not via email routing alone). <strong>Click a row</strong> or <strong>Checklist</strong>{' '}
                to work in the sidebar; <strong>Full page</strong> opens the full record editor.
              </p>
            </div>
            <span className="wf-todos-count" aria-hidden>
              {todos.length}
            </span>
          </div>
          <OpenTasksTable todos={todos} />
        </section>
        <DashboardCharts runs={displayRuns} rail />
      </aside>
    </div>
  );
}
