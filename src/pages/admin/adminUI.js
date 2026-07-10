import React from 'react';

/**
 * Small shared form primitives for the admin editors, styled to the site's dark
 * theme. Kept in one file so the editors stay DRY and consistent.
 */

const labelCls =
  'block font-mono text-[11px] tracking-wider uppercase text-dark-400 mb-1.5';
const inputCls =
  'w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-dark-50 text-sm placeholder:text-dark-500 focus:outline-none focus:border-primary-500 transition-colors';

export const Field = ({ label, children, hint }) => (
  <div className="mb-4">
    <label className={labelCls}>{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-dark-500">{hint}</p>}
  </div>
);

export const TextInput = ({ value, onChange, ...props }) => (
  <input
    type="text"
    className={inputCls}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    {...props}
  />
);

export const TextArea = ({ value, onChange, rows = 4, ...props }) => (
  <textarea
    className={`${inputCls} resize-y leading-relaxed`}
    rows={rows}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    {...props}
  />
);

export const Select = ({ value, onChange, options, ...props }) => (
  <select
    className={inputCls}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    {...props}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

export const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 mb-4 cursor-pointer select-none">
    <span
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${
        checked ? 'bg-primary-600' : 'bg-dark-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </span>
    <span className="text-sm text-dark-200">{label}</span>
  </label>
);

/**
 * Editor for a list of strings (features, technologies). Add / edit / remove
 * rows without touching JSON.
 */
export const StringListEditor = ({ items = [], onChange, placeholder }) => {
  const update = (i, val) => {
    const next = [...items];
    next[i] = val;
    onChange(next);
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, '']);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            className={inputCls}
            value={item}
            placeholder={placeholder}
            onChange={(e) => update(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="px-3 rounded-lg border border-white/10 text-dark-400 hover:text-red-400 hover:border-red-400/40 transition-colors"
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start mt-1 font-mono text-xs tracking-wide uppercase text-primary-400 hover:text-primary-300 transition-colors"
      >
        + Add
      </button>
    </div>
  );
};

export const Button = ({ variant = 'primary', className = '', ...props }) => {
  const base =
    'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-white text-dark-950 hover:bg-gray-100',
    ghost: 'border border-white/10 text-dark-50 hover:border-white/20',
    danger: 'border border-red-500/30 text-red-400 hover:bg-red-500/10',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
};

export { inputCls };
