import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  notes: z.string().optional().nullable(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  const { id: runId, itemId } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, runId },
  });

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      notes: parsed.data.notes ?? null,
    },
  });

  return NextResponse.json(updated);
}