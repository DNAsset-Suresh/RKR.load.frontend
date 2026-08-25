'use client';

import { parseKg } from '@/utils/format';

/**
 * KG input from the original entry console. Accepts '13,610' as well as
 * '13610', and reports the parsed value upward. It never computes money.
 */
export default function WeightInput({ value, onChange, onEnter, id = 'f-kg', invalid }) {
  return (
    <div className="field">
      <label htmlFor={id}>Weight</label>
      <div className="field-row">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="13610"
          className={invalid ? 'invalid' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
          aria-invalid={invalid || undefined}
        />
        <span className="field-unit">KG</span>
      </div>
    </div>
  );
}

export { parseKg };
