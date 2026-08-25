'use client';

import { useCallback, useMemo, useState } from 'react';
import { todayISO, weekStartISO, addDaysISO, monthStartISO } from '@/utils/format';

/** The period options offered by the backend, in the order the UI shows them. */
export const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'prevWeek', label: 'Previous Week' },
  { value: 'month', label: 'This Month' },
  { value: 'prevMonth', label: 'Previous Month' },
  { value: 'custom', label: 'Custom Range' },
  { value: 'all', label: 'All Time' },
];

export function useDateRange(initialPeriod = 'today') {
  const today = todayISO();
  const [period, setPeriod] = useState(initialPeriod);
  const [from, setFrom] = useState(monthStartISO(today));
  const [to, setTo] = useState(today);

  const select = useCallback((next) => {
    setPeriod(next);
    // Seed the custom inputs with the current week so the pickers are not blank.
    if (next === 'custom') {
      setFrom((f) => f || weekStartISO(today));
      setTo((t) => t || today);
    }
  }, [today]);

  // Only send from/to for a custom range; the backend derives the rest.
  const params = useMemo(() => (
    period === 'custom' ? { period, from, to } : { period }
  ), [period, from, to]);

  const valid = period !== 'custom' || (!!from && !!to && from <= to);

  return {
    period, setPeriod: select,
    from, setFrom, to, setTo,
    params, valid,
    weekStart: weekStartISO(today),
    weekEnd: addDaysISO(weekStartISO(today), 6),
  };
}
