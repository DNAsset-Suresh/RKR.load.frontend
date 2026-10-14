'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { normaliseVehicle, parseKg, todayISO, money, kg, tons } from '@/utils/format';
import ConversionTape from './ConversionTape';

/**
 * The entry console, supporting 40mm and Dust materials independently.
 *
 * Flow: DATE -> MATERIAL TYPE -> VEHICLE NUMBER -> WEIGHT (KG/TONS) -> ADD LOAD.
 * Preview is debounced and served by backend calcTransaction.
 */
export default function DailyLoadForm({ rates, capacity, onCreated }) {
  const [date, setDate] = useState(todayISO());
  const [material, setMaterial] = useState('40mm');
  const [vehicle, setVehicle] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('kg'); // 'kg' or 'tons'

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [tapeError, setTapeError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { toast } = useToast();
  const vehicleRef = useRef(null);
  const previewSeq = useRef(0);

  // Active rate card for selected material
  const activeRates = rates?.materials?.[material] || (
    material === 'Dust'
      ? { customerRatePerTon: 810, companyRatePerTon: 800, rkrProfitPerTon: 10, customerGstRate: 5, companyGstRate: 5 }
      : { customerRatePerTon: 930, companyRatePerTon: 920, rkrProfitPerTon: 10, customerGstRate: 5, companyGstRate: 5 }
  );

  const materialCapacity = rates?.materials?.[material]?.capacity || capacity;
  const atCapacity = materialCapacity && materialCapacity.remaining <= 0;

  // Convert entered weight to KG for calculations
  const getWeightInKg = useCallback((raw) => {
    const parsed = parseKg(raw);
    if (parsed === null || Number.isNaN(parsed)) return null;
    if (unit === 'tons') {
      return Math.round(parsed * 1000);
    }
    return parsed;
  }, [unit]);

  // Instant 0ms local preview calculation
  const getInstantPreview = useCallback((parsedKg, mat) => {
    if (!parsedKg || parsedKg <= 0) return null;
    const r = rates?.materials?.[mat] || (
      mat === 'Dust'
        ? { customerRatePerTon: 810, companyRatePerTon: 800, rkrProfitPerTon: 10, customerGstRate: 5, companyGstRate: 5 }
        : { customerRatePerTon: 930, companyRatePerTon: 920, rkrProfitPerTon: 10, customerGstRate: 5, companyGstRate: 5 }
    );
    const t = Math.round((parsedKg / 1000) * 1000) / 1000;
    const custBase = Math.round(t * r.customerRatePerTon * 100) / 100;
    const custGst = Math.round(custBase * (r.customerGstRate / 100) * 100) / 100;
    const custTotal = Math.round((custBase + custGst) * 100) / 100;
    const compBase = Math.round(t * r.companyRatePerTon * 100) / 100;
    const compGst = Math.round(compBase * (r.companyGstRate / 100) * 100) / 100;
    const compTotal = Math.round((compBase + compGst) * 100) / 100;
    const profit = Math.round(t * (r.rkrProfitPerTon || 10) * 100) / 100;
    return {
      material: mat,
      weightKg: parsedKg,
      weightTons: t,
      customerRatePerTon: r.customerRatePerTon,
      customerGstRate: r.customerGstRate,
      customerBaseAmount: custBase,
      customerGstAmount: custGst,
      customerTotalAmount: custTotal,
      companyRatePerTon: r.companyRatePerTon,
      companyGstRate: r.companyGstRate,
      companyBaseAmount: compBase,
      companyGstAmount: compGst,
      companyTotalAmount: compTotal,
      rkrProfitPerTon: r.rkrProfitPerTon || 10,
      rkrProfit: profit,
    };
  }, [rates]);

  // Instant 0ms preview + 60ms server confirmation
  useEffect(() => {
    const parsedKg = getWeightInKg(weight);
    if (parsedKg === null) { setPreview(null); setTapeError(''); return; }
    if (Number.isNaN(parsedKg) || parsedKg <= 0) {
      setPreview(null);
      setTapeError(unit === 'tons' ? 'Enter weight in tons, e.g. 13.61' : 'Enter weight in KG, e.g. 13610');
      return;
    }
    setTapeError('');
    // Instantaneous 0ms feedback
    const instant = getInstantPreview(parsedKg, material);
    setPreview(instant);

    const seq = ++previewSeq.current;
    const timer = setTimeout(async () => {
      try {
        const res = await api.transactions.preview(parsedKg, material);
        if (seq === previewSeq.current) setPreview(res.data);
      } catch (err) {
        if (seq === previewSeq.current && !instant) { setPreview(null); setTapeError(err.message); }
      } finally {
        if (seq === previewSeq.current) setPreviewing(false);
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [weight, material, unit, getWeightInKg, getInstantPreview]);

  const validate = useCallback(() => {
    const errors = {};
    if (!date) errors.date = 'Choose a date for this load.';
    const v = normaliseVehicle(vehicle);
    if (!v) errors.vehicle = 'Enter the vehicle number.';
    else if (v.length < 4) errors.vehicle = 'Vehicle number looks too short.';
    const parsedKg = getWeightInKg(weight);
    if (parsedKg === null) errors.weight = `Enter the weight in ${unit.toUpperCase()}.`;
    else if (Number.isNaN(parsedKg)) errors.weight = `Weight must be a valid number.`;
    else if (parsedKg <= 0) errors.weight = 'Weight must be greater than zero.';
    setFieldErrors(errors);
    return errors;
  }, [date, vehicle, weight, unit, getWeightInKg]);

  async function submit() {
    if (atCapacity) {
      toast(`Maximum load entries reached for ${material}. Export and archive first.`, 'bad');
      return;
    }
    const errors = validate();
    const first = Object.values(errors)[0];
    if (first) { toast(first, 'bad'); return; }

    const parsedKg = getWeightInKg(weight);
    setSaving(true);
    try {
      const res = await api.transactions.create({
        date,
        vehicleNumber: normaliseVehicle(vehicle),
        weightKg: parsedKg,
        material,
      });
      const t = res.data;
      toast(
        `[${t.material || material}] ${t.vehicleNumber} \u00b7 ${kg(t.weightKg)} KG = ${tons(t.weightTons)} Tons \u00b7 RKR ${money(t.rkrProfit)}`
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
      {/* Rate Card Banner for Active Material */}
      <div style={{
        background: material === 'Dust' ? 'rgba(201,162,75,0.08)' : 'rgba(26,86,219,0.06)',
        borderBottom: '1px solid var(--hair)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--disp)',
            fontWeight: 800,
            fontSize: '11px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: material === 'Dust' ? 'var(--gold-d)' : 'var(--royal)',
          }}>
            {material} Rate Card
          </span>
          <span style={{ fontSize: '13px', color: 'var(--ink-2)', fontFamily: 'var(--mono)' }}>
            Customer: ₹{activeRates.customerRatePerTon}/T (5% GST) &nbsp;|&nbsp;
            Company: ₹{activeRates.companyRatePerTon}/T (5% GST) &nbsp;|&nbsp;
            Profit: ₹{activeRates.rkrProfitPerTon}/T
          </span>
        </div>
        {materialCapacity ? (
          <span style={{ fontSize: '12px', color: 'var(--faint)', fontFamily: 'var(--mono)' }}>
            {material} entries: {materialCapacity.used} / {materialCapacity.maximumLoads}
          </span>
        ) : null}
      </div>

      <div className="console-grid">
        {/* Field 1: Date */}
        <div className="field">
          <label htmlFor="f-date">Date</label>
          <input
            id="f-date" type="date" value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldErrors.date ? 'invalid' : undefined}
          />
        </div>

        {/* Field 2: Material Segment */}
        <div className="field">
          <label>Material Segment</label>
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            <button
              type="button"
              className={`mat-pill${material === '40mm' ? ' active-40mm' : ''}`}
              onClick={() => setMaterial('40mm')}
              style={{ cursor: 'pointer', border: '1px solid', padding: '6px 12px' }}
            >
              40mm
            </button>
            <button
              type="button"
              className={`mat-pill${material === 'Dust' ? ' active-dust' : ''}`}
              onClick={() => setMaterial('Dust')}
              style={{ cursor: 'pointer', border: '1px solid', padding: '6px 12px' }}
            >
              Dust
            </button>
          </div>
        </div>

        {/* Field 3: Vehicle Number */}
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

        {/* Field 4: Weight + Unit Selector */}
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="f-weight">Load Weight</label>
            <div style={{ display: 'inline-flex', gap: 3 }}>
              <button
                type="button"
                onClick={() => setUnit('kg')}
                style={{
                  background: unit === 'kg' ? 'var(--navy)' : 'transparent',
                  color: unit === 'kg' ? '#fff' : 'var(--faint)',
                  border: '1px solid var(--hair)',
                  borderRadius: 4,
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  cursor: 'pointer',
                }}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => setUnit('tons')}
                style={{
                  background: unit === 'tons' ? 'var(--navy)' : 'transparent',
                  color: unit === 'tons' ? '#fff' : 'var(--faint)',
                  border: '1px solid var(--hair)',
                  borderRadius: 4,
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  cursor: 'pointer',
                }}
              >
                TONS
              </button>
            </div>
          </div>
          <div className="field-row">
            <input
              id="f-weight"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={unit === 'tons' ? '13.61' : '13610'}
              className={fieldErrors.weight ? 'invalid' : undefined}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            />
            <span className="field-unit">{unit.toUpperCase()}</span>
          </div>
        </div>

        {/* Field 5: Add Load Button */}
        <div className="add-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginLeft: 'auto' }}>
          <button className="btn-add" onClick={submit} disabled={saving || atCapacity}>
            {saving ? <span className="spinner" /> : atCapacity ? `${material} Limit` : 'Add Load'}
          </button>
        </div>
      </div>

      <ConversionTape
        raw={weight} preview={preview} loading={previewing}
        error={tapeError} rates={activeRates}
      />
    </div>
  );
}
