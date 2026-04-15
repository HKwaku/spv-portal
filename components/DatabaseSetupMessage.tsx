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
        The app could not connect to PostgreSQL. On <strong>Vercel</strong>, open{' '}
        <strong>Project → Settings → Environment Variables</strong> and set{' '}
        <code style={{ fontSize: '0.9em' }}>DATABASE_URL</code> to your hosted Postgres URL (Neon, Vercel Postgres,
        Supabase, etc.). Use a URL that includes SSL if your provider requires it, e.g.{' '}
        <code style={{ fontSize: '0.85em' }}>?sslmode=require</code> at the end.
      </p>
      <p className="muted" style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
        Then create tables <strong>once</strong> against that database from your computer:
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
        {`set DATABASE_URL=<same URL as Vercel>
npx prisma db push`}
      </pre>
      <p className="muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
        Redeploy after saving env vars. See <code>README.md</code> in the repo for details.
      </p>
      {digest ? (
        <p className="muted" style={{ marginTop: '1rem', fontSize: '0.78rem' }}>
          Error digest: {digest}
        </p>
      ) : null}
    </div>
  );
}
