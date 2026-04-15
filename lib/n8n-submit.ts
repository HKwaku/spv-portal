/**
 * Optional: POST intake to n8n for logging/sync. Task ownership and status live in the app DB — not in email.
 * Body matches "Normalise form fields" ($json.body.*).
 */
export async function submitToN8nWebhook(body: Record<string, string>) {
  const url = process.env.N8N_SPV_WEBHOOK_URL;
  if (!url) {
    return { ok: false as const, skipped: true, message: 'N8N_SPV_WEBHOOK_URL is not configured' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      message: typeof data === 'object' && data && 'message' in data ? String((data as { message?: string }).message) : text,
      data,
    };
  }

  return { ok: true as const, data };
}
