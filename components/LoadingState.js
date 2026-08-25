export default function LoadingState({ variant = 'tiles', rows = 5, label }) {
  if (variant === 'tiles') {
    return (
      <div className="tiles" aria-busy="true" aria-label={label || 'Loading'}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="tile skeleton skel-tile" />
        ))}
      </div>
    );
  }
  if (variant === 'inline') {
    return (
      <span className="cap" aria-busy="true">
        <span className="spinner" /> {label || 'Loading'}
      </span>
    );
  }
  return (
    <div className="panel" style={{ padding: 16 }} aria-busy="true" aria-label={label || 'Loading'}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skel-row" />
      ))}
    </div>
  );
}
