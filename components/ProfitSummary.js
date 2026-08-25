import { money, kg, tons } from '@/utils/format';

/**
 * The three-column billing panel: customer, company, RKR - each showing base,
 * GST and total with the formula printed underneath, so anyone can check the
 * arithmetic without opening a calculator.
 */
function Column({ name, rate, lines, totalLabel, totalValue, formula, gold }) {
  return (
    <div className={`bill-col${gold ? ' rkr' : ''}`}>
      <div className="bill-h">
        <span className="bill-name">{name}</span>
        <span className="bill-rate">{rate}</span>
      </div>
      {lines.map(([k, v]) => (
        <div className="bill-line" key={k}>
          <span>{k}</span><span>{v}</span>
        </div>
      ))}
      <div className="bill-line total">
        <span>{totalLabel}</span><span>{totalValue}</span>
      </div>
      <div className="formula">{formula}</div>
    </div>
  );
}

export default function ProfitSummary({ totals }) {
  if (!totals) return null;
  const t = tons(totals.totalWeightTons);
  const R = '\u20b9';
  const X = '\u00d7';

  return (
    <div className="billing">
      <Column
        name="Customer" rate={`${R}${totals.customerRatePerTon} / ton`}
        lines={[
          ['Total Tons', t],
          [`Base Amount  (${t} ${X} ${R}${totals.customerRatePerTon})`, money(totals.customerBaseAmount)],
          [`GST @ ${totals.customerGstRate}%`, money(totals.customerGstAmount)],
        ]}
        totalLabel="Customer Total" totalValue={money(totals.customerTotalAmount)}
        formula={`Tons ${X} ${R}${totals.customerRatePerTon} + ${totals.customerGstRate}% GST`}
      />
      <Column
        name="Company" rate={`${R}${totals.companyRatePerTon} / ton`}
        lines={[
          ['Total Tons', t],
          [`Base Amount  (${t} ${X} ${R}${totals.companyRatePerTon})`, money(totals.companyBaseAmount)],
          [`GST @ ${totals.companyGstRate}%`, money(totals.companyGstAmount)],
        ]}
        totalLabel="Company Total" totalValue={money(totals.companyTotalAmount)}
        formula={`Tons ${X} ${R}${totals.companyRatePerTon} + ${totals.companyGstRate}% GST`}
      />
      <Column
        gold name="RKR Profit" rate={`${R}${totals.rkrProfitPerTon} / ton`}
        lines={[
          ['Total Weight', `${kg(totals.totalWeightKg)} KG`],
          [`Total Tons  (KG ${'\u00f7'} 1,000)`, t],
          ['Rate per Ton', `${R}${Number(totals.rkrProfitPerTon).toFixed(2)}`],
        ]}
        totalLabel="RKR Profit" totalValue={money(totals.rkrProfit)}
        formula={`${t} Tons ${X} ${R}${totals.rkrProfitPerTon} = ${money(totals.rkrProfit)}`}
      />
    </div>
  );
}
