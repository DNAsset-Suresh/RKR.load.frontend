'use client';

import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import api from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { money, kg, tons, fmtDate } from '@/utils/format';

export default function LoadDeleteModal({ load, open, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  if (!load) return null;

  async function remove() {
    setBusy(true);
    try {
      await api.transactions.remove(load.id);
      toast(`Load deleted \u00b7 ${load.vehicleNumber}`);
      onDeleted(load);
      onClose();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConfirmationModal
      open={open} title="Delete Load" onClose={onClose}
      onConfirm={remove} confirmLabel="Delete Load" danger busy={busy}
    >
      <p style={{ margin: '0 0 14px' }}>
        Delete this load permanently? This cannot be undone.
      </p>
      <dl className="dl">
        <dt>Date</dt><dd>{fmtDate(load.date)}</dd>
        <dt>Vehicle</dt><dd>{load.vehicleNumber}</dd>
        <dt>Weight</dt><dd>{kg(load.weightKg)} KG ({tons(load.weightTons)} Tons)</dd>
        <dt>RKR Profit</dt><dd className="gold">{money(load.rkrProfit)}</dd>
      </dl>
    </ConfirmationModal>
  );
}
