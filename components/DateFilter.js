'use client';

import { PERIOD_OPTIONS } from '@/hooks/useDateRange';

/** Period chips + custom range pickers. Drives every figure on the page. */
export default function DateFilter({ range, options = PERIOD_OPTIONS }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="chips" role="group" aria-label="Date range">
        {options.map((o) => (
          <button
            key={o.value}
            className={`chip${range.period === o.value ? ' active' : ''}`}
            onClick={() => range.setPeriod(o.value)}
            aria-pressed={range.period === o.value}
          >
            {o.label}
          </button>
        ))}
      </div>

      {range.period === 'custom' ? (
        <div className="range-row">
          <div className="ef inline">
            <label htmlFor="range-from">From</label>
            <input
              id="range-from" type="date" value={range.from}
              onChange={(e) => range.setFrom(e.target.value)}
            />
          </div>
          <div className="ef inline">
            <label htmlFor="range-to">To</label>
            <input
              id="range-to" type="date" value={range.to}
              onChange={(e) => range.setTo(e.target.value)}
            />
          </div>
          {!range.valid ? (
            <span className="field-error" style={{ alignSelf: 'center' }}>
              The From date must be on or before the To date.
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
