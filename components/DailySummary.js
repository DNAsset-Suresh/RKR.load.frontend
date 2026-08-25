'use client';

import PeriodSummary from './PeriodSummary';

export default function DailySummary({ params }) {
  return <PeriodSummary period="today" title="Today" params={params} />;
}
