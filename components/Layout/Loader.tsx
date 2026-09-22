import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// A cosmic-wellness page loader: an orbit instrument draws itself in, a moonstone
// node circles the wordmark, a progress arc completes, then the whole overlay
// fades up to reveal the page. Shown until the page is ready + a graceful minimum.
const Loader: React.FC<LoaderProps> = ({ ready = false, isIndonesian = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 500 : 2200;              // let the animation breathe
  const mounted = useRef(Date.now());
  const [leaving, setLeaving] = useState(false); // start fade-out
  const [gone, setGone] = useState(false);       // unmount

  // Lock scroll while the loader is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Dismiss once ready + window fully loaded + minimum time elapsed.
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
      // Safety net if 'load' already passed or is slow.
      t = window.setTimeout(begin, 1200);
      return () => { window.removeEventListener('load', onLoad); if (t) clearTimeout(t); };
    }
    return () => { if (t) clearTimeout(t); };
  }, [ready, MIN]);

  if (gone) return null;

  const C = (r: number) => 2 * Math.PI * r; // circumference helper

  return (
    <div
      aria-hidden
      onTransitionEnd={() => leaving && setGone(true)}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'scale(1.06)' : 'scale(1)',
        background:
          'radial-gradient(120% 120% at 50% 30%, #1A1B40 0%, #12102E 45%, #0E0B24 100%)',
      }}
    >
      {/* faint starfield */}
      <div
        className="pointer-events-none absolute inset-0 animate-[ldTwinkle_5s_ease-in-out_infinite]"
        style={{
          backgroundImage:
            'radial-gradient(1.4px 1.4px at 20% 30%, rgba(255,255,255,0.9), transparent 60%),' +
            'radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.7), transparent 60%),' +
            'radial-gradient(1.6px 1.6px at 80% 65%, rgba(255,255,255,0.85), transparent 60%),' +
            'radial-gradient(1px 1px at 35% 75%, rgba(255,255,255,0.6), transparent 60%),' +
            'radial-gradient(1.2px 1.2px at 55% 45%, rgba(219,205,242,0.8), transparent 60%)',
          backgroundSize: '360px 360px',
        }}
      />

      {/* orbit instrument */}
      <div className="relative w-[236px] h-[236px] sm:w-[280px] sm:h-[280px]">
        <svg viewBox="0 0 300 300" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="ldMoon" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#DBCDF2" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#C6B2E4" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#C6B2E4" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* central glow — pulses */}
          <circle cx="150" cy="150" r="74" fill="url(#ldMoon)"
            style={{ transformOrigin: '150px 150px', animation: 'ldGlow 3s ease-in-out infinite' }} />

          {/* tilted orbit guide — slow spin */}
          <ellipse cx="150" cy="150" rx="104" ry="60" stroke="#C6B2E4" strokeOpacity="0.2" strokeWidth="1"
            style={{ transformOrigin: '150px 150px', animation: 'ldSpin 24s linear infinite' }} />

          {/* two rings that draw themselves in */}
          <circle cx="150" cy="150" r="60" stroke="#C6B2E4" strokeOpacity="0.4" strokeWidth="1.2"
            strokeDasharray={C(60)} strokeDashoffset={C(60)} strokeLinecap="round"
            style={{ animation: 'ldDraw 1.1s cubic-bezier(0.16,1,0.3,1) 0.15s forwards' }} />
          <circle cx="150" cy="150" r="44" stroke="#C6B2E4" strokeOpacity="0.25" strokeWidth="1"
            strokeDasharray={C(44)} strokeDashoffset={C(44)} strokeLinecap="round"
            style={{ animation: 'ldDraw 1s cubic-bezier(0.16,1,0.3,1) 0.35s forwards' }} />

          {/* dotted outer ring — very slow counter-spin */}
          <circle cx="150" cy="150" r="96" stroke="#C6B2E4" strokeOpacity="0.14" strokeWidth="1"
            strokeDasharray="2 9"
            style={{ transformOrigin: '150px 150px', animation: 'ldSpin 40s linear infinite reverse' }} />

          {/* progress arc — sweeps once around (starts at top) */}
          <g style={{ transformOrigin: '150px 150px', transform: 'rotate(-90deg)' }}>
            <circle cx="150" cy="150" r="118" stroke="#DBCDF2" strokeOpacity="0.9" strokeWidth="2"
              strokeDasharray={C(118)} strokeDashoffset={C(118)} strokeLinecap="round"
              style={{ animation: `ldDraw 2s cubic-bezier(0.4,0,0.2,1) 0.1s forwards${reduce ? '' : ''}` }} />
          </g>

          {/* orbiting moonstone node (rides the r=60 ring) */}
          <g style={{ transformOrigin: '150px 150px', animation: 'ldSpin 2.8s linear infinite' }}>
            <circle cx="150" cy="90" r="9" fill="#C6B2E4" opacity="0.3" />
            <circle cx="150" cy="90" r="4" fill="#DBCDF2" />
          </g>

          {/* centre mark */}
          <circle cx="150" cy="150" r="22" stroke="#DBCDF2" strokeOpacity="0.4" strokeWidth="1"
            style={{ transformOrigin: '150px 150px', animation: 'ldGlow 3s ease-in-out infinite' }} />
          <text x="150" y="150" textAnchor="middle" dominantBaseline="central"
            fontFamily="Syne, sans-serif" fontWeight="700" fontSize="24" fill="#F3ECFF">M</text>
        </svg>
      </div>

      {/* wordmark + progress bar */}
      <div className="relative mt-8 flex flex-col items-center" style={{ animation: reduce ? undefined : 'ldRise 0.9s cubic-bezier(0.16,1,0.3,1) 0.6s both' }}>
        <div className="flex items-center gap-3 text-[1.05rem] sm:text-xl font-serif font-bold uppercase tracking-[0.32em]">
          <span className="text-cream">Mayanov</span>
          <span className="text-moon">Tarot</span>
        </div>
        <div className="mt-4 h-px w-40 overflow-hidden bg-cream/10">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-moon-bright to-transparent origin-left"
            style={{ animation: `ldBar ${reduce ? '0.5s' : '2.1s'} cubic-bezier(0.4,0,0.2,1) forwards` }} />
        </div>
        <div className="mt-4 text-[10px] uppercase tracking-[0.34em] text-cream/40">
          {isIndonesian ? 'Menyelaraskan kartu' : 'Aligning the cards'}
        </div>
      </div>
    </div>
  );
};

export default Loader;
