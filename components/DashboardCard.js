import { money, kg, tons, count } from '@/utils/format';

/**
 * The original <div class="tile">. Three variants, same markup the CSS already
 * styles: plain, `rate` (gold outline) and `profit` (navy with gold figure).
 */
export default function DashboardCard({ label, value, sub, variant = 'plain', format }) {
  const formatted =
    format === 'money' ? money(value)
      : format === 'kg' ? `${kg(value)} KG`
      : format === 'tons' ? tons(value)
      : format === 'count' ? count(value)
      : value;

  return (
    <div className={`tile${variant === 'profit' ? ' profit' : variant === 'rate' ? ' rate' : ''}`}>
      <div className="tile-k">{label}</div>
      <div className="tile-v">{formatted}</div>
      {sub ? <div className="tile-sub">{sub}</div> : null}
    </div>
  );
}
