import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Page not found</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        That request or route does not exist.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
