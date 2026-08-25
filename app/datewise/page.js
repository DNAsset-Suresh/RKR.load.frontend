'use client';

import { useState } from 'react';
import api from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useDateRange } from '@/hooks/useDateRange';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';
import DateFilter from '@/components/DateFilter';
import DateWiseTable from '@/components/DateWiseTable';
import TransactionTable from '@/components/TransactionTable';
import ErrorMessage from '@/components/ErrorMessage';
import SummaryStrip from '@/components/SummaryStrip';
import { money, tons, fmtDate, fmtLong } from '@/utils/format';

/** Date-wise profit: one row per day, click a day to see its loads. */
export default function DateWisePage() {
  const range = useDateRange('month');
  const [sort, setSort] = useState('desc');
  const [selectedDate, setSelectedDate] = useState(null);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const params = { ...range.params, sort };

  const { data, loading, error, refetch } = useApi(
    () => api.reports.daily(params),
    [JSON.stringify(params)],
    { enabled: range.valid }
  );

  const dayLoads = useApi(
    () => api.transactions.list({ period: 'custom', from: selectedDate, to: selectedDate, pageSize: 200 }),
    [selectedDate],
    { enabled: !!selectedDate }
  );

  const report = data?.data;
  const rates = report?.totals;

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
        title="Date-wise Profit"
        rates={rates ? { rkrProfitPerTon: rates.rkrProfitPerTon } : null}
      />

      <div className="page">
        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Period</h2>
            <span className="sec-note">
              {report
                ? `${report.dayCount} ${report.dayCount === 1 ? 'day' : 'days'} with loads \u00b7 ` +
                  `RKR ${money(report.totals.rkrProfit)} over ${tons(report.totals.totalWeightTons)} Tons`
                : ''}
            </span>
          </div>
          <DateFilter range={range} />
        </section>

        {error ? <section className="sec"><ErrorMessage error={error} onRetry={refetch} /></section> : null}

        <section className="sec">
          <div className="panel">
            <div className="toolbar">
              <div className="panel-title">
                {report?.range?.from
                  ? `${fmtDate(report.range.from)}  \u2192  ${fmtDate(report.range.to)}`
                  : 'All recorded loads'}
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
              <h2 className="sec-title">Loads on {fmtLong(selectedDate)}</h2>
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
