import React, { useEffect, useRef, useState } from 'react';
import Background from './Background';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// How long the hand-off to the hero takes (ms). The hero times its own entrance
// against these, so keep them in sync with Hero.tsx.
export const REVEAL_FLIGHT_MS = 1150; // moon flies up and wanes into the hero crescent
const REVEAL_TOTAL_MS = 1550;         // loader fully gone

// Loader timeline (ms from mount)
const CORONA_IN = 80;    // the eclipsed moon and its corona appear straight away
const REVEAL_AT = 1150;  // …then the shadow starts sliding off
const WAX_MS = 1500;     // and uncovers the full moon
const MIN_MS = 2950;     // never hand off before the moon is full and has settled a beat

// A total eclipse: the screen opens on a dark moon ringed by a glowing corona (so it
// is never empty). The shadow slides off — a bright "diamond ring" flare where the
// light first breaks through — until the moon is full. Then the moon flies up,
// shrinking and waning, until it becomes the crescent above the hero title, while
// the identical sky cross-fades underneath.
const Loader: React.FC<LoaderProps> = ({ ready = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 500 : MIN_MS;
  const mounted = useRef(Date.now());
  const moonRef = useRef<HTMLDivElement>(null);
  const [wax, setWax] = useState(reduce ? 100 : 0); // shadow offset: 0 = eclipsed, 100 = full
  const [stage, setStage] = useState<'idle' | 'corona' | 'reveal'>(reduce ? 'reveal' : 'idle');
  const [heroReady, setHeroReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [flight, setFlight] = useState<string | null>(null); // moon's transform toward the hero crescent
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // corona appears → shadow starts sliding off
  useEffect(() => {
    if (reduce) return;
    const ts = [
      window.setTimeout(() => setStage('corona'), CORONA_IN),
      window.setTimeout(() => setStage('reveal'), REVEAL_AT),
    ];
    return () => ts.forEach(clearTimeout);
  }, [reduce]);

  // Slide the shadow off on a single rAF (no CSS transition chasing it).
  useEffect(() => {
    if (reduce || stage !== 'reveal') return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / WAX_MS, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
      setWax(eased * 100);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, reduce]);

  // Pre-decode the page's hero background so it doesn't decode on the reveal frame.
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

  // Only start the reveal once the app has resolved AND the hero image is decoded,
  // so the transition never competes with a decode/paint on its first frame.
  useEffect(() => {
    if (!ready || !heroReady) return;
    let t: number | undefined;
    const begin = () => {
      const wait = Math.max(0, MIN - (Date.now() - mounted.current));
      t = window.setTimeout(() => {
        // Aim the moon at the hero's crescent: the crescent's lit disc sits at
        // (41%, 50%) of its icon and spans 62.5% of its width (see CelestialMark).
        const from = moonRef.current?.getBoundingClientRect();
        const target = document.querySelector('[data-hero-moon] svg')?.getBoundingClientRect();
        if (from && target && !reduce) {
          const size = target.width * 0.625;
          const cx = target.left + target.width * 0.414;
          const cy = target.top + target.height * 0.5;
          const dx = cx - (from.left + from.width / 2);
          const dy = cy - (from.top + from.height / 2);
          setFlight(`translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${(size / from.width).toFixed(4)})`);
        }
        setLeaving(true);
        // tell the hero to play its entrance in step with the flight
        try { window.dispatchEvent(new CustomEvent('mt:reveal')); } catch { /* noop */ }
        window.setTimeout(() => setGone(true), reduce ? 400 : REVEAL_TOTAL_MS);
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
  }, [ready, heroReady, MIN, reduce]);

  if (gone) return null;

  const flying = leaving && !reduce && !!flight;
  const shown = stage !== 'idle';
  const revealing = stage === 'reveal';
  const EASE = 'cubic-bezier(0.16,1,0.3,1)';
  const EASE_FLIGHT = 'cubic-bezier(0.65,0,0.2,1)';
  // the "diamond ring": brightest just as the light first breaks through, then gone
  const flare = revealing ? Math.max(0, Math.sin(Math.min(wax / 22, 1) * Math.PI)) : 0;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{
        pointerEvents: leaving ? 'none' : undefined,
        // reduced motion (or no target to fly to): a simple quick fade
        opacity: leaving && !flying ? 0 : 1,
        transition: leaving && !flying ? 'opacity 380ms ease' : undefined,
      }}
    >
      {/* the hero's own night sky — identical to the page's, so it can cross-fade
          away underneath the flying moon without the stars ever jumping */}
      <div
        className="absolute inset-0"
        style={{
          background: '#0b0924',
          opacity: flying ? 0 : 1,
          transition: flying ? 'opacity 900ms cubic-bezier(0.4,0,0.2,1) 260ms' : undefined,
        }}
      >
        <Background />
        {/* soft violet bloom that warms up as the moon is uncovered */}
        <div aria-hidden className="absolute left-1/2 top-[43%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(140,98,196,0.32) 0%, rgba(140,98,196,0) 68%)', opacity: flying ? 0 : 0.35 + (wax / 100) * 0.65, transition: flying ? 'opacity 500ms ease' : undefined }} />
      </div>

      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: shown ? 1 : 0,
          transform: `scale(${shown ? 1 : 0.94})`,
          transition: `opacity 900ms ease, transform 1200ms ${EASE}`,
        }}
      >
        <div className="relative w-32 h-32 md:w-36 md:h-36">
          {/* CORONA — a soft halo plus a thin bright rim around the dark disc; it
              breathes while eclipsed, and fades as the moon's own light takes over */}
          <div
            aria-hidden
            className="absolute -inset-10 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(0,0,0,0) 38%, rgba(214,206,255,0.42) 41%, rgba(160,140,230,0.16) 50%, rgba(120,96,200,0) 66%)',
              opacity: flying ? 0 : 1 - (wax / 100) * 0.85,
              animation: !revealing && !reduce ? 'coronaBreath 2.4s ease-in-out infinite' : undefined,
              transition: flying ? 'opacity 300ms ease' : undefined,
            }}
          />
          <div
            aria-hidden
            className="absolute -inset-[3px] rounded-full pointer-events-none"
            style={{
              boxShadow: '0 0 0 1.5px rgba(240,236,255,0.85), 0 0 18px 3px rgba(220,210,255,0.55)',
              opacity: flying ? 0 : 1 - wax / 100,
            }}
          />
          {/* DIAMOND RING — a flare on the left limb where the light first breaks through */}
          <div
            aria-hidden
            className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #fff 0%, rgba(255,255,255,0.85) 22%, rgba(220,210,255,0) 70%)',
              boxShadow: '0 0 40px 14px rgba(230,222,255,0.55)',
              opacity: flare,
              transform: `scale(${0.6 + flare * 0.8})`,
            }}
          />

          {/* the moon — uncovered as the shadow slides off; on exit it flies to the
              hero crescent, shrinking and waning until it IS the crescent */}
          <div
            ref={moonRef}
            className="relative w-full h-full rounded-full overflow-hidden will-change-transform"
            style={{
              transform: flying ? flight! : 'none',
              opacity: flying ? 0 : 1,
              boxShadow: flying
                ? '0 0 26px 4px rgba(255,255,255,0.18)'
                : `0 0 ${wax * 1.1}px ${wax * 0.22}px rgba(255,255,255,${0.04 + wax / 260})`,
              transition: flying
                ? `transform ${REVEAL_FLIGHT_MS}ms ${EASE_FLIGHT}, box-shadow ${REVEAL_FLIGHT_MS}ms ease, opacity 320ms ease ${REVEAL_FLIGHT_MS - 120}ms`
                : 'none',
            }}
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
            {/* the eclipse shadow — slides off to the right; slides back in on the flight
                so the moon wanes into the crescent's lit-left shape */}
            <div
              className="absolute -inset-px rounded-full"
              style={{
                background: '#0d0b22',
                transform: `translateX(${flying ? 40 : wax * 1.04}%)`,
                filter: 'blur(2px)',
                transition: flying ? `transform ${REVEAL_FLIGHT_MS - 150}ms cubic-bezier(0.45,0,0.2,1) 120ms` : 'none',
              }}
            />
          </div>
        </div>

        {/* wordmark + label — slip away first, so the moon carries the reveal */}
        <div
          style={{
            opacity: leaving ? 0 : shown ? 1 : 0,
            transform: leaving && !reduce ? 'translateY(10px)' : 'none',
            filter: leaving && !reduce ? 'blur(4px)' : 'none',
            transition: leaving ? 'opacity 360ms ease, transform 420ms ease, filter 420ms ease' : 'opacity 900ms ease 300ms',
          }}
          className="flex flex-col items-center"
        >
          <div className="mt-10 flex items-baseline gap-[0.28em] text-lg sm:text-xl font-elegant font-semibold tracking-[0.02em]">
            <span className="text-cream">Mayanov</span>
            <span className="text-cream">Tarot</span>
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-[0.28em] text-cream/40">
            Loading
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
