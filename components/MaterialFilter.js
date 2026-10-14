'use client';

export const MATERIAL_OPTIONS_WITH_ALL = [
  { value: 'All', label: 'All Materials' },
  { value: '40mm', label: '40mm' },
  { value: 'Dust', label: 'Dust' },
];

export const MATERIAL_OPTIONS = [
  { value: '40mm', label: '40mm' },
  { value: 'Dust', label: 'Dust' },
];

export default function MaterialFilter({
  value = 'All',
  onChange,
  includeAll = true,
  label,
  size = 'normal'
}) {
  const options = includeAll ? MATERIAL_OPTIONS_WITH_ALL : MATERIAL_OPTIONS;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {label ? (
        <span style={{
          fontFamily: 'var(--disp)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--muted)'
        }}>
          {label}
        </span>
      ) : null}
      <div className="tabs" role="tablist" style={{ margin: 0, padding: size === 'small' ? '2px 3px' : '3px 4px' }}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`tab${isSelected ? ' active' : ''}`}
              onClick={() => onChange(opt.value)}
              style={{
                padding: size === 'small' ? '4px 10px' : '6px 14px',
                fontSize: size === 'small' ? '10.5px' : '11px',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
