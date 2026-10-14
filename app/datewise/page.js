'use client';

import { useState } from 'react';
import api from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useDateRange } from '@/hooks/useDateRange';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';
import DateFilter from '@/components/DateFilter';
import MaterialFilter from '@/components/MaterialFilter';
import DateWiseTable from '@/components/DateWiseTable';
import TransactionTable from '@/components/TransactionTable';
import ErrorMessage from '@/components/ErrorMessage';
import SummaryStrip from '@/components/SummaryStrip';
import { money, tons, fmtDate, fmtLong } from '@/utils/format';

/** Date-wise profit with material segment filtering: 40mm, Dust, or All Materials. */
export default function DateWisePage() {
  const range = useDateRange('month');
  const [material, setMaterial] = useState('All');
  const [sort, setSort] = useState('desc');
  const [selectedDate, setSelectedDate] = useState(null);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const params = { ...range.params, sort, material };

  const { data, loading, error, refetch } = useApi(
    () => api.reports.daily(params),
    [JSON.stringify(params)],
    { enabled: range.valid }
  );

  const dayLoads = useApi(
    () => api.transactions.list({
      period: 'custom',
      from: selectedDate,
      to: selectedDate,
      material: material !== 'All' ? material : undefined,
      pageSize: 200
    }),
    [selectedDate, material],
    { enabled: !!selectedDate }
  );

  const report = data?.data;
  const rates = report?.totals;

  async function exportExcel() {
    setExporting(true);
    try {
      const name = await api.exports.excel({ ...range.params, material });
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
        title="Date-wise Profit"
        rates={rates ? { rkrProfitPerTon: rates.rkrProfitPerTon } : null}
      />

      <div className="page">
        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Filter & Period</h2>
            <span className="sec-note">
              {report
                ? `${report.dayCount} ${report.dayCount === 1 ? 'day' : 'days'} with loads \u00b7 ` +
                  `RKR ${money(report.totals.rkrProfit)} over ${tons(report.totals.totalWeightTons)} Tons`
                : ''}
              {` \u00b7 Segment: ${material === 'All' ? 'All Materials' : material}`}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DateFilter range={range} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
              borderRadius: 'var(--r)',
              padding: '10px 16px',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <MaterialFilter
                value={material}
                onChange={setMaterial}
                includeAll={true}
                label="Material Segment"
              />
              <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                {material === 'Dust' ? 'Dust: ₹810 / ₹800 (5% GST) · RKR ₹10/T' :
                 material === '40mm' ? '40mm: ₹930 / ₹920 (5% GST) · RKR ₹10/T' :
                 'All Materials: Combined Ledger · RKR ₹10/T'}
              </span>
            </div>
          </div>
        </section>

        {error ? <section className="sec"><ErrorMessage error={error} onRetry={refetch} /></section> : null}

        <section className="sec">
          <div className="panel">
            <div className="toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div className="panel-title">
                {report?.range?.from
                  ? `${fmtDate(report.range.from)} \u2192 ${fmtDate(report.range.to)} (${material === 'All' ? 'All Materials' : material})`
                  : `All recorded loads (${material === 'All' ? 'All Materials' : material})`}
              </div>
              <div style={{ flex: 1 }} />
              <button
                className="tbtn"
                onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
              >
                {sort === 'desc' ? 'Newest first' : 'Oldest first'}
              </button>
              <button className="tbtn primary" onClick={exportExcel} disabled={exporting}>
                {exporting ? <span className="spinner" /> : 'Export Excel'}
              </button>
            </div>

            {report?.totals ? <SummaryStrip totals={report.totals} /> : null}

            <DateWiseTable
              report={report} loading={loading}
              onSelectDate={setSelectedDate}
            />
          </div>
        </section>

        {selectedDate ? (
          <section className="sec">
            <div className="sec-head">
              <h2 className="sec-title">Loads on {fmtLong(selectedDate)} ({material === 'All' ? 'All Materials' : material})</h2>
              <button className="tbtn" onClick={() => setSelectedDate(null)}>Close</button>
            </div>
            <div className="panel">
              <TransactionTable
                rows={dayLoads.data?.data}
                meta={dayLoads.data?.meta}
                loading={dayLoads.loading}
                onView={() => {}} onEdit={() => {}} onDelete={() => {}}
              />
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
