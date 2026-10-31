import React, { useEffect, useRef, useState } from 'react';

// A sky painted in watercolour rather than photographed: a graded wash, long
// wet-in-wet streaks laid across it like cloud (edges bled and dried darker), pale
// backruns, granulation and the paper's tooth, and a few dots of white gouache.
//
// Performance: the painting is built as SVG text and drawn once, at idle time, into a
// JPEG bitmap. Everything that moves afterwards (the slow drift, twinkling stars,
// crossfades between skies) is a plain transform/opacity on that one bitmap —
// compositor-only, and paused while the sky is off screen — so scrolling stays smooth.

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

// a clear sky's washes: big round pools of colour, blended wet-in-wet (same colour
// slots as BACK)
const CLEAR: Streak[] = [
  [800, -160, 1700, 330, 0, 0.75], // the deep zenith, wide so its edge never shows
  [180, 230, 560, 330, 0, 0.7],
  [1380, 150, 540, 270, 0, 0.6],
  [820, 330, 660, 240, 0, 0.55],
  [240, 580, 600, 250, 0, 0.6],
  [1360, 560, 580, 270, 0, 0.55],
];

// a clear sky's few high wisps, thin and lit from below near the horizon (colours
// from the front slots)
const WISPS: Streak[] = [
  [300, 360, 420, 12, -4, 0.4],
  [1280, 330, 380, 11, 3, 0.35],
  [520, 450, 600, 18, -3, 0.6],
  [1160, 430, 540, 16, 2, 0.55],
  [820, 530, 760, 22, -1, 0.7],
  [220, 595, 520, 20, 2, 0.65],
  [1420, 575, 480, 18, -2, 0.6],
];

// a faint band of starlight laid diagonally across a clear night, like the Milky Way
const BAND: Streak = [880, 200, 1100, 90, -16, 0.28];

// pale backruns, where water crept back into a drying wash
const BLOOMS: [number, number, number, number][] = [[560, 250, 140, 50], [1120, 210, 160, 46], [1460, 470, 140, 54]];

// small gouache dots, kept to the darker upper sky — [x%, y%, size px]
const STARS: [number, number, number][] = [
  [8.8, 9.4, 4.8], [20.6, 5.9, 3.4], [32.5, 14.4, 4.2], [43.1, 6.9, 2.8], [56.9, 12.5, 5],
  [67.5, 4.7, 3.4], [78.8, 11.3, 4], [90.6, 7.2, 4.6], [96.6, 20.3, 3], [13.1, 25.8, 3],
  [47.5, 23.4, 3.6], [74.4, 25, 2.8], [3.8, 34.4, 3.6], [86.9, 33.6, 3.4], [38.1, 30.6, 2.6],
];

export type SkyPalette = {
  ground: string;     // flat colour under everything
  base: string[];     // the graded wash, top to bottom (5 stops)
  back: string[];     // one per BACK streak
  front: string[];    // one per FRONT streak
  bloom: string;      // the pale backruns
  glow: [string, string];
  clear?: boolean;    // a clear sky: soft wet-in-wet colour pools, no cloud streaks
};

// the shared wash filter: soft body, wandering frilly edge, darker rim where it dried
const washFilter = (id: string, blur: number, seed: number, scale: number) => `
  <filter id="${id}" x="-30%" y="-60%" width="160%" height="220%">
    <feGaussianBlur stdDeviation="${blur}" result="soft"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.005 0.018" numOctaves="5" seed="${seed}" result="n"/>
    <feDisplacementMap in="soft" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="bled"/>
    <feMorphology in="bled" operator="erode" radius="4" result="inner"/>
    <feGaussianBlur in="inner" stdDeviation="2.5" result="innerSoft"/>
    <feComposite in="bled" in2="innerSoft" operator="out" result="rim"/>
    <feColorMatrix in="rim" type="matrix" values="0.55 0 0 0 0  0 0.5 0 0 0  0 0 0.65 0 0  0 0 0 0.8 0" result="rimDark"/>
    <feMerge><feMergeNode in="bled"/><feMergeNode in="rimDark"/></feMerge>
  </filter>`;

// wet-in-wet: colour that spread into damp paper — very soft, the edge only
// gently wandering, with the faintest dried rim
const softWashFilter = (id: string) => `
  <filter id="${id}" x="-40%" y="-60%" width="180%" height="220%">
    <feGaussianBlur stdDeviation="46" result="soft"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.004 0.007" numOctaves="3" seed="11" result="n"/>
    <feDisplacementMap in="soft" in2="n" scale="70" xChannelSelector="R" yChannelSelector="G" result="bled"/>
    <feMorphology in="bled" operator="erode" radius="6" result="inner"/>
    <feGaussianBlur in="inner" stdDeviation="10" result="innerSoft"/>
    <feComposite in="bled" in2="innerSoft" operator="out" result="rim"/>
    <feColorMatrix in="rim" type="matrix" values="0.6 0 0 0 0  0 0.55 0 0 0  0 0 0.7 0 0  0 0 0 0.12 0" result="rimDark"/>
    <feMerge><feMergeNode in="bled"/><feMergeNode in="rimDark"/></feMerge>
  </filter>`;

