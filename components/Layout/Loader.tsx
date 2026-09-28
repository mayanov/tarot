import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// White loader: a sun fills from empty to full (its glow grows with it), then the
// overlay lifts away with a curved bottom to unveil the dark starry hero — a
// day→night "curtain reveal".
const Loader: React.FC<LoaderProps> = ({ ready = false, isIndonesian = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 500 : 2200;
  const mounted = useRef(Date.now());
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Count 0 → 100 (eased) over the minimum, driving the sun fill.
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
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-white"
      style={{
        transform: leaving ? 'translateY(-100%)' : 'translateY(0)',
        borderBottomLeftRadius: leaving ? '50% 14%' : '0',
        borderBottomRightRadius: leaving ? '50% 14%' : '0',
        transition: 'transform 1050ms cubic-bezier(0.76,0,0.24,1), border-radius 1050ms cubic-bezier(0.76,0,0.24,1)',
        willChange: 'transform',
      }}
    >
      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving ? 'translateY(-24px)' : 'translateY(0)',
          transition: 'opacity 500ms ease, transform 600ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* the disc — empty, fills from the bottom with moonstone light, its glow growing */}
        <div
          className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden ring-1 ring-moon/40"
          style={{ boxShadow: `0 0 ${pct * 0.9}px ${pct * 0.18}px rgba(158,134,201,${0.12 + pct / 320})` }}
        >
          {/* rising moonstone fill */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: `${pct}%`,
              background: 'linear-gradient(0deg, #9E86C9 0%, #C6B2E4 55%, #E6E0F8 100%)',
              transition: reduce ? undefined : 'height 120ms linear',
            }}
          />
          {/* soft highlight */}
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 55% at 38% 30%, rgba(255,255,255,0.45) 0%, transparent 60%)' }} />
        </div>

        {/* wordmark */}
        <div className="mt-8 flex items-baseline gap-[0.28em] text-lg sm:text-xl font-elegant font-semibold tracking-[0.02em]">
          <span className="text-ink">Mayanov</span>
          <span className="text-moon-deep">Tarot</span>
        </div>

        {/* label */}
        <div className="mt-3 text-[11px] uppercase tracking-[0.28em] text-ink/45">
          {isIndonesian ? 'Menyiapkan ruangmu' : 'Preparing your space'}
        </div>
      </div>
    </div>
  );
};

export default Loader;
