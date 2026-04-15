/**
 * Dashboard timestamps must not use `toLocaleString(undefined, ...)` - the server and
 * browser default locales differ and cause React hydration mismatches.
 */
const DASHBOARD_LOCALE = 'en-GB';

const DASHBOARD_OPTS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

function formatDashboard(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString(DASHBOARD_LOCALE, DASHBOARD_OPTS);
}

/** “Last intake” caption and similar. */
export function formatDashboardCaptionTime(isoOrDate: string | Date): string {
  return formatDashboard(isoOrDate);
}

/** "Updated" column in pipeline list view table. */
export function formatDashboardTableTime(isoOrDate: string | Date): string {
  return formatDashboard(isoOrDate);
}
