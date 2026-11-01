import React, { useEffect, useRef, useState } from 'react';
import WatercolorSky, { TWILIGHT } from './WatercolorSky';

// Deterministic PRNG so the starfield is identical on every render / reload
// (no hydration flicker, no re-shuffle on state change).
const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// The stars are white paint flicked onto the painted sky with a brush — not points of
// light: specks and drops with ragged edges (a mix of cool and warm whites, as the
// paint picked up the wash under it), a few bigger drops with a satellite fleck, and a
// handful of four-point stars painted in with a fine brush. No glow, no twinkle — paint
// doesn't shine; the paper's grain breaks them up like everything else on the sheet.
const COLORS = [
  '250,246,238', '250,246,238', '250,246,238', '246,242,236',
  '226,232,252', // cool, picked up from the blue
  '255,236,218', // warm
];

type Dot = [number, number, number, number, number]; // [x%, y%, radius px, opacity, colorIdx]

const clamp = (n: number) => Math.min(Math.max(n, 0), 100);
const pick = (rng: () => number) => Math.floor(rng() * COLORS.length);

// Scatter across the whole sky.
const field = (rng: () => number, count: number, rMin: number, rMax: number, oMin: number, oMax: number): Dot[] =>
  Array.from({ length: count }, () => [
    +(rng() * 100).toFixed(2),
    +(rng() * 100).toFixed(2),
    +(rMin + rng() * (rMax - rMin)).toFixed(2),
    +(oMin + rng() * (oMax - oMin)).toFixed(2),
    pick(rng),
  ]);

// The flick of the brush runs along a diagonal (upper-left → lower-right), so the
// spatter is densest there — a Milky-Way band.
const band = (rng: () => number, count: number): Dot[] =>
  Array.from({ length: count }, () => {
    const t = rng();
    return [
      +clamp(6 + t * 90 + (rng() - 0.5) * 12).toFixed(2),
      +clamp(16 + t * 42 + (rng() - 0.5) * 16).toFixed(2),
      +(0.45 + rng() * 0.7).toFixed(2),
      +(0.35 + rng() * 0.45).toFixed(2),
      pick(rng),
    ];
  });

const rng = mulberry32(20090217);
const SPECKS: Dot[] = field(rng, 280, 0.55, 1.3, 0.3, 0.75);
const BAND: Dot[] = band(rng, 190);
const DROPS: Dot[] = field(rng, 42, 1.5, 3, 0.7, 0.92);
const STARS: Dot[] = field(rng, 10, 6, 10, 0.85, 0.95);

// a drop of paint: a round-ish blob whose edge wobbles (each drop its own shape)
const blob = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rnd: () => number) => {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.4;
    const rr = r * (0.72 + rnd() * 0.5);
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * (0.85 + rnd() * 0.25)];
  });
  ctx.beginPath();
  const mid = (i: number) => {
    const [ax, ay] = pts[i % n], [bx, by] = pts[(i + 1) % n];
    return [(ax + bx) / 2, (ay + by) / 2];
  };
  const [sx, sy] = mid(n - 1);
  ctx.moveTo(sx, sy);
  for (let i = 0; i < n; i++) {
    const [mx, my] = mid(i);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  ctx.fill();
};

// a four-point star painted with a fine brush: four tapering strokes, slightly
// uneven, the two arms of one axis a touch longer
const sparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rnd: () => number) => {
  const tilt = (rnd() - 0.5) * 0.35;
  const w = r * 0.2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = tilt + (i * Math.PI) / 2;
    const len = r * (i % 2 ? 0.72 + rnd() * 0.12 : 0.95 + rnd() * 0.1);
    const tx = x + Math.cos(a) * len, ty = y + Math.sin(a) * len;
    const a1 = a + Math.PI / 4, a2 = a - Math.PI / 4;
    if (i === 0) ctx.moveTo(x + Math.cos(a2) * w, y + Math.sin(a2) * w);
    ctx.quadraticCurveTo(x + Math.cos(a) * w * 1.3, y + Math.sin(a) * w * 1.3, tx, ty);
    ctx.quadraticCurveTo(x + Math.cos(a) * w * 1.3, y + Math.sin(a) * w * 1.3, x + Math.cos(a1) * w, y + Math.sin(a1) * w);
  }
  ctx.closePath();
  ctx.fill();
  // where the brush loaded the centre, a small round drop
  blob(ctx, x, y, w * 1.4, rnd);
};

