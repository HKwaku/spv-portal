'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import TaskCompleteForm from '@/components/TaskCompleteForm';
import { stepTitleWithoutPrefix } from '@/lib/checklist-status-ui';

export type TaskActionModalTask = {
  id: string;
  stepLabel: string;
  taskType?: string | null;
  taskPayload?: unknown;
};

export default function TaskActionModal({
  open,
  onClose,
  task,
  onCompleted,
}: {
  open: boolean;
  onClose: () => void;
  task: TaskActionModalTask | null;
  onCompleted?: () => void;
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

  if (!open || !task || typeof document === 'undefined') return null;

  const heading = stepTitleWithoutPrefix(task.stepLabel);

  return createPortal(
    <div className="open-tasks-modal-overlay" role="presentation">
      <button type="button" className="open-tasks-modal-backdrop" aria-label="Close dialog" onClick={onClose} />
      <div
        className="open-tasks-modal-panel card task-action-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-action-modal-title"
      >
        <div className="open-tasks-modal-head">
          <h2 id="task-action-modal-title" className="open-tasks-modal-title">
            {heading}
          </h2>
          <p className="muted open-tasks-modal-lead" style={{ marginBottom: 0 }}>
            Submit to update this step on the checklist.
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-icon open-tasks-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="open-tasks-modal-body">
          <TaskCompleteForm
            taskId={task.id}
            taskType={task.taskType}
            taskPayload={task.taskPayload as never}
            stepLabel={task.stepLabel}
            showStepInForm={false}
            onClose={() => {
              onCompleted?.();
              onClose();
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
