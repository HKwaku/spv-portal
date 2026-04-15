export type DashboardSearch = {
  run?: string;
  q?: string;
  strategy?: string;
  tpa?: string;
  /** Pipeline card tab: `list` = list view; omit = Kanban */
  tab?: string;
};

export function buildDashboardHref(next: DashboardSearch): string {
  const sp = new URLSearchParams();
  if (next.run) sp.set('run', next.run);
  if (next.q) sp.set('q', next.q);
  if (next.strategy) sp.set('strategy', next.strategy);
  if (next.tpa) sp.set('tpa', next.tpa);
  if (next.tab && next.tab !== 'pipeline') sp.set('tab', next.tab);
  const s = sp.toString();
  return s ? `/?${s}` : '/';
}
