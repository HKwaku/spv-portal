'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDashboardTableTime } from '@/lib/format-datetime';
import { STATUS_LABEL } from '@/lib/checklist-status-ui';
import { buildDashboardHref } from '@/lib/dashboard-href';
import type { TodoItemDto } from '@/lib/todos-query';

function statusClass(status: string): string {
  const s = status.replace(/[^a-z0-9]+/gi, '-');
  return `todo-status todo-status--${s}`;
}

export default function OpenTasksTable({
  todos,
  variant = 'rail',
}: {
  todos: TodoItemDto[];
  /** Wider scroll area when shown in the full-screen modal */
  variant?: 'rail' | 'modal';
}) {
  const router = useRouter();

  if (todos.length === 0) {
    return <p className="muted todo-panel-empty">No open tasks — applicable steps are done or marked N/A.</p>;
  }

  const scrollClass = variant === 'modal' ? 'todo-tab-scroll todo-tab-scroll--modal' : 'todo-tab-scroll';

  function goChecklist(runId: string, taskId: string) {
    router.push(buildDashboardHref({ run: runId, task: taskId }));
  }

  return (
    <div className={scrollClass} tabIndex={0} role="region" aria-label="Open tasks list">
      <div className="todo-table-wrap">
        <table className="todo-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Task</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {todos.map((t) => {
              const checklistHref = buildDashboardHref({ run: t.runId, task: t.id });
              return (
                <tr
                  key={t.id}
                  className="todo-table-row todo-table-row--clickable"
                  title="Open this request and start this task"
                  tabIndex={0}
                  onClick={() => goChecklist(t.runId, t.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goChecklist(t.runId, t.id);
                    }
                  }}
                >
                  <td className="todo-td-entity">
                    <span className="todo-entity-name">{t.entityName}</span>
                  </td>
                  <td className="todo-td-task">{t.stepTitle}</td>
                  <td className="todo-td-owner muted">{t.owner}</td>
                  <td>
                    <span className={statusClass(t.status)}>{STATUS_LABEL[t.status] ?? t.status}</span>
                  </td>
                  <td className="todo-td-date muted">{formatDashboardTableTime(t.updatedAt)}</td>
                  <td className="todo-td-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="todo-action-btns">
                    <Link href={checklistHref} className="btn btn-primary btn-sm" scroll={false}>
                      Open task
                    </Link>
                      <Link href={`/runs/${t.runId}`} className="btn btn-ghost btn-sm">
                        Full page
                      </Link>
                    </div>
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
