import React, { useEffect, useRef, useState } from 'react';

// Deterministic PRNG so the starfield is identical on every render / reload
// (no hydration flicker, no re-shuffle on state change).
const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Real stars aren't pure white — a spread of temperatures makes the field read as
// sky rather than UI dots. Weighted toward white, with some cool-blue and warm.
const COLORS = [
  '255,255,255', '255,255,255', '255,255,255', '255,255,255',
  '198,214,255', '208,222,255', // cool
  '255,232,205', '255,224,196', // warm
];

type Dot = [number, number, number, number, number]; // [x%, y%, radius px, opacity, colorIdx]

const clamp = (n: number) => Math.min(Math.max(n, 0), 100);
const pick = (rng: () => number) => Math.floor(rng() * COLORS.length);

// Scatter stars across the whole sky.
const field = (rng: () => number, count: number, rMin: number, rMax: number, oMin: number, oMax: number): Dot[] =>
  Array.from({ length: count }, () => [
    +(rng() * 100).toFixed(2),
    +(rng() * 100).toFixed(2),
    +(rMin + rng() * (rMax - rMin)).toFixed(2),
    +(oMin + rng() * (oMax - oMin)).toFixed(2),
    pick(rng),
  ]);

// Cluster stars along a diagonal to suggest a Milky-Way band (upper-left → lower-right).
const band = (rng: () => number, count: number): Dot[] =>
  Array.from({ length: count }, () => {
    const t = rng();
    return [
      +clamp(6 + t * 90 + (rng() - 0.5) * 12).toFixed(2),
      +clamp(16 + t * 42 + (rng() - 0.5) * 16).toFixed(2),
      +(0.5 + rng() * 0.9).toFixed(2),
      +(0.3 + rng() * 0.45).toFixed(2),
      pick(rng),
    ];
  });

const rng = mulberry32(20090217);
// base density: a faint full-sky dusting plus a denser diagonal band
const STATIC_DOTS: Dot[] = [...field(rng, 80, 0.5, 1.1, 0.3, 0.6), ...band(rng, 60)];
// twinkling layers at different speeds for depth
const TWINKLE_LAYERS: { dur: number; delay: number; drift: boolean; dots: Dot[] }[] = [
  { dur: 4.5, delay: 0,   drift: true,  dots: field(rng, 24, 0.9, 1.6, 0.6, 0.95) },
  { dur: 6,   delay: 1.1, drift: false, dots: [...field(rng, 18, 0.8, 1.3, 0.5, 0.85), ...band(rng, 14)] },
  { dur: 7.5, delay: 2.3, drift: true,  dots: field(rng, 20, 0.7, 1.1, 0.45, 0.75) },
];
// a few bright accent stars that pulse harder and carry a soft glow
const ACCENTS: Dot[] = field(rng, 9, 1.4, 2.2, 0.9, 1);

// Solid-core dot with a soft falloff.
const toGradients = (dots: Dot[]): string =>
  dots
    .map(([x, y, r, o, c]) => `radial-gradient(${r}px ${r}px at ${x}% ${y}%, rgba(${COLORS[c]},${o}) 0%, rgba(${COLORS[c]},0) 60%)`)
    .join(',');

// Wider, two-stop glow for the bright accent stars so they bloom a little.
const toGlows = (dots: Dot[]): string =>
  dots
    .map(([x, y, r, o, c]) =>
      `radial-gradient(${(r * 3).toFixed(1)}px ${(r * 3).toFixed(1)}px at ${x}% ${y}%, rgba(${COLORS[c]},${o}) 0%, rgba(${COLORS[c]},${(o * 0.35).toFixed(2)}) 22%, rgba(${COLORS[c]},0) 70%)`)
    .join(',');

// Fixed night sky behind the whole page (only visible at the hero, since the
// content sections are opaque): overlapping atmospheric color fields with a diffuse
// Milky-Way band and a living, multi-temperature starfield that drifts on scroll.
const Background: React.FC = () => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const update = () => {
      if (fieldRef.current) {
        fieldRef.current.style.transform = `translate3d(0, ${(window.scrollY * 0.06).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [reduce]);

  const anim = (dur: number, delay: number, drift: boolean) =>
    reduce ? undefined : `skyTwinkle ${dur}s ease-in-out ${delay}s infinite${drift ? `, skyDrift ${38 + dur * 3}s ease-in-out ${delay}s infinite` : ''}`;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* 1 — deep atmospheric base: a smooth vertical twilight, zenith darkest */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(177deg, #0c0a1f 0%, #141130 24%, #1b1740 50%, #211a44 72%, #15102e 100%)',
        }}
      />
      {/* 2 — overlapping soft color fields that melt into one another for depth.
          A warm-violet glow behind the wordmark, a cool indigo pool low-left, a
          plum bloom upper-right, and a faint teal breath so the hue range widens. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(85% 62% at 50% 40%, rgba(84,58,140,0.38), transparent 68%),' +
            'radial-gradient(60% 55% at 80% 16%, rgba(126,92,196,0.26), transparent 72%),' +
            'radial-gradient(70% 60% at 14% 82%, rgba(38,54,118,0.32), transparent 74%),' +
            'radial-gradient(42% 34% at 68% 88%, rgba(40,96,112,0.14), transparent 70%)',
        }}
      />
      {/* 3 — diffuse Milky-Way band: a blurred diagonal light, very low opacity */}
      <div
        aria-hidden
        className="absolute left-[-20%] right-[-20%] top-[10%] h-[48%] rotate-[12deg] blur-[30px]"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(150,132,214,0.10) 42%, rgba(120,138,206,0.13) 55%, transparent 100%)',
        }}
      />

      {/* 4 — the starfield: a fixed dusting (incl. the band cluster) plus twinkling
          layers and bright accent stars, all drifting together a touch on scroll */}
      <div ref={fieldRef} className="absolute -inset-y-[10%] inset-x-0 will-change-transform">
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: toGradients(STATIC_DOTS) }} />
        {TWINKLE_LAYERS.map((layer, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundImage: toGradients(layer.dots), animation: anim(layer.dur, layer.delay, layer.drift) }}
          />
        ))}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: toGlows(ACCENTS), animation: reduce ? undefined : 'starPulse 3.6s ease-in-out infinite' }}
        />
      </div>

      {/* 5 — legibility: a soft central pool + bottom scrim so the cream wordmark/CTA
          stay readable over the glow */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(68% 54% at 50% 44%, rgba(9,7,22,0.44) 0%, transparent 74%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent 0%, transparent 60%, rgba(9,7,22,0.5) 100%)' }}
      />
    </div>
  );
};

export default Background;
