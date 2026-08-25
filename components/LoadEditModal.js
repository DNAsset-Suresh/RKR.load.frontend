'use client';

import { useEffect, useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import api from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { normaliseVehicle, parseKg, money, kg, tons } from '@/utils/format';

/** Edit re-posts the raw inputs; the backend recalculates every rupee column. */
export default function LoadEditModal({ load, open, onClose, onSaved }) {
  const [date, setDate] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [weight, setWeight] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!load) return;
    setDate(load.date);
    setVehicle(load.vehicleNumber);
    setWeight(String(load.weightKg));
    setPreview(null);
  }, [load]);

  useEffect(() => {
    const parsed = parseKg(weight);
    if (parsed === null || Number.isNaN(parsed) || parsed <= 0) { setPreview(null); return; }
    let live = true;
    const t = setTimeout(async () => {
      try {
        const res = await api.transactions.preview(parsed);
        if (live) setPreview(res.data);
      } catch { if (live) setPreview(null); }
    }, 280);
    return () => { live = false; clearTimeout(t); };
  }, [weight]);

  async function save() {
    const parsed = parseKg(weight);
    if (!date) { toast('Choose a date.', 'bad'); return; }
    if (normaliseVehicle(vehicle).length < 4) { toast('Vehicle number looks too short.', 'bad'); return; }
    if (parsed === null || Number.isNaN(parsed) || parsed <= 0) {
      toast('Weight must be a number of kilograms greater than zero.', 'bad'); return;
    }
    setBusy(true);
    try {
      const res = await api.transactions.update(load.id, {
        date, vehicleNumber: normaliseVehicle(vehicle), weightKg: parsed,
      });
      toast(`Load updated \u00b7 ${res.data.vehicleNumber} \u00b7 ${tons(res.data.weightTons)} Tons`);
      onSaved(res.data);
      onClose();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConfirmationModal
      open={open} title="Edit Load" onClose={onClose}
      onConfirm={save} confirmLabel="Save Changes" busy={busy}
    >
      <div className="ef">
        <label htmlFor="e-date">Date</label>
        <input id="e-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="ef">
        <label htmlFor="e-veh">Vehicle Number</label>
        <input
          id="e-veh" type="text" maxLength={20} value={vehicle}
          onChange={(e) => setVehicle(e.target.value.toUpperCase())}
        />
      </div>
      <div className="ef">
        <label htmlFor="e-kg">Weight (KG)</label>
        <input
          id="e-kg" type="text" inputMode="numeric" value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <span className="hint">
          {preview
            ? `${kg(preview.weightKg)} KG = ${tons(preview.weightTons)} Tons \u00b7 RKR Profit ${money(preview.rkrProfit)}`
            : '\u00a0'}
        </span>
      </div>
    </ConfirmationModal>
  );
}
