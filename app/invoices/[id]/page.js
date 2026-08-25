'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';
import InvoicePreview from '@/components/InvoicePreview';
import LoadingState from '@/components/LoadingState';
import ErrorMessage from '@/components/ErrorMessage';

/** One invoice, with download and print. Print uses the browser dialog. */
export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refetch } = useApi(() => api.invoices.get(id), [id]);
  const settings = useApi(() => api.settings.get(), []);
  const invoice = data?.data;

  async function download(kind) {
    setBusy(true);
    try {
      if (kind === 'pdf') {
        await api.invoices.downloadPdf(invoice.id, invoice.invoiceNumber);
        toast(`Downloaded ${invoice.invoiceNumber}.pdf`);
      } else {
        await api.invoices.downloadExcel(invoice.id, invoice.invoiceNumber);
        toast(`Downloaded ${invoice.invoiceNumber}.xlsx`);
      }
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Opens the server-rendered PDF in a new tab and triggers its print dialog,
   * so the printed sheet is the real invoice rather than a screenshot of the page.
   */
  function print() {
    const w = window.open(api.invoices.pdfUrl(invoice.id), '_blank');
    if (!w) { toast('Allow pop-ups to print the invoice.', 'bad'); return; }
    w.addEventListener('load', () => { try { w.print(); } catch { /* user can print manually */ } });
  }

  return (
    <>
      <Header title={invoice ? invoice.invoiceNumber : 'Invoice'}>
        {invoice ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="tbtn" onClick={() => router.push('/invoices')}>Back</button>
            <button className="tbtn" onClick={print}>Print</button>
            <button className="tbtn" onClick={() => download('excel')} disabled={busy}>Excel</button>
            <button className="tbtn primary" onClick={() => download('pdf')} disabled={busy}>
              {busy ? <span className="spinner" /> : 'Download PDF'}
            </button>
          </div>
        ) : null}
      </Header>

      <div className="page">
        {error ? <section className="sec"><ErrorMessage error={error} onRetry={refetch} /></section> : null}
        {loading && !invoice ? <section className="sec"><LoadingState variant="rows" rows={6} /></section> : null}
        {invoice ? (
          <section className="sec">
            <InvoicePreview invoice={invoice} business={settings.data?.data} />
          </section>
        ) : null}
      </div>
    </>
  );
}
