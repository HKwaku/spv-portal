import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  portalUnlocksNextAfterComplete,
  requestN8nCompletionGate,
} from '@/lib/n8n-completion-gate';
import { prisma } from '@/lib/prisma';

const bodySchema = z.object({
  action: z.enum(['complete', 'approve', 'reject', 'block']),
  data: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Find and unlock the next non-NA checklist item after currentSortOrder.
 * Skips items that are already done or na.
 */
async function unlockNextTask(runId: string, currentSortOrder: number) {
  const next = await prisma.checklistItem.findFirst({
    where: {
      runId,
      sortOrder: { gt: currentSortOrder },
      status: { not: 'na' },
    },
    orderBy: { sortOrder: 'asc' },
  });

  if (!next) return null;

  return prisma.checklistItem.update({
    where: { id: next.id },
    data: { isUnlocked: true },
  });
}

/**
 * If the completed task has an externalWaitKey, resume the paused n8n WAIT node.
 * n8n resume URL format:
 *   https://<subdomain>.app.n8n.cloud/webhook-waiting/<waitWebhookId>
 * The waitWebhookId is stored in externalWaitKey when n8n calls /api/tasks/sync.
 *
 * N8N_BASE_URL env var should be set to your n8n instance root,
 * e.g. https://hopetettey.app.n8n.cloud
 */
async function resumeN8nWait(
  externalWaitKey: string,
  payload: {
    taskId: string;
    runId: string;
    stepKey: string;
    action: string;
    data: Record<string, unknown> | null;
  }
) {
  const base = process.env.N8N_BASE_URL;
  if (!base) {
    console.warn('[resumeN8nWait] N8N_BASE_URL not set — skipping resume');
    return;
  }

  const url = `${base}/webhook-waiting/${externalWaitKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[resumeN8nWait] n8n returned ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error('[resumeN8nWait] fetch failed:', err);
  }
}

/**
 * Update the parent ProcessRun status based on checklist item statuses.
 * - all done/na → 'complete'
 * - any blocked  → 'blocked'
 * - otherwise    → 'in_progress'
 */
async function syncRunStatus(runId: string) {
  const items = await prisma.checklistItem.findMany({
    where: { runId },
    select: { status: true },
  });

  const statuses = items.map((i) => i.status);
  const actionable = statuses.filter((s) => s !== 'na');

  let status = 'in_progress';
  if (actionable.every((s) => s === 'done')) status = 'complete';
  else if (statuses.some((s) => s === 'blocked')) status = 'blocked';

  await prisma.processRun.update({
    where: { id: runId },
    data: { status },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.checklistItem.findUnique({
    where: { id: taskId },
    include: { run: true },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (!task.isUnlocked) {
    return NextResponse.json({ error: 'Task is locked — a prior step must be completed first' }, { status: 409 });
  }

  if (task.status === 'done') {
    return NextResponse.json({ error: 'Task is already complete' }, { status: 409 });
  }

  const nextStatus: string =
    parsed.data.action === 'approve' || parsed.data.action === 'complete'
      ? 'done'
      : 'blocked';

  const updated = await prisma.checklistItem.update({
    where: { id: task.id },
    data: {
      status: nextStatus,
      completionData: (parsed.data.data ?? { action: parsed.data.action }) as Prisma.InputJsonValue,
      startedAt: task.startedAt ?? new Date(),
      completedAt: nextStatus === 'done' ? new Date() : task.completedAt,
    },
  });

  // Unlock the next step — optional: disable so only n8n (POST /api/tasks/sync) advances the queue
  if (nextStatus === 'done' && portalUnlocksNextAfterComplete()) {
    await unlockNextTask(task.runId, task.sortOrder);
  }

  // Keep the run-level status in sync
  await syncRunStatus(task.runId);

  // If this task was blocking an n8n WAIT node, resume it
  if (nextStatus === 'done' && task.externalWaitKey) {
    await resumeN8nWait(task.externalWaitKey, {
      taskId: task.id,
      runId: task.runId,
      stepKey: task.stepKey,
      action: parsed.data.action,
      data: (parsed.data.data as Record<string, unknown>) ?? null,
    });
  }

  return NextResponse.json({ ok: true, task: updated });
}
