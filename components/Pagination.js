'use client';

export default function Pagination({ meta, page, onPage }) {
  if (!meta) return null;
  const from = meta.total === 0 ? 0 : (page - 1) * meta.pageSize + 1;
  const to = Math.min(page * meta.pageSize, meta.total);

  return (
    <div className="pager">
      <span className="pager-info">{from}{'\u2013'}{to} of {meta.total}</span>
      <span style={{ display: 'flex', gap: 7 }}>
        <button className="tbtn" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
        <button
          className="tbtn"
          disabled={page >= meta.pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </span>
    </div>
  );
}
