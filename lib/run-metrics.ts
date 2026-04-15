import { strategyToLabel } from './intake-lookups';

export type RunWithChecklistLite = {
  id: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  n8nOk: boolean | null;
  n8nError: string | null;
  intake: unknown;
  /** Omitted or empty when not loaded; callers treat as []. */
  checklist?: { status: string; sortOrder: number; owner?: string | null }[];
};

export function runProgressPct(run: RunWithChecklistLite): number {
  return checklistProgressPct(run.checklist);
}

/** Progress % from checklist items only (same rules as run progress). */
export function checklistProgressPct(items: { status: string; sortOrder?: number }[] | undefined | null): number {
  if (!items?.length) return 0;
  const applicable = items.filter((c) => c.status !== 'na').length;
  if (applicable === 0) return 0;
  const done = items.filter((c) => c.status === 'done').length;
  return Math.round((done / applicable) * 100);
}

export function runBlockedCount(run: RunWithChecklistLite): number {
  return (run.checklist ?? []).filter((c) => c.status === 'blocked').length;
}

export type WorkflowPhase = 'intake' | 'active' | 'wrap' | 'done';

export function runPhase(run: RunWithChecklistLite): WorkflowPhase {
  const p = runProgressPct(run);
  if (p >= 100) return 'done';
  if (p >= 70) return 'wrap';
  if (p > 0) return 'active';
  return 'intake';
}

export function portfolioMetrics(runs: RunWithChecklistLite[]) {
  let inFlight = 0;
  let done = 0;
  let blockedSteps = 0;
  let n8nIssues = 0;

  for (const r of runs) {
    const p = runProgressPct(r);
    if (p >= 100) done += 1;
    else if (p > 0) inFlight += 1;
    blockedSteps += runBlockedCount(r);
    if (r.n8nOk === false) n8nIssues += 1;
  }

  return {
    total: runs.length,
    notStarted: runs.length - inFlight - done,
    inFlight,
    done,
    blockedSteps,
    n8nIssues,
  };
}

export type DashboardFilters = {
  q?: string;
  strategy?: string;
  tpa?: string;
};

/**
 * Client-side search: partial match across entity name, strategy (slug + label), TPA, jurisdiction.
 * Multi-word queries require every token to match somewhere in that combined string.
 */
export function filterRunsBySearchQuery(runs: RunWithChecklistLite[], raw: string): RunWithChecklistLite[] {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return runs;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  return runs.filter((r) => {
    const intake = r.intake as { entityName?: string; strategy?: string; tpa?: string; jurisdiction?: string };
    const strat = intake.strategy ?? '';
    const haystack = [intake.entityName ?? '', strat, strategyToLabel(strat), intake.tpa ?? '', intake.jurisdiction ?? '']
      .join(' ')
      .toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  });
}

export function applyDashboardFilters(runs: RunWithChecklistLite[], f: DashboardFilters): RunWithChecklistLite[] {
  let out = runs;
  const q = f.q?.trim().toLowerCase();
  if (q) {
    out = out.filter((r) => {
      const intake = r.intake as { entityName?: string };
      return (intake.entityName ?? '').toLowerCase().includes(q);
    });
  }
  if (f.strategy) {
    out = out.filter((r) => {
      const intake = r.intake as { strategy?: string };
      return intake.strategy === f.strategy;
    });
  }
  if (f.tpa) {
    out = out.filter((r) => {
      const intake = r.intake as { tpa?: string };
      return intake.tpa === f.tpa;
    });
  }
  return out;
}
