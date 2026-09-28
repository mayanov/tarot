import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// Light loader with a real moon + a progress ring that draws around it; on
// hand-off the light overlay lifts away (curved bottom) to unveil the dark
// starry hero — a bright→night "curtain reveal" for a wow moment.
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

  // Count 0 → 100 (eased) over the minimum, driving the ring.
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

  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div
      aria-hidden
      onTransitionEnd={(e) => { if (leaving && e.propertyName === 'transform') setGone(true); }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #F6F2FB 0%, #ECE7F6 100%)',
        transform: leaving ? 'translateY(-100%)' : 'translateY(0)',
        borderBottomLeftRadius: leaving ? '50% 14%' : '0',
        borderBottomRightRadius: leaving ? '50% 14%' : '0',
        transition: 'transform 1050ms cubic-bezier(0.76,0,0.24,1), border-radius 1050ms cubic-bezier(0.76,0,0.24,1)',
        willChange: 'transform',
      }}
    >
      {/* content — fades/rises out just before the curtain lifts */}
      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving ? 'translateY(-24px)' : 'translateY(0)',
          transition: 'opacity 500ms ease, transform 600ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* moon + progress ring */}
        <div className="relative w-32 h-32 md:w-36 md:h-36">
          {/* progress ring */}
          <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(57,35,78,0.12)" strokeWidth="1.5" />
            <circle
              cx="60" cy="60" r={R} fill="none" stroke="#9E86C9" strokeWidth="1.5" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
            />
          </svg>
          {/* real moon, cropped to a clean disc */}
          <div
            className="absolute inset-[14px] rounded-full shadow-[0_10px_40px_-8px_rgba(57,35,78,0.35)]"
            style={{
              backgroundImage: `url(${import.meta.env.BASE_URL}moon.jpg)`,
              backgroundSize: '158%',
              backgroundPosition: 'center',
              animation: reduce ? undefined : 'ldSpin 60s linear infinite',
            }}
          />
        </div>

        {/* wordmark */}
        <div className="mt-8 flex items-baseline gap-[0.28em] text-lg sm:text-xl font-elegant font-semibold tracking-[0.02em]">
          <span className="text-ink">Mayanov</span>
          <span className="text-moon-deep">Tarot</span>
        </div>

        {/* count + label */}
        <div className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-ink/45">
          <span className="tabular-nums text-ink/70">{pct.toString().padStart(3, '0')}</span>
          <span className="w-px h-3 bg-ink/20" />
          <span>{isIndonesian ? 'Menyiapkan ruangmu' : 'Preparing your space'}</span>
        </div>
      </div>
    </div>
  );
};

export default Loader;
