'use client';

import { useCallback, useState } from 'react';
import api from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { useDateRange } from '@/hooks/useDateRange';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';
import DailyLoadForm from '@/components/DailyLoadForm';
import TransactionTable from '@/components/TransactionTable';
import Pagination from '@/components/Pagination';
import DateFilter from '@/components/DateFilter';
import VehicleSearch from '@/components/VehicleSearch';
import ErrorMessage from '@/components/ErrorMessage';
import LoadDetailModal from '@/components/LoadDetailModal';
import LoadEditModal from '@/components/LoadEditModal';
import LoadDeleteModal from '@/components/LoadDeleteModal';
import { kg, tons, money, count } from '@/utils/format';

/** Daily load entry plus the full ledger. */
export default function LoadsPage() {
  const range = useDateRange('week');
  const [vehicle, setVehicle] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { toast } = useToast();

  const params = { ...range.params, vehicle: vehicle || undefined, page, pageSize: 50 };

  const { data, loading, error, refetch } = useApi(
    () => api.transactions.list(params),
    [JSON.stringify(params), refreshKey],
    { enabled: range.valid }
  );

  const settings = useApi(() => api.settings.get(), [refreshKey]);
  const rates = settings.data?.data;
  const capacity = settings.data?.data?.capacity;

  const refreshAll = useCallback(() => {
    setRefreshKey((k) => k + 1);
    settings.refetch();
  }, [settings]);

  const onCreated = useCallback(() => { setPage(1); refreshAll(); }, [refreshAll]);

  async function exportExcel() {
    setExporting(true);
    try {
      const name = await api.exports.excel({ ...range.params, vehicle: vehicle || undefined });
      toast(`Downloaded ${name}`);
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setExporting(false);
    }
  }

  const rows = data?.data;
  const meta = data?.meta;

  return (
    <>
      <Header title="Load Entry" rates={rates ? { rkrProfitPerTon: rates.rkrProfitPerTon } : null} />

      <div className="page">
        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Daily Load Entry</h2>
            <span className="sec-note">
              Weight is entered in kilograms {'\u2014'} tons and profit are calculated on the server.
            </span>
          </div>
          <DailyLoadForm
            rates={rates} capacity={capacity} onCreated={onCreated}
          />
          {capacity && capacity.remaining <= 0 ? (
            <div className="alert" style={{ marginTop: 12 }} role="alert">
              <div>
                <div className="alert-title">Maximum load entries reached</div>
                <div className="alert-body">
                  {count(capacity.used)} of {count(capacity.maximumLoads)} entries used.
                  Export and archive before adding more. Profit is still calculated
                  from tonnage, not from this limit.
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2 className="sec-title">Load Ledger</h2>
            <span className="sec-note">
              {meta
                ? `${count(meta.total)} ${meta.total === 1 ? 'entry' : 'entries'} \u00b7 ` +
                  `${kg(meta.totals.totalWeightKg)} KG \u00b7 ${tons(meta.totals.totalWeightTons)} Tons \u00b7 ` +
                  `RKR ${money(meta.totals.rkrProfit)}`
                : ''}
            </span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <DateFilter range={range} />
          </div>

          {error ? <ErrorMessage error={error} onRetry={refetch} /> : null}

          <div className="panel">
            <div className="toolbar">
              <VehicleSearch
                value={vehicle}
                onChange={(v) => { setVehicle(v); setPage(1); }}
                placeholder="Search vehicle number, e.g. TN 18 CA 6746"
              />
              {vehicle ? (
                <button className="tbtn" onClick={() => { setVehicle(''); setPage(1); }}>
                  Clear
                </button>
              ) : null}
              <div style={{ flex: 1 }} />
              <button className="tbtn primary" onClick={exportExcel} disabled={exporting}>
                {exporting ? <span className="spinner" /> : 'Export Excel'}
              </button>
            </div>

            <TransactionTable
              rows={rows} meta={meta} loading={loading}
              onView={setViewing} onEdit={setEditing} onDelete={setDeleting}
              emptyHint={vehicle
                ? `No loads for "${vehicle}" in this period.`
                : 'Add a load above, or widen the date range.'}
            />

            <Pagination meta={meta} page={page} onPage={setPage} />
          </div>
        </section>
      </div>

      <LoadDetailModal
        load={viewing} open={!!viewing} onClose={() => setViewing(null)}
        onEdit={(l) => { setViewing(null); setEditing(l); }}
      />
      <LoadEditModal
        load={editing} open={!!editing} onClose={() => setEditing(null)}
        onSaved={refreshAll}
      />
      <LoadDeleteModal
        load={deleting} open={!!deleting} onClose={() => setDeleting(null)}
        onDeleted={refreshAll}
      />
    </>
  );
}
