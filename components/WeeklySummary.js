'use client';

import PeriodSummary from './PeriodSummary';

export default function WeeklySummary({ params }) {
  return <PeriodSummary period="week" title="This Week" params={params} />;
}
