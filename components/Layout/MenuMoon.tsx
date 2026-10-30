import React, { useId } from 'react';

// Tonight's moon, for the menu: a faint photo moon printed into the paper, lit to the
// real phase. Same terminator as the divider's Phase glyphs (a half disc closed by an
// ellipse), so the two always agree.

const SYNODIC = 29.530588853;
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14); // a known new moon

export type MoonNow = { p: number; waning: boolean };

export function moonNow(at = Date.now()): MoonNow {
  const age = ((((at - NEW_MOON_REF) / 86400000) % SYNODIC) + SYNODIC) % SYNODIC;
  const angle = (age / SYNODIC) * 2 * Math.PI;
  return {
    p: (1 - Math.cos(angle)) / 2,
    waning: age > SYNODIC / 2,
  };
}

const MOON_IMG = `${import.meta.env.BASE_URL}moon.jpg`;

// the watermark: the whole disc ghosted (earthshine), the lit part a little stronger,
// and a hairline ring — multiplied into the paper so it reads as printed, not pasted
export const MoonWatermark: React.FC<{ moon: MoonNow; className?: string; style?: React.CSSProperties }> = ({ moon, className = '', style }) => {
  const id = useId().replace(/:/g, '');
  const r = 98, c = 100;
  const rx = Math.abs(1 - 2 * moon.p) * r;
  const lit = `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} A ${rx} ${r} 0 0 ${moon.p > 0.5 ? 1 : 0} ${c} ${c - r} Z`;
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={`pointer-events-none mix-blend-multiply ${className}`} style={style}>
      <defs>
        <clipPath id={`${id}d`}><circle cx={c} cy={c} r={r} /></clipPath>
        <clipPath id={`${id}l`}>
          {moon.p > 0.985
            ? <circle cx={c} cy={c} r={r} />
            : <path d={lit} transform={moon.waning ? 'translate(200 0) scale(-1 1)' : undefined} />}
        </clipPath>
      </defs>
      <image href={MOON_IMG} x={-4} y={-4} width={208} height={208} clipPath={`url(#${id}d)`} opacity={0.035} />
      <image href={MOON_IMG} x={-4} y={-4} width={208} height={208} clipPath={`url(#${id}l)`} opacity={0.11} />
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeOpacity={0.14} strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};
