'use client';

import type { Prisma } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

type Field = {
  key: string;
  type: string;
  required?: boolean;
  options?: string[];
};

type TaskPayload = {
  fields?: Field[];
};

type Props = {
  taskId: string;
  taskType: string | null | undefined;
  taskPayload: Prisma.JsonValue | null | undefined;
  stepLabel: string;
  onClose?: () => void;
};

/**
 * Renders the correct completion form for a checklist task based on its taskType.
 *
 * - 'approval'  → Approve / Reject buttons + optional comment
 * - 'upload'    → document name + URL + optional comment
 * - 'confirm'   → Mark complete + optional comment
 * - 'review'    → same as confirm
 */
export default function TaskCompleteForm({
  taskId,
  taskType,
  taskPayload,
  stepLabel,
  onClose,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = (taskPayload as TaskPayload | null | undefined)?.fields ?? [];

  async function submit(action: 'complete' | 'approve' | 'reject') {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);

    // Validate required fields
    for (const f of fields) {
      if (f.required && !fd.get(f.key)?.toString().trim()) {
        setError(`${f.key} is required`);
        return;
      }
    }

    const data: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) {
      data[k] = v;
    }

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === 'string' ? body.error : 'Something went wrong');
      return;
    }

    onClose?.();
    router.refresh();
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        submit('complete');
      }}
      className="task-complete-form"
    >
      <p className="task-complete-step muted">{stepLabel}</p>

      {fields.map((f) => (
        <div key={f.key} className="task-complete-field">
          <label className="field">
            {f.key.replace(/_/g, ' ')}
            {f.required ? ' *' : ''}

            {f.type === 'select' && f.options ? (
              <select name={f.key} required={f.required} defaultValue="">
                <option value="" disabled>
                  Select…
                </option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea name={f.key} rows={3} placeholder="Optional notes…" />
            ) : (
              <input name={f.key} type="text" required={f.required} />
            )}
          </label>
        </div>
      ))}

      {error ? (
        <p className="alert-error" role="alert" style={{ marginBottom: '0.75rem' }}>
          {error}
        </p>
      ) : null}

      <div className="task-complete-actions">
        {taskType === 'approval' ? (
          <>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={() => submit('approve')}
            >
              {saving ? 'Saving…' : 'Approve'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={saving}
              onClick={() => submit('reject')}
            >
              Reject
            </button>
          </>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Mark complete'}
          </button>
        )}

        {onClose ? (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
