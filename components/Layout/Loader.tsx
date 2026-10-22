import React, { useEffect, useRef, useState } from 'react';
import Background from './Background';
import CelestialMark from '../UI/CelestialMark';

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
const CARD_IN = 80;      // the card back drifts in
const FLIP_AT = 950;     // …turns over
const FLIP_MS = 900;
const MOON_AT = FLIP_AT + FLIP_MS * 0.55; // the moon appears on the card face as it comes round
const WAX_MS = 1150;     // and waxes from crescent to full
const MIN_MS = 2900;     // never hand off before the moon is full and has settled a beat

// A tarot reading in miniature: a card is dealt face-down, turns over to reveal
// "The Moon" (XVIII), and the moon waxes full on it. Then the moon lifts off the card
// and flies up, shrinking and waning, until it becomes the crescent above the hero
// title — while the card dissolves and the identical sky cross-fades underneath.
const Loader: React.FC<LoaderProps> = ({ ready = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 500 : MIN_MS;
  const mounted = useRef(Date.now());
  const moonRef = useRef<HTMLDivElement>(null);
  const [wax, setWax] = useState(reduce ? 100 : 30); // shadow offset: 30 = crescent, 100 = full
  const [stage, setStage] = useState<'idle' | 'in' | 'flipped' | 'moon'>(reduce ? 'moon' : 'idle');
  const [heroReady, setHeroReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [flight, setFlight] = useState<string | null>(null); // moon's transform toward the hero crescent
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // deal → flip → moon appears
  useEffect(() => {
    if (reduce) return;
    const ts = [
      window.setTimeout(() => setStage('in'), CARD_IN),
      window.setTimeout(() => setStage('flipped'), FLIP_AT),
      window.setTimeout(() => setStage('moon'), MOON_AT),
    ];
    return () => ts.forEach(clearTimeout);
  }, [reduce]);

  // Wax the moon on a single rAF once it's on the card (no CSS transition chasing it).
  useEffect(() => {
    if (reduce || stage !== 'moon') return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / WAX_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic — slows softly into full
      setWax(30 + eased * 70);
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
  const dealt = stage !== 'idle';
  const flipped = stage === 'flipped' || stage === 'moon';
  const moonOn = stage === 'moon';
  const EASE = 'cubic-bezier(0.16,1,0.3,1)';
  const EASE_FLIGHT = 'cubic-bezier(0.65,0,0.2,1)';
  const GOLD = 'rgba(214,190,140,0.75)';

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
        {/* soft violet bloom behind the card */}
        <div aria-hidden className="absolute left-1/2 top-[45%] h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(140,98,196,0.3) 0%, rgba(140,98,196,0) 68%)', opacity: moonOn && !flying ? 1 : 0.4, transition: 'opacity 1200ms ease' }} />
      </div>

      <div className="relative flex flex-col items-center">
        {/* THE CARD — dealt face-down, then turned over. The moon is a separate layer
            on top (so it can fly off the card without being clipped by it). */}
        <div className="relative w-[9.25rem] md:w-[10.5rem] aspect-[5/8]">
          <div
            className="absolute inset-0 [perspective:1400px]"
            style={{
              opacity: flying ? 0 : dealt ? 1 : 0,
              transform: flying ? 'translateY(10px) scale(0.94)' : dealt ? 'translateY(0)' : 'translateY(26px) scale(0.96)',
              filter: flying ? 'blur(6px)' : 'none',
              transition: flying
                ? 'opacity 520ms ease 80ms, transform 700ms ease, filter 600ms ease 80ms'
                : `opacity 700ms ease, transform 900ms ${EASE}`,
            }}
          >
            <div
              className="relative h-full w-full [transform-style:preserve-3d]"
              style={{
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: reduce ? 'none' : `transform ${FLIP_MS}ms cubic-bezier(0.7,0,0.25,1)`,
              }}
            >
              {/* back — plum with a starry wash, a fine gold frame and a central star */}
              <div
                className="absolute inset-0 [backface-visibility:hidden] overflow-hidden rounded-[0.9rem] ring-1 ring-white/15 [box-shadow:0_30px_70px_-30px_rgba(6,4,20,0.9)]"
                style={{ background: 'radial-gradient(135% 120% at 15% -15%, #553172 0%, #39234E 52%, #20132f 100%)' }}
              >
                <div aria-hidden className="absolute inset-[0.5rem] rounded-[0.6rem] border" style={{ borderColor: GOLD }} />
                <div aria-hidden className="absolute inset-[0.8rem] rounded-[0.45rem] border border-white/10" />
                <div className="absolute inset-0 grid place-items-center" style={{ color: GOLD }}>
                  <CelestialMark name="star" className="w-12" />
                </div>
                <CelestialMark name="sparkle" className="absolute left-1/2 top-[14%] -translate-x-1/2 w-3 text-white/40" />
                <CelestialMark name="sparkle" className="absolute left-1/2 bottom-[14%] -translate-x-1/2 w-3 text-white/40" />
              </div>

              {/* face — "The Moon" (XVIII): deep night, gold frame, numeral and name */}
              <div
                className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden rounded-[0.9rem] ring-1 ring-white/15 [box-shadow:0_30px_70px_-30px_rgba(6,4,20,0.9)]"
                style={{ background: 'radial-gradient(120% 90% at 50% 40%, #241f52 0%, #141233 60%, #0d0b25 100%)' }}
              >
                <div aria-hidden className="absolute inset-[0.5rem] rounded-[0.6rem] border" style={{ borderColor: GOLD }} />
                <span className="absolute inset-x-0 top-[0.95rem] text-center font-elegant italic text-[13px] tracking-[0.2em]" style={{ color: GOLD }}>XVIII</span>
                <span className="absolute inset-x-0 bottom-[0.95rem] text-center text-[9px] font-medium tracking-[0.34em] uppercase" style={{ color: GOLD }}>The Moon</span>
              </div>
            </div>
          </div>

          {/* the moon — sits in the middle of the card face; waxes to full, then on exit
              flies to the hero crescent, shrinking and waning until it IS the crescent */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div
              ref={moonRef}
              className="relative w-[5.25rem] h-[5.25rem] md:w-24 md:h-24 rounded-full overflow-hidden will-change-transform"
              style={{
                transform: flying ? flight! : moonOn ? 'scale(1)' : 'scale(0.85)',
                opacity: flying ? 0 : moonOn ? 1 : 0,
                boxShadow: flying
                  ? '0 0 26px 4px rgba(255,255,255,0.18)'
                  : `0 0 ${wax * 0.7}px ${wax * 0.12}px rgba(255,255,255,${0.05 + wax / 380})`,
                transition: flying
                  ? `transform ${REVEAL_FLIGHT_MS}ms ${EASE_FLIGHT}, box-shadow ${REVEAL_FLIGHT_MS}ms ease, opacity 320ms ease ${REVEAL_FLIGHT_MS - 120}ms`
                  : `opacity 600ms ease, transform 900ms ${EASE}`,
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
                  background: '#141233',
                  transform: `translateX(${flying ? 40 : wax * 1.02}%)`,
                  filter: 'blur(3px)',
                  transition: flying ? `transform ${REVEAL_FLIGHT_MS - 150}ms cubic-bezier(0.45,0,0.2,1) 120ms` : 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* wordmark + label — slip away first, so the moon carries the reveal */}
        <div
          style={{
            opacity: leaving ? 0 : dealt ? 1 : 0,
            transform: leaving && !reduce ? 'translateY(10px)' : 'none',
            filter: leaving && !reduce ? 'blur(4px)' : 'none',
            transition: leaving ? 'opacity 360ms ease, transform 420ms ease, filter 420ms ease' : 'opacity 900ms ease 300ms',
          }}
          className="flex flex-col items-center"
        >
          <div className="mt-8 flex items-baseline gap-[0.28em] text-lg sm:text-xl font-elegant font-semibold tracking-[0.02em]">
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
