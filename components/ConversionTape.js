import { money, kg, tons } from '@/utils/format';

/**
 * The live KG -> Tons -> profit tape under the entry form.
 *
 * `preview` comes from POST /api/transactions/preview, so the figures shown
 * here are produced by the same engine that will store the row - no duplicate
 * arithmetic in the browser.
 */
export default function ConversionTape({ raw, preview, error, loading, rates }) {
  if (error) {
    return <div className="tape"><span className="err">{error}</span></div>;
  }
  if (!raw) {
    return (
      <div className="tape">
        <span className="tape-idle">
          Enter a weight to see the KG {'\u2192'} Tons {'\u2192'} Profit conversion.
        </span>
      </div>
    );
  }
  if (loading || !preview) {
    return (
      <div className="tape">
        <span className="cap"><span className="spinner" /> Calculating on the server{'\u2026'}</span>
      </div>
    );
  }

  const Step = ({ k, v, hero }) => (
    <span className={`tape-step${hero ? ' hero' : ''}`}>
      <span className="tape-k">{k}</span>
      <span className="tape-v">{v}</span>
    </span>
  );
  const Arrow = () => <span className="tape-arrow">{'\u2192'}</span>;

  return (
    <div className="tape">
      <Step k="Weight" v={`${kg(preview.weightKg)} KG`} />
      <Arrow />
      <Step k={'\u00f7 1,000 = Tons'} v={`${tons(preview.weightTons)} Tons`} />
      <Arrow />
      <Step k="Customer (incl. GST)" v={money(preview.customerTotalAmount)} />
      <Step k="Company (incl. GST)" v={money(preview.companyTotalAmount)} />
      <Arrow />
      <Step k="RKR Profit" v={money(preview.rkrProfit)} hero />
      <span className="tape-step" style={{ borderLeft: '1px solid var(--hair)' }}>
        <span className="tape-k">Formula</span>
        <span className="tape-v" style={{ fontSize: '12.5px', color: 'var(--faint)' }}>
          {tons(preview.weightTons)} {'\u00d7'} {'\u20b9'}
          {rates?.rkrProfitPerTon ?? preview.rkrProfitPerTon}
        </span>
      </span>
    </div>
  );
}
