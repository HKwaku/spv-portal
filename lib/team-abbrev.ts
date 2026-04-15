import { PROCESS_STEPS } from './process-steps';

/**
 * Short labels for process-step owner strings (checklist "team"), for dense tables.
 */
const OWNER_TO_ABBREV: Record<string, string> = {
  'Deal Team': 'Deal',
  'Fund Transaction Ops': 'FTO',
  'Tax Team': 'Tax',
  'Tax team': 'Tax',
  'Fund Counsel / TPA': 'FC/TPA',
  'Fund Counsel': 'FC',
  TPA: 'TPA',
  'External advisor': 'Ext',
  'GEMS team': 'GEMS',
  'Jersey counsel': 'Jersey',
  'Tax advisors / TPA': 'Tax/TPA',
  'ICG Tax Team': 'ICG Tax',
};

export function abbrevTeamOwner(owner: string): string {
  const a = OWNER_TO_ABBREV[owner];
  if (a) return a;
  if (owner.length <= 10) return owner;
  return `${owner.slice(0, 8)}...`;
}

export type ChecklistLiteItem = { status: string; sortOrder: number; owner?: string | null };

/** First non-done, non-na step: owning team for the active step. */
export function currentStepTeamAbbrev(items: ChecklistLiteItem[] | undefined | null): string | null {
  if (!items?.length) return null;
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const item of sorted) {
    if (item.status === 'na') continue;
    if (item.status === 'done') continue;
    const o = item.owner ?? PROCESS_STEPS.find((s) => s.sortOrder === item.sortOrder)?.owner;
    if (o) return abbrevTeamOwner(o);
  }
  return null;
}
