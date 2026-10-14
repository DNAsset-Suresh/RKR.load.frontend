'use client';

import { useCallback, useState } from 'react';
import api from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useDateRange } from '@/hooks/useDateRange';
import Header from '@/components/Header';
import DashboardCard from '@/components/DashboardCard';
import ProfitCard from '@/components/ProfitCard';
import DateFilter from '@/components/DateFilter';
import MaterialFilter from '@/components/MaterialFilter';
import SummaryStrip from '@/components/SummaryStrip';
import ProfitSummary from '@/components/ProfitSummary';
import TonnageChart from '@/components/TonnageChart';
import LoadingState from '@/components/LoadingState';
import ErrorMessage from '@/components/ErrorMessage';
import { todayISO, money, kg, tons, count, fmtDate } from '@/utils/format';

/**
 * Dashboard with material-aware filtering and reporting.
 * Every card comes from GET /api/dashboard.
 */
export default function DashboardPage() {
  const range = useDateRange('today');
  const [material, setMaterial] = useState('All');

  const queryParams = { ...range.params, material };

  const { data, loading, error, refetch } = useApi(
    () => api.dashboard.get(queryParams),
    [JSON.stringify(queryParams)],
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
      <Header
        title="Dashboard"
        rates={rates ? { rkrProfitPerTon: rates.rkrProfitPerTon } : null}
      />

      <div className="page">
        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Filter & Period</h2>
            <span className="sec-note">
              {d ? d.range.label : 'Choose a range'}
              {d?.range?.from ? ` \u00b7 ${fmtDate(d.range.from)} \u2192 ${fmtDate(d.range.to)}` : ''}
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

              {rates && (
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                  {material === 'Dust' ? (
                    <span><strong>Dust Rates:</strong> Cust ₹810/T (5% GST) · Comp ₹800/T (5% GST) · Profit ₹10/T</span>
                  ) : material === '40mm' ? (
                    <span><strong>40mm Rates:</strong> Cust ₹930/T (5% GST) · Comp ₹920/T (5% GST) · Profit ₹10/T</span>
                  ) : (
                    <span><strong>All Materials:</strong> Combined Totals · RKR Profit ₹10/T</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {error ? (
          <section className="sec"><ErrorMessage error={error} onRetry={refetch} /></section>
        ) : null}

        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Selected Period ({material === 'All' ? 'All Materials' : material})</h2>
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
                sub={`${tons(cards.selected.totalWeightTons)} Tons \u00b7 Incl. 5% GST`} />
              <DashboardCard label="Company Total" value={cards.selected.companyTotalAmount} format="money"
                sub={`${tons(cards.selected.totalWeightTons)} Tons \u00b7 Incl. 5% GST`} />
            </div>
          ) : null}
        </section>

        {cards ? (
          <>
            <section className="sec">
              <div className="sec-head">
                <h2 className="sec-title">Today {'\u00b7'} Week {'\u00b7'} Month {'\u00b7'} Overall ({material === 'All' ? 'All Materials' : material})</h2>
                <span className="sec-note">Independent of the date range above</span>
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
                <h2 className="sec-title">Billing Breakdown ({material === 'All' ? 'All Materials' : material})</h2>
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
