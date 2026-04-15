import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

/**
 * Called by n8n HTTP Request nodes after each process step Set node executes.
 * This is how n8n tells the portal "I have reached step X — unlock it for the user."
 *
 * Body shape (sent by n8n):
 * {
 *   runId: string            — portalRunId threaded from intake POST
 *   stepKey: string          — matches ChecklistItem.stepKey e.g. "2-initiate"
 *   externalWaitKey: string  — n8n WAIT node webhookId (only for approval steps)
 *   n8nExecutionId: string   — n8n execution ID for traceability
 *   assignedTo?: string      — optional: lock to a specific user email
 *   assignedTeam?: string    — optional: override team assignment
 * }
 */
const schema = z.object({
  runId: z.string().min(1),
  stepKey: z.string().min(1),
  externalWaitKey: z.string().default(''),
  n8nExecutionId: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  assignedTeam: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { runId, stepKey, externalWaitKey, n8nExecutionId, assignedTo, assignedTeam } =
    parsed.data;

  const task = await prisma.checklistItem.findFirst({
    where: { runId, stepKey },
  });

  if (!task) {
    return NextResponse.json(
      { error: `No checklist item found for runId=${runId} stepKey=${stepKey}` },
      { status: 404 }
    );
  }

  const updated = await prisma.checklistItem.update({
    where: { id: task.id },
    data: {
      externalWaitKey: externalWaitKey || null,
      n8nExecutionId: n8nExecutionId ?? null,
      assignedTo: assignedTo ?? task.assignedTo,
      assignedTeam: assignedTeam ?? task.assignedTeam,
      isUnlocked: task.status === 'na' ? false : true,
      status: task.status === 'na' ? 'na' : 'pending',
    },
  });

  return NextResponse.json({ ok: true, task: updated });
}
