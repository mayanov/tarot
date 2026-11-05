import React, { useId } from 'react';

export type CelestialName = 'sparkle' | 'star' | 'constellation' | 'crescent' | 'sun';

interface CelestialMarkProps {
  /** Which celestial mark to draw. Defaults to the single inline sparkle. */
  name?: CelestialName;
  /** Tailwind/size classes — set width/height + color here (the art uses currentColor). */
  className?: string;
  /** If provided, the mark is exposed to assistive tech with this label; otherwise it's decorative. */
  title?: string;
  /** Crescent only: false hides the sparkle; a number pencils it on, stroke by stroke,
   *  starting that many ms from now (the hero, after the loader's moon has waned). */
  sparkleIn?: number | false;
}

/**
 * Mayanov's celestial line-work — the brand's signature motif, hand-drawn as
 * vector paths (no icon library). All marks inherit `currentColor`, so color
 * them with `text-*`. Drawn in one language: fine strokes, filled dots for
 * stars of varying magnitude, a little organic asymmetry.
 *
 *   <CelestialMark name="sparkle" className="w-3.5 h-3.5 text-moon" />   // inline punctuation
 *   <CelestialMark name="constellation" className="w-40 text-moon/25" /> // ambient accent
 */
const SPARKLE = 'M0,-1 C0.06,-0.3 0.3,-0.06 1,0 C0.3,0.06 0.06,0.3 0,1 C-0.06,0.3 -0.3,0.06 -1,0 C-0.3,-0.06 -0.06,-0.3 0,-1 Z';

// The crescent, drawn in pencil: its outline (with a second, lighter pass a hair off,
// as a hand goes round twice), shaded with diagonal hatching, each stroke a little
// uneven. The shape is unchanged — the loader's moon lands on its lit disc (Loader.tsx).
const CRESCENT = 'M37 15 A20 20 0 1 0 37 49 A18 18 0 0 1 37 15 Z';
// the crescent is this lit disc with the dark disc taken out of it
const LIT = { cx: 26.46, cy: 32, r: 20 };
const DARK = { cx: 42.92, cy: 32, r: 18 };
const HATCH_LINES = Array.from({ length: 34 }, (_, n) => {
  const i = -36 + n * 2.1;
  const j = ((Math.sin(i * 7.3) + 1) * 0.6).toFixed(2);
  return { i, d: `M${i.toFixed(1)} ${64 + +j} L${(i + 64).toFixed(1)} ${-j}` };
});
const HATCH = HATCH_LINES.map((l) => l.d).join(' ');
// the strokes that cross the lit disc, in the order a hand shades it (left to right)
const DISC_HATCH = HATCH_LINES.filter((l) => Math.abs(l.i + 64 - (LIT.cx + LIT.cy)) < LIT.r * Math.SQRT2).map((l) => l.d);
// the sparkle, stroke by stroke: up and down, across, the two small diagonals
const SPARK = [
  { d: 'M49 12.5 L49 25.5', w: 0.9, o: 1 },
  { d: 'M42.5 19 L55.5 19', w: 0.9, o: 1 },
  { d: 'M46.6 16.6 L51.4 21.4', w: 0.5, o: 0.7 },
  { d: 'M51.4 16.6 L46.6 21.4', w: 0.5, o: 0.7 },
];
const SPARK_STEP_MS = 150;
const SPARK_STROKE_MS = 280;

/**
 * The loader's full moon, which wanes into the crescent (Loader). While the page loads
 * it's pencilled in: its outline drawn round as `draw` goes 0 → 1, then shaded with the
 * crescent's own hatching, stroke by stroke. When `wane` turns on, the dark disc slides
 * in from the right, the pencil tracing its edge, and stops exactly where the
 * crescent's inner curve is, so it ends as the crescent (without its sparkle).
 */
export const WaningMoon: React.FC<{
  draw: number; wane: boolean; waneMs: number; waneDelay: number; pencil: boolean;
  className?: string; style?: React.CSSProperties;
}> = ({ draw, wane, waneMs, waneDelay, pencil, className = '', style }) => {
  const id = useId().replace(/:/g, '');
  const outline = Math.min(1, draw / 0.6);
  const shade = Math.max(0, (draw - 0.5) / 0.5);
  const n = DISC_HATCH.length;
  const slide: React.CSSProperties = {
    transform: `translateX(${wane ? 0 : 24}px)`,
    transition: wane ? `transform ${waneMs}ms cubic-bezier(0.45, 0, 0.25, 1) ${waneDelay}ms` : 'none',
  };
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style} overflow="visible" aria-hidden>
      <defs>
        <clipPath id={`disc-${id}`}><circle cx={LIT.cx} cy={LIT.cy} r={LIT.r} /></clipPath>
        <mask id={`dark-${id}`} maskUnits="userSpaceOnUse" x={-10} y={-10} width={84} height={84}>
          <rect x={-10} y={-10} width={84} height={84} fill="white" />
          <circle cx={DARK.cx} cy={DARK.cy} r={DARK.r} fill="black" style={slide} />
        </mask>
      </defs>
      <g filter={pencil ? 'url(#pencil-icon)' : undefined} stroke="currentColor" strokeLinecap="round">
        <g mask={`url(#dark-${id})`}>
          <g clipPath={`url(#disc-${id})`} strokeWidth={0.55}>
            {DISC_HATCH.map((d, k) => {
              const o = Math.min(1, Math.max(0, shade * n - k));
              return o > 0 ? <path key={k} d={d} opacity={0.75 * o} /> : null;
            })}
          </g>
          <circle
            cx={LIT.cx} cy={LIT.cy} r={LIT.r} strokeWidth={1.1}
            pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - outline}
            transform={`rotate(-90 ${LIT.cx} ${LIT.cy})`}
          />
          <circle cx={LIT.cx - 0.4} cy={LIT.cy + 0.3} r={19.6} strokeWidth={0.6} opacity={0.6 * Math.max(0, outline * 2 - 1)} />
        </g>
        {/* the edge of the dark, traced as it comes across (only over the lit disc) */}
        <g clipPath={`url(#disc-${id})`}>
          <circle cx={DARK.cx} cy={DARK.cy} r={DARK.r} strokeWidth={1.1} style={slide} />
        </g>
      </g>
    </svg>
  );
};

