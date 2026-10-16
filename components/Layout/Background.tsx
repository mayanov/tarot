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
const STATIC_DOTS: Dot[] = [...field(rng, 330, 0.4, 1.1, 0.26, 0.62), ...band(rng, 210)];
// twinkling layers at different speeds for depth (more, faster, livelier)
const TWINKLE_LAYERS: { dur: number; delay: number; drift: boolean; dots: Dot[] }[] = [
  { dur: 3.6, delay: 0,   drift: true,  dots: field(rng, 86, 0.9, 1.6, 0.6, 0.95) },
  { dur: 5,   delay: 0.7, drift: false, dots: [...field(rng, 62, 0.8, 1.3, 0.5, 0.88), ...band(rng, 56)] },
  { dur: 6.5, delay: 1.6, drift: true,  dots: field(rng, 68, 0.7, 1.1, 0.45, 0.78) },
  { dur: 8.5, delay: 2.6, drift: false, dots: field(rng, 58, 0.5, 0.95, 0.35, 0.62) },
];
// bright accent stars that pulse harder and carry a soft glow
const ACCENTS: Dot[] = field(rng, 28, 1.4, 2.3, 0.9, 1);

// Occasional shooting stars — [top%, left%, widthRem, duration s, delay s]; they
// start upper-left and dart down-right (matching the keyframe's 28deg travel).
const SHOOTERS: [number, number, number, number, number][] = [
  [8, 12, 7, 7.5, 3],
  [18, 40, 6, 9.5, 8],
  [5, 64, 8, 12, 14],
];

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

// Render a set of star dots into a <canvas> ONCE (and on resize) instead of as
// hundreds of live CSS radial-gradients. 900+ gradients across the hero were being
// re-rasterized by the GPU on scroll and after idle — the scroll lag. As a canvas
// bitmap each layer rasters once and then only composites (cheap), and the twinkle
// animation still works because opacity/transform on the <canvas> is compositor-only.
const StarCanvas: React.FC<{ dots: Dot[]; glow?: boolean; className?: string; style?: React.CSSProperties }> = ({ dots, glow, className, style }) => {
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
      for (const [x, y, r, o, c] of dots) {
        const px = (x / 100) * W;
        const py = (y / 100) * H;
        const R = glow ? r * 3 : r;
        const g = ctx.createRadialGradient(px, py, 0, px, py, Math.max(R, 0.4));
        g.addColorStop(0, `rgba(${COLORS[c]},${o})`);
        if (glow) g.addColorStop(0.22, `rgba(${COLORS[c]},${o * 0.35})`);
        g.addColorStop(glow ? 0.7 : 0.6, `rgba(${COLORS[c]},0)`);
        g.addColorStop(1, `rgba(${COLORS[c]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(R, 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); });
    ro.observe(parent);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [dots, glow]);
  return <canvas ref={ref} aria-hidden className={className} style={style} />;
};

// Fixed night sky behind the whole page (only visible at the hero, since the
// content sections are opaque): overlapping atmospheric color fields with a diffuse
// Milky-Way band and a living, multi-temperature starfield that drifts on scroll.
const Background: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
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
        fieldRef.current.style.transform = `translate3d(0, ${(window.scrollY * 0.06).toFixed(1)}px, 0)`;
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

  const anim = (dur: number, delay: number, drift: boolean) =>
    reduce ? undefined : `skyTwinkle ${dur}s ease-in-out ${delay}s infinite${drift ? `, skyDrift ${38 + dur * 3}s ease-in-out ${delay}s infinite` : ''}`;

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 1 — deep atmospheric base: a smooth vertical twilight, zenith darkest,
          shaded a touch bluer through the middle so it reads as sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(177deg, #0b0924 0%, #10122f 22%, #181a44 46%, #221c48 70%, #140f2c 100%)',
        }}
      />
      {/* 2a — the COOL side of the sky: blues up the left, teal/cyan pooling toward
          the lower-right, and a faint cool breath across the zenith (drifts slowly) */}
      <div
        aria-hidden
        className="absolute inset-0 will-change-transform"
        style={{
          background:
            'radial-gradient(70% 56% at 16% 20%, rgba(52,80,178,0.28), transparent 70%),' +
            'radial-gradient(58% 50% at 86% 78%, rgba(42,124,142,0.24), transparent 72%),' +
            'radial-gradient(52% 42% at 50% 5%, rgba(72,112,168,0.18), transparent 70%)',
          animation: reduce ? undefined : 'nebulaDrift 52s ease-in-out infinite',
        }}
      />
      {/* 2b — the WARM side: a violet glow behind the wordmark, a rose/magenta bloom
          upper-right, an indigo-violet pool lower-left, and a faint ember low so the
          twilight carries real chromatic range instead of one flat wash (drifts, offset) */}
      <div
        aria-hidden
        className="absolute inset-0 will-change-transform"
        style={{
          background:
            'radial-gradient(82% 60% at 50% 42%, rgba(112,66,150,0.34), transparent 68%),' +
            'radial-gradient(56% 50% at 82% 16%, rgba(178,98,158,0.24), transparent 72%),' +
            'radial-gradient(60% 52% at 12% 84%, rgba(60,52,132,0.30), transparent 74%),' +
            'radial-gradient(36% 28% at 56% 93%, rgba(166,100,88,0.13), transparent 68%)',
          animation: reduce ? undefined : 'nebulaDrift 70s ease-in-out -24s infinite',
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
        <StarCanvas dots={STATIC_DOTS} className="absolute inset-0 w-full h-full" />
        {TWINKLE_LAYERS.map((layer, i) => (
          <StarCanvas
            key={i}
            dots={layer.dots}
            className="absolute inset-0 w-full h-full"
            style={{ animation: anim(layer.dur, layer.delay, layer.drift) }}
          />
        ))}
        <StarCanvas
          dots={ACCENTS}
          glow
          className="absolute inset-0 w-full h-full"
          style={{ animation: reduce ? undefined : 'starPulse 3.6s ease-in-out infinite' }}
        />
      </div>

      {/* occasional shooting stars — a bright head (right) with a tapering tail that
          trails behind it as it darts down-right; long quiet gaps between */}
      {!reduce && SHOOTERS.map(([top, left, w, dur, delay], i) => (
        <span
          key={i}
          aria-hidden
          className="absolute h-[2px] rounded-full will-change-transform"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: `${w}rem`,
            transformOrigin: 'right center',
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 55%, rgba(255,255,255,0.95) 92%, #fff 100%)',
            filter: 'drop-shadow(0 0 7px rgba(255,255,255,0.7))',
            animation: `shootingStar ${dur}s ease-in ${delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}

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
