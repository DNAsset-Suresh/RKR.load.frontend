'use client';

export default function GlobalError({ error, reset }) {
  return (
    <div className="page" style={{ paddingTop: 40 }}>
      <div className="alert" role="alert">
        <div>
          <div className="alert-title">Something went wrong on this screen</div>
          <div className="alert-body">{error?.message || 'Unexpected error.'}</div>
          <button className="tbtn" style={{ marginTop: 10 }} onClick={reset}>Try again</button>
        </div>
      </div>
    </div>
  );
}
