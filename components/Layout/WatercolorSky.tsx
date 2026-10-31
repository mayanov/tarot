import React, { useId } from 'react';

// A sky painted in watercolour (the footer's, and the interlude's in its own palette) rather than photographed: a graded dusk wash (indigo at
// the top through violet and rose to a pale lavender glow at the bottom), then long
// wet-in-wet streaks laid across it like evening cloud, their edges bled and dried
// darker. The streak layers drift very slowly against each other and the glow
// breathes, so the sky feels alive; granulation and the paper's tooth sit on top,
// with a few twinkling dots of white gouache. Each moving layer is its own SVG, so
// the browser paints the filters once and only slides the result.

const W = 1600, H = 640;

// [cx, cy, rx, ry, rotate°, opacity] — long, tilted streaks; colours come from the palette
type Streak = [number, number, number, number, number, number];

const BACK: Streak[] = [
  [700, 40, 1050, 150, -3, 0.9],   // night pooling at the top
  [250, 150, 560, 70, 4, 0.75],
  [1300, 170, 620, 80, -5, 0.7],
  [820, 300, 820, 75, -2, 0.6],    // the middle band
  [380, 420, 640, 70, 5, 0.5],     // a warmer drift
  [1240, 450, 600, 80, -4, 0.42],
];
const FRONT: Streak[] = [
  [480, 230, 460, 26, -4, 0.55],
  [1180, 280, 520, 30, 3, 0.45],
  [760, 380, 600, 24, -2, 0.35],
  [260, 520, 420, 22, 3, 0.4],    // lit undersides near the bottom
  [1080, 560, 560, 28, -3, 0.35],
];

export type SkyPalette = {
  ground: string;     // flat colour under everything
  base: string[];     // the graded wash, top to bottom (5 stops)
  back: string[];     // one per BACK streak
  front: string[];    // one per FRONT streak
  bloom: string;      // the pale backruns
  glow: [string, string];
};

// dusk: indigo through violet to rose — the footer
export const DUSK: SkyPalette = {
  ground: '#3a2763',
  base: ['#1c1946', '#33236a', '#5d3c95', '#9a5e9f', '#d9a9c9'],
  back: ['#191744', '#2c1f62', '#3a2470', '#6a3f9f', '#9a4f9a', '#b45f98'],
  front: ['#4b2e86', '#7a4aa6', '#c07aa8', '#e0acd0', '#f0c2d4'],
  bloom: '#e4d2f2',
  glow: ['rgba(255,214,236,0.9)', 'rgba(214,190,255,0.7)'],
};

// pale backruns, where water crept back into a drying wash
const BLOOMS: [number, number, number, number][] = [[560, 250, 140, 50], [1120, 210, 160, 46], [1460, 470, 140, 54]];

// small gouache dots, kept to the darker upper sky
const STARS: [number, number, number][] = [
  [140, 60, 1.6], [330, 38, 1.1], [520, 92, 1.4], [690, 44, 0.9], [910, 80, 1.7],
  [1080, 30, 1.1], [1260, 72, 1.3], [1450, 46, 1.5], [1545, 130, 1], [210, 165, 1],
  [760, 150, 1.2], [1190, 160, 0.9], [60, 220, 1.2], [1390, 215, 1.1], [610, 196, 0.8],
];

// the shared wash filter: soft body, wandering frilly edge, darker rim where it dried
const WashFilter: React.FC<{ id: string; blur: number; seed: number; scale: number }> = ({ id, blur, seed, scale }) => (
  <filter id={id} x="-30%" y="-60%" width="160%" height="220%">
    <feGaussianBlur stdDeviation={blur} result="soft" />
    <feTurbulence type="fractalNoise" baseFrequency="0.005 0.018" numOctaves="5" seed={seed} result="n" />
    <feDisplacementMap in="soft" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" result="bled" />
    <feMorphology in="bled" operator="erode" radius="4" result="inner" />
    <feGaussianBlur in="inner" stdDeviation="2.5" result="innerSoft" />
    <feComposite in="bled" in2="innerSoft" operator="out" result="rim" />
    <feColorMatrix in="rim" type="matrix" values="0.55 0 0 0 0  0 0.5 0 0 0  0 0 0.65 0 0  0 0 0 0.8 0" result="rimDark" />
    <feMerge><feMergeNode in="bled" /><feMergeNode in="rimDark" /></feMerge>
  </filter>
);

const Layer: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => (
  <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={`absolute w-full h-full ${className}`} style={style}>
    {children}
  </svg>
);

const streaks = (list: Streak[], colours: string[]) => list.map(([cx, cy, rx, ry, rot, o], i) => (
  <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={colours[i]} opacity={o} transform={`rotate(${rot} ${cx} ${cy})`} />
));

