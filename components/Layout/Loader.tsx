import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// Black loader: a real moon waxes from new → full (a soft shadow slides off it as
// it loads, its glow growing), then the whole night scene collapses inward into
// the moon while zooming slightly toward the viewer, and the page emerges around
// it — a "pull into the moon" reveal.
const Loader: React.FC<LoaderProps> = ({ ready = false, isIndonesian = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 500 : 2400;
  const mounted = useRef(Date.now());
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Count 0 → 100 (eased) over the minimum, driving the moon's waxing.
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

  // how far the shadow disc has slid off the moon (0 = new moon, 100 = full)
  const wax = pct;

  return (
    <div
      aria-hidden
      onTransitionEnd={(e) => { if (leaving && e.propertyName === 'clip-path') setGone(true); }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: '#000000',
        clipPath: leaving ? 'circle(0% at 50% 43%)' : 'circle(150% at 50% 43%)',
        transform: leaving ? 'scale(1.12)' : 'scale(1)',
        transition: 'clip-path 1100ms cubic-bezier(0.83,0,0.17,1), transform 1200ms cubic-bezier(0.83,0,0.17,1)',
        willChange: 'clip-path, transform',
      }}
    >
      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving ? 'scale(1.06)' : 'scale(1)',
          transition: 'opacity 720ms ease, transform 900ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* the moon — a real photo, revealed as the shadow disc slides off */}
        <div
          className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden"
          style={{ boxShadow: `0 0 ${wax * 1.1}px ${wax * 0.22}px rgba(198,178,228,${0.06 + wax / 260})` }}
        >
          <img
            src={`${import.meta.env.BASE_URL}moon.jpg`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scale(1.04)' }}
            draggable={false}
          />
          {/* faint moonstone tint so the grey moon reads on-brand */}
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(70% 70% at 42% 38%, rgba(219,205,242,0.14) 0%, transparent 70%)', mixBlendMode: 'screen' }} />
          {/* the shadow that retreats to the right, waxing the moon (soft terminator) */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: '#000000',
              transform: `translateX(${wax * 1.02}%)`,
              filter: 'blur(2px)',
              transition: reduce ? undefined : 'transform 120ms linear',
            }}
          />
        </div>

        {/* wordmark */}
        <div className="mt-9 flex items-baseline gap-[0.28em] text-lg sm:text-xl font-elegant font-semibold tracking-[0.02em]">
          <span className="text-cream">Mayanov</span>
          <span className="text-moon">Tarot</span>
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
