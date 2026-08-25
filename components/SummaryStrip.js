import { money, kg, tons, count } from '@/utils/format';

/** The <div class="summary-strip"> band: six figures for the chosen period. */
export default function SummaryStrip({ totals }) {
  if (!totals) return null;
  const cells = [
    ['Vehicles', count(totals.loadCount)],
    ['Total KG', kg(totals.totalWeightKg)],
    ['Total Tons', tons(totals.totalWeightTons)],
    ['Customer Amount', money(totals.customerTotalAmount)],
    ['Company Amount', money(totals.companyTotalAmount)],
    ['RKR Profit', money(totals.rkrProfit)],
  ];
  return (
    <div className="summary-strip">
      {cells.map(([k, v]) => (
        <div className="ss" key={k}>
          <div className="ss-k">{k}</div>
          <div className="ss-v">{v}</div>
        </div>
      ))}
    </div>
  );
}
