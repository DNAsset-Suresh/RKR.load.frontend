/**
 * Errors say what went wrong and what to do about it. A network failure is the
 * common case in this app (API not started), so it gets its own wording.
 */
export default function ErrorMessage({ error, onRetry, title }) {
  if (!error) return null;
  const isNetwork = error.status === 0;

  return (
    <div className={`alert${isNetwork ? ' warn' : ''}`} role="alert">
      <div style={{ flex: 1 }}>
        <div className="alert-title">
          {title || (isNetwork ? 'Cannot reach the server' : 'Something went wrong')}
        </div>
        <div className="alert-body">{error.message}</div>

        {Array.isArray(error.details) && error.details.length > 0 ? (
          <ul className="alert-body" style={{ margin: '6px 0 0 16px' }}>
            {error.details.map((d, i) => (
              <li key={i}>{d.field ? `${d.field}: ` : ''}{d.message}</li>
            ))}
          </ul>
        ) : null}

        {isNetwork ? (
          <div className="alert-body" style={{ marginTop: 6 }}>
            Start it with <code>npm run dev</code> in the <code>backend</code> folder.
          </div>
        ) : null}

        {onRetry ? (
          <button className="tbtn" style={{ marginTop: 10 }} onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
