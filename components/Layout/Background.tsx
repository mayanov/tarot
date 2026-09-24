import React, { useEffect, useRef } from 'react';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")";

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
