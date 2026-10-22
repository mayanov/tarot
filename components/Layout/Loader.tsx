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
const STARS = 12;          // stars in the ring
const STARS_AT = 200;      // the first star lights up…
const STAR_GAP = 95;       // …then one after another round the circle
const MOON_AT = STARS_AT + STAR_GAP * STARS + 120; // ring closes → the moon blooms inside it
const MIN_MS = 2900;       // never hand off before the moon has settled a beat

// A constellation being drawn: stars light up one by one in a ring and a fine line
// joins them round; as the circle closes, the full moon blooms inside it. Then the
// ring scatters outward and the moon flies up, shrinking and waning, until it
// becomes the crescent above the hero title, while the identical sky cross-fades
// underneath.
const Loader: React.FC<LoaderProps> = ({ ready = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 500 : MIN_MS;
  const mounted = useRef(Date.now());
  const moonRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<'idle' | 'drawing' | 'moon'>(reduce ? 'moon' : 'idle');
  const [lit, setLit] = useState(reduce ? STARS : 0); // how many ring stars are lit so far
  const [heroReady, setHeroReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [flight, setFlight] = useState<string | null>(null); // moon's transform toward the hero crescent
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Stars light up one by one (the joining line follows each), then the moon blooms
  // in once the ring closes. All on the same timers, so they can never drift apart.
  useEffect(() => {
    if (reduce) return;
    const ts = [window.setTimeout(() => setStage('drawing'), STARS_AT - 120)];
    for (let i = 1; i <= STARS; i++) ts.push(window.setTimeout(() => setLit(i), STARS_AT + (i - 1) * STAR_GAP));
    ts.push(window.setTimeout(() => setStage('moon'), MOON_AT));
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
  const drawing = stage !== 'idle';
  const moonOn = stage === 'moon';
  const EASE = 'cubic-bezier(0.16,1,0.3,1)';
  const EASE_FLIGHT = 'cubic-bezier(0.65,0,0.2,1)';
  // ring geometry (SVG units; the moon fills r=50 of a 160 box)
  const R = 66;
  const ringStars = Array.from({ length: STARS }, (_, i) => {
    const a = -Math.PI / 2 + (i / STARS) * Math.PI * 2; // start at the top, go clockwise
    return { x: 80 + R * Math.cos(a), y: 80 + R * Math.sin(a), big: i % 3 === 0, a };
  });
  const CIRC = 2 * Math.PI * R;

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
        {/* soft violet bloom that warms up when the moon arrives */}
        <div aria-hidden className="absolute left-1/2 top-[43%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(140,98,196,0.32) 0%, rgba(140,98,196,0) 68%)', opacity: flying ? 0 : moonOn ? 1 : 0.3, transition: flying ? 'opacity 500ms ease' : 'opacity 1200ms ease' }} />
      </div>

      <div className="relative flex flex-col items-center">
        <div className="relative w-32 h-32 md:w-36 md:h-36">
          {/* THE CONSTELLATION — a ring of stars that light up one by one, joined by a
              fine line drawn round after them; on exit the stars scatter outward */}
          <svg
            aria-hidden
            viewBox="0 0 160 160"
            className="absolute pointer-events-none overflow-visible"
            style={{ inset: '-30%', width: '160%', height: '160%' }}
          >
            <circle
              cx="80" cy="80" r={R}
              fill="none"
              stroke="rgba(214,206,255,0.38)"
              strokeWidth="0.6"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - lit / STARS)}
              transform="rotate(-90 80 80)"
              style={{
                opacity: flying ? 0 : 1,
                transition: flying ? 'opacity 360ms ease' : `stroke-dashoffset ${STAR_GAP + 40}ms linear`,
              }}
            />
            {ringStars.map((st, i) => {
              const burst = flying ? 26 : 0;
              return (
                <g
                  key={i}
                  style={{
                    transform: `translate(${(Math.cos(st.a) * burst).toFixed(1)}px, ${(Math.sin(st.a) * burst).toFixed(1)}px)`,
                    opacity: flying ? 0 : i < lit ? 1 : 0,
                    transition: flying
                      ? `transform 700ms ${EASE}, opacity 600ms ease ${i * 18}ms`
                      : 'opacity 450ms ease',
                  }}
                >
                  <circle cx={st.x} cy={st.y} r={st.big ? 5 : 3.4} fill="rgba(220,210,255,0.22)" />
                  <circle cx={st.x} cy={st.y} r={st.big ? 1.7 : 1.1} fill="#fff" />
                </g>
              );
            })}
          </svg>

          {/* the moon — blooms into the closed ring; on exit it flies to the hero
              crescent, shrinking and waning until it IS the crescent */}
          <div
            ref={moonRef}
            className="relative w-full h-full rounded-full overflow-hidden will-change-transform"
            style={{
              transform: flying ? flight! : moonOn ? 'scale(1)' : 'scale(0.82)',
              opacity: flying ? 0 : moonOn ? 1 : 0,
              filter: moonOn || flying ? 'blur(0)' : 'blur(8px)',
              boxShadow: flying
                ? '0 0 26px 4px rgba(255,255,255,0.18)'
                : moonOn ? '0 0 110px 22px rgba(255,255,255,0.42)' : '0 0 0 0 rgba(255,255,255,0)',
              transition: flying
                ? `transform ${REVEAL_FLIGHT_MS}ms ${EASE_FLIGHT}, box-shadow ${REVEAL_FLIGHT_MS}ms ease, opacity 320ms ease ${REVEAL_FLIGHT_MS - 120}ms`
                : `opacity 900ms ease, transform 1200ms ${EASE}, filter 900ms ease, box-shadow 1400ms ease`,
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
            {/* shadow — parked off to the right while full; slides back in on the
                flight so the moon wanes into the crescent's lit-left shape */}
            <div
              className="absolute -inset-px rounded-full"
              style={{
                background: '#0d0b22',
                transform: `translateX(${flying ? 40 : 104}%)`,
                filter: 'blur(2px)',
                transition: flying ? `transform ${REVEAL_FLIGHT_MS - 150}ms cubic-bezier(0.45,0,0.2,1) 120ms` : 'none',
              }}
            />
          </div>
        </div>

        {/* wordmark + label — slip away first, so the moon carries the reveal */}
        <div
          style={{
            opacity: leaving ? 0 : drawing ? 1 : 0,
            transform: leaving && !reduce ? 'translateY(10px)' : 'none',
            filter: leaving && !reduce ? 'blur(4px)' : 'none',
            transition: leaving ? 'opacity 360ms ease, transform 420ms ease, filter 420ms ease' : 'opacity 900ms ease 300ms',
          }}
          className="flex flex-col items-center"
        >
          <div className="mt-14 flex items-baseline gap-[0.28em] text-lg sm:text-xl font-elegant font-semibold tracking-[0.02em]">
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
