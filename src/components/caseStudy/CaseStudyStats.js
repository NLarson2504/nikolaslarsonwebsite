import React from 'react';

/**
 * A row of highlighted metrics for a case study, e.g.
 *   [{ value: '30', unit: '→ 60s', label: 'Per-invoice time' }, ...]
 * Renders nothing when there are no stats.
 */
const CaseStudyStats = ({ stats = [] }) => {
  if (!stats.length) return null;

  return (
    <div className="grid gap-3.5 my-8 grid-cols-1 sm:grid-cols-3">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-dark-900 border border-white/10 rounded-xl px-5 py-4"
        >
          <div className="font-heading font-extrabold text-3xl leading-none text-dark-50 tabular-nums">
            {stat.value}
            {stat.unit && (
              <span className="text-base font-semibold text-primary-400 ml-1">
                {stat.unit}
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] tracking-wider uppercase text-dark-400 mt-2.5">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CaseStudyStats;
