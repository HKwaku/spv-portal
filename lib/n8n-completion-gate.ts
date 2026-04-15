/**
 * Optional: user task completion is sent to n8n first; the workflow must allow before we persist to Postgres.
 * Configure `N8N_TASK_COMPLETION_WEBHOOK_URL` with a Webhook → … → **Respond to Webhook** workflow that returns JSON.
 */

export type CompletionGatePayload = {
  taskId: string;
  runId: string;
  stepKey: string;
  action: 'complete' | 'approve' | 'reject' | 'block';
  data: Record<string, unknown> | null;
  n8nExecutionId: string | null;
};

export type CompletionGateResult = { allowed: true } | { allowed: false; message: string };

function parseAllowBody(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  if (o.allow === true || o.allowed === true || o.ok === true) return true;
  return false;
}

export async function requestN8nCompletionGate(payload: CompletionGatePayload): Promise<CompletionGateResult> {
  const url = process.env.N8N_TASK_COMPLETION_WEBHOOK_URL?.trim();
  if (!url) {
    return { allowed: true };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = process.env.N8N_COMPLETION_WEBHOOK_SECRET?.trim();
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { allowed: false, message: `n8n completion webhook failed: ${msg}` };
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: unknown }).message)
        : `Workflow returned ${res.status}`;
    return { allowed: false, message: msg };
  }

  if (!parseAllowBody(data)) {
    const msg =
      data && typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: unknown }).message)
        : 'Workflow did not approve this completion (expected { "allow": true } or { "ok": true })';
    return { allowed: false, message: msg };
  }

  return { allowed: true };
}

/** When false, the portal does not unlock the next checklist row after complete — n8n must call POST /api/tasks/sync. */
export function portalUnlocksNextAfterComplete(): boolean {
  return process.env.PORTAL_UNLOCK_NEXT_AFTER_COMPLETE !== 'false';
}
