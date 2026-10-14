'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';
import LoadingState from '@/components/LoadingState';
import ErrorMessage from '@/components/ErrorMessage';
import { count } from '@/utils/format';

const RATE_40MM_FIELDS = [
  ['customerRatePerTon', 'Customer Rate (\u20b9 per ton)', 930],
  ['companyRatePerTon', 'Company Rate (\u20b9 per ton)', 920],
  ['rkrProfitPerTon', 'RKR Profit Rate (\u20b9 per ton)', 10],
  ['customerGstRate', 'Customer GST (%)', 5],
  ['companyGstRate', 'Company GST (%)', 5],
  ['maximumLoads', 'Maximum Load Entries', 10000],
];

const RATE_DUST_FIELDS = [
  ['dust_customerRatePerTon', 'Customer Rate (\u20b9 per ton)', 810],
  ['dust_companyRatePerTon', 'Company Rate (\u20b9 per ton)', 800],
  ['dust_rkrProfitPerTon', 'RKR Profit Rate (\u20b9 per ton)', 10],
  ['dust_customerGstRate', 'Customer GST (%)', 5],
  ['dust_companyGstRate', 'Company GST (%)', 5],
  ['dust_maximumLoads', 'Maximum Load Entries', 10000],
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

  useEffect(() => {
    if (data?.data) {
      const d = data.data;
      const dust = d.materials?.Dust || d.Dust || {};
      const m40 = d.materials?.['40mm'] || d['40mm'] || {};

      setForm({
        ...d,
        customerRatePerTon: m40.customerRatePerTon ?? d.customerRatePerTon ?? 930,
        companyRatePerTon: m40.companyRatePerTon ?? d.companyRatePerTon ?? 920,
        rkrProfitPerTon: m40.rkrProfitPerTon ?? d.rkrProfitPerTon ?? 10,
        customerGstRate: m40.customerGstRate ?? d.customerGstRate ?? 5,
        companyGstRate: m40.companyGstRate ?? d.companyGstRate ?? 5,
        maximumLoads: m40.maximumLoads ?? d.maximumLoads ?? 10000,

        dust_customerRatePerTon: dust.customerRatePerTon ?? d.dust_customerRatePerTon ?? 810,
        dust_companyRatePerTon: dust.companyRatePerTon ?? d.dust_companyRatePerTon ?? 800,
        dust_rkrProfitPerTon: dust.rkrProfitPerTon ?? d.dust_rkrProfitPerTon ?? 10,
        dust_customerGstRate: dust.customerGstRate ?? d.dust_customerGstRate ?? 5,
        dust_companyGstRate: dust.companyGstRate ?? d.dust_companyGstRate ?? 5,
        dust_maximumLoads: dust.maximumLoads ?? d.dust_maximumLoads ?? 10000,
      });
    }
  }, [data]);

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })); }

  async function save() {
    setSaving(true);
    try {
      const body = {};
      RATE_40MM_FIELDS.forEach(([k]) => { body[k] = Number(form[k]); });
      RATE_DUST_FIELDS.forEach(([k]) => {
        body[k] = Number(form[k]);
        // Also send camelCase equivalent for flexibility
        const camel = k.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
        body[camel] = Number(form[k]);
      });
      BUSINESS_FIELDS.forEach(([k]) => {
        if (form[k] !== undefined && form[k] !== null) body[k] = form[k];
      });
      if (!body.gstin) delete body.gstin;

      const res = await api.settings.update(body);
      toast(res.message || 'Independent rate cards and settings updated successfully.');
      refetch();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setSaving(false);
    }
  }

  function resetDefaults() {
    setForm((f) => ({
      ...f,
      customerRatePerTon: 930,
      companyRatePerTon: 920,
      rkrProfitPerTon: 10,
      customerGstRate: 5,
      companyGstRate: 5,
      maximumLoads: 10000,

      dust_customerRatePerTon: 810,
      dust_companyRatePerTon: 800,
      dust_rkrProfitPerTon: 10,
      dust_customerGstRate: 5,
      dust_companyGstRate: 5,
      dust_maximumLoads: 10000,
    }));
  }

  const card40mm = data?.data?.materials?.['40mm'];
  const cardDust = data?.data?.materials?.['Dust'];

  return (
    <>
      <Header title="Rate Card" rates={form ? { rkrProfitPerTon: form.rkrProfitPerTon } : null} />

      <div className="page">
        {error ? <section className="sec"><ErrorMessage error={error} onRetry={refetch} /></section> : null}
        {loading && !form ? <section className="sec"><LoadingState variant="rows" rows={6} /></section> : null}

        {form ? (
          <>
            {/* 40mm Rate Card Section */}
            <section className="sec">
              <div className="sec-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mat-badge m40" style={{ fontSize: 13, padding: '4px 10px' }}>40mm</span>
                  <h2 className="sec-title">40mm Material Rate Card</h2>
                </div>
                <span className="sec-note">
                  Independent rate card for 40mm material segment. Existing 40mm loads remain completely preserved.
                </span>
              </div>
              <div className="panel" style={{ padding: 18 }}>
                <div className="form-grid">
                  {RATE_40MM_FIELDS.map(([key, label]) => (
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
                {card40mm?.capacity ? (
                  <div className="help">
                    40mm Capacity: {count(card40mm.capacity.used)} of {count(card40mm.capacity.maximumLoads)} entries used,
                    {' '}{count(card40mm.capacity.remaining)} remaining.
                  </div>
                ) : null}
              </div>
            </section>

            {/* Dust Rate Card Section */}
            <section className="sec">
              <div className="sec-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mat-badge dust" style={{ fontSize: 13, padding: '4px 10px' }}>Dust</span>
                  <h2 className="sec-title">Dust Material Rate Card</h2>
                </div>
                <span className="sec-note">
                  Separate, independent rate card for Dust segment. Updating Dust rates never modifies 40mm rates.
                </span>
              </div>
              <div className="panel" style={{ padding: 18 }}>
                <div className="form-grid">
                  {RATE_DUST_FIELDS.map(([key, label]) => (
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
                {cardDust?.capacity ? (
                  <div className="help">
                    Dust Capacity: {count(cardDust.capacity.used)} of {count(cardDust.capacity.maximumLoads)} entries used,
                    {' '}{count(cardDust.capacity.remaining)} remaining.
                  </div>
                ) : null}
              </div>
            </section>

            {/* Business Details Section */}
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
