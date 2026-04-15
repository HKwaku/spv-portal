/** Shared status labels + cycling for checklist UIs (no dropdowns). */
export const CHECKLIST_STATUSES = ['pending', 'in_progress', 'blocked', 'done', 'na'] as const;
export type ChecklistStatus = (typeof CHECKLIST_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
  na: 'N/A',
};

export function nextChecklistStatus(current: string): string {
  const i = CHECKLIST_STATUSES.indexOf(current as ChecklistStatus);
  const next = i < 0 ? 0 : (i + 1) % CHECKLIST_STATUSES.length;
  return CHECKLIST_STATUSES[next];
}

/** Strip leading step index like `1 - `, `1 -- `, or `3b -- ` for display. */
export function stepTitleWithoutPrefix(full: string): string {
  const t = full.trim();
  const m = t.match(/^\d+[a-z]?\s*[-–—]+\s*(.+)$/i);
  return m ? m[1].trim() : t;
}

/** Short label for collapsed sidebar lines */
export function shortStepLabel(full: string): string {
  const s = stepTitleWithoutPrefix(full);
  return s.length > 14 ? `${s.slice(0, 12)}...` : s;
}
