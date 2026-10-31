import React, { useId } from 'react';

// The footer's sky, painted rather than photographed: a graded violet wash, then
// wet-in-wet layers whose edges wander and dry darker (tide lines), a couple of pale
// backruns, pigment granulation and the tooth of the paper, and a few dots of white
// gouache for stars. All one inline SVG, so there's no image to fetch.

// the sheet is drawn wide and short, like the footer itself (1600×560)
// [cx, cy, rx, ry, colour, opacity]
const WASHES: [number, number, number, number, string, number][] = [
  [820, -40, 980, 210, '#24154a', 0.95],   // night pooling at the top
  [230, 90, 420, 150, '#3a2066', 0.8],
  [1380, 110, 440, 140, '#2b1f63', 0.85],
  [760, 250, 560, 120, '#7446a6', 0.6],   // violet band
  [1260, 330, 420, 120, '#a45c9e', 0.55],  // a mauve-rose drift
  [300, 380, 460, 130, '#5f63b8', 0.5],
  [880, 520, 820, 150, '#c6a3dc', 0.45],   // last light along the bottom
];

// pale backruns, where water crept back into a drying wash
const BLOOMS: [number, number, number, number][] = [
  [520, 210, 150, 70], [1100, 190, 170, 60], [1480, 420, 140, 70],
];

// small gouache dots, kept to the darker upper sky
const STARS: [number, number, number][] = [
  [140, 60, 1.6], [330, 38, 1.1], [520, 92, 1.4], [690, 44, 0.9], [910, 80, 1.7],
  [1080, 30, 1.1], [1260, 72, 1.3], [1450, 46, 1.5], [1545, 130, 1], [210, 165, 1],
  [760, 150, 1.2], [1190, 160, 0.9], [60, 220, 1.2], [1390, 215, 1.1], [610, 196, 0.8],
];

const WatercolorSky: React.FC<{ className?: string; style?: React.CSSProperties; skyRef?: React.Ref<HTMLDivElement> }> = ({ className = '', style, skyRef }) => {
  const id = useId().replace(/:/g, '');
  const f = (n: string) => `url(#${id}${n})`;
  return (
    <div ref={skyRef} aria-hidden className={`pointer-events-none ${className}`} style={{ background: '#3a2763', ...style }}>
      <svg viewBox="0 0 1600 560" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <defs>
          {/* the first graded wash: deep at the top, lavender by the bottom */}
          <linearGradient id={`${id}base`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a1a52" />
            <stop offset="0.55" stopColor="#4d3383" />
            <stop offset="1" stopColor="#9b7fc4" />
          </linearGradient>

          {/* a wash: soft body, wandering frilly edge, darker rim where it dried */}
          <filter id={`${id}wash`} x="-30%" y="-40%" width="160%" height="180%">
            <feGaussianBlur stdDeviation="7" result="soft" />
            <feTurbulence type="fractalNoise" baseFrequency="0.009 0.016" numOctaves="5" seed="7" result="n" />
            <feDisplacementMap in="soft" in2="n" scale="110" xChannelSelector="R" yChannelSelector="G" result="bled" />
            <feMorphology in="bled" operator="erode" radius="4" result="inner" />
            <feGaussianBlur in="inner" stdDeviation="2.5" result="innerSoft" />
            <feComposite in="bled" in2="innerSoft" operator="out" result="rim" />
            <feColorMatrix in="rim" type="matrix" values="0.55 0 0 0 0  0 0.5 0 0 0  0 0 0.65 0 0  0 0 0 0.9 0" result="rimDark" />
            <feMerge><feMergeNode in="bled" /><feMergeNode in="rimDark" /></feMerge>
          </filter>

          {/* backruns: pale blooms with a darker frilled edge */}
          <filter id={`${id}bloom`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="soft" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="21" result="n" />
            <feDisplacementMap in="soft" in2="n" scale="60" xChannelSelector="R" yChannelSelector="G" result="b" />
            <feMorphology in="b" operator="erode" radius="3" result="i" />
            <feComposite in="b" in2="i" operator="out" result="edge" />
            <feFlood floodColor="#2a1850" floodOpacity="0.5" />
            <feComposite in2="edge" operator="in" result="edgeInk" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="edgeInk" /></feMerge>
          </filter>

          {/* granulation: pigment settling into speckles */}
          <filter id={`${id}grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="3" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0 0.3  0 0 0 -1.6 0.95" />
          </filter>
          {/* the paper's tooth, lit from the top left */}
          <filter id={`${id}paper`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="4" seed="9" result="t" />
            <feDiffuseLighting in="t" surfaceScale="2.2" lightingColor="#ffffff" result="lit">
              <feDistantLight azimuth="225" elevation="48" />
            </feDiffuseLighting>
          </filter>
          <filter id={`${id}star`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="0.9" />
          </filter>
        </defs>

        <rect width="1600" height="560" fill={`url(#${id}base)`} />
        <g filter={f('wash')}>
          {WASHES.map(([cx, cy, rx, ry, fill, o], i) => (
            <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} opacity={o} />
          ))}
        </g>
        <g filter={f('bloom')} fill="#d9c6ee" opacity="0.4">
          {BLOOMS.map(([cx, cy, rx, ry], i) => <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />)}
        </g>
        <rect width="1600" height="560" filter={f('grain')} opacity="0.55" style={{ mixBlendMode: 'multiply' }} />
        <rect width="1600" height="560" filter={f('paper')} opacity="0.45" style={{ mixBlendMode: 'multiply' }} />
        <g fill="#f8f2ff" filter={f('star')}>
          {STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r * 1.5} opacity={0.6 + (i % 3) * 0.13} />)}
        </g>
      </svg>
    </div>
  );
};

export default WatercolorSky;
