'use client';

import type { Prisma } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { STATUS_LABEL, stepTitleWithoutPrefix } from '@/lib/checklist-status-ui';
import TaskActionModal from '@/components/TaskActionModal';

export type ChecklistRow = {
  id: string;
  stepKey: string;
  stepLabel: string;
  owner: string;
  assignedTo?: string | null;
  assignedTeam?: string | null;
  taskType?: string | null;
  /** Stored as JSON in Prisma; UI expects `{ fields?: [...] }` from `buildTaskPayload`. */
  taskPayload?: Prisma.JsonValue | null;
  sortOrder: number;
  status: string;
  notes: string | null;
  isUnlocked?: boolean;
  /** ISO string from API or `Date` from Prisma include */
  completedAt?: string | Date | null;
};

export default function ChecklistEditor({
  runId,
  items,
  focusTaskId = null,
}: {
  runId: string;
  items: ChecklistRow[];
  /** From URL `?task=` — opens the action modal for that checklist row (e.g. Open tasks click). */
  focusTaskId?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  const modalRow = activeTaskId ? sorted.find((r) => r.id === activeTaskId) ?? null : null;

  const clearTaskQuery = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    if (!sp.has('task')) return;
    sp.delete('task');
    const s = sp.toString();
    router.replace(s ? `/?${s}` : '/', { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (!focusTaskId) return;
    const row = sorted.find((r) => r.id === focusTaskId);
    if (!row || row.status === 'done' || row.status === 'na') return;
    if (!row.isUnlocked) return;
    setActiveTaskId(focusTaskId);
    const t = window.setTimeout(() => {
      document.getElementById('workflow-checklist')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    return () => window.clearTimeout(t);
  }, [focusTaskId, sorted]);

  function closeTaskModal() {
    setActiveTaskId(null);
    clearTaskQuery();
  }

  function afterTaskComplete() {
    closeTaskModal();
    router.refresh();
  }

  async function patchNotes(itemId: string, body: { notes?: string | null }) {
    setSaving(itemId);
    setError(null);

    const res = await fetch(`/api/processes/${runId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSaving(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === 'string' ? data.error : JSON.stringify(data));
      return;
    }

    router.refresh();
  }

  return (
    <div className="card" style={{ marginTop: '1rem' }} id="workflow-checklist">
      <TaskActionModal
        open={modalRow !== null && !!modalRow.isUnlocked && modalRow.status !== 'done' && modalRow.status !== 'na'}
        task={
          modalRow
            ? {
                id: modalRow.id,
                stepLabel: modalRow.stepLabel,
                taskType: modalRow.taskType,
                taskPayload: modalRow.taskPayload,
              }
            : null
        }
        onClose={closeTaskModal}
        onCompleted={afterTaskComplete}
      />

      <div className="card-header">
        <div>
          <h2 className="card-title no-print">Checklist</h2>
          <p
            className="muted no-print"
            style={{ marginTop: '0.35rem', fontSize: '0.88rem', maxWidth: '62ch' }}
          >
            Steps unlock when the workflow allows the next action. Click <strong>Action</strong> to open a dialog and
            submit completion. Locked means a prior step is still in progress or automation has not opened this step yet.
          </p>
        </div>
      </div>

      {error ? (
        <p className="alert-error" style={{ marginBottom: '0.75rem' }} role="alert">
          {error}
        </p>
      ) : null}

      <div className="table-wrap">
        <table className="data-table data-table--checklist" dir="ltr">
          <colgroup>
            <col className="cg-ch-status" />
            <col className="cg-ch-step" />
            <col className="cg-ch-owner" />
            <col className="cg-ch-notes" />
          </colgroup>
          <thead>
            <tr>
              <th className="col-status">Action</th>
              <th>Step</th>
              <th>Owner</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const isDoneOrNa = row.status === 'done' || row.status === 'na';
              const lockedForAction = !isDoneOrNa && !row.isUnlocked;

              return (
                  <tr
                    key={row.id}
                    className={[
                      saving === row.id ? 'table-saving' : '',
                      lockedForAction ? 'row-locked' : '',
                      row.status === 'done' ? 'row-done' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <td className="col-status">
                      {row.status === 'done' ? (
                        <span className="status-done">Done</span>
                      ) : row.status === 'na' ? (
                        <span className="muted">N/A</span>
                      ) : lockedForAction ? (
                        <span className="muted status-locked" title="Waiting for prior step">
                          Locked
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={saving === row.id}
                          onClick={() => setActiveTaskId(row.id)}
                        >
                          {row.taskType === 'approval' ? 'Review' : 'Action'}
                        </button>
                      )}

                      <div style={{ marginTop: '0.35rem' }}>
                        <span className="muted" style={{ fontSize: '0.72rem' }}>
                          {STATUS_LABEL[row.status] ?? row.status}
                        </span>
                      </div>
                    </td>

                    <td className="col-step">
                      <div style={{ fontWeight: 500 }}>{stepTitleWithoutPrefix(row.stepLabel)}</div>
                      <div className="muted" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        {row.stepKey}
                      </div>
                      {row.assignedTeam ? (
                        <div className="muted" style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>
                          Queue: {row.assignedTeam}
                        </div>
                      ) : null}
                    </td>

                    <td className="muted col-owner">{row.owner}</td>

                    <td>
                      <textarea
                        defaultValue={row.notes ?? ''}
                        rows={2}
                        className="checklist-notes"
                        placeholder="Optional"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v === (row.notes ?? '').trim()) return;
                          patchNotes(row.id, { notes: v || null });
                        }}
                      />
                    </td>
                  </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
