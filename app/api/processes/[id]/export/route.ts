import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function csvEscape(v: string) {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const run = await prisma.processRun.findUnique({
    where: { id },
    include: { checklist: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const headers = ['stepKey', 'stepLabel', 'owner', 'status', 'notes'];
  const lines = [
    headers.join(','),
    ...run.checklist.map((c) =>
      [c.stepKey, c.stepLabel, c.owner, c.status, c.notes ?? '']
        .map((x) => csvEscape(String(x)))
        .join(',')
    ),
  ];
  const csv = '\uFEFF' + lines.join('\r\n');
  const filename = `spv-${run.id.slice(0, 8)}-checklist.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
