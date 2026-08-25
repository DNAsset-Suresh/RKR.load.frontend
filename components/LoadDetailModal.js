'use client';

import ConfirmationModal from './ConfirmationModal';
import { money, kg, tons, fmtLong } from '@/utils/format';

const Row = ({ k, v, cls }) => (
  <>
    <dt>{k}</dt>
    <dd className={cls}>{v}</dd>
  </>
);

/** Full calculation chain for one load, straight from the stored columns. */
export default function LoadDetailModal({ load, open, onClose, onEdit }) {
  if (!load) return null;
  const R = '\u20b9';
  const X = '\u00d7';
  const t = tons(load.weightTons);

  return (
    <ConfirmationModal
      open={open} title="Load Detail" onClose={onClose}
      footer={
        <>
          <button className="tbtn" onClick={() => onEdit(load)}>Edit</button>
          <button className="tbtn primary" onClick={onClose}>Done</button>
        </>
      }
    >
      <dl className="dl">
        <Row k="Date" v={fmtLong(load.date)} />
        <Row k="Vehicle Number" v={load.vehicleNumber} />
      </dl>
      <div className="rule" />
      <dl className="dl">
        <Row k="Weight" v={`${kg(load.weightKg)} KG`} />
        <Row k="Conversion" v={`${kg(load.weightKg)} \u00f7 1,000`} />
        <Row k="Weight in Tons" v={`${t} Tons`} cls="big" />
      </dl>
      <div className="rule" />
      <dl className="dl">
        <Row k={`Customer  (${t} ${X} ${R}${load.customerRatePerTon})`} v={money(load.customerBaseAmount)} />
        <Row k={`Customer GST @ ${load.customerGstRate}%`} v={money(load.customerGstAmount)} />
        <Row k="Customer Total" v={money(load.customerTotalAmount)} cls="big" />
      </dl>
      <div className="rule" />
      <dl className="dl">
        <Row k={`Company  (${t} ${X} ${R}${load.companyRatePerTon})`} v={money(load.companyBaseAmount)} />
        <Row k={`Company GST @ ${load.companyGstRate}%`} v={money(load.companyGstAmount)} />
        <Row k="Company Total" v={money(load.companyTotalAmount)} cls="big" />
      </dl>
      <div className="rule" />
      <dl className="dl">
        <Row k="RKR Rate" v={`${R}${Number(load.rkrProfitPerTon).toFixed(2)} / Ton`} />
        <Row k={`RKR Profit  (${t} ${X} ${R}${load.rkrProfitPerTon})`} v={money(load.rkrProfit)} cls="big gold" />
      </dl>
    </ConfirmationModal>
  );
}
