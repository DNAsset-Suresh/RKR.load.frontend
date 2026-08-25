'use client';

import { useEffect, useState } from 'react';

/**
 * Debounced vehicle/date search. A vehicle runs many trips, so this filters
 * rather than de-duplicates - duplicates are expected and correct.
 */
export default function VehicleSearch({ value, onChange, placeholder }) {
  const [local, setLocal] = useState(value || '');

  useEffect(() => { setLocal(value || ''); }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <input
      className="search"
      type="search"
      autoComplete="off"
      placeholder={placeholder || 'Search vehicle number\u2026'}
      value={local}
      onChange={(e) => setLocal(e.target.value.toUpperCase())}
      aria-label="Search by vehicle number"
    />
  );
}