const CelestialMark: React.FC<CelestialMarkProps> = ({ name = 'sparkle', className = '', title, sparkleIn }) => {
  const clip = `crescent-${useId().replace(/:/g, '')}`;
  const still = sparkleIn === undefined || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // each of the crescent's sparkle strokes pencilled on in turn (sparkleIn), or simply there
  const spark = (k: number): React.SVGProps<SVGPathElement> => still ? {} : {
    pathLength: 1,
    strokeDasharray: '1 2',
    style: {
      strokeDashoffset: sparkleIn === false ? 1 : 0,
      transition: sparkleIn === false ? 'none' : `stroke-dashoffset ${SPARK_STROKE_MS}ms cubic-bezier(0.5, 0, 0.3, 1) ${sparkleIn + k * SPARK_STEP_MS}ms`,
    },
  };
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  const box = name === 'sparkle' ? '0 0 24 24' : '0 0 64 64';

  return (
    <svg className={className} viewBox={box} fill="none" xmlns="http://www.w3.org/2000/svg" {...a11y}>
      {title ? <title>{title}</title> : null}

      {name === 'sparkle' && (
        <path transform="translate(12 12) scale(10.5)" fill="currentColor" d={SPARKLE} />
      )}

      {name === 'star' && (
        <g fill="currentColor">
          <path transform="translate(27 26) scale(18)" d={SPARKLE} />
          <path transform="translate(49 43) scale(7.5)" d={SPARKLE} />
          <circle cx="15" cy="48" r="1.2" />
        </g>
      )}

      {name === 'constellation' && (
        <>
          <path d="M11 45 L24 29 L35 39 L49 19 L58 33" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
          <g fill="currentColor">
            <circle cx="11" cy="45" r="2" />
            <circle cx="24" cy="29" r="1.5" />
            <circle cx="35" cy="39" r="2.9" />
            <circle cx="49" cy="19" r="2.1" />
            <circle cx="58" cy="33" r="1.4" />
          </g>
          <g stroke="currentColor" strokeWidth={0.9} strokeLinecap="round" opacity={0.5}>
            <line x1="35" y1="30.5" x2="35" y2="33" />
            <line x1="35" y1="45" x2="35" y2="47.5" />
            <line x1="29.5" y1="39" x2="27" y2="39" />
            <line x1="43" y1="39" x2="40.5" y2="39" />
          </g>
          <g fill="currentColor" opacity={0.45}>
            <circle cx="53" cy="52" r="0.9" />
            <circle cx="17" cy="15" r="0.9" />
          </g>
        </>
      )}

      {name === 'crescent' && (
        <>
          <defs><clipPath id={clip}><path d={CRESCENT} /></clipPath></defs>
          <g filter="url(#pencil-icon)" stroke="currentColor" strokeLinecap="round">
            <path d={HATCH} clipPath={`url(#${clip})`} strokeWidth={0.55} opacity={0.75} />
            <path d={CRESCENT} strokeWidth={1.1} />
            <path d="M36.4 15.6 A19.6 19.6 0 1 0 37.4 48.6" strokeWidth={0.6} opacity={0.6} transform="rotate(-2 32 32)" />
            {SPARK.map((s, k) => <path key={k} d={s.d} strokeWidth={s.w} opacity={s.o} {...spark(k)} />)}
            <circle
              cx="54" cy="31" r="0.9" strokeWidth={0.8}
              style={still ? undefined : { opacity: sparkleIn === false ? 0 : 1, transition: sparkleIn === false ? 'none' : `opacity 300ms ease ${sparkleIn + SPARK.length * SPARK_STEP_MS}ms` }}
            />
          </g>
        </>
      )}

      {name === 'sun' && (
        <>
          <circle cx="32" cy="32" r="6.5" stroke="currentColor" strokeWidth={1.2} />
          <circle cx="32" cy="32" r="1.6" fill="currentColor" />
          <g stroke="currentColor" strokeWidth={1.2} strokeLinecap="round">
            <line x1="42" y1="32" x2="54" y2="32" />
            <line x1="37" y1="40.66" x2="43" y2="51.05" />
            <line x1="27" y1="40.66" x2="21" y2="51.05" />
            <line x1="22" y1="32" x2="10" y2="32" />
            <line x1="27" y1="23.34" x2="21" y2="12.95" />
            <line x1="37" y1="23.34" x2="43" y2="12.95" />
          </g>
          <g stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" opacity={0.75}>
            <line x1="40.66" y1="37" x2="45.86" y2="40" />
            <line x1="32" y1="42" x2="32" y2="48" />
            <line x1="23.34" y1="37" x2="18.14" y2="40" />
            <line x1="23.34" y1="27" x2="18.14" y2="24" />
            <line x1="32" y1="22" x2="32" y2="16" />
            <line x1="40.66" y1="27" x2="45.86" y2="24" />
          </g>
        </>
      )}
    </svg>
  );
};

export default CelestialMark;
