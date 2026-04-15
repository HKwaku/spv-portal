import { CHECKLIST_GROUPS } from '@/lib/checklist-groups';
import { strategyToLabel } from '@/lib/intake-lookups';
import type { RunWithChecklistLite } from '@/lib/run-metrics';
import { runPhase, runProgressPct } from '@/lib/run-metrics';

/** Keys used for stacked TPA segments (unknown / missing -> Other). */
export const TPA_STACK_KEYS = ['Apex', 'CSC', 'JPM', 'BNP', 'Other'] as const;
export type TpaStackKey = (typeof TPA_STACK_KEYS)[number];

export const TPA_STACK_COLORS: Record<TpaStackKey, string> = {
  Apex: '#22c55e',
  CSC: '#3b82f6',
  JPM: '#a855f7',
  BNP: '#f59e0b',
  Other: '#64748b',
};

export type StackedByTpaRow = { name: string } & Record<TpaStackKey, number>;

const PHASE_ORDER = ['intake', 'active', 'wrap', 'done'] as const;
const PHASE_LABEL: Record<(typeof PHASE_ORDER)[number], string> = {
  intake: 'Intake',
  active: 'In motion',
  wrap: 'Wrap-up',
  done: 'Complete',
};

function emptyTpaCounts(): Record<TpaStackKey, number> {
  return { Apex: 0, CSC: 0, JPM: 0, BNP: 0, Other: 0 };
}

function tpaBucket(raw: string | undefined): TpaStackKey {
  const v = raw ?? '';
  if (v === 'Apex' || v === 'CSC' || v === 'JPM' || v === 'BNP') return v;
  return 'Other';
}

/** One row per pipeline phase; each TPA column counts runs in that phase with that TPA. */
export function buildPhaseStackedByTpa(runs: RunWithChecklistLite[]): StackedByTpaRow[] {
  const byPhase: Record<(typeof PHASE_ORDER)[number], Record<TpaStackKey, number>> = {
    intake: { ...emptyTpaCounts() },
    active: { ...emptyTpaCounts() },
    wrap: { ...emptyTpaCounts() },
    done: { ...emptyTpaCounts() },
  };
  for (const r of runs) {
    const phase = runPhase(r);
    const tpa = tpaBucket((r.intake as { tpa?: string }).tpa);
    byPhase[phase][tpa] += 1;
  }
  return PHASE_ORDER.map((key) => ({
    name: PHASE_LABEL[key],
    ...byPhase[key],
  }));
}

/** Top strategies by run count; each row stacked by TPA. */
export function buildStrategyStackedByTpa(runs: RunWithChecklistLite[], limit = 8): StackedByTpaRow[] {
  const slugTotals = new Map<string, number>();
  const slugTpa = new Map<string, Record<TpaStackKey, number>>();

  for (const r of runs) {
    const slug = (r.intake as { strategy?: string }).strategy ?? '-';
    slugTotals.set(slug, (slugTotals.get(slug) ?? 0) + 1);
    if (!slugTpa.has(slug)) slugTpa.set(slug, { ...emptyTpaCounts() });
    const tpa = tpaBucket((r.intake as { tpa?: string }).tpa);
    const row = slugTpa.get(slug)!;
    row[tpa] += 1;
  }

  const topSlugs = [...slugTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => slug);

  return topSlugs.map((slug) => {
    const counts = slugTpa.get(slug) ?? emptyTpaCounts();
    return {
      name: slug === '-' ? '-' : strategyToLabel(slug),
      ...counts,
    };
  });
}

/** Average checklist completion % across runs (0 if none). */
export function averageProgressPct(runs: RunWithChecklistLite[]): number {
  if (runs.length === 0) return 0;
  const sum = runs.reduce((acc, r) => acc + runProgressPct(r), 0);
  return Math.round(sum / runs.length);
}

const PHASE_CHART_LABEL: Record<string, string> = {
  'req-tax': 'Req. & tax',
  legal: 'Legal form.',
  'post-sys': 'Post-form.',
  'reg-bank': 'Reg. & bank',
  'tax-rep': 'Tax & rep.',
};

function groupIndexForSortOrder(sortOrder: number): number {
  for (let i = 0; i < CHECKLIST_GROUPS.length; i++) {
    const g = CHECKLIST_GROUPS[i];
    if (sortOrder >= g.minSort && sortOrder <= g.maxSort) return i;
  }
  return -1;
}

/**
 * Which workflow stage an entity is in: first incomplete (non-N/A) checklist step by order,
 * or "complete" when every applicable item is done.
 */
export function entityWorkflowStageId(r: RunWithChecklistLite): string {
  const sorted = [...(r.checklist ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const item of sorted) {
    if (item.status === 'na') continue;
    if (item.status !== 'done') {
      const gi = groupIndexForSortOrder(item.sortOrder);
      return gi >= 0 ? CHECKLIST_GROUPS[gi].id : 'complete';
    }
  }
  return 'complete';
}

export type EntityStageCountRow = { name: string; fullName: string; count: number; fill: string };

/** One bar per stage: how many entities (runs) are currently in that workflow stage. */
export function buildEntityCountByWorkflowStage(runs: RunWithChecklistLite[]): EntityStageCountRow[] {
  const counts: Record<string, number> = {};
  for (const g of CHECKLIST_GROUPS) counts[g.id] = 0;
  counts.complete = 0;

  for (const r of runs) {
    const id = entityWorkflowStageId(r);
    counts[id] = (counts[id] ?? 0) + 1;
  }

  const inProgressFill = '#5b8def';
  const completeFill = '#34d399';

  const rows: EntityStageCountRow[] = CHECKLIST_GROUPS.map((g) => ({
    name: PHASE_CHART_LABEL[g.id] ?? g.title,
    fullName: g.title,
    count: counts[g.id] ?? 0,
    fill: inProgressFill,
  }));

  rows.push({
    name: 'Complete',
    fullName: 'All applicable checklist steps done',
    count: counts.complete ?? 0,
    fill: completeFill,
  });

  return rows;
}
