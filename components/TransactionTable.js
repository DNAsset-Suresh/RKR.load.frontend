'use client';

import { money, kg, tons, fmtDate } from '@/utils/format';
import LoadingState from './LoadingState';

/**
 * The ledger, from the original <table id="tbl">. Same columns, same alignment,
 * same gold RKR column, plus View / Edit / Delete per row.
 */
export default function TransactionTable({
  rows, meta, loading, onView, onEdit, onDelete, emptyHint,
}) {
  if (loading && !rows) return <LoadingState variant="rows" rows={6} />;

  const totals = meta?.totals;

  return (
    <div className="tscroll">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Vehicle Number</th>
            <th className="r">Weight KG</th>
            <th className="r">Weight Tons</th>
            <th className="r">Customer Total</th>
            <th className="r">Company Total</th>
            <th className="r">RKR Profit</th>
            <th className="r">Actions</th>
          </tr>
        </thead>

        <tbody>
          {!rows || rows.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className="empty">
                  <div className="empty-t">No loads in this view</div>
                  <div>{emptyHint || 'Add a load, or widen the date range.'}</div>
                </div>
              </td>
            </tr>
          ) : rows.map((t) => (
            <tr key={t.id}>
              <td className="num">{fmtDate(t.date)}</td>
              <td className="veh">{t.vehicleNumber}</td>
              <td className="r">{kg(t.weightKg)}</td>
              <td className="r">{tons(t.weightTons)}</td>
              <td className="r">{money(t.customerTotalAmount)}</td>
              <td className="r">{money(t.companyTotalAmount)}</td>
              <td className="r gold">{money(t.rkrProfit)}</td>
              <td className="r">
                <div className="act">
                  <button className="abtn" onClick={() => onView(t)}>View</button>
                  <button className="abtn" onClick={() => onEdit(t)}>Edit</button>
                  <button className="abtn del" onClick={() => onDelete(t)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>

        {totals && rows && rows.length > 0 ? (
          <tfoot>
            <tr>
              <td className="lab">Period total</td>
              <td className="lab">{totals.loadCount} vehicles</td>
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
