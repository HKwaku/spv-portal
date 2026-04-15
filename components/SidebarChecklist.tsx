'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { groupChecklistItems } from '@/lib/checklist-groups';
import { nextChecklistStatus, STATUS_LABEL, stepTitleWithoutPrefix } from '@/lib/checklist-status-ui';
import { checklistProgressPct } from '@/lib/run-metrics';

/** Same completion rule as portfolio run progress: % of applicable (non-N/A) steps marked done. */
function groupProgressPct(items: { status: string }[]): number {
  return checklistProgressPct(items);
}

type ApiChecklistItem = {
  id: string;
  stepKey: string;
  stepLabel: string;
  owner: string;
  sortOrder: number;
  status: string;
};

type ApiRun = {
  id: string;
  intake: unknown;
  checklist: ApiChecklistItem[];
};

function resolveRunId(pathname: string, searchParams: URLSearchParams): string | null {
  if (pathname === '/' || pathname === '') {
    return searchParams.get('run');
  }
  if (pathname.startsWith('/runs/')) {
    const seg = pathname.slice('/runs/'.length).split('/')[0];
    return seg || null;
  }
  return null;
}

export default function SidebarChecklist() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const runId = resolveRunId(pathname, searchParams);

  const [err, setErr] = useState<string | null>(null);
  const [run, setRun] = useState<ApiRun | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!runId) {
      setRun(null);
      setErr(null);
      return;
    }
    let cancelled = false;
    setRun(null);
    setErr(null);
    fetch(`/api/processes/${runId}`)
      .then((r) => {
        if (r.status === 404) throw new Error('not found');
        if (!r.ok) throw new Error('load');
        return r.json();
      })
      .then((data: ApiRun) => {
        if (!cancelled) setRun(data);
      })
      .catch(() => {
        if (!cancelled) {
          setRun(null);
          setErr('Could not load');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  const grouped = useMemo(() => {
    if (!run) return [];
    const sorted = [...run.checklist].sort((a, b) => a.sortOrder - b.sortOrder);
    return groupChecklistItems(sorted);
  }, [run]);

  async function patchStatus(itemId: string, status: string) {
    if (!runId) return;
    const res = await fetch(`/api/processes/${runId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    setRun((prev) =>
      prev
        ? {
            ...prev,
            checklist: prev.checklist.map((i) => (i.id === itemId ? { ...i, status } : i)),
          }
        : null
    );
    router.refresh();
  }

  function toggleGroup(id: string) {
    setOpenGroups((o) => ({ ...o, [id]: !((o[id] ?? false)) }));
  }

  if (!runId) {
    return (
      <div className="sidebar-checklist-empty">
        <p className="sidebar-checklist-title">Workflow steps</p>
        <p className="sidebar-checklist-hint">
          Choose a request (use <strong>Open tasks</strong> above the charts or <strong>List view</strong> in Pipeline).
          When a request is open, <strong>click status</strong> on each step you own—work is managed in this app, not by
          email handoffs alone.
        </p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="sidebar-checklist-empty">
        <p className="sidebar-checklist-title">Workflow steps</p>
        <p className="sidebar-checklist-hint" style={{ color: 'var(--danger)' }}>
          {err}
        </p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="sidebar-checklist-empty">
        <p className="sidebar-checklist-title">Workflow steps</p>
        <p className="sidebar-checklist-hint muted">Loading checklist...</p>
      </div>
    );
  }

  const entityName = (run.intake as { entityName?: string })?.entityName ?? '-';
  const overallPct = checklistProgressPct(run.checklist);

  return (
    <div className="sidebar-checklist">
      <div className="sidebar-checklist-head">
        <div className="sidebar-track-card">
          <div className="sidebar-track-card-top">
            <span className="sidebar-checklist-kicker">Active request</span>
            <span className="sidebar-track-pct">{overallPct}%</span>
          </div>
          <strong className="sidebar-checklist-entity">{entityName}</strong>
          <div className="sidebar-track-overall-bar" aria-hidden>
            <span className="sidebar-track-overall-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <Link href={`/runs/${run.id}`} className="sidebar-checklist-record">
            Open full record
          </Link>
        </div>
      </div>
      <div className="sidebar-checklist-groups" aria-label="Checklist by phase">
        {grouped.map(({ group, items }) => {
          const expanded = openGroups[group.id] ?? false;
          const pct = groupProgressPct(items);
          return (
            <section key={group.id} className={`sidebar-checklist-group sidebar-checklist-group--${group.id}`}>
              <button
                type="button"
                className="sidebar-checklist-group-head"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={expanded}
              >
                <span className="sidebar-checklist-group-chevron" aria-hidden>
                  {expanded ? '-' : '+'}
                </span>
                <span className="sidebar-checklist-group-title">{group.title}</span>
                <span className="sidebar-checklist-group-stat" title={expanded ? `${items.length} steps` : `${pct}% in this phase`}>
                  {expanded ? items.length : `${pct}%`}
                </span>
              </button>
              {!expanded ? (
                <div className="sidebar-checklist-kanban-summary" aria-label={`${group.title}: ${pct}% complete`}>
                  <span className="sidebar-checklist-kanban-bar">
                    <span className="sidebar-checklist-kanban-bar-fill" style={{ width: `${pct}%` }} />
                  </span>
                </div>
              ) : (
                <ul className="sidebar-checklist-steps">
                  {items.map((item) => {
                    const stepTitle = stepTitleWithoutPrefix(item.stepLabel);
                    return (
                      <li key={item.id} className={`sidebar-checklist-step sidebar-checklist-step--${item.status}`}>
                        <span className="sidebar-checklist-step-rail" aria-hidden />
                        <div className="sidebar-checklist-step-body">
                          <div className="sidebar-checklist-step-row">
                            <div className="sidebar-checklist-step-text" title={stepTitle}>
                              {stepTitle}
                            </div>
                            <div className="sidebar-checklist-step-status-col">
                              <button
                                type="button"
                                className={`sidebar-status-pill sidebar-status-pill--btn sidebar-status-pill--${item.status}`}
                                title="Click to advance status"
                                onClick={() => patchStatus(item.id, nextChecklistStatus(item.status))}
                              >
                                {STATUS_LABEL[item.status] ?? item.status}
                              </button>
                              <span className="sidebar-team-pill" title={item.owner}>
                                {item.owner}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
