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
const PHASES = [0, 26, 52, 78, 104];  // shadow offset per phase: new → crescent → half → gibbous → full
const PHASE_AT = 220;      // the first phase lights up…
const PHASE_GAP = 300;     // …then the next, like a progress bar
const MERGE_AT = PHASE_AT + PHASE_GAP * PHASES.length + 150; // they glide together into one full moon
const MIN_MS = 2950;       // never hand off before the moon has settled a beat

// The lunar cycle as a progress bar: five small moons — new, crescent, half, gibbous,
// full — light up one after another, then glide together and merge into one full
// moon. That moon then flies up, shrinking and waning, until it becomes the crescent
// above the hero title, while the identical sky cross-fades underneath.
// One moon face with its shadow parked at `offset` (0 = new, 104 = full). Defined
// outside Loader so re-renders don't remount it (that would skip the shadow's slide).
const MOON_IMG = `${import.meta.env.BASE_URL}moon.jpg`;
const Face: React.FC<{ offset: number; shadowStyle?: React.CSSProperties }> = ({ offset, shadowStyle }) => (
  <>
    <img src={MOON_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scale(1.06)' }} draggable={false} />
    <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(70% 70% at 42% 38%, rgba(107,63,160,0.16) 0%, transparent 70%)', mixBlendMode: 'screen' }} />
    <div className="absolute -inset-px rounded-full" style={{ background: '#0d0b22', transform: `translateX(${offset}%)`, filter: 'blur(1.5px)', ...shadowStyle }} />
  </>
);

const Loader: React.FC<LoaderProps> = ({ ready = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 500 : MIN_MS;
  const mounted = useRef(Date.now());
  const moonRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<'idle' | 'row' | 'moon'>(reduce ? 'moon' : 'idle');
  const [lit, setLit] = useState(reduce ? PHASES.length : 0); // how many phases are lit so far
  const [heroReady, setHeroReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [flight, setFlight] = useState<string | null>(null); // moon's transform toward the hero crescent
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // The phases light up one by one, then merge into the full moon — all on the same
  // timers, so they can never drift apart.
  useEffect(() => {
    if (reduce) return;
    const ts = [window.setTimeout(() => setStage('row'), PHASE_AT - 160)];
    PHASES.forEach((_, i) => ts.push(window.setTimeout(() => setLit(i + 1), PHASE_AT + i * PHASE_GAP)));
    ts.push(window.setTimeout(() => setStage('moon'), MERGE_AT));
    return () => ts.forEach(clearTimeout);
  }, [reduce]);

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
  const showing = stage !== 'idle';
  const merged = stage === 'moon';
  const EASE = 'cubic-bezier(0.16,1,0.3,1)';
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
        {/* soft violet bloom that warms up when the full moon forms */}
        <div aria-hidden className="absolute left-1/2 top-[43%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(140,98,196,0.32) 0%, rgba(140,98,196,0) 68%)', opacity: flying ? 0 : merged ? 1 : 0.3, transition: flying ? 'opacity 500ms ease' : 'opacity 1200ms ease' }} />
      </div>

      <div className="relative flex flex-col items-center">
        <div className="relative w-32 h-32 md:w-36 md:h-36">
          {/* THE PHASES — a row of small moons across the middle that light up in turn
              (a progress bar), then glide into the centre and dissolve into the full moon */}
          {PHASES.map((offset, i) => {
            const slot = i - (PHASES.length - 1) / 2; // -2 … 2
            const on = i < lit;
            return (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 w-7 h-7 md:w-8 md:h-8 -ml-3.5 -mt-3.5 md:-ml-4 md:-mt-4 rounded-full overflow-hidden"
                style={{
                  transform: merged || flying ? 'translateX(0) scale(1.6)' : `translateX(${slot * 2.9}rem) scale(${on ? 1 : 0.86})`,
                  opacity: merged || flying ? 0 : !showing ? 0 : on ? 1 : 0.22,
                  boxShadow: on ? '0 0 16px 2px rgba(255,255,255,0.28)' : 'none',
                  transition: merged || flying
                    ? `transform 900ms ${EASE} ${Math.abs(slot) * 40}ms, opacity 700ms ease ${180 + Math.abs(slot) * 40}ms`
                    : `opacity 500ms ease, transform 600ms ${EASE}, box-shadow 600ms ease`,
                }}
              >
                <Face offset={offset} />
              </div>
            );
          })}

          {/* the full moon — forms as the phases merge; on exit it flies to the hero
              crescent, shrinking and waning until it IS the crescent */}
          <div
            ref={moonRef}
            className="relative w-full h-full rounded-full overflow-hidden will-change-transform"
            style={{
              transform: flying ? flight! : merged ? 'scale(1)' : 'scale(0.25)',
              opacity: flying ? 0 : merged ? 1 : 0,
              boxShadow: flying
                ? '0 0 26px 4px rgba(255,255,255,0.18)'
                : merged ? '0 0 110px 22px rgba(255,255,255,0.42)' : '0 0 0 0 rgba(255,255,255,0)',
              transition: flying
                ? `transform ${REVEAL_FLIGHT_MS}ms ${EASE_FLIGHT}, box-shadow ${REVEAL_FLIGHT_MS}ms ease, opacity 320ms ease ${REVEAL_FLIGHT_MS - 120}ms`
                : `opacity 700ms ease 120ms, transform 1100ms ${EASE}, box-shadow 1400ms ease`,
            }}
          >
            <Face
              offset={flying ? 40 : 104}
              shadowStyle={{ filter: 'blur(2px)', transition: flying ? `transform ${REVEAL_FLIGHT_MS - 150}ms cubic-bezier(0.45,0,0.2,1) 120ms` : 'none' }}
            />
          </div>
        </div>

        {/* wordmark + label — slip away first, so the moon carries the reveal */}
        <div
          style={{
            opacity: leaving ? 0 : showing ? 1 : 0,
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
