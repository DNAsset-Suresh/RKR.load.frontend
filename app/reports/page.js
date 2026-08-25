'use client';

import { useState } from 'react';
import api from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useDateRange } from '@/hooks/useDateRange';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';
import DateFilter from '@/components/DateFilter';
import SummaryStrip from '@/components/SummaryStrip';
import ProfitSummary from '@/components/ProfitSummary';
import LoadingState from '@/components/LoadingState';
import ErrorMessage from '@/components/ErrorMessage';
import { money, kg, tons, fmtDate } from '@/utils/format';

/** Daily / weekly / monthly / overall reports plus a per-vehicle rollup. */
export default function ReportsPage() {
  const range = useDateRange('month');
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const period = useApi(
    () => api.reports.weekly(range.params),
    [JSON.stringify(range.params)],
    { enabled: range.valid }
  );

  const vehicles = useApi(
    () => api.reports.vehicles(range.params),
    [JSON.stringify(range.params)],
    { enabled: range.valid }
  );

  const report = period.data?.data;

  async function exportExcel() {
    setExporting(true);
    try {
      const name = await api.exports.excel(range.params);
      toast(`Downloaded ${name}`);
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Header
        title="Reports"
        rates={report?.totals ? { rkrProfitPerTon: report.totals.rkrProfitPerTon } : null}
      />

      <div className="page">
        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Report Period</h2>
            <span className="sec-note">
              {report?.range?.from
                ? `${fmtDate(report.range.from)} \u2192 ${fmtDate(report.range.to)}`
                : 'All recorded loads'}
            </span>
          </div>
          <DateFilter range={range} />
        </section>

        {period.error ? (
          <section className="sec"><ErrorMessage error={period.error} onRetry={period.refetch} /></section>
        ) : null}

        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Totals</h2>
            <button className="tbtn primary" onClick={exportExcel} disabled={exporting}>
              {exporting ? <span className="spinner" /> : 'Export Excel'}
            </button>
          </div>
          {period.loading && !report ? <LoadingState variant="rows" rows={4} /> : report ? (
            <div className="panel">
              <SummaryStrip totals={report.totals} />
              <ProfitSummary totals={report.totals} />
            </div>
          ) : null}
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">By Vehicle</h2>
            <span className="sec-note">
              {vehicles.data?.data
                ? `${vehicles.data.data.vehicleCount} vehicles \u00b7 a vehicle may run many trips`
                : ''}
            </span>
          </div>

          {vehicles.loading && !vehicles.data ? <LoadingState variant="rows" rows={5} /> : (
            <div className="panel">
              <div className="tscroll">
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle Number</th>
                      <th className="r">Loads</th>
                      <th className="r">Weight KG</th>
                      <th className="r">Tons</th>
                      <th className="r">Customer Total</th>
                      <th className="r">Company Total</th>
                      <th className="r">RKR Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vehicles.data?.data?.vehicles || []).length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty">
                            <div className="empty-t">No vehicles in this period</div>
                            <div>Widen the date range, or add a load.</div>
                          </div>
                        </td>
                      </tr>
                    ) : vehicles.data.data.vehicles.map((v) => (
                      <tr key={v.vehicleNumber}>
                        <td className="veh">{v.vehicleNumber}</td>
                        <td className="r">{v.loadCount}</td>
                        <td className="r">{kg(v.totalWeightKg)}</td>
                        <td className="r">{tons(v.totalWeightTons)}</td>
                        <td className="r">{money(v.customerTotalAmount)}</td>
                        <td className="r">{money(v.companyTotalAmount)}</td>
                        <td className="r gold">{money(v.rkrProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
