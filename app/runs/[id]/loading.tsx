export default function RunLoading() {
  return (
    <div>
      <div className="skeleton skeleton-line short" style={{ width: '140px', marginBottom: '0.5rem' }} />
      <div className="skeleton skeleton-line" style={{ width: 'min(400px, 90%)', height: '1.75rem', marginBottom: '1rem' }} />
      <div className="card">
        <div className="skeleton skeleton-line short" style={{ width: '30%' }} />
        <div style={{ marginTop: '1rem' }} className="dl-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ gridColumn: '1 / -1' }} className="skeleton skeleton-line" />
          ))}
        </div>
      </div>
    </div>
  );
}
