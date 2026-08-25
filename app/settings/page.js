'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';
import LoadingState from '@/components/LoadingState';
import ErrorMessage from '@/components/ErrorMessage';
import { count } from '@/utils/format';

const RATE_FIELDS = [
  ['customerRatePerTon', 'Customer Rate (\u20b9 per ton)', 930],
  ['companyRatePerTon', 'Company Rate (\u20b9 per ton)', 920],
  ['rkrProfitPerTon', 'RKR Profit Rate (\u20b9 per ton)', 10],
  ['customerGstRate', 'Customer GST (%)', 5],
  ['companyGstRate', 'Company GST (%)', 5],
  ['maximumLoads', 'Maximum Load Entries', 10000],
];

const BUSINESS_FIELDS = [
  ['businessName', 'Business Name'],
  ['businessTagline', 'Tagline'],
  ['businessAddress', 'Address'],
  ['businessPhone', 'Phone'],
  ['businessEmail', 'Email'],
  ['gstin', 'GSTIN (optional)'],
  ['invoicePrefix', 'Invoice Number Prefix'],
];

export default function SettingsPage() {
  const { data, loading, error, refetch } = useApi(() => api.settings.get(), []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { if (data?.data) setForm(data.data); }, [data]);

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })); }

  async function save() {
    setSaving(true);
    try {
      const body = {};
      RATE_FIELDS.forEach(([k]) => { body[k] = Number(form[k]); });
      BUSINESS_FIELDS.forEach(([k]) => {
        if (form[k] !== undefined && form[k] !== null) body[k] = form[k];
      });
      if (!body.gstin) delete body.gstin;
      const res = await api.settings.update(body);
      toast(res.message || 'Rate card updated.');
      refetch();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setSaving(false);
    }
  }

  function resetDefaults() {
    setForm((f) => ({
      ...f, customerRatePerTon: 930, companyRatePerTon: 920,
      rkrProfitPerTon: 10, customerGstRate: 5, companyGstRate: 5, maximumLoads: 10000,
    }));
  }

  return (
    <>
      <Header title="Rate Card" rates={form ? { rkrProfitPerTon: form.rkrProfitPerTon } : null} />

      <div className="page">
        {error ? <section className="sec"><ErrorMessage error={error} onRetry={refetch} /></section> : null}
        {loading && !form ? <section className="sec"><LoadingState variant="rows" rows={6} /></section> : null}

        {form ? (
          <>
            <section className="sec">
              <div className="sec-head">
                <h2 className="sec-title">Rates</h2>
                <span className="sec-note">
                  All billing is per ton. Changing a rate affects loads created from now on {'\u2014'}
                  existing loads keep the rates they were billed at.
                </span>
              </div>
              <div className="panel" style={{ padding: 18 }}>
                <div className="form-grid">
                  {RATE_FIELDS.map(([key, label]) => (
                    <div className="ef" key={key}>
                      <label htmlFor={key}>{label}</label>
                      <input
                        id={key} type="number" min="0" step="0.01"
                        value={form[key] ?? ''}
                        onChange={(e) => set(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="help">
                  Capacity: {count(form.capacity?.used ?? 0)} of {count(form.maximumLoads)} entries used,
                  {' '}{count(form.capacity?.remaining ?? 0)} remaining. The limit counts load entries.
                  Profit is always total tons {'\u00d7'} the RKR rate, never the number of loads.
                </div>
              </div>
            </section>

            <section className="sec">
              <div className="sec-head">
                <h2 className="sec-title">Business Details</h2>
                <span className="sec-note">Printed on every invoice and export.</span>
              </div>
              <div className="panel" style={{ padding: 18 }}>
                <div className="form-grid">
                  {BUSINESS_FIELDS.map(([key, label]) => (
                    <div className="ef" key={key}>
                      <label htmlFor={key}>{label}</label>
                      <input
                        id={key} type="text" value={form[key] ?? ''}
                        onChange={(e) => set(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="sec">
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                <button className="tbtn" onClick={resetDefaults}>Reset to Default Rates</button>
                <button className="tbtn primary" onClick={save} disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Save Settings'}
                </button>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
