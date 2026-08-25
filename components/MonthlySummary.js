'use client';

import PeriodSummary from './PeriodSummary';

export default function MonthlySummary({ params }) {
  return <PeriodSummary period="month" title="This Month" params={params} />;
}
