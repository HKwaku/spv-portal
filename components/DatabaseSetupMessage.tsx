/**
 * Shown when Prisma cannot reach the database (missing env, wrong URL, or tables not created).
 */
export default function DatabaseSetupMessage({ digest }: { digest?: string }) {
  return (
    <div className="card" style={{ maxWidth: '46rem', margin: '2rem auto' }}>
      <h1 className="card-title" style={{ marginBottom: '0.75rem' }}>
        Database not configured
      </h1>
      <p className="muted" style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
        Prisma needs a <strong>Postgres connection string</strong> in{' '}
        <code style={{ fontSize: '0.9em' }}>DATABASE_URL</code>. In Supabase:{' '}
        <strong>Project Settings → Database</strong> → copy the URI (same project as{' '}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> in JS-only apps, but Prisma uses the Postgres URL, not the anon key). On{' '}
        <strong>Vercel</strong>, add that value under <strong>Environment Variables</strong> and redeploy.
      </p>
      <p className="muted" style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
        Create tables <strong>once</strong> from your machine (with <code>DATABASE_URL</code> in <code>.env</code>):
      </p>
      <pre
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'rgba(0,0,0,0.35)',
          fontSize: '0.82rem',
          overflow: 'auto',
        }}
      >
        npx prisma db push
      </pre>
      <p className="muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
        See <code>README.md</code>. If Vercel still cannot connect, try the <strong>transaction pooler</strong> URI (port
        6543) from Supabase instead of direct 5432.
      </p>
      {digest ? (
        <p className="muted" style={{ marginTop: '1rem', fontSize: '0.78rem' }}>
          Error digest: {digest}
        </p>
      ) : null}
    </div>
  );
}
