import { money, tons } from '@/utils/format';

/** The hero tile. Always states the arithmetic under the figure. */
export default function ProfitCard({ label, totals, rates }) {
  const rate = rates?.rkrProfitPerTon ?? totals?.rkrProfitPerTon ?? 10;
  return (
    <div className="tile profit">
      <div className="tile-k">{label}</div>
      <div className="tile-v">{money(totals?.rkrProfit || 0)}</div>
      <div className="tile-sub">
        {tons(totals?.totalWeightTons || 0)} Tons {'\u00d7'} {'\u20b9'}{rate}
      </div>
    </div>
  );
}
