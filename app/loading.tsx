export default function Loading() {
  return (
    <div>
      <div className="page-header">
        <div className="skeleton skeleton-line short" style={{ width: '120px', marginBottom: '0.75rem' }} />
        <div className="skeleton skeleton-line" style={{ width: 'min(420px, 90%)', height: '1.75rem', marginBottom: '0.5rem' }} />
        <div className="skeleton skeleton-line short" style={{ width: 'min(520px, 100%)' }} />
      </div>
      <div className="stats-row">
        {[1, 2, 3].map((i) => (
          <div key={i} className="stat">
            <div className="skeleton skeleton-line" style={{ width: '3rem', height: '1.75rem' }} />
            <div className="skeleton skeleton-line short" style={{ width: '5rem', marginTop: '0.5rem' }} />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="skeleton skeleton-line" style={{ width: '40%' }} />
        <div style={{ marginTop: '1rem' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-line" style={{ marginBottom: '0.65rem' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
