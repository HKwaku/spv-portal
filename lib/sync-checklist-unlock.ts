import type { PrismaClient } from '@prisma/client';

/**
 * Ensures a single "current" step is unlocked: first checklist row (by sortOrder) that is not done/NA.
 * Matches behaviour after completing a task (`unlockNextTask` in the complete API).
 */
export async function syncUnlockedFlagsForRun(prisma: PrismaClient, runId: string): Promise<void> {
  await prisma.checklistItem.updateMany({
    where: { runId },
    data: { isUnlocked: false },
  });

  const next = await prisma.checklistItem.findFirst({
    where: {
      runId,
      status: { notIn: ['done', 'na'] },
    },
    orderBy: { sortOrder: 'asc' },
  });

  if (next) {
    await prisma.checklistItem.update({
      where: { id: next.id },
      data: { isUnlocked: true },
    });
  }
}
