export default function NewLoading() {
  return (
    <div>
      <div className="skeleton skeleton-line short" style={{ width: '100px', marginBottom: '0.5rem' }} />
      <div className="skeleton skeleton-line" style={{ width: 'min(340px, 90%)', height: '1.65rem', marginBottom: '0.75rem' }} />
      <div className="skeleton skeleton-line short" style={{ width: 'min(480px, 100%)', marginBottom: '1.5rem' }} />
      <div className="card">
        <div className="skeleton skeleton-line short" style={{ width: '60%', marginBottom: '1rem' }} />
        <div className="grid2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="skeleton skeleton-line short" style={{ width: '40%', marginBottom: '0.35rem' }} />
              <div className="skeleton skeleton-line" style={{ height: '2.5rem' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
