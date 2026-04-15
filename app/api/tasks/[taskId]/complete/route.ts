import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const bodySchema = z.object({
  action: z.enum(['complete', 'approve', 'reject', 'block']),
  data: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Unlock the next non-NA item after currentSortOrder.
 * This runs whether or not n8n has called /api/tasks/sync —
 * so the portal works standalone and with n8n.
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
 * Resume a paused n8n WAIT node.
 * n8n stores the webhookId in externalWaitKey via /api/tasks/sync.
 * Resume URL: https://<subdomain>.app.n8n.cloud/webhook-waiting/<webhookId>
 */
async function resumeN8nWait(
  externalWaitKey: string,
  payload: { taskId: string; runId: string; stepKey: string; action: string; data: Record<string, unknown> | null }
) {
  const base = process.env.N8N_BASE_URL;
  if (!base || !externalWaitKey) return;

  try {
    await fetch(`${base}/webhook-waiting/${externalWaitKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[resumeN8nWait] failed:', err);
  }
}

/** Roll up checklist statuses into a single run status. */
async function syncRunStatus(runId: string) {
  const items = await prisma.checklistItem.findMany({
    where: { runId },
    select: { status: true },
  });
  const actionable = items.map((i) => i.status).filter((s) => s !== 'na');
  let status = 'in_progress';
  if (actionable.every((s) => s === 'done')) status = 'complete';
  else if (items.some((i) => i.status === 'blocked')) status = 'blocked';
  await prisma.processRun.update({ where: { id: runId }, data: { status } });
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
  });

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (!task.isUnlocked) return NextResponse.json({ error: 'Task is locked' }, { status: 409 });
  if (task.status === 'done') return NextResponse.json({ error: 'Already complete' }, { status: 409 });

  const nextStatus =
    parsed.data.action === 'approve' || parsed.data.action === 'complete' ? 'done' : 'blocked';

  const updated = await prisma.checklistItem.update({
    where: { id: task.id },
    data: {
      status: nextStatus,
      completionData: (parsed.data.data ?? { action: parsed.data.action }) as Prisma.InputJsonValue,
      startedAt: task.startedAt ?? new Date(),
      completedAt: nextStatus === 'done' ? new Date() : task.completedAt,
    },
  });

  // Always unlock next step — works with or without n8n
  if (nextStatus === 'done') {
    await unlockNextTask(task.runId, task.sortOrder);
  }

  await syncRunStatus(task.runId);

  // If n8n was waiting on this step, resume it
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
