'use client';

import { useApi } from '@/hooks/useApi';
import api from '@/services/api';
import SummaryStrip from './SummaryStrip';
import ProfitSummary from './ProfitSummary';
import LoadingState from './LoadingState';
import ErrorMessage from './ErrorMessage';
import { fmtDate } from '@/utils/format';

/**
 * One period panel. DailySummary, WeeklySummary and MonthlySummary below are
 * this component with the period fixed - the spec names them separately, and
 * they are genuinely used in different places.
 */
export default function PeriodSummary({ period, title, params }) {
  const query = params || { period };
  const { data, loading, error, refetch } = useApi(
    () => api.reports.weekly(query),
    [JSON.stringify(query)]
  );

  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (loading && !data) return <LoadingState variant="rows" rows={4} />;

  const report = data?.data;
  if (!report) return null;

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">{title || report.range.label}</div>
        <div className="panel-range num">
          {report.range.from
            ? `${fmtDate(report.range.from)}  \u2192  ${fmtDate(report.range.to)}`
            : 'All recorded loads'}
        </div>
      </div>
      <SummaryStrip totals={report.totals} />
      <ProfitSummary totals={report.totals} />
    </div>
  );
}
