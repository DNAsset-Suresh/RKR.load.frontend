'use client';

import { useCallback } from 'react';
import api from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useDateRange } from '@/hooks/useDateRange';
import Header from '@/components/Header';
import DashboardCard from '@/components/DashboardCard';
import ProfitCard from '@/components/ProfitCard';
import DateFilter from '@/components/DateFilter';
import SummaryStrip from '@/components/SummaryStrip';
import ProfitSummary from '@/components/ProfitSummary';
import TonnageChart from '@/components/TonnageChart';
import LoadingState from '@/components/LoadingState';
import ErrorMessage from '@/components/ErrorMessage';
import { todayISO, money, kg, tons, count, fmtDate } from '@/utils/format';

/**
 * Dashboard. Every card comes from GET /api/dashboard, which prices the summed
 * tonnage once - so no figure here is a sum of rounded rupee columns.
 */
export default function DashboardPage() {
  const range = useDateRange('today');

  const { data, loading, error, refetch } = useApi(
    () => api.dashboard.get(range.params),
    [JSON.stringify(range.params)],
    { enabled: range.valid }
  );

  const d = data?.data;
  const cards = d?.cards;
  const rates = d?.rates;

  const rateSub = useCallback((totals) => (
    totals ? `${tons(totals.totalWeightTons)} Tons \u00d7 \u20b9${rates?.rkrProfitPerTon ?? 10}` : ''
  ), [rates]);

  return (
    <>
      <Header title="Dashboard" rates={rates} />

      <div className="page">
        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Period</h2>
            <span className="sec-note">
              {d ? d.range.label : 'Choose a range'}
              {d?.range?.from ? ` \u00b7 ${fmtDate(d.range.from)} \u2192 ${fmtDate(d.range.to)}` : ''}
            </span>
          </div>
          <DateFilter range={range} />
        </section>

        {error ? (
          <section className="sec"><ErrorMessage error={error} onRetry={refetch} /></section>
        ) : null}

        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Selected Period</h2>
          </div>
          {loading && !cards ? <LoadingState /> : cards ? (
            <div className="tiles">
              <DashboardCard label="Total Loads" value={cards.selected.loadCount} format="count"
                sub={cards.selected.loadCount === 1 ? '1 load' : 'loads recorded'} />
              <DashboardCard label="Total Weight KG" value={cards.selected.totalWeightKg} format="kg"
                sub={`${tons(cards.selected.totalWeightTons)} Tons`} />
              <DashboardCard label="Total Weight Tons" value={cards.selected.totalWeightTons} format="tons"
                sub={'Tons \u00b7 KG \u00f7 1,000'} />
              <DashboardCard label="RKR Profit Rate" variant="rate"
                value={`\u20b9${rates?.rkrProfitPerTon ?? 10} / TON`} sub="fixed commission" />
              <ProfitCard label="Profit for Period" totals={cards.selected} rates={rates} />
              <DashboardCard label="Customer Total" value={cards.selected.customerTotalAmount} format="money"
                sub={`${tons(cards.selected.totalWeightTons)} \u00d7 \u20b9${cards.selected.customerRatePerTon} + ${cards.selected.customerGstRate}% GST`} />
              <DashboardCard label="Company Total" value={cards.selected.companyTotalAmount} format="money"
                sub={`${tons(cards.selected.totalWeightTons)} \u00d7 \u20b9${cards.selected.companyRatePerTon} + ${cards.selected.companyGstRate}% GST`} />
            </div>
          ) : null}
        </section>

        {cards ? (
          <>
            <section className="sec">
              <div className="sec-head">
                <h2 className="sec-title">Today {'\u00b7'} Week {'\u00b7'} Month {'\u00b7'} Overall</h2>
                <span className="sec-note">Independent of the filter above</span>
              </div>
              <div className="tiles">
                <DashboardCard label="Today's Loads" value={cards.today.loadCount} format="count"
                  sub={`${kg(cards.today.totalWeightKg)} KG`} />
                <DashboardCard label="Today's Tons" value={cards.today.totalWeightTons} format="tons"
                  sub={rateSub(cards.today)} />
                <ProfitCard label="Today's Profit" totals={cards.today} rates={rates} />
                <DashboardCard label="Weekly Loads" value={cards.week.loadCount} format="count"
                  sub={`${tons(cards.week.totalWeightTons)} Tons`} />
                <DashboardCard label="Weekly Profit" value={cards.week.rkrProfit} format="money"
                  sub={rateSub(cards.week)} />
                <DashboardCard label="Monthly Profit" value={cards.month.rkrProfit} format="money"
                  sub={rateSub(cards.month)} />
                <DashboardCard label="Overall Profit" value={cards.overall.rkrProfit} format="money"
                  sub={rateSub(cards.overall)} />
                <DashboardCard label="Loads Used" value={`${count(d.capacity.used)} / ${count(d.capacity.maximumLoads)}`}
                  sub={`${count(d.capacity.remaining)} remaining`} />
              </div>
            </section>

            <section className="sec">
              <div className="sec-head">
                <h2 className="sec-title">Billing Breakdown</h2>
                <span className="sec-note">{d.range.label}</span>
              </div>
              <div className="panel">
                <SummaryStrip totals={cards.selected} />
                <ProfitSummary totals={cards.selected} />
                <TonnageChart chart={d.chart} todayISO={todayISO()} />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
