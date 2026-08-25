import { money, tons, fmtDate } from '@/utils/format';

/**
 * The 14-day tonnage strip. Bars are plain divs sized by percentage - no chart
 * library, and it inherits the theme tokens automatically.
 */
export default function TonnageChart({ chart, todayISO }) {
  if (!chart || chart.length === 0) return null;
  const max = chart.reduce((m, d) => Math.max(m, d.tons), 0);

  return (
    <div className="chart">
      <div className="chart-head">
        <span className="chart-t">Daily Tonnage {'\u2014'} last 14 days</span>
        <span className="chart-t">{max > 0 ? `peak ${tons(max)} T` : 'no loads yet'}</span>
      </div>
      <div className="bars">
        {chart.map((d) => {
          const pct = max > 0 ? Math.max(2, (d.tons / max) * 100) : 2;
          return (
            <div
              key={d.date}
              className={`bar-col${d.date === todayISO ? ' today' : ''}${d.tons === 0 ? ' zero' : ''}`}
              title={`${fmtDate(d.date)} \u2014 ${tons(d.tons)} Tons \u00b7 ${money(d.rkrProfit)}`}
            >
              <div className="bar" style={{ height: `${pct.toFixed(1)}%` }} />
              <div className="bar-lab">{fmtDate(d.date).slice(0, 5)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 10 }} />
    </div>
  );
}
