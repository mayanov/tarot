import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Background from './Background';
import { stopLenis, startLenis } from '../UI/scroll';
import { PHASES as DIVIDER_PHASES } from '../UI/MoonPhaseDivider';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// How long the hand-off to the hero takes (ms). The hero times its own entrance
// against these, so keep them in sync with Hero.tsx.
export const REVEAL_FLIGHT_MS = 1150; // moon flies up and wanes into the hero crescent
const REVEAL_TOTAL_MS = 1550;         // loader fully gone
const WORDMARK_PX = 20;               // the wordmark's size while loading

// Loading is REAL: progress comes from the work the page actually waits on (fonts, the
// moon image, the location check, and the page itself). It's shown as the site's
// moon-phase divider being drawn: hairlines grow outward from the centre while seven
// small photo moons (crescent, half, gibbous, FULL, gibbous, half, crescent) brighten
// and wax into their phases, the outer pair first and the full moon last — plus a live
// percentage. At 100% the row glides into the centre and becomes the full moon, which
// then flies up and wanes into the crescent above the hero title.
const ROW_GAP_REM = 2.4;     // distance between moons in the row
const TASKS = ['fonts', 'moon', 'app', 'page'] as const;
const MIN_CLIMB_MS = 1600;   // even on a fast connection, the bar takes this long to fill (no flash)
const SETTLE_MS = 850;       // the merged full moon holds a beat before the hand-off
const TASK_TIMEOUT_MS = 6000; // never wait forever on a single task

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
  const moonRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<'idle' | 'row' | 'moon'>('idle');
  const [pct, setPct] = useState(0); // displayed progress, 0–100
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [leaving, setLeaving] = useState(false);
  const [flight, setFlight] = useState<string | null>(null); // moon's transform toward the hero crescent
  const [gone, setGone] = useState(false);

  // THE WORDMARK is drawn at the hero title's real size and position (so it stays
  // crisp) and scaled DOWN into its slot under the moon. On hand-off it simply drops
  // that transform — gliding up and growing into the exact spot of the hero title,
  // which then takes over invisibly (same font, size and position).
  const slotRef = useRef<HTMLDivElement>(null);
  const [word, setWord] = useState<null | { left: number; top: number; width: number; height: number; fontSize: string; rest: string }>(null);
  const leavingRef = useRef(false);
  useLayoutEffect(() => {
    const measure = () => {
      if (leavingRef.current) return;
      const title = document.querySelector<HTMLElement>('[data-hero-title]');
      const slot = slotRef.current;
      if (!title || !slot) return;
      const r = title.getBoundingClientRect();
      const sr = slot.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(title).fontSize) || 32;
      const dx = sr.left + sr.width / 2 - (r.left + r.width / 2);
      const dy = sr.top + sr.height / 2 - (r.top + r.height / 2);
      setWord({
        left: r.left, top: r.top, width: r.width, height: r.height, fontSize: `${fs}px`,
        rest: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${(WORDMARK_PX / fs).toFixed(4)})`,
      });
    };
    measure();
    // web fonts can change the title's size after first paint — re-measure then too
    (document as any).fonts?.ready?.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // The page must not scroll while loading. Native overflow:hidden isn't enough: the
  // smooth-scroll library (Lenis) starts right after this and drives the scroll itself.
  // So: pause Lenis, block wheel / touch / keyboard scrolling, keep the page pinned at
  // the top — and release it all the moment the hand-off begins.
  useEffect(() => {
    if (leaving) return;
    const html = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = html.style.overflow;
    document.body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    const block = (e: Event) => { e.preventDefault(); stopLenis(); };
    const KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);
    const onKey = (e: KeyboardEvent) => { if (KEYS.has(e.key)) e.preventDefault(); };
    const opts: AddEventListenerOptions = { passive: false, capture: true };
    window.addEventListener('wheel', block, opts);
    window.addEventListener('touchmove', block, opts);
    window.addEventListener('keydown', onKey, opts);
    const pause = window.setTimeout(() => { stopLenis(); window.scrollTo(0, 0); }, 0); // after Lenis starts
    return () => {
      clearTimeout(pause);
      window.removeEventListener('wheel', block, opts);
      window.removeEventListener('touchmove', block, opts);
      window.removeEventListener('keydown', onKey, opts);
      document.body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
      startLenis();
    };
  }, [leaving]);

  // ---- the real loading tasks ----
  const mark = (task: string) => setDone((d) => (d[task] ? d : { ...d, [task]: true }));
  useEffect(() => {
    let cancelled = false;
    const safe = (task: string) => () => { if (!cancelled) mark(task); };
    const timers = TASKS.map((task) => window.setTimeout(safe(task), TASK_TIMEOUT_MS));
    // fonts (the title's size depends on them)
    const fonts = (document as any).fonts;
    if (fonts?.ready) fonts.ready.then(safe('fonts')).catch(safe('fonts')); else safe('fonts')();
    // images: ready once downloaded (the real wait); also decode them in the background
    // so nothing decodes on the reveal frame — but don't wait on decode(), which some
    // browsers hold back in background tabs
    const decode = (src: string, task: string) => {
      const img = new Image();
      img.onload = () => { safe(task)(); if (typeof img.decode === 'function') img.decode().catch(() => {}); };
      img.onerror = safe(task);
      img.src = src;
      if (img.complete && img.naturalWidth) safe(task)();
    };
    decode(MOON_IMG, 'moon');
    // the page itself (scripts, styles, images in the document)
    if (document.readyState === 'complete') safe('page')();
    else window.addEventListener('load', safe('page'), { once: true });
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, []);
  // the app's own startup (location check) — passed in as `ready`
  useEffect(() => { if (ready) mark('app'); }, [ready]);

  const doneCount = TASKS.filter((t) => done[t]).length;
  const doneRef = useRef(0);
  doneRef.current = doneCount;
  const lastDoneAt = useRef(performance.now());
  useEffect(() => { lastDoneAt.current = performance.now(); }, [doneCount]);

  // ---- the progress bar: eases toward what's actually finished ----
  // It can't fill faster than MIN_CLIMB_MS, never passes the work that's done (it only
  // creeps a little into the next step while waiting, so it never looks frozen), and
  // never shows 100% until everything has finished.
  useEffect(() => {
    const climb = reduce ? 1 : MIN_CLIMB_MS;
    const t0 = performance.now();
    let shown = 0;
    setStage('row');
    // a ~30fps timer rather than rAF, so progress keeps moving even in a background tab
    const tick = () => {
      const now = performance.now();
      const real = doneRef.current / TASKS.length;
      const allDone = real >= 1;
      const timeCap = Math.min(1, (now - t0) / climb) * 100;
      const creep = allDone ? 0 : 12 * (1 - Math.exp(-(now - lastDoneAt.current) / 1800));
      const target = Math.min(timeCap, allDone ? 100 : Math.min(99, real * 100 + creep));
      shown += (target - shown) * (reduce ? 1 : 0.16);
      if (allDone && timeCap >= 100 && shown > 99.4) shown = 100;
      setPct(shown);
      if (shown >= 100) { clearInterval(iv); setStage('moon'); }
    };
    const iv = window.setInterval(tick, 33);
    return () => clearInterval(iv);
  }, [reduce]);

  // ---- the hand-off: only once loading reached 100% and the full moon has settled ----
  useEffect(() => {
    if (stage !== 'moon') return;
    const t = window.setTimeout(() => {
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
      leavingRef.current = true;
      setLeaving(true);
      // tell the hero to play its entrance in step with the flight
      try { window.dispatchEvent(new CustomEvent('mt:reveal')); } catch { /* noop */ }
      window.setTimeout(() => setGone(true), reduce ? 400 : REVEAL_TOTAL_MS);
    }, reduce ? 0 : SETTLE_MS);
    return () => clearTimeout(t);
  }, [stage, reduce]);

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
          {/* THE DIVIDER — hairlines drawn outward with progress, and the row of moons
              waxing pair by pair (outer pair first, full moon last); at 100% the
              row glides into the centre and dissolves into the full moon */}
          {(['left', 'right'] as const).map((side) => (
            <span
              key={side}
              className="absolute top-1/2 h-px"
              style={{
                [side === 'left' ? 'right' : 'left']: `calc(50% + ${(ROW_GAP_REM * 3.5).toFixed(2)}rem)`,
                width: merged || flying ? 0 : `${(Math.min(pct, 100) / 100) * 24}vw`,
                background: `linear-gradient(to ${side}, rgba(201,184,232,0.45), rgba(201,184,232,0))`,
                opacity: showing ? 1 : 0,
                transition: merged || flying ? 'width 600ms ease, opacity 600ms ease' : 'opacity 600ms ease',
              } as React.CSSProperties}
            />
          ))}
          {DIVIDER_PHASES.map((ph, i) => {
            const slot = i - (DIVIDER_PHASES.length - 1) / 2; // -3 … 3
            const ring = 3 - Math.abs(slot);                  // 0 = outer pair … 3 = full moon
            const fill = Math.max(0, Math.min(1, (pct - ring * 25) / 25)); // this pair's share of the progress
            const center = slot === 0;
            const on = fill >= 1;
            return (
              <div
                key={i}
                className={`absolute left-1/2 top-1/2 rounded-full overflow-hidden ${center ? 'w-8 h-8 md:w-9 md:h-9' : 'w-6 h-6 md:w-7 md:h-7'}`}
                style={{
                  transform: `translate(-50%, -50%) translateX(${merged || flying ? 0 : slot * ROW_GAP_REM}rem) scale(${merged || flying ? 1.6 : 0.86 + fill * 0.14}) ${ph.waning ? 'scaleX(-1)' : ''}`,
                  opacity: merged || flying ? 0 : !showing ? 0 : 0.2 + fill * 0.8,
                  boxShadow: on ? '0 0 16px 2px rgba(255,255,255,0.28)' : 'none',
                  transition: merged || flying
                    ? `transform 900ms ${EASE} ${Math.abs(slot) * 40}ms, opacity 700ms ease ${180 + Math.abs(slot) * 40}ms`
                    : 'box-shadow 600ms ease',
                }}
              >
                {/* a real moon photo, waxing from new to its own phase as its share fills
                    (waning moons are mirrored so their lit side faces the other way) */}
                <Face offset={ph.p * fill * 104} />
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

        {/* wordmark slot (the real wordmark is the fixed layer below) + the label */}
        <div ref={slotRef} className="mt-10 h-[1.35rem] w-44 grid place-items-center">
          {!word && (
            <span className="font-serif font-medium uppercase whitespace-nowrap tracking-[-0.01em] text-cream" style={{ fontSize: WORDMARK_PX, opacity: showing && !leaving ? 1 : 0, transition: 'opacity 700ms ease' }}>Mayanov Tarot</span>
          )}
        </div>
        <div
          className="mt-3 text-[11px] uppercase tracking-[0.28em] text-cream/40"
          style={{ opacity: leaving ? 0 : showing ? 1 : 0, transition: leaving ? 'opacity 300ms ease' : 'opacity 900ms ease 300ms' }}
        >
          Loading <span className="tabular-nums text-cream/60">{Math.floor(pct)}%</span>
        </div>
      </div>

      {/* THE WORDMARK — sits at the hero title's exact size and spot, scaled down into
          its slot; on hand-off it glides up and grows into the hero title */}
      {word && (
        <div
          className="fixed flex items-center justify-center font-serif font-medium uppercase whitespace-nowrap leading-[0.95] tracking-[-0.01em] text-cream [text-shadow:0_8px_60px_rgba(6,4,14,0.5)] will-change-transform"
          style={{
            left: word.left, top: word.top, width: word.width, height: word.height, fontSize: word.fontSize,
            transformOrigin: '50% 50%',
            transform: flying ? 'none' : word.rest,
            opacity: flying ? 0 : leaving ? 0 : showing ? 1 : 0,
            transition: flying
              ? `transform ${REVEAL_FLIGHT_MS}ms cubic-bezier(0.65,0,0.2,1) 40ms, opacity 240ms ease ${REVEAL_FLIGHT_MS + 40}ms`
              : leaving ? 'opacity 300ms ease' : 'opacity 900ms ease 300ms',
          }}
        >
          Mayanov Tarot
        </div>
      )}
    </div>
  );
};

export default Loader;
