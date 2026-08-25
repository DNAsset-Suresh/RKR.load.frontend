'use client';

import { money, kg, tons, fmtDate } from '@/utils/format';

/**
 * On-screen invoice. Deliberately mirrors the PDF layout so what the office
 * approves here is what the customer receives.
 */
export default function InvoicePreview({ invoice, business }) {
  if (!invoice) return null;
  const R = '\u20b9';

  return (
    <div>
      <div className="inv-head">
        <div className="inv-brand">RKR <em>ENTERPRISES</em></div>
        <div className="inv-meta">
          Weekly Invoice {'\u00b7'} {invoice.invoiceNumber}
        </div>
        <div className="inv-meta">
          {fmtDate(invoice.weekStart)} {'\u2192'} {fmtDate(invoice.weekEnd)}
          {'   \u00b7   '}Issued {fmtDate(invoice.invoiceDate)}
        </div>
        {business ? (
          <div className="inv-meta">
            {business.businessAddress} {'\u00b7'} {business.businessPhone} {'\u00b7'} {business.businessEmail}
          </div>
        ) : null}
      </div>

      <div className="summary-strip" style={{ border: '1px solid var(--hair)', borderRadius: 10 }}>
        <div className="ss"><div className="ss-k">Total Vehicles</div><div className="ss-v">{invoice.totalLoads}</div></div>
        <div className="ss"><div className="ss-k">Total KG</div><div className="ss-v">{kg(invoice.totalWeightKg)}</div></div>
        <div className="ss"><div className="ss-k">Total Tons</div><div className="ss-v">{tons(invoice.totalWeightTons)}</div></div>
        <div className="ss"><div className="ss-k">RKR Profit</div><div className="ss-v" style={{ color: 'var(--gold-d)' }}>{money(invoice.rkrProfit)}</div></div>
      </div>

      <div className="billing" style={{ marginTop: 18, border: '1px solid var(--hair)', borderRadius: 10, overflow: 'hidden' }}>
        <div className="bill-col">
          <div className="bill-h"><span className="bill-name">Customer</span>
            <span className="bill-rate">{R}{invoice.customerRatePerTon} / ton</span></div>
          <div className="bill-line"><span>Amount</span><span>{money(invoice.customerBaseAmount)}</span></div>
          <div className="bill-line"><span>GST @ {invoice.customerGstRate}%</span><span>{money(invoice.customerGstAmount)}</span></div>
          <div className="bill-line total"><span>Customer Total</span><span>{money(invoice.customerTotalAmount)}</span></div>
        </div>
        <div className="bill-col">
          <div className="bill-h"><span className="bill-name">Company</span>
            <span className="bill-rate">{R}{invoice.companyRatePerTon} / ton</span></div>
          <div className="bill-line"><span>Amount</span><span>{money(invoice.companyBaseAmount)}</span></div>
          <div className="bill-line"><span>GST @ {invoice.companyGstRate}%</span><span>{money(invoice.companyGstAmount)}</span></div>
          <div className="bill-line total"><span>Company Total</span><span>{money(invoice.companyTotalAmount)}</span></div>
        </div>
        <div className="bill-col rkr">
          <div className="bill-h"><span className="bill-name">RKR Profit</span>
            <span className="bill-rate">{R}{invoice.rkrProfitPerTon} / ton</span></div>
          <div className="bill-line"><span>Total Tons</span><span>{tons(invoice.totalWeightTons)}</span></div>
          <div className="bill-line"><span>Rate per Ton</span><span>{R}{Number(invoice.rkrProfitPerTon).toFixed(2)}</span></div>
          <div className="bill-line total"><span>RKR Profit</span><span>{money(invoice.rkrProfit)}</span></div>
          <div className="formula">
            {tons(invoice.totalWeightTons)} Tons {'\u00d7'} {R}{invoice.rkrProfitPerTon} = {money(invoice.rkrProfit)}
          </div>
        </div>
      </div>

      <div className="sec-head" style={{ marginTop: 22 }}>
        <h2 className="sec-title">Load breakdown</h2>
        <span className="sec-note">{invoice.items?.length || 0} loads in this week</span>
      </div>

      <div className="panel">
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Vehicle Number</th>
                <th className="r">Weight KG</th><th className="r">Tons</th>
                <th className="r">Customer</th><th className="r">Company</th>
                <th className="r">RKR Profit</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((i) => (
                <tr key={i.id}>
                  <td className="num">{fmtDate(i.date)}</td>
                  <td className="veh">{i.vehicleNumber}</td>
                  <td className="r">{kg(i.weightKg)}</td>
                  <td className="r">{tons(i.weightTons)}</td>
                  <td className="r">{money(i.customerTotalAmount)}</td>
                  <td className="r">{money(i.companyTotalAmount)}</td>
                  <td className="r gold">{money(i.rkrProfit)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="lab">Total</td>
                <td className="lab">{invoice.totalLoads} loads</td>
                <td className="r">{kg(invoice.totalWeightKg)}</td>
                <td className="r">{tons(invoice.totalWeightTons)}</td>
                <td className="r">{money(invoice.customerTotalAmount)}</td>
                <td className="r">{money(invoice.companyTotalAmount)}</td>
                <td className="r" style={{ color: 'var(--gold-d)' }}>{money(invoice.rkrProfit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
