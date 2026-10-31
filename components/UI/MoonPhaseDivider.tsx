import React from 'react';
import FadeIn from './FadeIn';
import PencilRule from './PencilRule';

// A quiet section break: a hairline across the page with a row of moon phases in
// the middle — waxing up to a full moon and waning again (an echo of the loader).
// Pure SVG in the brand purple; decorative only.

// lit fraction 0 = new, 0.5 = half, 1 = full; `waning` lights the left side instead
export const Phase: React.FC<{ p: number; waning?: boolean; size: number }> = ({ p, waning = false, size }) => {
  const r = 7, c = 8;
  const rx = Math.abs(1 - 2 * p) * r;
  // right half-circle, closed by the terminator ellipse (bulging out for gibbous)
  const lit = p >= 1
    ? null
    : `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} A ${rx} ${r} 0 0 ${p > 0.5 ? 1 : 0} ${c} ${c - r} Z`;
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} className="shrink-0" style={waning ? { transform: 'scaleX(-1)' } : undefined}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} />
      {p >= 1 ? <circle cx={c} cy={c} r={r} fill="currentColor" /> : p > 0 && <path d={lit!} fill="currentColor" />}
    </svg>
  );
};

export const PHASES: { p: number; waning?: boolean }[] = [
  { p: 0.25 }, { p: 0.5 }, { p: 0.75 }, { p: 1 }, { p: 0.75, waning: true }, { p: 0.5, waning: true }, { p: 0.25, waning: true },
];

const MoonPhaseDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden className={`mx-auto px-8 ${className}`}>
    <FadeIn dir="none">
      <div className="print-ink mix-blend-multiply flex items-center gap-4 md:gap-6 text-moon">
        <PencilRule fade="start" className="flex-1 text-moon/70" />
        <div className="flex items-center gap-2.5 md:gap-3.5">
          {PHASES.map((ph, i) => (
            <Phase key={i} p={ph.p} waning={ph.waning} size={ph.p === 1 ? 18 : 13} />
          ))}
        </div>
        <PencilRule fade="end" className="flex-1 text-moon/70" />
      </div>
    </FadeIn>
  </div>
);

export default MoonPhaseDivider;
