'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { normaliseVehicle, parseKg, todayISO, money, kg, tons } from '@/utils/format';
import ConversionTape from './ConversionTape';
import WeightInput from './WeightInput';

/**
 * The entry console, converted from the original <div class="console">.
 *
 * Flow: DATE -> VEHICLE NUMBER -> WEIGHT KG -> ADD LOAD.
 * The preview is debounced and served by the backend; the save is a POST. The
 * browser never decides a rupee figure.
 */
export default function DailyLoadForm({ rates, capacity, onCreated }) {
  const [date, setDate] = useState(todayISO());
  const [vehicle, setVehicle] = useState('');
  const [weight, setWeight] = useState('');

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [tapeError, setTapeError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { toast } = useToast();
  const vehicleRef = useRef(null);
  const previewSeq = useRef(0);

  const atCapacity = capacity && capacity.remaining <= 0;

  // Debounced preview. Every keystroke would otherwise be a round trip.
  useEffect(() => {
    const parsed = parseKg(weight);
    if (parsed === null) { setPreview(null); setTapeError(''); return; }
    if (Number.isNaN(parsed) || parsed <= 0) {
      setPreview(null);
      setTapeError('Enter the weight as a number of kilograms, e.g. 13610');
      return;
    }
    setTapeError('');
    setPreviewing(true);
    const seq = ++previewSeq.current;
    const timer = setTimeout(async () => {
      try {
        const res = await api.transactions.preview(parsed);
        if (seq === previewSeq.current) setPreview(res.data);
      } catch (err) {
        if (seq === previewSeq.current) { setPreview(null); setTapeError(err.message); }
      } finally {
        if (seq === previewSeq.current) setPreviewing(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [weight]);

  const validate = useCallback(() => {
    const errors = {};
    if (!date) errors.date = 'Choose a date for this load.';
    const v = normaliseVehicle(vehicle);
    if (!v) errors.vehicle = 'Enter the vehicle number.';
    else if (v.length < 4) errors.vehicle = 'Vehicle number looks too short.';
    const parsed = parseKg(weight);
    if (parsed === null) errors.weight = 'Enter the weight in KG.';
    else if (Number.isNaN(parsed)) errors.weight = 'Weight must be a number, e.g. 13610.';
    else if (parsed <= 0) errors.weight = 'Weight must be greater than zero.';
    setFieldErrors(errors);
    return errors;
  }, [date, vehicle, weight]);

  async function submit() {
    if (atCapacity) {
      toast('Maximum load entries reached. Export and archive first.', 'bad');
      return;
    }
    const errors = validate();
    const first = Object.values(errors)[0];
    if (first) { toast(first, 'bad'); return; }

    setSaving(true);
    try {
      const res = await api.transactions.create({
        date,
        vehicleNumber: normaliseVehicle(vehicle),
        weightKg: parseKg(weight),
      });
      const t = res.data;
      toast(
        `${t.vehicleNumber} \u00b7 ${kg(t.weightKg)} KG = ${tons(t.weightTons)} Tons ` +
        `\u00b7 RKR ${money(t.rkrProfit)}`
      );
      setVehicle('');
      setWeight('');
      setPreview(null);
      setFieldErrors({});
      vehicleRef.current?.focus();
      if (onCreated) onCreated(t);
    } catch (err) {
      toast(err.message, 'bad');
      if (Array.isArray(err.details)) {
        const mapped = {};
        err.details.forEach((d) => {
          if (d.field === 'weightKg') mapped.weight = d.message;
          if (d.field === 'vehicleNumber') mapped.vehicle = d.message;
          if (d.field === 'date') mapped.date = d.message;
        });
        setFieldErrors(mapped);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="console">
      <div className="console-grid">
        <div className="field">
          <label htmlFor="f-date">Date</label>
          <input
            id="f-date" type="date" value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldErrors.date ? 'invalid' : undefined}
          />
        </div>

        <div className="field">
          <label htmlFor="f-vehicle">Vehicle Number</label>
          <input
            id="f-vehicle" ref={vehicleRef} type="text" maxLength={20}
            autoComplete="off" spellCheck={false} placeholder="TN 18 CA 6746"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value.toUpperCase())}
            onBlur={() => setVehicle((v) => normaliseVehicle(v))}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            className={fieldErrors.vehicle ? 'invalid' : undefined}
          />
        </div>

        <WeightInput
          value={weight} onChange={setWeight} onEnter={submit}
          invalid={!!fieldErrors.weight}
        />

        <div className="add-cell">
          <button className="btn-add" onClick={submit} disabled={saving || atCapacity}>
            {saving ? <span className="spinner" /> : atCapacity ? 'Limit reached' : 'Add Load'}
          </button>
        </div>
      </div>

      <ConversionTape
        raw={weight} preview={preview} loading={previewing}
        error={tapeError} rates={rates}
      />
    </div>
  );
}
