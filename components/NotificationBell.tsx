'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildDashboardHref } from '@/lib/dashboard-href';
import OpenTasksModal from '@/components/OpenTasksModal';
import { useCallback, useEffect, useRef, useState } from 'react';
import { STATUS_LABEL } from '@/lib/checklist-status-ui';
import type { TodoItemDto } from '@/lib/todos-query';

type ApiResponse = { todos: TodoItemDto[]; count: number };

async function fetchTodos(): Promise<ApiResponse> {
  const res = await fetch('/api/todos', { cache: 'no-store' });
  if (!res.ok) return { todos: [], count: 0 };
  return res.json();
}

type Props = {
  /** Sits beside the dashboard "Open tasks" heading; dropdown stays within the rail */
  variant?: 'rail';
  /** Extra "View all" control next to the bell (opens the full list modal) */
  showViewAllButton?: boolean;
};

export default function NotificationBell({ variant = 'rail', showViewAllButton = true }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [allModalOpen, setAllModalOpen] = useState(false);
  const [todos, setTodos] = useState<TodoItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchTodos();
    setTodos(data.todos);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (allModalOpen) load();
  }, [allModalOpen, load]);

  useEffect(() => {
    const id = window.setInterval(() => load(), 45000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onFocus() {
      load();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function openAllModal() {
    setOpen(false);
    setAllModalOpen(true);
  }

  const count = todos.length;
  const preview = todos.slice(0, 10);
  const wrapClass = variant === 'rail' ? 'notif-bell-wrap notif-bell-wrap--rail' : 'notif-bell-wrap';

  return (
    <div className={wrapClass} ref={wrapRef}>
      <div className="notif-bell-cluster">
        <button
          type="button"
          className="notif-bell-btn"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={count ? `${count} open tasks` : 'No open tasks'}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="notif-bell-icon" aria-hidden>
            🔔
          </span>
          {count > 0 ? (
            <span className="notif-bell-badge" aria-hidden>
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </button>
        {showViewAllButton ? (
          <button type="button" className="btn btn-ghost btn-sm notif-view-all-btn" onClick={openAllModal}>
            View all
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="notif-dropdown" role="dialog" aria-label="Open tasks preview">
          <div className="notif-dropdown-head">
            <span className="notif-dropdown-title">Recent</span>
            {loading ? <span className="muted notif-dropdown-loading">Updating…</span> : null}
          </div>
          {preview.length === 0 && !loading ? (
            <p className="notif-dropdown-empty muted">No tasks need action right now.</p>
          ) : (
            <ul className="notif-dropdown-list">
              {preview.map((t) => (
                <li key={t.id}>
                  <Link
                    href={buildDashboardHref({ run: t.runId, task: t.id })}
                    className="notif-dropdown-item"
                    onClick={() => {
                      setOpen(false);
                      router.refresh();
                    }}
                  >
                    <span className="notif-dropdown-entity">{t.entityName}</span>
                    <span className="notif-dropdown-task">{t.stepTitle}</span>
                    <span className="notif-dropdown-meta">
                      <span className="notif-dropdown-owner">{t.owner}</span>
                      <span className="notif-dropdown-status">{STATUS_LABEL[t.status] ?? t.status}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="notif-dropdown-foot">
            <button type="button" className="btn btn-ghost btn-sm notif-dropdown-link" onClick={() => setOpen(false)}>
              Close
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={openAllModal}>
              View all
            </button>
          </div>
        </div>
      ) : null}

      <OpenTasksModal open={allModalOpen} onClose={() => setAllModalOpen(false)} todos={todos} />
    </div>
  );
}
