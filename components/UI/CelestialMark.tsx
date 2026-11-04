import React, { useId } from 'react';

export type CelestialName = 'sparkle' | 'star' | 'constellation' | 'crescent' | 'sun';

interface CelestialMarkProps {
  /** Which celestial mark to draw. Defaults to the single inline sparkle. */
  name?: CelestialName;
  /** Tailwind/size classes — set width/height + color here (the art uses currentColor). */
  className?: string;
  /** If provided, the mark is exposed to assistive tech with this label; otherwise it's decorative. */
  title?: string;
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
const HATCH = Array.from({ length: 43 }, (_, n) => {
  const i = -20 + n * 2.1;
  const j = ((Math.sin(i * 7.3) + 1) * 0.6).toFixed(2);
  return `M${i.toFixed(1)} ${64 + +j} L${(i + 64).toFixed(1)} ${-j}`;
}).join(' ');

const CelestialMark: React.FC<CelestialMarkProps> = ({ name = 'sparkle', className = '', title }) => {
  const clip = `crescent-${useId().replace(/:/g, '')}`;
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
            <path d="M49 12.5 L49 25.5 M42.5 19 L55.5 19" strokeWidth={0.9} />
            <path d="M46.6 16.6 L51.4 21.4 M51.4 16.6 L46.6 21.4" strokeWidth={0.5} opacity={0.7} />
            <circle cx="54" cy="31" r="0.9" strokeWidth={0.8} />
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