// Paint a set of marks into a <canvas> ONCE (and on resize): as a bitmap it rasters
// once and then only composites on scroll (hundreds of live CSS gradients lagged).
const StarCanvas: React.FC<{ dots: Dot[]; kind?: 'drop' | 'star'; seed: number; className?: string; style?: React.CSSProperties }> = ({ dots, kind = 'drop', seed, className, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const parent = cv?.parentElement;
    if (!cv || !parent) return;
    let raf = 0;
    const draw = () => {
      const rect = parent.getBoundingClientRect();
      const W = Math.max(1, Math.round(rect.width));
      const H = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const rnd = mulberry32(seed); // same shapes on every redraw
      for (const [x, y, r, o, c] of dots) {
        const px = (x / 100) * W;
        const py = (y / 100) * H;
        ctx.fillStyle = `rgba(${COLORS[c]},${o})`;
        if (kind === 'star') { sparkle(ctx, px, py, r, rnd); continue; }
        blob(ctx, px, py, Math.max(r, 0.45), rnd);
        // the bigger drops threw a fleck off to one side
        if (r > 2 && rnd() < 0.6) {
          const a = rnd() * Math.PI * 2, d = r * (2.2 + rnd() * 2);
          ctx.fillStyle = `rgba(${COLORS[c]},${o * 0.8})`;
          blob(ctx, px + Math.cos(a) * d, py + Math.sin(a) * d, r * 0.35, rnd);
        }
      }
    };
    draw();
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); });
    ro.observe(parent);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [dots, kind, seed]);
  return <canvas ref={ref} aria-hidden className={className} style={style} />;
};

// Fixed night sky behind the whole page (only visible at the hero, since the
// content sections are opaque): a watercolour twilight with a living,
// multi-temperature starfield over it that drifts on scroll.
const Background: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const update = () => {
      // skip the parallax write while the sky is scrolled out of view
      if (visibleRef.current && fieldRef.current) {
        const y = window.scrollY;
        fieldRef.current.style.transform = `translate3d(0, ${(y * 0.06).toFixed(1)}px, 0)`;
        // depth: nearer star layers slide up faster than the far dusting
        if (midRef.current) midRef.current.style.transform = `translate3d(0, ${(-y * 0.08).toFixed(1)}px, 0)`;
        if (nearRef.current) nearRef.current.style.transform = `translate3d(0, ${(-y * 0.2).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [reduce]);

  // Freeze the (otherwise infinite) twinkle/drift/nebula animations once the sky
  // leaves the viewport — they're only visible at the hero, so animating them while
  // scrolled past was pure, continuous GPU cost that dragged the rest of the page.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        visibleRef.current = e.isIntersecting;
        root.classList.toggle('sky-paused', !e.isIntersecting);
      },
      { rootMargin: '120px' }
    );
    io.observe(root);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 1 — the sky itself, painted in watercolour (blue up the left, a violet
          heart, a rose bloom upper-right, teal lower-right), drifting very slowly */}
      <WatercolorSky palette={TWILIGHT} stars={false} className="absolute inset-0" />

      {/* 4 — the stars, flicked on in white paint; the far specks, the band and the
          near drops and painted stars drift apart a touch on scroll, and the paper's
          grain (print-ink) breaks the paint up */}
      <div ref={fieldRef} className="print-ink absolute -inset-y-[10%] inset-x-0 will-change-transform">
        <StarCanvas dots={SPECKS} seed={11} className="absolute inset-0 w-full h-full" />
        <div ref={midRef} className="absolute inset-0 will-change-transform">
          <StarCanvas dots={BAND} seed={23} className="absolute inset-0 w-full h-full" />
        </div>
        <div ref={nearRef} className="absolute inset-0 will-change-transform">
          <StarCanvas dots={DROPS} seed={37} className="absolute inset-0 w-full h-full" />
          <StarCanvas dots={STARS} kind="star" seed={41} className="absolute inset-0 w-full h-full" />
        </div>
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