const WatercolorSky: React.FC<{ palette?: SkyPalette; className?: string; style?: React.CSSProperties; skyRef?: React.Ref<HTMLDivElement> }> = ({ palette: p = DUSK, className = '', style, skyRef }) => {
  const id = useId().replace(/:/g, '');
  const f = (n: string) => `url(#${id}${n})`;
  return (
    <div ref={skyRef} aria-hidden className={`pointer-events-none isolate overflow-hidden ${className}`} style={{ background: p.ground, ...style }}>
      {/* the graded wash */}
      <Layer className="inset-0">
        <defs>
          <linearGradient id={`${id}base`} x1="0" y1="0" x2="0.15" y2="1">
            {[0, 0.3, 0.55, 0.78, 1].map((o, i) => <stop key={o} offset={o} stopColor={p.base[i]} />)}
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${id}base)`} />
      </Layer>

      {/* broad streaks, drifting one way… */}
      <div className="absolute -inset-[6%] motion-safe:animate-[nebulaDrift_48s_ease-in-out_infinite]">
        <Layer className="inset-0">
          <defs><WashFilter id={`${id}back`} blur={9} seed={7} scale={120} /></defs>
          <g filter={f('back')}>{streaks(BACK, p.back)}</g>
        </Layer>
      </div>
      {/* …the glow low in the sky, breathing… */}
      <div
        className="absolute -inset-[10%] mix-blend-soft-light motion-safe:animate-[nebulaDrift_30s_ease-in-out_infinite_reverse]"
        style={{ background: `radial-gradient(60% 45% at 38% 82%, ${p.glow[0]}, transparent 70%), radial-gradient(45% 40% at 78% 70%, ${p.glow[1]}, transparent 70%)` }}
      />
      {/* …and the thin cloud streaks the other way */}
      <div className="absolute -inset-[6%] motion-safe:animate-[nebulaDrift_36s_ease-in-out_infinite_reverse]">
        <Layer className="inset-0">
          <defs>
            <WashFilter id={`${id}front`} blur={5} seed={19} scale={90} />
            <filter id={`${id}bloom`} x="-50%" y="-80%" width="200%" height="260%">
              <feGaussianBlur stdDeviation="9" result="soft" />
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="21" result="n" />
              <feDisplacementMap in="soft" in2="n" scale="55" xChannelSelector="R" yChannelSelector="G" result="b" />
              <feMorphology in="b" operator="erode" radius="3" result="i" />
              <feComposite in="b" in2="i" operator="out" result="edge" />
              <feFlood floodColor="#2a1850" floodOpacity="0.45" />
              <feComposite in2="edge" operator="in" result="edgeInk" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="edgeInk" /></feMerge>
            </filter>
          </defs>
          <g filter={f('front')}>{streaks(FRONT, p.front)}</g>
          <g filter={f('bloom')} fill={p.bloom} opacity="0.32">
            {BLOOMS.map(([cx, cy, rx, ry], i) => <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />)}
          </g>
        </Layer>
      </div>

      {/* granulation and the paper's tooth, still while the paint moves under them */}
      <Layer className="inset-0">
        <defs>
          <filter id={`${id}grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="3" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0 0.3  0 0 0 -1.6 0.95" />
          </filter>
          <filter id={`${id}paper`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="4" seed="9" result="t" />
            <feDiffuseLighting in="t" surfaceScale="2.2" lightingColor="#ffffff">
              <feDistantLight azimuth="225" elevation="48" />
            </feDiffuseLighting>
          </filter>
        </defs>
        <rect width={W} height={H} filter={f('grain')} opacity="0.5" style={{ mixBlendMode: 'multiply' }} />
        <rect width={W} height={H} filter={f('paper')} opacity="0.42" style={{ mixBlendMode: 'multiply' }} />
      </Layer>

      {/* gouache stars, twinkling */}
      <Layer className="inset-0">
        <defs>
          <filter id={`${id}star`} x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="0.9" /></filter>
        </defs>
        <g fill="#f8f2ff" filter={f('star')}>
          {STARS.map(([x, y, r], i) => (
            <circle
              key={i} cx={x} cy={y} r={r * 1.5}
              className="motion-safe:animate-[starPulse_var(--d)_ease-in-out_infinite]"
              style={{ '--d': `${4 + (i % 5) * 1.3}s`, animationDelay: `${(i * 0.7) % 5}s`, opacity: 0.75 } as React.CSSProperties}
            />
          ))}
        </g>
      </Layer>
    </div>
  );
};

// midnight: deep navy through blue-violet to a cool periwinkle haze — the interlude,
// a night sky to the footer's dusk
export const MIDNIGHT: SkyPalette = {
  ground: '#1f2a5a',
  base: ['#0d1638', '#1b2858', '#2c3a80', '#4f579c', '#7f88c4'],
  back: ['#0b1333', '#1a2560', '#20306e', '#3b4c9c', '#5b4f9e', '#4f6bb0'],
  front: ['#2a3a7e', '#4a5cac', '#7a86c6', '#a9b2e0', '#c8c4ea'],
  bloom: '#d5dcf5',
  glow: ['rgba(196,214,255,0.6)', 'rgba(206,190,255,0.45)'],
};

// plum: aubergine through berry to a rosy blush, with a few blue streaks — the
// "calm space" band, warmer than the interlude's midnight
export const PLUM: SkyPalette = {
  ground: '#2a1638',
  base: ['#160b24', '#2a1440', '#4a2160', '#7a3a78', '#b0688a'],
  back: ['#140a22', '#2a1446', '#331a52', '#5c2a74', '#7d3a7c', '#3e3a7e'],
  front: ['#4a2470', '#8a4a8e', '#c27a9c', '#e2a6b8', '#5a6ab0'],
  bloom: '#f0d4e2',
  glow: ['rgba(255,200,214,0.6)', 'rgba(180,170,255,0.45)'],
};

export default WatercolorSky;
