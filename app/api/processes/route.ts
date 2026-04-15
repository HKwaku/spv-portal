import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { intakeSchema, toN8nBody } from '@/lib/intake-schema';
import { buildChecklistRows } from '@/lib/process-steps';
import { submitToN8nWebhook } from '@/lib/n8n-submit';

export async function GET() {
  const runs = await prisma.processRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      n8nOk: true,
      intake: true,
    },
  });
  return NextResponse.json(runs);
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = intakeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400 });
  }

  const intake = parsed.data;
  const body = toN8nBody(intake);

  const run = await prisma.processRun.create({
    data: {
      status: 'submitted',
      intake: intake as object,
      n8nOk: null,
      n8nError: null,
      checklist: {
        create: buildChecklistRows(intake).map((r) => ({
          stepKey: r.stepKey,
          stepLabel: r.stepLabel,
          owner: r.owner,
          assignedTeam: r.assignedTeam,
          taskType: r.taskType,
          taskPayload: r.taskPayload,
          sortOrder: r.sortOrder,
          status: r.status,
          isUnlocked: r.isUnlocked,
        })),
      },
    },
  });

  const n8n = await submitToN8nWebhook({
    ...(body as Record<string, string>),
    portalRunId: run.id,
  });

  if (n8n.skipped) {
    await prisma.processRun.update({
      where: { id: run.id },
      data: { n8nOk: false, n8nError: n8n.message },
    });
  } else if (n8n.ok) {
    await prisma.processRun.update({
      where: { id: run.id },
      data: { n8nOk: true, n8nError: null },
    });
  } else {
    await prisma.processRun.update({
      where: { id: run.id },
      data: { n8nOk: false, n8nError: n8n.message ?? 'n8n error' },
    });
  }

  const full = await prisma.processRun.findUnique({
    where: { id: run.id },
    include: { checklist: { orderBy: { sortOrder: 'asc' } } },
  });

  return NextResponse.json({ run: full, n8n });
}