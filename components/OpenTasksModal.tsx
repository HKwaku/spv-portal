'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import OpenTasksTable from '@/components/dashboard/OpenTasksTable';
import type { TodoItemDto } from '@/lib/todos-query';

export default function OpenTasksModal({
  open,
  onClose,
  todos,
}: {
  open: boolean;
  onClose: () => void;
  todos: TodoItemDto[];
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="open-tasks-modal-overlay" role="presentation">
      <button type="button" className="open-tasks-modal-backdrop" aria-label="Close dialog" onClick={onClose} />
      <div
        className="open-tasks-modal-panel card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="open-tasks-modal-title"
      >
        <div className="open-tasks-modal-head">
          <h2 id="open-tasks-modal-title" className="open-tasks-modal-title">
            All open tasks
          </h2>
          <p className="muted open-tasks-modal-lead">
            <strong>Team</strong> shows who should act. Click a row or <strong>Checklist</strong> to open the request and
            complete the assigned task in the portal. Email notifications from automation are optional; human workflow
            progress is driven here.
          </p>
          <button type="button" className="btn btn-ghost btn-icon open-tasks-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="open-tasks-modal-body">
          <OpenTasksTable todos={todos} variant="modal" />
        </div>
      </div>
    </div>,
    document.body
  );
}
