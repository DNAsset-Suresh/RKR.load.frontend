'use client';

import { useState } from 'react';
import api from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';
import InvoiceTable from '@/components/InvoiceTable';
import ConfirmationModal from '@/components/ConfirmationModal';
import LoadingState from '@/components/LoadingState';
import ErrorMessage from '@/components/ErrorMessage';
import { money, kg, tons, fmtDate, todayISO, weekStartISO, addDaysISO } from '@/utils/format';

/**
 * Weekly invoicing.
 *
 * ONE invoice per week. If the week already has one, the API answers 409 and
 * this page offers View / Download / Regenerate instead of silently creating a
 * second invoice for the same period.
 */
export default function InvoicesPage() {
  const [weekOf, setWeekOf] = useState(weekStartISO(todayISO()));
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [duplicate, setDuplicate] = useState(null);
  const { toast } = useToast();

  const list = useApi(() => api.invoices.list({ pageSize: 50 }), []);
  const preview = useApi(() => api.invoices.preview(weekOf), [weekOf]);

  const p = preview.data?.data;

  async function generate(regenerate = false) {
    setGenerating(true);
    try {
      const res = await api.invoices.generate(weekOf, regenerate);
      toast(res.message || 'Weekly invoice generated.');
      setDuplicate(null);
      list.refetch();
      preview.refetch();
    } catch (err) {
      if (err.status === 409 && err.details?.invoice) {
        setDuplicate(err.details.invoice);
      } else {
        toast(err.message, 'bad');
      }
    } finally {
      setGenerating(false);
    }
  }

  async function downloadPdf(inv) {
    setBusyId(inv.id);
    try {
      await api.invoices.downloadPdf(inv.id, inv.invoiceNumber);
      toast(`Downloaded ${inv.invoiceNumber}.pdf`);
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusyId(null);
    }
  }

  async function downloadExcel(inv) {
    try {
      await api.invoices.downloadExcel(inv.id, inv.invoiceNumber);
      toast(`Downloaded ${inv.invoiceNumber}.xlsx`);
    } catch (err) {
      toast(err.message, 'bad');
    }
  }

  const weekEnd = addDaysISO(weekStartISO(weekOf), 6);

  return (
    <>
      <Header title="Weekly Invoice" />

      <div className="page">
        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Generate</h2>
            <span className="sec-note">
              One invoice covers one whole week {'\u2014'} not one per vehicle.
            </span>
          </div>

          <div className="panel" style={{ padding: 18 }}>
            <div className="range-row">
              <div className="ef inline">
                <label htmlFor="week-of">Any date inside the week</label>
                <input
                  id="week-of" type="date" value={weekOf}
                  onChange={(e) => setWeekOf(e.target.value)}
                />
              </div>
              <div className="ef inline">
                <label>Week covered</label>
                <div className="panel-range num" style={{ padding: '9px 0' }}>
                  {fmtDate(weekStartISO(weekOf))} {'\u2192'} {fmtDate(weekEnd)}
                </div>
              </div>
              <button
                className="tbtn primary" style={{ padding: '10px 18px' }}
                onClick={() => generate(false)}
                disabled={generating || preview.loading || !!preview.error}
              >
                {generating ? <span className="spinner" /> : 'Generate Weekly Invoice'}
              </button>
            </div>

            {preview.loading ? <LoadingState variant="inline" label="Checking that week" /> : null}

            {preview.error ? (
              <div className="alert warn" style={{ marginTop: 12 }}>
                <div>
                  <div className="alert-title">Nothing to invoice</div>
                  <div className="alert-body">{preview.error.message}</div>
                </div>
              </div>
            ) : null}

            {p ? (
              <>
                <div className="summary-strip" style={{ border: '1px solid var(--hair)', borderRadius: 10, marginTop: 14 }}>
                  <div className="ss"><div className="ss-k">Loads</div><div className="ss-v">{p.itemCount}</div></div>
                  <div className="ss"><div className="ss-k">Total KG</div><div className="ss-v">{kg(p.totals.totalWeightKg)}</div></div>
                  <div className="ss"><div className="ss-k">Total Tons</div><div className="ss-v">{tons(p.totals.totalWeightTons)}</div></div>
                  <div className="ss"><div className="ss-k">Customer</div><div className="ss-v">{money(p.totals.customerTotalAmount)}</div></div>
                  <div className="ss"><div className="ss-k">Company</div><div className="ss-v">{money(p.totals.companyTotalAmount)}</div></div>
                  <div className="ss">
                    <div className="ss-k">RKR Profit</div>
                    <div className="ss-v" style={{ color: 'var(--gold-d)' }}>{money(p.totals.rkrProfit)}</div>
                  </div>
                </div>

                {p.existingInvoice ? (
                  <div className="alert warn" style={{ marginTop: 12 }}>
                    <div>
                      <div className="alert-title">Weekly Invoice Already Generated</div>
                      <div className="alert-body">
                        {p.existingInvoice.invoiceNumber} already covers this week.
                        Generating again will refresh its contents under the same number.
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">All Invoices</h2>
            <span className="sec-note">
              {list.data?.meta ? `${list.data.meta.total} invoices` : ''}
            </span>
          </div>

          {list.error ? <ErrorMessage error={list.error} onRetry={list.refetch} /> : null}
          {list.loading && !list.data ? <LoadingState variant="rows" rows={3} /> : (
            <InvoiceTable
              invoices={list.data?.data}
              onDownloadPdf={downloadPdf}
              onDownloadExcel={downloadExcel}
              busyId={busyId}
            />
          )}
        </section>
      </div>

      <ConfirmationModal
        open={!!duplicate}
        title="Weekly Invoice Already Generated"
        onClose={() => setDuplicate(null)}
        footer={
          <>
            <button className="tbtn" onClick={() => setDuplicate(null)}>Cancel</button>
            {duplicate ? (
              <>
                <a className="tbtn" href={`/invoices/${duplicate.id}`}>View</a>
                <button className="tbtn" onClick={() => downloadPdf(duplicate)}>Download PDF</button>
                <button
                  className="tbtn primary" disabled={generating}
                  onClick={() => generate(true)}
                >
                  {generating ? <span className="spinner" /> : 'Regenerate'}
                </button>
              </>
            ) : null}
          </>
        }
      >
        {duplicate ? (
          <>
            <p style={{ margin: '0 0 14px' }}>
              {duplicate.invoiceNumber} already covers{' '}
              {fmtDate(duplicate.weekStart)} to {fmtDate(duplicate.weekEnd)}.
            </p>
            <dl className="dl">
              <dt>Loads</dt><dd>{duplicate.totalLoads}</dd>
              <dt>Total Tons</dt><dd>{tons(duplicate.totalWeightTons)}</dd>
              <dt>RKR Profit</dt><dd className="gold">{money(duplicate.rkrProfit)}</dd>
            </dl>
            <p className="help" style={{ marginTop: 14 }}>
              Regenerating keeps the same invoice number and refreshes the figures
              from the loads currently recorded for that week.
            </p>
          </>
        ) : null}
      </ConfirmationModal>
    </>
  );
}
