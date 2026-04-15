'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { groupChecklistItems } from '@/lib/checklist-groups';
import { STATUS_LABEL, stepTitleWithoutPrefix } from '@/lib/checklist-status-ui';
import { checklistProgressPct } from '@/lib/run-metrics';
import TaskActionModal from '@/components/TaskActionModal';

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
  isUnlocked?: boolean;
  taskType?: string | null;
  taskPayload?: unknown;
};

type ApiRun = {
  id: string;
  intake: unknown;
  checklist: ApiChecklistItem[];
};

function resolveRunId(pathname: string, searchParams: URLSearchParams): string | null {
  if (pathname === '/' || pathname === '') return searchParams.get('run');
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
  const [modalTask, setModalTask] = useState<ApiChecklistItem | null>(null);

  function loadRun(id: string) {
    fetch(`/api/processes/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('load');
        return r.json();
      })
      .then((data: ApiRun) => setRun(data))
      .catch(() => setErr('Could not load checklist'));
  }

  useEffect(() => {
    if (!runId) {
      setRun(null);
      setErr(null);
      return;
    }
    setRun(null);
    setErr(null);
    setModalTask(null);
    loadRun(runId);
  }, [runId]);

  const grouped = useMemo(() => {
    if (!run) return [];
    const sorted = [...run.checklist].sort((a, b) => a.sortOrder - b.sortOrder);
    return groupChecklistItems(sorted);
  }, [run]);

  function toggleGroup(id: string) {
    setOpenGroups((o) => ({ ...o, [id]: !(o[id] ?? false) }));
  }

  function handleTaskDone() {
    setModalTask(null);
    if (runId) loadRun(runId);
    router.refresh();
  }

  if (!runId) {
    return (
      <div className="sidebar-checklist-empty">
        <p className="sidebar-checklist-title">Workflow steps</p>
        <p className="sidebar-checklist-hint">
          Choose a request to see its checklist. Click an unlocked step to action it.
        </p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="sidebar-checklist-empty">
        <p className="sidebar-checklist-title">Workflow steps</p>
        <p className="sidebar-checklist-hint" style={{ color: 'var(--color-text-danger)' }}>
          {err}
        </p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="sidebar-checklist-empty">
        <p className="sidebar-checklist-title">Workflow steps</p>
        <p className="sidebar-checklist-hint muted">Loading checklist…</p>
      </div>
    );
  }

  const entityName = (run.intake as { entityName?: string })?.entityName ?? '-';
  const overallPct = checklistProgressPct(run.checklist);

  return (
    <div className="sidebar-checklist">
      <TaskActionModal
        open={modalTask !== null}
        task={modalTask}
        onClose={() => setModalTask(null)}
        onCompleted={handleTaskDone}
      />

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
            <section
              key={group.id}
              className={`sidebar-checklist-group sidebar-checklist-group--${group.id}`}
            >
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
                <span
                  className="sidebar-checklist-group-stat"
                  title={expanded ? `${items.length} steps` : `${pct}% in this phase`}
                >
                  {expanded ? items.length : `${pct}%`}
                </span>
              </button>

              {!expanded ? (
                <div
                  className="sidebar-checklist-kanban-summary"
                  aria-label={`${group.title}: ${pct}% complete`}
                >
                  <span className="sidebar-checklist-kanban-bar">
                    <span
                      className="sidebar-checklist-kanban-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </div>
              ) : (
                <ul className="sidebar-checklist-steps">
                  {items.map((item) => {
                    const stepTitle = stepTitleWithoutPrefix(item.stepLabel);
                    const isDone = item.status === 'done' || item.status === 'na';
                    const isLocked = !isDone && !item.isUnlocked;
                    const canAct = !isDone && item.isUnlocked;

                    return (
                      <li
                        key={item.id}
                        className={`sidebar-checklist-step sidebar-checklist-step--${item.status}`}
                      >
                        <span className="sidebar-checklist-step-rail" aria-hidden />
                        <div className="sidebar-checklist-step-body">
                          <div className="sidebar-checklist-step-row">
                            <button
                              type="button"
                              className="sidebar-checklist-step-text sidebar-checklist-step-text--btn"
                              title={stepTitle}
                              disabled={!canAct}
                              style={isLocked ? { opacity: 0.45 } : undefined}
                              onClick={() => canAct && setModalTask(item)}
                            >
                              {stepTitle}
                            </button>

                            <div className="sidebar-checklist-step-status-col">
                              {isDone ? (
                                <span className={`sidebar-status-pill sidebar-status-pill--${item.status}`}>
                                  {STATUS_LABEL[item.status] ?? item.status}
                                </span>
                              ) : isLocked ? (
                                <span
                                  className="sidebar-status-pill sidebar-status-pill--pending"
                                  style={{ opacity: 0.5 }}
                                  title="Waiting for a prior step"
                                >
                                  Locked
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="sidebar-status-pill sidebar-status-pill--btn sidebar-status-pill--pending"
                                  onClick={() => setModalTask(item)}
                                >
                                  {item.taskType === 'approval' ? 'Review' : 'Open'}
                                </button>
                              )}

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
