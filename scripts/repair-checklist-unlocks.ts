/**
 * One-off: fix isUnlocked flags for every process run (e.g. after older seed data left all steps locked).
 * Usage: npx tsx scripts/repair-checklist-unlocks.ts
 */
import { PrismaClient } from '@prisma/client';
import { syncUnlockedFlagsForRun } from '../lib/sync-checklist-unlock';

const prisma = new PrismaClient();

async function main() {
  const runs = await prisma.processRun.findMany({ select: { id: true } });
  for (const r of runs) {
    await syncUnlockedFlagsForRun(prisma, r.id);
  }
  console.log(`Repaired unlock flags for ${runs.length} process run(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
