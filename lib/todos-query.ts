import { prisma } from '@/lib/prisma';
import { stepTitleWithoutPrefix } from '@/lib/checklist-status-ui';

/** Matches `CHECKLIST_STATUSES` / DB values (pending, in_progress, blocked, done, na). */
function actionableStatusWhere() {
  return {
    OR: [
      { status: 'pending' },
      { status: 'in_progress' },
      { status: 'blocked' },
    ],
  };
}

export type TodoItemDto = {
  id: string;
  runId: string;
  entityName: string;
  stepTitle: string;
  owner: string;
  assignedTo: string | null;
  assignedTeam: string | null;
  taskType: string | null;
  status: string;
  isUnlocked: boolean;
  updatedAt: string;
};

export async function getActionableTodos(limit = 300): Promise<TodoItemDto[]> {
  const rows = await prisma.checklistItem.findMany({
    where: {
      ...actionableStatusWhere(),
    },
    include: {
      run: { select: { id: true, intake: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: limit,
  });

  return rows.map((c) => {
    const intake = c.run.intake as { entityName?: string };

    return {
      id: c.id,
      runId: c.runId,
      entityName: intake.entityName ?? '—',
      stepTitle: stepTitleWithoutPrefix(c.stepLabel),
      owner: c.owner,
      assignedTo: c.assignedTo ?? null,
      assignedTeam: c.assignedTeam ?? null,
      taskType: c.taskType ?? null,
      status: c.status,
      isUnlocked: c.isUnlocked,
      updatedAt: c.updatedAt.toISOString(),
    };
  });
}

export async function getMyTasks(userEmail: string, teams: string[] = [], limit = 100): Promise<TodoItemDto[]> {
  const rows = await prisma.checklistItem.findMany({
    where: {
      AND: [
        actionableStatusWhere(),
        {
          OR: [
            { assignedTo: userEmail },
            ...(teams.length ? [{ assignedTeam: { in: teams } }] : []),
          ],
        },
      ],
    },
    include: {
      run: { select: { id: true, intake: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: limit,
  });

  return rows.map((c) => {
    const intake = c.run.intake as { entityName?: string };

    return {
      id: c.id,
      runId: c.runId,
      entityName: intake.entityName ?? '—',
      stepTitle: stepTitleWithoutPrefix(c.stepLabel),
      owner: c.owner,
      assignedTo: c.assignedTo ?? null,
      assignedTeam: c.assignedTeam ?? null,
      taskType: c.taskType ?? null,
      status: c.status,
      isUnlocked: c.isUnlocked,
      updatedAt: c.updatedAt.toISOString(),
    };
  });
}