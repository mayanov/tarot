import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// Black loader: a real moon waxes from new → full (a soft shadow slides off it as
// it loads, its glow growing), settles full for a beat, then the full moon blooms
// brighter and dilates open — a circle of light expanding outward from its center
// to unveil the page, continuing the moon's growth as one flowing motion.
const Loader: React.FC<LoaderProps> = ({ ready = false, isIndonesian = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 500 : 2500;
  const mounted = useRef(Date.now());
  const [wax, setWax] = useState(0); // 0 = new moon, 100 = full
  const [enter, setEnter] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // gentle entrance for the content
  useEffect(() => {
    const r = requestAnimationFrame(() => setEnter(true));
    return () => cancelAnimationFrame(r);
  }, []);

  // Pre-decode the page's hero background so it doesn't decode on the reveal frame
  // (which was causing a stutter the instant the aperture uncovered it).
  useEffect(() => {
    let cancelled = false;
    const done = () => { if (!cancelled) setHeroReady(true); };
    const img = new Image();
    img.src = `${import.meta.env.BASE_URL}sky-hero.jpg`;
    if ('decode' in img && typeof img.decode === 'function') img.decode().then(done).catch(done);
    else { img.onload = done; img.onerror = done; }
    const t = window.setTimeout(done, 2200); // never block forever
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // Drive the waxing on a single rAF (no CSS transition chasing it, so it stays
  // buttery). Finish just before MIN so it flows straight into the reveal.
  useEffect(() => {
    const dur = reduce ? MIN : MIN * 0.96;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic — slows softly into full
      setWax(Math.round(eased * 1000) / 10);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [MIN, reduce]);

  // Only start the reveal once the app has resolved AND the hero image is decoded,
  // so the transition never competes with a decode/paint on its first frame.
  useEffect(() => {
    if (!ready || !heroReady) return;
    let t: number | undefined;
    const begin = () => {
      const wait = Math.max(0, MIN - (Date.now() - mounted.current));
      t = window.setTimeout(() => {
        setLeaving(true);
        // tell the hero to play its entrance as the aperture opens
        try { window.dispatchEvent(new CustomEvent('mt:reveal')); } catch { /* noop */ }
      }, wait);
    };
    if (document.readyState === 'complete') begin();
    else {
      const onLoad = () => begin();
      window.addEventListener('load', onLoad, { once: true });
      t = window.setTimeout(begin, 1400);
      return () => { window.removeEventListener('load', onLoad); if (t) clearTimeout(t); };
    }
    return () => { if (t) clearTimeout(t); };
  }, [ready, heroReady, MIN]);

  if (gone) return null;

  return (
    <div
      aria-hidden
      onAnimationEnd={(e) => { if (leaving && e.animationName === 'ldAperture') setGone(true); }}
      onTransitionEnd={(e) => { if (leaving && reduce && e.propertyName === 'opacity') setGone(true); }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: '#14112B',
        // The full moon dilates open — a circle of light growing from its center
        // to unveil the page (an "aperture" reveal). The mask is only applied once
        // the exit begins, so no pinhole of the page shows through beforehand.
        WebkitMaskImage: leaving && !reduce ? 'radial-gradient(circle at 50% 43%, transparent var(--ldIris), #000 calc(var(--ldIris) + 0.6%))' : undefined,
        maskImage: leaving && !reduce ? 'radial-gradient(circle at 50% 43%, transparent var(--ldIris), #000 calc(var(--ldIris) + 0.6%))' : undefined,
        animation: leaving && !reduce ? 'ldAperture 1200ms cubic-bezier(0.33,0,0.2,1) 110ms forwards' : undefined,
        opacity: leaving && reduce ? 0 : 1,
        transition: reduce ? 'opacity 300ms ease' : undefined,
        willChange: 'mask',
      }}
    >
      <div
        className="relative flex flex-col items-center"
        style={{
          // No bloom/scale on exit — the moon holds still and the aperture simply
          // opens from its center (the mask reveals straight through it).
          opacity: leaving ? (reduce ? 0 : 1) : enter ? 1 : 0,
          transform: `translateY(${!leaving && !enter ? 12 : 0}px) scale(1)`,
          transition: leaving ? (reduce ? 'opacity 250ms ease' : undefined) : 'opacity 800ms ease, transform 900ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* the moon — a real photo, revealed as the shadow disc slides off */}
        <div
          className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden"
          style={{ boxShadow: `0 0 ${wax * 1.1}px ${wax * 0.22}px rgba(255,255,255,${0.06 + wax / 260})` }}
        >
          <img
            src={`${import.meta.env.BASE_URL}moon.jpg`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center', transform: 'scale(1.06)' }}
            draggable={false}
          />
          {/* faint moonstone tint so the grey moon reads on-brand */}
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(70% 70% at 42% 38%, rgba(107,63,160,0.16) 0%, transparent 70%)', mixBlendMode: 'screen' }} />
          {/* the shadow that retreats to the right, waxing the moon (soft terminator) */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: '#0A0916',
              transform: `translateX(${wax * 1.02}%)`,
              filter: 'blur(3px)',
            }}
          />
        </div>

        {/* wordmark */}
        <div className="mt-9 flex items-baseline gap-[0.28em] text-lg sm:text-xl font-elegant font-semibold tracking-[0.02em]">
          <span className="text-white">Mayanov</span>
          <span className="text-white">Tarot</span>
        </div>

        {/* label */}
        <div className="mt-3 text-[11px] uppercase tracking-[0.28em] text-cream/40">
          Loading
        </div>
      </div>
    </div>
  );
};

export default Loader;
