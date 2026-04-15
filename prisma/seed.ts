import './bootstrap-env';
import { PrismaClient } from '@prisma/client';
import type { IntakePayload } from '../lib/intake-schema';
import { buildChecklistRows } from '../lib/process-steps';

const prisma = new PrismaClient();

const STRATEGIES: IntakePayload['strategy'][] = [
  'infrastructure',
  'real_estate',
  'european_corporate',
  'lp_secondaries',
  'strategic_equity',
];

const JURIS: IntakePayload['jurisdiction'][] = [
  'Luxembourg',
  'Ireland',
  'Jersey',
  'Netherlands',
  'Cayman Islands',
];

const TPAS: IntakePayload['tpa'][] = ['Apex', 'CSC', 'JPM', 'BNP'];

function demoIntake(index: number): IntakePayload {
  const i = index + 1;
  return {
    entityName: `Demo - Entity ${String(i).padStart(2, '0')}`,
    entityType: 'S.à r.l.',
    strategy: STRATEGIES[index % STRATEGIES.length],
    jurisdiction: JURIS[index % JURIS.length],
    requestedBy: 'demo.seed@example.com',
    tpa: TPAS[index % TPAS.length],
    tpaEmail: 'tpa.demo.seed@example.com',
    isAggregatorFund: index === 7 ? 'yes' : 'no',
    taxPaperRequired: index % 4 === 0 ? 'yes' : 'no',
    notaryRequired: index % 5 === 1 ? 'yes' : 'no',
    blockingCertRequired: index === 3 ? 'yes' : 'no',
    postFormationNotaryRequired: index === 2 ? 'yes' : 'no',
    leiRequired: index % 6 === 0 ? 'yes' : 'no',
    jerseyApprovalRequired: index === 5 ? 'yes' : 'no',
  };
}

/** Target completion % for each demo run (varied pipeline positions). */
const TARGET_PCT = [2, 18, 33, 48, 62, 76, 91, 100, 41, 55];

function applyDemoProgress(
  items: { id: string; status: string; sortOrder: number }[],
  runIndex: number
) {
  const applicable = [...items].filter((x) => x.status !== 'na').sort((a, b) => a.sortOrder - b.sortOrder);
  const n = applicable.length;
  if (n === 0) return;

  const pct = TARGET_PCT[runIndex % TARGET_PCT.length];
  let doneCount = Math.round((pct / 100) * n);
  if (pct >= 100) doneCount = n;

  const updates: { id: string; status: string }[] = [];

  for (let i = 0; i < applicable.length; i++) {
    const row = applicable[i];
    if (i < doneCount) {
      updates.push({ id: row.id, status: 'done' });
    } else if (runIndex === 4 && i === doneCount) {
      updates.push({ id: row.id, status: 'blocked' });
    } else if (i === doneCount) {
      updates.push({ id: row.id, status: 'in_progress' });
    } else {
      updates.push({ id: row.id, status: 'pending' });
    }
  }

  return updates;
}

async function main() {
  const existing = await prisma.processRun.findMany({ select: { id: true, intake: true } });
  const demoIds = existing
    .filter((r) => {
      const name = (r.intake as { entityName?: string })?.entityName ?? '';
      return name.startsWith('Demo -');
    })
    .map((r) => r.id);

  if (demoIds.length) {
    await prisma.processRun.deleteMany({ where: { id: { in: demoIds } } });
    console.log(`Removed ${demoIds.length} previous demo requests.`);
  }

  for (let k = 0; k < 10; k++) {
    const intake = demoIntake(k);
    const rows = buildChecklistRows(intake);

    const run = await prisma.processRun.create({
      data: {
        status: 'submitted',
        intake: intake as object,
        n8nOk: k % 9 === 6 ? false : k % 7 === 0 ? true : null,
        n8nError: k % 9 === 6 ? 'Demo: simulated n8n failure' : null,
        checklist: {
          create: rows.map((r) => ({
            stepKey: r.stepKey,
            stepLabel: r.stepLabel,
            owner: r.owner,
            sortOrder: r.sortOrder,
            status: r.status,
          })),
        },
      },
      include: { checklist: { orderBy: { sortOrder: 'asc' } } },
    });

    const patch = applyDemoProgress(run.checklist, k);
    if (patch) {
      await Promise.all(
        patch.map((u) =>
          prisma.checklistItem.update({
            where: { id: u.id },
            data: { status: u.status },
          })
        )
      );
    }
  }

  console.log('Seeded 10 demo requests (Demo - Entity 01 ... 10) at varied checklist stages.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
