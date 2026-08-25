import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page" style={{ paddingTop: 40 }}>
      <div className="empty">
        <div className="empty-t">Page not found</div>
        <div>That screen does not exist.</div>
        <Link className="tbtn primary" href="/" style={{ marginTop: 16, display: 'inline-block' }}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
