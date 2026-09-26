import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// Celestial page loader: a moonstone ring draws itself around a glowing ✦, the
// wordmark shimmers, and a progress line fills — then the dark overlay fades
// through to the (dark) hero for a seamless hand-off.
const Loader: React.FC<LoaderProps> = ({ ready = false, isIndonesian = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 400 : 2000;
  const mounted = useRef(Date.now());
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

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
      t = window.setTimeout(begin, 1200);
      return () => { window.removeEventListener('load', onLoad); if (t) clearTimeout(t); };
    }
    return () => { if (t) clearTimeout(t); };
  }, [ready, MIN]);

  if (gone) return null;

  return (
    <div
      aria-hidden
      onTransitionEnd={() => leaving && setGone(true)}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        background: 'radial-gradient(120% 90% at 50% 40%, #16123A 0%, #0B0B16 60%, #08060F 100%)',
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'scale(1.06)' : 'scale(1)',
      }}
    >
      {/* faint drifting stars */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 80% 25%, rgba(219,205,242,0.7), transparent), radial-gradient(1px 1px at 65% 70%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 35% 80%, rgba(219,205,242,0.5), transparent), radial-gradient(1.5px 1.5px at 50% 15%, rgba(255,255,255,0.6), transparent)',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div
        className="relative flex flex-col items-center"
        style={{ animation: reduce ? undefined : 'ldRise 0.8s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* celestial ring drawing around a glowing ✦ */}
        <div className="relative w-24 h-24 md:w-28 md:h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ animation: reduce ? undefined : 'ldSpin 9s linear infinite' }}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(198,178,228,0.18)" strokeWidth="1" />
            <circle
              cx="50" cy="50" r="44" fill="none" stroke="#C6B2E4" strokeWidth="1.5" strokeLinecap="round"
              transform="rotate(-90 50 50)"
              strokeDasharray="276.5"
              style={{ strokeDashoffset: reduce ? 0 : 276.5, animation: reduce ? undefined : 'ldDraw 2s cubic-bezier(0.16,1,0.3,1) forwards' }}
            />
            {/* small orbiting node */}
            <circle cx="50" cy="6" r="2.4" fill="#DBCDF2" />
          </svg>
          <span
            className="absolute inset-0 grid place-items-center text-moon text-2xl leading-none"
            style={{ animation: reduce ? undefined : 'ldGlow 2.6s ease-in-out infinite' }}
          >
            ✦
          </span>
        </div>

        {/* shimmering wordmark */}
        <div
          className="mt-8 text-[0.95rem] sm:text-lg font-semibold uppercase tracking-[0.36em] text-transparent"
          style={{
            backgroundImage: 'linear-gradient(100deg, rgba(230,224,248,0.35) 0%, #ffffff 20%, #DBCDF2 42%, rgba(230,224,248,0.35) 62%)',
            backgroundSize: '220% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            animation: reduce ? undefined : 'ldShimmer 2.6s linear infinite',
          }}
        >
          Mayanov&nbsp;Tarot
        </div>

        {/* progress line */}
        <div className="mt-7 h-px w-40 overflow-hidden bg-white/10">
          <div
            className="h-full w-full origin-left"
            style={{ background: 'linear-gradient(90deg, #9E86C9, #DBCDF2)', animation: `ldBar ${reduce ? '0.5s' : '2s'} cubic-bezier(0.4,0,0.2,1) forwards` }}
          />
        </div>

        {/* quiet label */}
        <div className="mt-5 text-[10px] uppercase tracking-[0.28em] text-cream/40">
          {isIndonesian ? 'Menyiapkan ruangmu' : 'Preparing your space'}
        </div>
      </div>
    </div>
  );
};

export default Loader;
