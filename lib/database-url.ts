/**
 * Builds `process.env.DATABASE_URL` from split env vars when it is not set.
 * Prisma still reads `DATABASE_URL`; this keeps secrets out of a single concatenated string in config UIs.
 *
 * Supabase: set `SUPABASE_PROJECT_REF` + `SUPABASE_DB_PASSWORD` (optional overrides below).
 * Any host: set `DATABASE_URL` directly and composition is skipped.
 *
 * If `DATABASE_URL` is a leftover SQLite `file:...` URL or otherwise not a Postgres URL, it is ignored
 * so split vars (or a corrected `DATABASE_URL`) can be used.
 */

function isPostgresConnectionUrl(url: string): boolean {
  const u = url.trim();
  return u.startsWith('postgresql://') || u.startsWith('postgres://');
}

/** True if URL points at loopback — often a stray env from another tool; prefer Supabase split vars when set. */
function isLoopbackPostgresUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return (
    u.includes('@127.0.0.1:') ||
    u.includes('@localhost:') ||
    u.includes('://127.0.0.1:') ||
    u.includes('://localhost:')
  );
}

/** Supabase internal project UUID — wrong value for db host; Reference ID is different. */
function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());
}

function normalizeHostFragment(s: string): string {
  return s.replace(/^https?:\/\//, '').trim().split('/')[0] ?? '';
}

/**
 * Resolves the Postgres host for Supabase.
 * - `SUPABASE_DB_HOST` wins if set (paste `db.xxxxx.supabase.co` from the dashboard).
 * - Else `SUPABASE_PROJECT_REF` may be either the short Reference ID or a full `db....supabase.co` host.
 * - Do not use the long "Project ID" UUID — use Reference ID from Settings → General, or paste the host.
 */
export function resolveSupabaseDbHost(): string | null {
  const explicit = process.env.SUPABASE_DB_HOST?.trim();
  if (explicit) return normalizeHostFragment(explicit);

  const ref = process.env.SUPABASE_PROJECT_REF?.trim();
  if (!ref) return null;

  if (ref.includes('.supabase.co')) {
    return normalizeHostFragment(ref);
  }

  if (looksLikeUuid(ref)) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[database-url] SUPABASE_PROJECT_REF looks like a project UUID. That is not the DB hostname.\n' +
          '  → Open Supabase → Project Settings → General → copy Reference ID (short), not the UUID.\n' +
          '  → Or set SUPABASE_DB_HOST to the host from Settings → Database (e.g. db.xxxxx.supabase.co).',
      );
    }
    return null;
  }

  return `db.${ref}.supabase.co`;
}

export function composeDatabaseUrl(): void {
  let raw = process.env.DATABASE_URL?.trim();

  if (raw && isPostgresConnectionUrl(raw)) {
    const hasSplit =
      (process.env.SUPABASE_PROJECT_REF?.trim() || process.env.SUPABASE_DB_HOST?.trim()) &&
      process.env.SUPABASE_DB_PASSWORD !== undefined &&
      process.env.SUPABASE_DB_PASSWORD !== '';
    if (!(hasSplit && isLoopbackPostgresUrl(raw))) return;
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[database-url] Ignoring loopback DATABASE_URL because SUPABASE_* split vars are set (use Supabase for this project).',
      );
    }
    delete process.env.DATABASE_URL;
    raw = undefined;
  }

  if (raw && !isPostgresConnectionUrl(raw)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[database-url] Ignoring DATABASE_URL (not a postgres:// URL). Remove leftover SQLite `file:...` or set a valid postgresql:// URL.',
      );
    }
    delete process.env.DATABASE_URL;
    raw = undefined;
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  if (password === undefined || password === '') return;

  const host = resolveSupabaseDbHost();
  if (!host) return;

  const user = process.env.SUPABASE_DB_USER?.trim() || 'postgres';
  const port = process.env.SUPABASE_DB_PORT?.trim() || '5432';
  const database = process.env.SUPABASE_DB_NAME?.trim() || 'postgres';
  const sslmode = process.env.SUPABASE_DB_SSLMODE?.trim() || 'require';

  const u = encodeURIComponent(user);
  const p = encodeURIComponent(password);
  process.env.DATABASE_URL = `postgresql://${u}:${p}@${host}:${port}/${database}?sslmode=${encodeURIComponent(sslmode)}`;

  if (process.env.NODE_ENV === 'development') {
    console.info(`[database-url] Composed DATABASE_URL for host ${host} (user ${user}, db ${database}).`);
  }
}
