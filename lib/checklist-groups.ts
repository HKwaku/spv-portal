/** Buckets aligned with process step sortOrder ranges (see lib/process-steps.ts). */
export type ChecklistGroupDef = {
  id: string;
  title: string;
  minSort: number;
  maxSort: number;
};

export const CHECKLIST_GROUPS: ChecklistGroupDef[] = [
  { id: 'req-tax', title: 'Requirements & tax', minSort: 0, maxSort: 44 },
  { id: 'legal', title: 'Legal formation', minSort: 45, maxSort: 84 },
  { id: 'post-sys', title: 'Post-formation & systems', minSort: 85, maxSort: 119 },
  { id: 'reg-bank', title: 'Regulatory & banking', minSort: 120, maxSort: 169 },
  { id: 'tax-rep', title: 'Tax registration & reporting', minSort: 170, maxSort: 99999 },
];

export function groupChecklistItems<T extends { sortOrder: number }>(
  items: T[]
): { group: ChecklistGroupDef; items: T[] }[] {
  return CHECKLIST_GROUPS.map((group) => ({
    group,
    items: items.filter((i) => i.sortOrder >= group.minSort && i.sortOrder <= group.maxSort),
  })).filter((x) => x.items.length > 0);
}
