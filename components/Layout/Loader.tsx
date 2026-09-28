import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// Celestial loader: a moon fills with moonstone light as it loads, the wordmark
// sits below, then the whole overlay lifts away on a strong ease with a curved
// bottom edge — a "curtain reveal" hand-off to the page.
const Loader: React.FC<LoaderProps> = ({ ready = false, isIndonesian = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 500 : 2200;
  const mounted = useRef(Date.now());
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  // Lock scroll while the loader is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Count 0 → 100 (eased) over the minimum, to drive the moon fill.
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / MIN, 1);
      setPct(Math.round((1 - Math.pow(1 - t, 2)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [MIN]);

  // Dismiss once ready + window loaded + minimum time elapsed.
  useEffect(() => {
    if (!ready) return;
    let t: number | undefined;
    const begin = () => {
      const wait = Math.max(0, MIN - (Date.now() - mounted.current));
      t = window.setTimeout(() => setLeaving(true), wait);
    };
    if (document.readyState === 'complete') begin();
    else {
      const onLoad = () => begin();
      window.addEventListener('load', onLoad, { once: true });
      t = window.setTimeout(begin, 1400);
      return () => { window.removeEventListener('load', onLoad); if (t) clearTimeout(t); };
    }
    return () => { if (t) clearTimeout(t); };
  }, [ready, MIN]);

  if (gone) return null;

  return (
    <div
      aria-hidden
      onTransitionEnd={(e) => { if (leaving && e.propertyName === 'transform') setGone(true); }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(120% 90% at 50% 38%, #16123A 0%, #0B0B16 60%, #08060F 100%)',
        transform: leaving ? 'translateY(-100%)' : 'translateY(0)',
        borderBottomLeftRadius: leaving ? '50% 14%' : '0',
        borderBottomRightRadius: leaving ? '50% 14%' : '0',
        transition: 'transform 1050ms cubic-bezier(0.76,0,0.24,1), border-radius 1050ms cubic-bezier(0.76,0,0.24,1)',
        willChange: 'transform',
      }}
    >
      {/* faint stars */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 80% 25%, rgba(219,205,242,0.7), transparent), radial-gradient(1px 1px at 65% 72%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 32% 78%, rgba(219,205,242,0.5), transparent), radial-gradient(1.5px 1.5px at 50% 12%, rgba(255,255,255,0.6), transparent)',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* content — exits (fade + rise) just before the curtain lifts */}
      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving ? 'translateY(-24px)' : 'translateY(0)',
          transition: 'opacity 500ms ease, transform 600ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* the moon — outline ring with a moonstone tide that fills as it loads */}
        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden ring-1 ring-moon/40 shadow-[0_0_50px_-10px_rgba(198,178,228,0.45)]">
          {/* dark moon face */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 120% at 30% 25%, #1a1640 0%, #0d0b1e 70%)' }} />
          {/* rising moonstone light */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: `${pct}%`,
              background: 'linear-gradient(180deg, #E6E0F8 0%, #C6B2E4 45%, #9E86C9 100%)',
              transition: reduce ? undefined : 'height 120ms linear',
              boxShadow: '0 -8px 24px rgba(198,178,228,0.5)',
            }}
          />
          {/* soft craters / texture */}
          <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ background: 'radial-gradient(circle at 62% 40%, rgba(0,0,0,0.5) 0 8%, transparent 9%), radial-gradient(circle at 40% 62%, rgba(0,0,0,0.4) 0 6%, transparent 7%)' }} />
        </div>

        {/* wordmark */}
        <div className="mt-8 flex items-baseline gap-[0.28em] text-lg sm:text-xl font-elegant font-semibold tracking-[0.02em]">
          <span className="text-cream">Mayanov</span>
          <span className="text-moon">Tarot</span>
        </div>

        {/* count + label */}
        <div className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cream/45">
          <span className="tabular-nums text-cream/70">{pct.toString().padStart(3, '0')}</span>
          <span className="w-px h-3 bg-cream/20" />
          <span>{isIndonesian ? 'Menyiapkan ruangmu' : 'Preparing your space'}</span>
        </div>
      </div>

      {/* thin progress line pinned near the bottom, fills with the count */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 h-px w-48 md:w-64 bg-white/10 overflow-hidden">
        <div className="h-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #9E86C9, #DBCDF2)' }} />
      </div>
    </div>
  );
};

export default Loader;
