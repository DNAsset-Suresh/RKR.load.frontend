'use client';

import { money, kg, tons, fmtDate } from '@/utils/format';
import LoadingState from './LoadingState';

/**
 * Date-wise profit: one row per day that actually had loads, with each day's
 * share of the period's profit as a bar. Grouped by PostgreSQL, not here.
 */
export default function DateWiseTable({ report, loading, onSelectDate }) {
  if (loading && !report) return <LoadingState variant="rows" rows={6} />;
  const days = report?.days || [];
  const totals = report?.totals;
  const maxProfit = days.reduce((m, d) => Math.max(m, d.rkrProfit), 0);

  return (
    <div className="tscroll">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th className="r">Vehicles</th>
            <th className="r">Weight KG</th>
            <th className="r">Tons</th>
            <th className="r">Customer Total</th>
            <th className="r">Company Total</th>
            <th className="r">RKR Profit</th>
            <th>Share of period</th>
          </tr>
        </thead>

        <tbody>
          {days.length === 0 ? (
            <tr>
              <td colSpan={9}>
                <div className="empty">
                  <div className="empty-t">Nothing to show for these dates</div>
                  <div>Pick a wider range, or add a load.</div>
                </div>
              </td>
            </tr>
          ) : days.map((d) => (
            <tr
              key={d.date}
              className="dw-row"
              onClick={() => onSelectDate && onSelectDate(d.date)}
              title="Show these loads in the ledger"
            >
              <td className="num">{fmtDate(d.date)}</td>
              <td className="day">{d.dayName}</td>
              <td className="r">{d.loadCount}</td>
              <td className="r">{kg(d.totalWeightKg)}</td>
              <td className="r">{tons(d.totalWeightTons)}</td>
              <td className="r">{money(d.customerTotalAmount)}</td>
              <td className="r">{money(d.companyTotalAmount)}</td>
              <td className="r gold">{money(d.rkrProfit)}</td>
              <td>
                <div className="share">
                  <div className="share-bar">
                    <div
                      className="share-fill"
                      style={{ width: `${maxProfit > 0 ? (d.rkrProfit / maxProfit) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="share-pct">{Math.round(d.shareOfProfit)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>

        {totals && days.length > 0 ? (
          <tfoot>
            <tr>
              <td className="lab">Total</td>
              <td className="lab">{days.length} days</td>
              <td className="r">{totals.loadCount}</td>
              <td className="r">{kg(totals.totalWeightKg)}</td>
              <td className="r">{tons(totals.totalWeightTons)}</td>
              <td className="r">{money(totals.customerTotalAmount)}</td>
              <td className="r">{money(totals.companyTotalAmount)}</td>
              <td className="r" style={{ color: 'var(--gold-d)' }}>{money(totals.rkrProfit)}</td>
              <td />
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
