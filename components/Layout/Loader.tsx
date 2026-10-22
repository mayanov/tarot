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

// Black loader: a real moon waxes from new → full (a soft shadow slides off it as
// it loads, its glow growing) and settles full for a beat. Then, instead of fading
// away, the moon itself becomes the hero: it flies up, shrinks and wanes into the
// small crescent above the title, while the sky stays put (the loader's sky is the
// page's identical sky, cross-faded underneath) and the title writes itself in.
const Loader: React.FC<LoaderProps> = ({ ready = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 500 : 2500;
  const mounted = useRef(Date.now());
  const moonRef = useRef<HTMLDivElement>(null);
  const [wax, setWax] = useState(0); // 0 = new moon, 100 = full
  const [enter, setEnter] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [flight, setFlight] = useState<string | null>(null); // moon's transform toward the hero crescent
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
  const EASE_FLIGHT = 'cubic-bezier(0.65,0,0.2,1)';

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
        {/* soft violet bloom cradling the moon, so it sits in a pool of light */}
        <div aria-hidden className="absolute left-1/2 top-[43%] h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(140,98,196,0.3) 0%, rgba(140,98,196,0) 68%)', opacity: enter && !flying ? 1 : 0, transition: flying ? 'opacity 500ms ease' : 'opacity 1100ms ease' }} />
      </div>

      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: enter ? 1 : 0,
          transform: `translateY(${!enter ? 12 : 0}px)`,
          transition: 'opacity 800ms ease, transform 900ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* the moon — a real photo, revealed as the shadow disc slides off. On exit it
            flies to the hero crescent, shrinking and waning (the shadow slides back
            in from the right) until it IS the crescent, then hands off to it. */}
        <div
          ref={moonRef}
          className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden will-change-transform"
          style={{
            transform: flying ? flight! : 'none',
            opacity: flying ? 0 : 1,
            boxShadow: flying
              ? '0 0 26px 4px rgba(255,255,255,0.18)'
              : `0 0 ${wax * 1.1}px ${wax * 0.22}px rgba(255,255,255,${0.06 + wax / 260})`,
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
          {/* the shadow — retreats right while waxing; slides back in on the flight so
              the moon wanes into the crescent's lit-left shape */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: '#181A44',
              transform: `translateX(${flying ? 40 : wax * 1.02}%)`,
              filter: 'blur(3px)',
              transition: flying ? `transform ${REVEAL_FLIGHT_MS - 150}ms cubic-bezier(0.45,0,0.2,1) 120ms` : 'none',
            }}
          />
        </div>

        {/* wordmark + label — slip away first, so the moon carries the reveal */}
        <div
          style={{
            opacity: leaving ? 0 : 1,
            transform: leaving && !reduce ? 'translateY(10px)' : 'none',
            filter: leaving && !reduce ? 'blur(4px)' : 'none',
            transition: 'opacity 360ms ease, transform 420ms ease, filter 420ms ease',
          }}
          className="flex flex-col items-center"
        >
          <div className="mt-9 flex items-baseline gap-[0.28em] text-lg sm:text-xl font-elegant font-semibold tracking-[0.02em]">
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
