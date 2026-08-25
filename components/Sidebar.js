'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { count } from '@/utils/format';

/**
 * From the original <header class="strip">: the RKR wordmark and tagline move
 * into a left rail, because the single-page dashboard is now several routes.
 * The navy/gold treatment and Montserrat wordmark are unchanged.
 */
const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/loads', label: 'Load Entry' },
  { href: '/datewise', label: 'Date-wise Profit' },
  { href: '/reports', label: 'Reports' },
  { href: '/invoices', label: 'Weekly Invoice' },
  { href: '/settings', label: 'Rate Card' },
];

export default function Sidebar({ capacity }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="mark">
        <div className="mark-name">RKR <em>ENTERPRISES</em></div>
        <div className="mark-sub">Planning&nbsp; |&nbsp; Solutions&nbsp; |&nbsp; Growth</div>
      </div>

      <nav className="side-nav" aria-label="Main">
        {LINKS.map((l) => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`side-link${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      {capacity ? (
        <div className="side-foot">
          <div className="cap-line">
            {count(capacity.used)} / {count(capacity.maximumLoads)} loads used
          </div>
          <div className="cap-bar">
            <div
              className={`cap-fill${capacity.percentUsed > 85 ? ' hot' : ''}${
                capacity.remaining === 0 ? ' full' : ''}`}
              style={{ width: `${Math.min(100, capacity.percentUsed || 0)}%` }}
            />
          </div>
          <div className="cap-line" style={{ marginTop: 5 }}>
            {count(capacity.remaining)} remaining
          </div>
        </div>
      ) : null}
    </aside>
  );
}
