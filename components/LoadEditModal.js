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
  const [material, setMaterial] = useState('40mm');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!load) return;
    setDate(load.date);
    setVehicle(load.vehicleNumber);
    setWeight(String(load.weightKg));
    setMaterial(load.material || '40mm');
    setPreview(null);
  }, [load]);

  useEffect(() => {
    const parsed = parseKg(weight);
    if (parsed === null || Number.isNaN(parsed) || parsed <= 0) { setPreview(null); return; }
    let live = true;
    const t = setTimeout(async () => {
      try {
        const res = await api.transactions.preview(parsed, material);
        if (live) setPreview(res.data);
      } catch { if (live) setPreview(null); }
    }, 280);
    return () => { live = false; clearTimeout(t); };
  }, [weight, material]);

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
        date,
        vehicleNumber: normaliseVehicle(vehicle),
        weightKg: parsed,
        material,
      });
      toast(`Load updated \u00b7 [${res.data.material || material}] ${res.data.vehicleNumber} \u00b7 ${tons(res.data.weightTons)} Tons`);
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
        <label>Material Segment</label>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button
            type="button"
            className={`mat-pill${material === '40mm' ? ' active-40mm' : ''}`}
            onClick={() => setMaterial('40mm')}
            style={{ cursor: 'pointer', border: '1px solid', padding: '6px 14px' }}
          >
            40mm
          </button>
          <button
            type="button"
            className={`mat-pill${material === 'Dust' ? ' active-dust' : ''}`}
            onClick={() => setMaterial('Dust')}
            style={{ cursor: 'pointer', border: '1px solid', padding: '6px 14px' }}
          >
            Dust
          </button>
        </div>
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
            ? `[${preview.material || material}] ${kg(preview.weightKg)} KG = ${tons(preview.weightTons)} Tons \u00b7 RKR Profit ${money(preview.rkrProfit)}`
            : '\u00a0'}
        </span>
      </div>
    </ConfirmationModal>
  );
}
