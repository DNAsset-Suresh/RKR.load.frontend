/**
 * Display formatting only.
 *
 * Nothing here decides money. Every rupee shown comes from the backend, which
 * recomputes it from weightKg. These helpers just group digits the Indian way
 * (1,14,370 rather than 114,370).
 */

export function inrGroup(value, dp = 2) {
  const n = Number(value);
  if (!isFinite(n)) return dp === 0 ? '0' : '0.00';
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(dp);
  const [intPart, frac] = fixed.split('.');
  let last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  if (rest) last3 = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  return (neg ? '-' : '') + last3 + (frac ? '.' + frac : '');
}

export const money = (v) => '\u20b9' + inrGroup(v, 2);
export const kg = (v) => inrGroup(v, 0);
export const tons = (v) => inrGroup(v, 2);
export const count = (v) => inrGroup(v, 0);

/** 'YYYY-MM-DD' -> '25-08-2026' without touching timezones. */
export function fmtDate(iso) {
  if (!iso) return '';
  const p = String(iso).slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : String(iso);
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

export function fmtLong(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DAYS[dt.getUTCDay()]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

export function dayName(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDaysISO(iso, n) {
  const [y, m, d] = String(iso).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Monday-start week, matching the backend. */
export function weekStartISO(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return addDaysISO(iso, -((dt.getUTCDay() + 6) % 7));
}

export function monthStartISO(iso) {
  return String(iso).slice(0, 8) + '01';
}

/** Vehicle numbers are shown and sent upper-case with single spaces. */
export function normaliseVehicle(v) {
  return String(v || '').toUpperCase().replace(/\s+/g, ' ').trim();
}

/** Accepts '13,610' or '13610'. Returns null if empty, NaN if not a number. */
export function parseKg(value) {
  const s = String(value ?? '').replace(/[,\s]/g, '');
  if (s === '') return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
  return parseFloat(s);
}
