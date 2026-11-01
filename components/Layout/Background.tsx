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

// The stars are white paint touched onto the painted sky with a fine brush: tiny
// drops with soft, slightly ragged edges (a mix of cool and warm whites, as the paint
// picked up the wash under it), a handful of brighter ones, and only a few painted as
// two crossing strokes. Like a real clear night, most are pinpoints and they don't
// fill the sky evenly: thin cloud covers some patches, so the stars gather in the
// clear gaps between. They twinkle softly; the paper's grain breaks them up.
const COLORS = [
  '250,246,238', '250,246,238', '250,246,238', '246,242,236',
  '226,232,252', // cool, picked up from the blue
  '255,236,218', // warm
];

type Dot = [number, number, number, number, number]; // [x%, y%, radius px, opacity, colorIdx]

const clamp = (n: number) => Math.min(Math.max(n, 0), 100);
const pick = (rng: () => number) => Math.floor(rng() * COLORS.length);

// smooth value noise over the sky (0..1): where it is high, a thin veil of cloud
const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
const smooth = (t: number) => t * t * (3 - 2 * t);
const noise = (x: number, y: number) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = smooth(x - xi), v = smooth(y - yi);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const cloud = (x: number, y: number) => 0.65 * noise(x / 22, y / 18) + 0.35 * noise(x / 9 + 7, y / 8 + 3);
// is this spot of sky clear? (a soft edge: stars thin out towards the cloud)
const clear = (rng: () => number, x: number, y: number) => rng() > (cloud(x, y) - 0.4) * 4;

// Scatter across the clear sky.
const field = (rng: () => number, count: number, rMin: number, rMax: number, oMin: number, oMax: number): Dot[] => {
  const out: Dot[] = [];
  while (out.length < count) {
    const x = rng() * 100, y = rng() * 100;
    if (!clear(rng, x, y)) continue;
    out.push([+x.toFixed(2), +y.toFixed(2), +(rMin + rng() * (rMax - rMin)).toFixed(2), +(oMin + rng() * (oMax - oMin)).toFixed(2), pick(rng)]);
  }
  return out;
};

// a faint Milky-Way band along the diagonal (upper-left → lower-right)
const band = (rng: () => number, count: number): Dot[] => {
  const out: Dot[] = [];
  while (out.length < count) {
    const t = rng();
    const x = clamp(6 + t * 90 + (rng() - 0.5) * 12), y = clamp(16 + t * 42 + (rng() - 0.5) * 16);
    if (!clear(rng, x, y)) continue;
    out.push([+x.toFixed(2), +y.toFixed(2), +(0.5 + rng() * 0.45).toFixed(2), +(0.3 + rng() * 0.35).toFixed(2), pick(rng)]);
  }
  return out;
};

const rng = mulberry32(20090217);
// far: the faint dusting and the band, still
const DUST: Dot[] = [...field(rng, 220, 0.5, 0.95, 0.35, 0.7), ...band(rng, 120)];
// twinkling layers at different speeds, for depth
const TWINKLE_LAYERS: { dur: number; delay: number; dots: Dot[] }[] = [
  { dur: 4.2, delay: 0, dots: field(rng, 55, 0.8, 1.3, 0.65, 0.95) },
  { dur: 6, delay: 1.1, dots: field(rng, 45, 0.7, 1.15, 0.55, 0.85) },
  { dur: 8, delay: 2.4, dots: field(rng, 40, 0.6, 1, 0.45, 0.75) },
];
// the few bright ones, and fewer still painted as crossing strokes
const BRIGHT: Dot[] = field(rng, 18, 1.4, 2, 0.88, 1);
const STARS: Dot[] = field(rng, 5, 3.2, 4.4, 0.85, 0.95);

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

// where a drop landed in the still-wet wash, the white bled out into a faint, uneven
// bloom round it (a soft-edged blob, densest at the middle)
const bloom = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, o: number, rnd: () => number) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${o})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  blob(ctx, x, y, r, rnd);
};

// a star painted as two quick brush strokes crossing, each swelling in the middle and
// tapering to round-ish ends, one a little longer and neither quite square to the other
const stroke = (ctx: CanvasRenderingContext2D, x: number, y: number, a: number, len: number, w: number) => {
  const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  ctx.beginPath();
  ctx.moveTo(x - dx * len, y - dy * len);
  ctx.quadraticCurveTo(x + nx * w, y + ny * w, x + dx * len, y + dy * len);
  ctx.quadraticCurveTo(x - nx * w, y - ny * w, x - dx * len, y - dy * len);
  ctx.fill();
};
const cross = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rnd: () => number) => {
  const tilt = (rnd() - 0.5) * 0.5;
  stroke(ctx, x, y, Math.PI / 2 + tilt, r, r * 0.26);
  stroke(ctx, x, y, tilt + (rnd() - 0.5) * 0.25, r * (0.62 + rnd() * 0.15), r * 0.24);
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
        const rgb = COLORS[c];
        if (kind === 'star') {
          bloom(ctx, px, py, r * 1.5, rgb, o * 0.22, rnd);
          ctx.fillStyle = `rgba(${rgb},${o})`;
          cross(ctx, px, py, r, rnd);
          continue;
        }
        const R = Math.max(r, 0.45);
        if (R > 1.2) bloom(ctx, px, py, R * 2.4, rgb, o * 0.16, rnd);
        ctx.fillStyle = `rgba(${rgb},${o})`;
        blob(ctx, px, py, R, rnd);
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
    // (on a phone the stars hold still: a scroll listener there lags the scroll)
    if (reduce || window.matchMedia('(pointer: coarse)').matches) return;
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

  const twinkle = (dur: number, delay: number) => (reduce ? undefined : `skyTwinkle ${dur}s ease-in-out ${delay}s infinite`);

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 1 — the sky itself, painted in watercolour (blue up the left, a violet
          heart, a rose bloom upper-right, teal lower-right), drifting very slowly */}
      <WatercolorSky palette={TWILIGHT} stars={false} className="absolute inset-0" />

      {/* 4 — the stars, touched on in white paint: the still far dusting, twinkling
          nearer layers and a few bright ones drift apart a touch on scroll, and the
          paper's grain (print-ink) breaks the paint up */}
      <div ref={fieldRef} className="print-ink touch-unmask absolute -inset-y-[10%] inset-x-0 will-change-transform">
        <StarCanvas dots={DUST} seed={11} className="absolute inset-0 w-full h-full" />
        <div ref={midRef} className="absolute inset-0 will-change-transform">
          {TWINKLE_LAYERS.slice(1).map((l, i) => (
            <StarCanvas key={i} dots={l.dots} seed={23 + i} className="absolute inset-0 w-full h-full" style={{ animation: twinkle(l.dur, l.delay) }} />
          ))}
        </div>
        <div ref={nearRef} className="absolute inset-0 will-change-transform">
          <StarCanvas dots={TWINKLE_LAYERS[0].dots} seed={31} className="absolute inset-0 w-full h-full" style={{ animation: twinkle(TWINKLE_LAYERS[0].dur, 0) }} />
          <StarCanvas dots={BRIGHT} seed={37} className="absolute inset-0 w-full h-full" style={{ animation: reduce ? undefined : 'starPulse 3.6s ease-in-out infinite' }} />
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
