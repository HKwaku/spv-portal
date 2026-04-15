'use client';

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
        <table className="todo-table todo-table--compact">
          <thead>
            <tr>
              <th>Request</th>
              <th className="todo-th-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {todos.map((t) => (
              <tr
                key={t.id}
                className="todo-table-row todo-table-row--clickable"
                title="Open this request and complete this task"
                tabIndex={0}
                onClick={() => goChecklist(t.runId, t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goChecklist(t.runId, t.id);
                  }
                }}
              >
                <td className="todo-td-stack">
                  <div className="todo-task-stack">
                    <span className="todo-entity-name">{t.entityName}</span>
                    <span className="todo-step-title">{t.stepTitle}</span>
                    <span className="todo-task-meta muted">
                      {t.owner}
                      <span className="todo-task-meta-sep" aria-hidden>
                        {' '}
                        ·{' '}
                      </span>
                      {formatDashboardTableTime(t.updatedAt)}
                    </span>
                  </div>
                </td>
                <td className="todo-td-status">
                  <span className={statusClass(t.status)}>{STATUS_LABEL[t.status] ?? t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
