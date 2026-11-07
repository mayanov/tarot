import React, { useId } from 'react';

// The Mayanov Tarot mark: the shiba reader, a shiba in a turban with the crescent jewel
// and pixel "deal with it" shades, over a soft watercolour moon, with a pencil arc round
// it and a four-point star at the arc's open end. The wash is two overlapping circles
// roughened by a turbulence filter so the edge bleeds like paint on paper (the turban
// gets its own wash the same way). `onDark` is for the sky: the moon becomes a bright
// full moon (a paper-white wash) with the arc and star in cream, and the shiba stays in
// ink on it, the same drawing as on light pages; otherwise a violet wash. `shades={false}` gives the reader without the shades.
// Source drawing and exports: design/logo/build-mark.py.

const STAR = 'M0,-1 C0.06,-0.3 0.3,-0.06 1,0 C0.3,0.06 0.06,0.3 0,1 C-0.06,0.3 -0.3,0.06 -1,0 C-0.3,-0.06 -0.06,-0.3 0,-1 Z';
const TURBAN = 'M20 47 C15 28 31 14 50 13 C69 14 85 28 80 47 C66 41 34 41 20 47 Z';
// the shades on a 2.3-unit pixel grid: the bar, then each lens stepping in toward its foot
const SHADES = [
  [25, 48.6, 50, 2.6],
  ...[0, 26].flatMap((ox) => [[28, 46], [29.8, 46], [31.6, 44.8], [33.4, 43]].map(([a, b], k) => [a + ox, 51 + k * 2.3, b - a, 2.45])),
];
const GLINTS = [[36.2, 51.6], [38.5, 53.9], [62.2, 51.6], [64.5, 53.9]];

const LogoMark: React.FC<{ onDark?: boolean; className?: string; wash?: number; shades?: boolean }> = ({ onDark = false, className = '', wash, shades = true }) => {
  const uid = useId().replace(/:/g, '');
  const fid = `wc${uid}`;
  const tone = onDark ? '#F3F1EC' : '#6B3FA0';
  const ink = '#221D3C';
  const jewel = '#6B3FA0';
  const cut = '#F3F1EC';
  const a = wash ?? (onDark ? 0.9 : 0.26);
  // the shiba is always ink, so the moon behind it is what changes: violet on light
  // pages, a bright full moon on the sky (cream lines on a pale wash blurred into the sky)
  const moon = onDark ? '#F3F1EC' : 'currentColor';
  const moon2 = onDark ? '#FFFFFF' : 'currentColor';
  const k = 1;
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={`overflow-visible ${className}`} style={{ color: tone }}>
      <defs>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="9" />
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
        <mask id={`ears${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="white" />
          <path d={TURBAN} fill="black" stroke="black" strokeWidth={2.7 * k} />
        </mask>
        <clipPath id={`turban${uid}`}><path d={TURBAN} /></clipPath>
      </defs>
      <g filter={`url(#${fid})`}>
        <circle cx="48" cy="52" r="38" fill={moon} opacity={a} />
        <circle cx="56" cy="47" r="30" fill={moon2} opacity={onDark ? 0.5 : a * 0.6} />
      </g>
      <path d="M70 14 A43 43 0 1 0 82 78" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <path fill="currentColor" transform="translate(80 18) scale(8)" d={STAR} />

      {/* the shiba reader, where the handwritten M used to be */}
      <g transform="translate(11 18.5) scale(0.74)">
        <path d={TURBAN} fill={jewel} opacity={0.35} filter={`url(#${fid})`} />
        <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
          {/* ears, rising from behind the turban */}
          <g mask={`url(#ears${uid})`} strokeWidth={2.7 * k}>
            <path d="M25 40 L22.5 9.5 C22.4 8 23.6 7.4 24.7 8.2 L44 24" />
            <path d="M75 40 L77.5 9.5 C77.6 8 76.4 7.4 75.3 8.2 L56 24" />
            <path d="M27.5 31 L26 15 L37 24 M72.5 31 L74 15 L63 24" strokeWidth={1.8 * k} />
          </g>
          {/* face: broad at the cheeks, a fluff-notch each side, tapering to the muzzle */}
          <path d="M21 47 C18 55 17.5 61 19.5 66 L15 70.5 L22.5 72 C29 81 40 87 50 87 C60 87 71 81 77.5 72 L85 70.5 L80.5 66 C82.5 61 82 55 79 47" strokeWidth={2.7 * k} />
          <ellipse cx="35.5" cy="47.8" rx="2.2" ry="1.4" fill={ink} stroke="none" />
          <ellipse cx="64.5" cy="47.8" rx="2.2" ry="1.4" fill={ink} stroke="none" />
          {!shades && (
            <>
              <path d="M30 53.5 C34 52 39 51.6 43 52.6 M57 52.6 C61 51.6 66 52 70 53.5" strokeWidth={2.7 * k} />
              <path d="M32.5 54 A4.6 4.6 0 0 0 41.6 54 Z M58.4 54 A4.6 4.6 0 0 0 67.5 54 Z" fill={ink} stroke="none" />
            </>
          )}
          <path d="M44.5 65.5 C44.5 62.2 55.5 62.2 55.5 65.5 C55.5 69 52.7 71.4 50 71.4 C47.3 71.4 44.5 69 44.5 65.5 Z" fill={ink} stroke="none" />
          <path d="M50 71.4 L50 74.6 M50 74.6 C47.4 78 43.6 78 42 75.4 M50 74.6 C52.6 78 56.4 78 58 75.4" strokeWidth={2.2 * k} />
          {/* turban: dome, one wrap, the brim, a little shading on its far side */}
          <path d={TURBAN} strokeWidth={2.7 * k} />
          <path d="M23.5 33 C37 23 60 20.5 77.5 30 M22 41 C36 35.5 64 35.5 78 41" strokeWidth={1.8 * k} />
          {<path clipPath={`url(#turban${uid})`} strokeWidth="0.8" opacity="0.55"
            d="M60 50 L78 14 M63.4 50 L81.4 14 M66.8 50 L84.8 14 M70.2 50 L88.2 14 M73.6 50 L91.6 14 M77 50 L95 14 M80.4 50 L98.4 14" />}
        </g>
        {shades && (
          <g>
            {SHADES.map(([x, y, w, h], k) => <rect key={k} x={x} y={y} width={w} height={h} fill={ink} />)}
            {GLINTS.map(([x, y], k) => <rect key={k} x={x} y={y} width="2.3" height="2.3" fill={cut} />)}
          </g>
        )}
        {/* the jewel: a drop with the crescent and sparkle cut from it */}
        <path d="M50 24 C46 29.5 43.6 33.6 43.6 37 C43.6 40.6 46.4 43.4 50 43.4 C53.6 43.4 56.4 40.6 56.4 37 C56.4 33.6 54 29.5 50 24 Z" fill={jewel} />
        <path d="M51.6 33.2 A4.3 4.3 0 1 0 51.6 41 A3.5 3.5 0 0 1 51.6 33.2 Z" fill={cut} />
        <path transform="translate(53.3 33.4) scale(1.9)" fill={cut} d={STAR} />
      </g>
    </svg>
  );
};

export default LogoMark;
