import React, { useEffect, useRef } from 'react';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")";

// Soft twinkling star points, biased toward the right/top where the hero sky is
// visible (the left is under the legibility overlay). [x%, y%, radius, opacity]
const STAR_LAYERS: { dur: number; delay: number; dots: [number, number, number, number][] }[] = [
  { dur: 4.5, delay: 0, dots: [[72, 18, 1.5, 0.9], [84, 34, 1.2, 0.8], [63, 46, 1.4, 0.85], [91, 52, 1, 0.7], [55, 24, 1.1, 0.75], [78, 62, 1.3, 0.8]] },
  { dur: 6, delay: 1.1, dots: [[68, 30, 1, 0.7], [88, 22, 1.3, 0.85], [60, 60, 1.1, 0.7], [95, 40, 1.2, 0.75], [74, 48, 1, 0.65], [82, 70, 1.2, 0.7]] },
  { dur: 7.5, delay: 2.3, dots: [[58, 38, 0.9, 0.6], [90, 64, 1, 0.65], [66, 20, 1, 0.7], [79, 28, 0.9, 0.6], [86, 46, 1.1, 0.7], [70, 72, 1, 0.6]] },
];

// Fixed night-sky photo behind the whole page (only visible at the hero, since the
// content sections are opaque). A deep violet starry sky, with legibility overlays
// so the hero copy stays readable, and a soft parallax drift on scroll.
const Background: React.FC = () => {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      if (fieldRef.current) {
        fieldRef.current.style.transform = `translate3d(0, ${(window.scrollY * 0.06).toFixed(1)}px, 0) scale(1.08)`;
      }
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* the sky photo (scaled a touch so the parallax never reveals an edge) */}
      <div
        ref={fieldRef}
        className="absolute -inset-y-[8%] inset-x-0 will-change-transform"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}sky-hero.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'scale(1.08)',
        }}
      />

      {/* live twinkling stars — a few soft points drifting over the photo so the
          hero sky feels alive (only visible at the hero; sections are opaque) */}
      {STAR_LAYERS.map((layer, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: layer.dots
              .map(([x, y, r, o]) => `radial-gradient(${r}px ${r}px at ${x}% ${y}%, rgba(255,255,255,${o}) 0%, rgba(255,255,255,0) 60%)`)
              .join(','),
            animation: `skyTwinkle ${layer.dur}s ease-in-out ${layer.delay}s infinite`,
          }}
        />
      ))}

      {/* legibility overlays — darker at the left (statement) and along the bottom (stats) */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(8,6,20,0.74) 0%, rgba(8,6,20,0.36) 48%, rgba(8,6,20,0.12) 100%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(8,6,20,0.28) 0%, transparent 30%, transparent 60%, rgba(8,6,20,0.55) 100%)' }}
      />

      {/* film grain — ties the photo to the rest of the site's texture */}
      <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
    </div>
  );
};

export default Background;
