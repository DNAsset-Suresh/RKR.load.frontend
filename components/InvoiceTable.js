'use client';

import Link from 'next/link';
import { money, kg, tons, fmtDate } from '@/utils/format';

/** Invoice list as cards - a week is a richer object than a table row. */
export default function InvoiceTable({ invoices, onDownloadPdf, onDownloadExcel, busyId }) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="empty">
        <div className="empty-t">No invoices yet</div>
        <div>Generate the first weekly invoice above.</div>
      </div>
    );
  }

  return (
    <div className="inv-grid">
      {invoices.map((inv) => (
        <div className="inv-card" key={inv.id}>
          <div className="inv-card-h">
            <span className="inv-no">{inv.invoiceNumber}</span>
            <span className={`badge ${inv.status.toLowerCase()}`}>{inv.status}</span>
          </div>

          <div className="inv-period">
            {fmtDate(inv.weekStart)} {'\u2192'} {fmtDate(inv.weekEnd)}
            {inv.regeneratedCount > 0 ? `  \u00b7  regenerated ${inv.regeneratedCount}\u00d7` : ''}
          </div>

          <div className="inv-figs">
            <div>
              <div className="inv-fig-k">Loads</div>
              <div className="inv-fig-v">{inv.totalLoads}</div>
            </div>
            <div>
              <div className="inv-fig-k">Tons</div>
              <div className="inv-fig-v">{tons(inv.totalWeightTons)}</div>
            </div>
            <div>
              <div className="inv-fig-k">RKR Profit</div>
              <div className="inv-fig-v gold">{money(inv.rkrProfit)}</div>
            </div>
          </div>

          <div className="inv-actions">
            <Link className="tbtn" href={`/invoices/${inv.id}`}>View</Link>
            <button
              className="tbtn" disabled={busyId === inv.id}
              onClick={() => onDownloadPdf(inv)}
            >
              {busyId === inv.id ? <span className="spinner" /> : 'Download PDF'}
            </button>
            <button className="tbtn" onClick={() => onDownloadExcel(inv)}>Excel</button>
          </div>
        </div>
      ))}
    </div>
  );
}
