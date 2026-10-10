import React, { useEffect, useRef } from 'react';

// Deterministic PRNG so the starfield is identical on every render / reload
// (no hydration flicker, no re-shuffle on state change).
const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Dot = [number, number, number, number]; // [x%, y%, radius px, opacity]

// Scatter `count` stars across the whole sky with the given size/opacity range.
const field = (rng: () => number, count: number, rMin: number, rMax: number, oMin: number, oMax: number): Dot[] =>
  Array.from({ length: count }, () => [
    +(rng() * 100).toFixed(2),
    +(rng() * 100).toFixed(2),
    +(rMin + rng() * (rMax - rMin)).toFixed(2),
    +(oMin + rng() * (oMax - oMin)).toFixed(2),
  ]);

// A faint dusting of fixed stars for base density, plus three sparser layers that
// twinkle at different speeds for depth. Generated once at module load.
const rng = mulberry32(20090217);
const STATIC_DOTS: Dot[] = field(rng, 90, 0.5, 1.1, 0.35, 0.7);
const TWINKLE_LAYERS: { dur: number; delay: number; dots: Dot[] }[] = [
  { dur: 4.5, delay: 0,   dots: field(rng, 26, 0.9, 1.7, 0.7, 1) },
  { dur: 6,   delay: 1.1, dots: field(rng, 24, 0.8, 1.4, 0.6, 0.9) },
  { dur: 7.5, delay: 2.3, dots: field(rng, 22, 0.7, 1.2, 0.5, 0.8) },
];

const toGradients = (dots: Dot[]): string =>
  dots
    .map(([x, y, r, o]) => `radial-gradient(${r}px ${r}px at ${x}% ${y}%, rgba(255,255,255,${o}) 0%, rgba(255,255,255,0) 60%)`)
    .join(',');

// Fixed night sky behind the whole page (only visible at the hero, since the
// content sections are opaque): a deep midnight gradient with faint violet/indigo
// nebula blooms and a living starfield, with a soft parallax drift on scroll.
const Background: React.FC = () => {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* deep night-sky fill — darkest at the edges, a touch of plum/indigo depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 8%, #2a1b47 0%, #1b1536 34%, #141127 64%, #0c0a1c 100%)',
        }}
      />
      {/* faint nebula blooms for depth (very low opacity so it reads as sky, not UI) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(44% 36% at 78% 22%, rgba(122,88,190,0.22), transparent 70%),' +
            'radial-gradient(40% 34% at 18% 68%, rgba(32,42,92,0.30), transparent 72%)',
        }}
      />

      {/* the starfield — one fixed dusting layer plus slow-twinkling layers, all
          drifting together a touch on scroll for parallax depth */}
      <div ref={fieldRef} className="absolute -inset-y-[10%] inset-x-0 will-change-transform">
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: toGradients(STATIC_DOTS) }} />
        {TWINKLE_LAYERS.map((layer, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: toGradients(layer.dots),
              animation: `skyTwinkle ${layer.dur}s ease-in-out ${layer.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* legibility pool so the centered cream wordmark/CTA stay readable over the
          brighter upper glow */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(70% 56% at 50% 44%, rgba(10,8,24,0.42) 0%, transparent 74%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent 0%, transparent 62%, rgba(10,8,24,0.5) 100%)' }}
      />
    </div>
  );
};

export default Background;