const streaks = (list: Streak[], colours: string[]) => list.map(([cx, cy, rx, ry, rot, o], i) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${colours[i]}" opacity="${o}" transform="rotate(${rot} ${cx} ${cy})"/>`).join('');

const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">${body}</svg>`)}`;

// the whole painting in one sheet: graded wash, broad streaks, the glow, thin cloud
// streaks and backruns, then granulation and the paper's tooth over everything
const paintSvg = (p: SkyPalette) => svg(`
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="0.15" y2="1">
      ${[0, 0.3, 0.55, 0.78, 1].map((o, i) => `<stop offset="${o}" stop-color="${p.base[i]}"/>`).join('')}
    </linearGradient>
    <radialGradient id="g1" cx="0.38" cy="0.82" r="0.6"><stop offset="0" stop-color="${p.glow[0]}"/><stop offset="0.7" stop-color="${p.glow[0]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0.78" cy="0.7" r="0.45"><stop offset="0" stop-color="${p.glow[1]}"/><stop offset="0.7" stop-color="${p.glow[1]}" stop-opacity="0"/></radialGradient>
    ${p.clear ? softWashFilter('wash') : washFilter('wash', 9, 7, 120)}
    ${washFilter('wash2', 5, 19, 90)}
    ${washFilter('wisp', 12, 27, 150)}
    <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="${p.glow[0]}" stop-opacity="0"/><stop offset="0.8" stop-color="${p.glow[0]}" stop-opacity="0.55"/><stop offset="1" stop-color="${p.glow[0]}"/></linearGradient>
    <filter id="bloom" x="-50%" y="-80%" width="200%" height="260%">
      <feGaussianBlur stdDeviation="9" result="soft"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="21" result="n"/>
      <feDisplacementMap in="soft" in2="n" scale="55" xChannelSelector="R" yChannelSelector="G" result="b"/>
      <feMorphology in="b" operator="erode" radius="3" result="i"/>
      <feComposite in="b" in2="i" operator="out" result="edge"/>
      <feFlood flood-color="#2a1850" flood-opacity="0.45"/>
      <feComposite in2="edge" operator="in" result="edgeInk"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="edgeInk"/></feMerge>
    </filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0 0.3  0 0 0 -1.6 0.95"/>
    </filter>
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="4" seed="9"/>
      <feDiffuseLighting surfaceScale="2.2" lighting-color="#ffffff"><feDistantLight azimuth="225" elevation="48"/></feDiffuseLighting>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#base)"/>
  <g filter="url(#wash)">${streaks(p.clear ? CLEAR : BACK, p.back)}</g>
  <g opacity="0.4"><rect width="${W}" height="${H}" fill="url(#g1)"/><rect width="${W}" height="${H}" fill="url(#g2)"/></g>
  ${p.clear ? `<rect width="${W}" height="${H}" fill="url(#horizon)" opacity="0.8"/>
  <g filter="url(#wisp)">${streaks([BAND], [p.bloom])}</g>
  <g filter="url(#wisp)">${streaks(WISPS, p.front)}</g>` : `<g filter="url(#wash2)">${streaks(FRONT, p.front)}</g>
  <g filter="url(#bloom)" fill="${p.bloom}" opacity="0.32">
    ${BLOOMS.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`).join('')}
  </g>`}
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="${p.clear ? 0.32 : 0.5}" style="mix-blend-mode:multiply"/>
  <rect width="${W}" height="${H}" filter="url(#paper)" opacity="0.42" style="mix-blend-mode:multiply"/>`);

// Each palette is painted once per page load into a plain JPEG bitmap (at 1.5× the
// sheet), queued for idle time so the heavy filters never run during a scroll. Until
// it's ready the sky shows its flat ground colour, then fades the painting in.
const SCALE = 1.5;
const bitmaps = new Map<SkyPalette, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();
const idle = () => new Promise<void>((r) => {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  if (ric) ric(() => r(), { timeout: 1500 }); else setTimeout(r, 60);
});
const bitmap = (p: SkyPalette) => {
  let v = bitmaps.get(p);
  if (!v) {
    v = queue.then(idle).then(() => new Promise<string>((resolve) => {
      const src = paintSvg(p);
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = W * SCALE; c.height = H * SCALE;
          c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
          c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : src), 'image/jpeg', 0.9);
        } catch { resolve(src); }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    }));
    queue = v;
    bitmaps.set(p, v);
  }
  return v;
};

const WatercolorSky: React.FC<{ palette?: SkyPalette; stars?: boolean; className?: string; style?: React.CSSProperties; skyRef?: React.Ref<HTMLDivElement> }> = ({ palette: p = DUSK, stars = true, className = '', style, skyRef }) => {
  const [src, setSrc] = useState<string>();
  const [onScreen, setOnScreen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    bitmap(p).then((u) => { if (live) setSrc(u); });
    return () => { live = false; };
  }, [p]);
  // drift and twinkle only while the sky is on screen
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const play = { animationPlayState: onScreen ? 'running' : 'paused' } as const;
  return (
    <div ref={skyRef} aria-hidden className={`pointer-events-none isolate overflow-hidden ${className}`} style={{ background: p.ground, ...style }}>
      <div ref={boxRef} className="absolute inset-0">
        {/* the painting, drifting very slowly so the sky feels alive */}
        {src && (
          <img
            src={src} alt="" draggable={false}
            className="absolute -inset-[6%] w-[112%] h-[112%] max-w-none object-cover select-none animate-[skyFadeIn_900ms_ease-out_both] motion-safe:[animation:skyFadeIn_900ms_ease-out_both,nebulaDrift_48s_ease-in-out_infinite]"
            style={play}
          />
        )}
        {/* gouache stars, twinkling (opacity only) */}
        {stars && STARS.map(([x, y, s], i) => (
          <span
            key={i}
            className="absolute rounded-full motion-safe:animate-[starPulse_var(--d)_ease-in-out_infinite]"
            style={{
              left: `${x}%`, top: `${y}%`, width: s, height: s,
              background: 'radial-gradient(circle, rgba(248,242,255,0.95) 0%, rgba(248,242,255,0.5) 45%, transparent 75%)',
              '--d': `${4 + (i % 5) * 1.3}s`, animationDelay: `${(i * 0.7) % 5}s`, ...play,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
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

// midnight: deep navy at the top warming through violet to a mauve-rose haze, with
// a teal-blue drift and a few aqua and pink lights — the interlude, a night sky to
// the footer's dusk
export const MIDNIGHT: SkyPalette = {
  ground: '#2a2560',
  base: ['#0d1638', '#1e2560', '#3a3488', '#6a4a9e', '#a7739f'],
  back: ['#0b1333', '#2a1f62', '#1c3a74', '#4b3c9c', '#7a4a9a', '#2f6a9a'],
  front: ['#3a3a8e', '#6a5ab0', '#b07ab0', '#e0a8c4', '#7fb0d8'],
  bloom: '#e6dcf5',
  glow: ['rgba(255,190,220,0.6)', 'rgba(150,210,240,0.5)'],
};

// twilight: the hero and loader — a clear sky just after dusk: deep navy overhead
// lightening to a luminous violet-rose horizon, blue up the left, a magenta bloom
// upper-right, teal lower-right, and a few thin lit wisps low down
export const TWILIGHT: SkyPalette = {
  ground: '#1c1c50',
  base: ['#050a2a', '#0f1e58', '#243488', '#5446a2', '#a06aae'],
  back: ['#040824', '#2e5ccc', '#b04aa6', '#3a3eaa', '#7a4ab4', '#2a9ab0'],
  front: ['#e09ac4', '#9aaae4', '#f2b0c8', '#b48ad6', '#8ccad8'],
  bloom: '#e4dcff',
  glow: ['rgba(245,160,190,0.85)', 'rgba(110,210,230,0.7)'],
  clear: true,
};

// the calm-space band's timelapse runs NIGHT → PLUM → SUNRISE
export const NIGHT: SkyPalette = {
  ground: '#0a0c22',
  base: ['#05061a', '#0b0f2c', '#141a40', '#1f2552', '#2c2f62'],
  back: ['#04051a', '#0c1032', '#10153a', '#1c2350', '#262457', '#1a2a5a'],
  front: ['#1a2050', '#2a2e66', '#3a3a78', '#4a4684', '#34407a'],
  bloom: '#8a90c0',
  glow: ['rgba(120,140,220,0.35)', 'rgba(140,120,220,0.3)'],
};
export const PLUM: SkyPalette = {
  ground: '#2a1638',
  base: ['#160b24', '#2a1440', '#4a2160', '#7a3a78', '#b0688a'],
  back: ['#140a22', '#2a1446', '#331a52', '#5c2a74', '#7d3a7c', '#3e3a7e'],
  front: ['#4a2470', '#8a4a8e', '#c27a9c', '#e2a6b8', '#5a6ab0'],
  bloom: '#f0d4e2',
  glow: ['rgba(255,200,214,0.6)', 'rgba(180,170,255,0.45)'],
};
export const SUNRISE: SkyPalette = {
  ground: '#5a4a8a',
  base: ['#2e3170', '#564b92', '#a2689c', '#e9968c', '#ffcf9c'],
  back: ['#262a66', '#3f3f86', '#6b54a0', '#c4708f', '#ee9478', '#f2b07e'],
  front: ['#7a64b0', '#c07aa8', '#f3a58c', '#ffd3a2', '#ffe2b8'],
  bloom: '#fff0de',
  glow: ['rgba(255,220,170,0.9)', 'rgba(255,190,200,0.6)'],
};

export default WatercolorSky;
