'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card" style={{ maxWidth: '46rem', margin: '2rem auto' }}>
      <h1 className="card-title" style={{ marginBottom: '0.75rem' }}>
        Something went wrong
      </h1>
      <p className="muted" style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
        A server error occurred. If this is a fresh Vercel deploy, confirm <code>DATABASE_URL</code> is set to your
        Supabase Postgres URI and run <code>npx prisma db push</code> once from your machine (see README).
      </p>
      {error.digest ? (
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          Digest: {error.digest}
        </p>
      ) : null}
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
