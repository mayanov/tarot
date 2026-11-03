import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { stopLenis, startLenis } from '../UI/scroll';
import { PHASES } from '../UI/MoonPhaseDivider';
import PencilRule from '../UI/PencilRule';
import CelestialMark from '../UI/CelestialMark';
import { skyPainted, TWILIGHT } from './WatercolorSky';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// The loader is the hero itself, before the rest of it has come in: it's drawn straight
// over the hero's own night sky (nothing of its own behind it, so there's no second sky
// to swap for the real one; the header and the WhatsApp button wait, see .boot-hide),
// the name already in its place as the hero's title (same type, same spot), and where
// the hero's crescent will be, the moon-phase divider pencilled on in cream as the page
// loads, the rules drawn outward and the moons outlined and shaded in pair by pair (the
// outer pair first, the full moon last, right where the crescent goes). Once everything
// is in, nothing moves: the rest of the divider fades, the full moon wanes into the
// crescent where it is, and the hero's words come in under the title.
//
// The sky runs a timelapse while it loads: it opens on a sunset (peach and rose under
// indigo), which gives way to a violet dusk, which gives way to the hero's own
// twilight, while the clouds sail across and slow to a stop. The three skies share
// one set of clouds; the sunset and dusk are laid over the hero's sky and thin away in
// turn, so by the hand-off only the hero's own sky is left, at rest, and nothing is
// swapped.

// The hand-off's timing (ms). The hero and About time their entrances against these.
const CLEAR_MS = 1300;                // the drawing fades from the sky
const CARRY_DELAY_MS = 200;           // the moon lifts off as the drawing starts to fade
const CARRY_MS = 1150;                // the moon reaches the hero's crescent
// when the moon has landed (from mt:reveal): the hero's crescent takes over then
export const REVEAL_FLIGHT_MS = CARRY_DELAY_MS + CARRY_MS;
// Scrolling stays locked until the hero's entrance (and the About sheet rising under
// it) has finished, so an early scroll can't catch the page mid-animation.
const SCROLL_UNLOCK_MS = REVEAL_FLIGHT_MS + 1400;

// Loading is REAL: progress comes from the work the page actually waits on.
const TASKS = ['fonts', 'paper', 'sky', 'app', 'page'] as const;
const MIN_CLIMB_MS = 1600;    // even on a fast connection the drawing takes this long (no flash)
const SETTLE_MS = 450;        // the finished drawing (at 100%) holds a beat before the hand-off
const TASK_TIMEOUT_MS = 6000; // never wait forever on a single task
const PAPER_IMG = `${import.meta.env.BASE_URL}paper.webp`;
// The timelapse: once the skies are in, sunset turns to dusk and dusk to the hero's
// twilight over this long (the hand-off waits for it, so it's always seen through)
const DUSK_MS = 2600;
// the sunset and the dusk (WatercolorSky's SUNRISE and DUSK, painted as clear skies so
// their clouds are the hero's own, in the same places: only the light changes), painted
// ahead of time so they're there from the first frame (index.html preloads them and
// shows the sunset before the scripts run)
const SUNSET_IMG = `${import.meta.env.BASE_URL}sky-sunset.webp`;
const DUSK_IMG = `${import.meta.env.BASE_URL}sky-dusk.webp`;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// the clouds' drift across the timelapse: easing in, then slowing to a stop just where
// the hero's sky sits (every sky painting, the hero's included, moves together, so the
// clouds carry on through the colour changes; index.html starts the sunset at
// drift(0)). Sideways only, within the 6% each painting overhangs its frame, so there's
// no zoom; and as `translate`, so it adds to the hero sky's own slow drift (transform).
const drift = (d: number) => {
  const k = 1 - smooth(0, 1, d);
  return k < 0.0005 ? '' : `${(-5 * k).toFixed(3)}vw 0`;
};

// One moon pencilled in: its outline drawn round as `draw` goes 0 → 1, then its lit part
// shaded in. Same geometry as the divider's Phase (MoonPhaseDivider).
const DrawnPhase: React.FC<{ p: number; waning?: boolean; size: number; draw: number }> = ({ p, waning = false, size, draw }) => {
  const r = 7, c = 8;
  const rx = Math.abs(1 - 2 * p) * r;
  const lit = `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} A ${rx} ${r} 0 0 ${p > 0.5 ? 1 : 0} ${c} ${c - r} Z`;
  const outline = Math.min(1, draw / 0.6);         // the first 60%: the outline
  const shade = Math.max(0, (draw - 0.5) / 0.5);    // then the shading
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} className="shrink-0 overflow-visible" style={waning ? { transform: 'scaleX(-1)' } : undefined}>
      <circle
        cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeOpacity={0.55} strokeWidth={0.9}
        pathLength={1} strokeDasharray="1" strokeDashoffset={1 - outline}
        transform={`rotate(-90 ${c} ${c})`} strokeLinecap="round"
      />
      {p >= 1
        ? <circle cx={c} cy={c} r={r} fill="currentColor" opacity={shade} />
        : <path d={lit} fill="currentColor" opacity={shade} />}
    </svg>
  );
};

const Loader: React.FC<LoaderProps> = ({ ready = false, isIndonesian = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(false);      // the drawing has started
  const [pct, setPct] = useState(0);              // progress, 0–100
  const [complete, setComplete] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [unlocked, setUnlocked] = useState(false); // page may scroll again
  const [eveningAt, setEveningAt] = useState<number | null>(null); // the skies are in
  const [dusk, setDusk] = useState(reduce ? 1 : 0); // the timelapse, 0 (sunset) → 1 (twilight)

  // The page must not scroll while loading. Native overflow:hidden isn't enough: the
  // smooth-scroll library (Lenis) starts right after this and drives the scroll itself.
  // So: pause Lenis, block wheel / touch / keyboard scrolling, keep the page pinned at
  // the top — and release it all once the hero has finished its entrance.
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => setUnlocked(true), reduce ? 0 : SCROLL_UNLOCK_MS);
    return () => clearTimeout(t);
  }, [leaving, reduce]);
  useEffect(() => {
    if (unlocked) return;
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
  }, [unlocked]);
  // tell the page scrolling is free again (runs after the lock above is released), so
  // App can take a held #section link there
  useEffect(() => {
    if (unlocked) window.dispatchEvent(new CustomEvent('mt:unlocked'));
  }, [unlocked]);

  // ---- the real loading tasks ----
  const mark = (task: string) => setDone((d) => (d[task] ? d : { ...d, [task]: true }));
  useEffect(() => {
    let cancelled = false;
    const safe = (task: string) => () => { if (!cancelled) mark(task); };
    const timers = TASKS.map((task) => window.setTimeout(safe(task), TASK_TIMEOUT_MS));
    // fonts (the hero title's size depends on them)
    const fonts = (document as any).fonts;
    if (fonts?.ready) fonts.ready.then(safe('fonts')).catch(safe('fonts')); else safe('fonts')();
    // the paper's grain: every light section under the hero is printed on it
    const img = new Image();
    img.onload = safe('paper');
    img.onerror = safe('paper');
    img.src = PAPER_IMG;
    if (img.complete && img.naturalWidth) safe('paper')();
    // the hero's watercolour sky: painted first thing (it holds the main thread for a
    // moment, which on a phone would show as a hitch if it landed mid-drawing)
    const twilight = skyPainted(TWILIGHT);
    twilight.then(safe('sky'), safe('sky'));
    // night starts falling once all three skies are in
    const load = (src: string) => new Promise<void>((r) => {
      const e = new Image();
      e.onload = e.onerror = () => r();
      e.src = src;
    });
    Promise.all([load(SUNSET_IMG), load(DUSK_IMG), twilight.catch(() => {})]).then(() => { if (!cancelled) setEveningAt(performance.now()); });
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

  // ---- progress: eases toward what's actually finished ----
  // It can't fill faster than MIN_CLIMB_MS, never passes the work that's done (it only
  // creeps a little into the next step while waiting, so the pencil never looks stuck),
  // and never completes until everything has finished.
  useEffect(() => {
    const climb = reduce ? 1 : MIN_CLIMB_MS;
    const t0 = performance.now();
    let p = 0;
    setShown(true);
    // in step with the screen (rAF), so the pencil moves smoothly; a timer takes over
    // while the tab is hidden, so progress keeps moving in a background tab
    let raf = 0, iv = 0;
    const stop = () => { cancelAnimationFrame(raf); clearInterval(iv); };
    const tick = () => {
      const now = performance.now();
      const real = doneRef.current / TASKS.length;
      const allDone = real >= 1;
      const timeCap = Math.min(1, (now - t0) / climb) * 100;
      const creep = allDone ? 0 : 12 * (1 - Math.exp(-(now - lastDoneAt.current) / 1800));
      const target = Math.min(timeCap, allDone ? 100 : Math.min(99, real * 100 + creep));
      // (nobody's watching a hidden tab: go straight to where it's got)
      p += (target - p) * (reduce || document.hidden ? 1 : 0.14);
      if (allDone && timeCap >= 100 && p > 99.4) p = 100;
      setPct(p);
      if (p >= 100) { stop(); setComplete(true); return; }
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    const run = () => {
      stop();
      if (document.hidden) iv = window.setInterval(tick, 100);
      else raf = requestAnimationFrame(tick);
    };
    run();
    document.addEventListener('visibilitychange', run);
    return () => { stop(); document.removeEventListener('visibilitychange', run); };
  }, [reduce]);

  // ---- the timelapse: from the painted evening into the night, on its own clock ----
  useEffect(() => {
    if (reduce || eveningAt === null) return;
    let raf = 0;
    const tick = () => {
      // (nobody's watching a hidden tab: straight to the night)
      const d = document.hidden ? 1 : Math.min(1, (performance.now() - eveningAt) / DUSK_MS);
      setDusk(d);
      if (d < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const skip = () => { if (document.hidden) setDusk(1); };
    document.addEventListener('visibilitychange', skip);
    // never hold the hand-off on it
    const cap = window.setTimeout(() => setDusk(1), TASK_TIMEOUT_MS);
    return () => { cancelAnimationFrame(raf); clearTimeout(cap); document.removeEventListener('visibilitychange', skip); };
  }, [eveningAt, reduce]);
  const night = dusk >= 1;
  // every sky painting drifts together (the loader's and the hero's: data-sky-drift)
  useLayoutEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-sky-drift] img').forEach((el) => { el.style.translate = drift(dusk); });
  }, [dusk]);
  useEffect(() => () => {
    document.querySelectorAll<HTMLElement>('[data-sky-drift] img').forEach((el) => { el.style.translate = ''; });
  }, []);

  // ---- where the hero's title and crescent are, to draw the loader over them ----
  const [slots, setSlots] = useState<{ title: DOMRect; titleFont: string; moonY: number; moonX: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const title = document.querySelector<HTMLElement>('[data-hero-title]');
      const crescent = document.querySelector('[data-hero-moon] svg');
      if (!title || !crescent) return;
      const c = crescent.getBoundingClientRect();
      // the crescent's lit disc sits at 41%, 50% of its icon (see CelestialMark)
      setSlots({ title: title.getBoundingClientRect(), titleFont: getComputedStyle(title).fontSize, moonX: c.left + c.width * 0.414, moonY: c.top + c.height / 2 });
    };
    measure();
    // the title's size depends on the web fonts, and the window may change; its place
    // too, whenever the hero's stack changes height (e.g. the line rewraps once the
    // language is known), since the stack is centred in the screen
    (document as any).fonts?.ready?.then(measure);
    window.addEventListener('resize', measure);
    const stack = document.querySelector('[data-hero-title]')?.parentElement?.parentElement;
    const ro = stack && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (stack) ro?.observe(stack);
    return () => { window.removeEventListener('resize', measure); ro?.disconnect(); };
  }, []);

  // ---- the hand-off: the full moon wanes into the crescent where it is ----
  const moonRef = useRef<HTMLDivElement>(null);
  const [carry, setCarry] = useState<string | null>(null);
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    if (!complete || !night) return;
    const timers: number[] = [];
    const at = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
    at(reduce ? 0 : SETTLE_MS, () => {
      // where the full moon goes: onto the lit disc of the hero's crescent (it sits at
      // 41%, 50% of its icon and spans 62.5% of its width, see CelestialMark)
      const move = (from?: DOMRect, to?: DOMRect, scale = 1) =>
        from && to
          ? `translate3d(${(to.left + to.width / 2 - (from.left + from.width / 2)).toFixed(1)}px, ${(to.top + to.height / 2 - (from.top + from.height / 2)).toFixed(1)}px, 0) scale(${scale.toFixed(4)})`
          : 'none';
      const moon = moonRef.current?.getBoundingClientRect();
      const crescent = document.querySelector('[data-hero-moon] svg')?.getBoundingClientRect();
      if (!reduce) {
        const disc = crescent && new DOMRect(crescent.left + crescent.width * 0.414 - crescent.width * 0.3125, crescent.top + crescent.height / 2 - crescent.width * 0.3125, crescent.width * 0.625, crescent.width * 0.625);
        // (the moon's disc is 14/16 of its glyph)
        setCarry(move(moon, disc, disc && moon ? disc.width / (moon.width * 14 / 16) : 1));
      }
      setLeaving(true);
      // tell the hero to take over (its title at once, under this one) and bring its words in
      try { window.dispatchEvent(new CustomEvent('mt:reveal')); } catch { /* noop */ }
      at(reduce ? 0 : REVEAL_FLIGHT_MS - 300, () => setLanded(true)); // (crossfades with the hero's crescent)
      at(reduce ? 400 : Math.max(CLEAR_MS, REVEAL_FLIGHT_MS + 500), () => setGone(true));
    });
    return () => timers.forEach(clearTimeout);
  }, [complete, night, reduce]);

  // the page shows the sky's colour until the loader's done (index.html sets
  // html.booting, so the first frame before React is already the night)
  useEffect(() => {
    if (leaving) document.documentElement.classList.remove('booting');
  }, [leaving]);

  if (gone) return null;

  const clearing = leaving && !reduce;
  const CLEAR_EASE = 'cubic-bezier(0.45, 0, 0.25, 1)';
  // the moon's flight: up onto the hero's crescent
  const flight: React.CSSProperties = clearing && carry ? {
    transform: carry,
    transition: `transform ${CARRY_MS}ms cubic-bezier(0.6, 0, 0.2, 1) ${CARRY_DELAY_MS}ms, opacity 700ms ease`,
  } : {};
  // each pair of moons draws in its quarter of the progress, outer pair first
  const drawOf = (i: number) => {
    const ring = 3 - Math.abs(i - (PHASES.length - 1) / 2); // 0 = outer pair … 3 = full moon
    return Math.max(0, Math.min(1, (pct - ring * 25) / 25));
  };
  // the rules are drawn outward from the moons as the whole drawing progresses
  const rule = Math.min(1, pct / 100);
  // the rest of the drawing fades from the sky
  const fades: React.CSSProperties = clearing ? { opacity: 0, transition: `opacity ${CLEAR_MS * 0.75}ms ${CLEAR_EASE}` } : {};
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[200]"
      style={{
        pointerEvents: leaving ? 'none' : undefined,
        opacity: leaving && reduce ? 0 : 1,
        transition: leaving && reduce ? 'opacity 380ms ease' : undefined,
      }}
    >
      {/* the timelapse over the hero's twilight: the dusk, and the sunset over that,
          each thinning away in turn (with the hero's own pool of shade, so the cream
          holds on the lighter skies) */}
      {!reduce && !night && (
        <>
          <div data-sky-drift className="absolute inset-0 overflow-hidden">
            {/* (placed as WatercolorSky places the hero's painting) */}
            <img src={DUSK_IMG} alt="" draggable={false} className="absolute -inset-[6%] w-[112%] h-[112%] max-w-none object-cover select-none" style={{ opacity: (1 - smooth(0.55, 1, dusk)).toFixed(3) }} />
            <img src={SUNSET_IMG} alt="" draggable={false} className="absolute -inset-[6%] w-[112%] h-[112%] max-w-none object-cover select-none" style={{ opacity: (1 - smooth(0.05, 0.6, dusk)).toFixed(3) }} />
          </div>
          <div className="absolute inset-0" style={{ opacity: (1 - smooth(0.55, 1, dusk)).toFixed(3), background: 'radial-gradient(68% 54% at 50% 44%, rgba(9,7,22,0.3) 0%, transparent 74%)' }} />
        </>
      )}

      {/* the name, exactly where (and as) the hero's title is: the same box, with the
          h1's room for descenders at the bottom (pb), so the letters sit on the same line */}
      {slots && (
        <div
          className="letterpress-lg fixed flex items-start justify-center pb-[0.14em] font-serif font-medium uppercase whitespace-nowrap leading-[0.95] tracking-[-0.01em] text-cream"
          style={{
            left: slots.title.left, top: slots.title.top, width: slots.title.width, height: slots.title.height, fontSize: slots.titleFont,
            opacity: shown ? 1 : 0, transition: clearing ? 'opacity 400ms ease 300ms' : 'opacity 900ms ease',
            ...(clearing ? { opacity: 0 } : null),
          }}
        >
          Mayanov Tarot
        </div>
      )}

      {/* how far it's got, under the title where the hero's line will come in; it reads
          100 only once everything's loaded, and the hand-off waits for that */}
      {slots && (
        <div
          className="fixed inset-x-0 text-center text-xs md:text-[13px] uppercase tracking-[0.3em] text-cream/55"
          style={{ top: slots.title.bottom + 28, opacity: shown ? 1 : 0, transition: 'opacity 900ms ease 200ms', ...fades }}
        >
          {isIndonesian ? 'Memuat' : 'Loading'} <span className="tabular-nums text-cream/80">{Math.floor(pct)}%</span>
        </div>
      )}

      {/* the divider, its full moon where the hero's crescent will be */}
      {slots && (
        <div
          className="fixed inset-x-0 px-8 flex justify-center text-cream/85"
          style={{ top: slots.moonY, transform: 'translateY(-50%)', opacity: shown ? 1 : 0, transition: 'opacity 900ms ease' }}
        >
        <div className="w-full max-w-[34rem] flex items-center gap-4 md:gap-5" style={{ transform: `translateX(${(slots.moonX - window.innerWidth / 2).toFixed(1)}px)` }}>
          {/* each rule is uncovered outward from the moons: a window slides along over
              it (the line held still inside), transforms only, so nothing is redrawn */}
          <div className="flex-1 min-w-0 overflow-hidden py-2 -my-2" style={fades}>
            <div className="overflow-hidden py-2 -my-2 will-change-transform" style={{ transform: `translate3d(${((1 - rule) * 100).toFixed(2)}%,0,0)` }}>
              <div className="will-change-transform" style={{ transform: `translate3d(${(-(1 - rule) * 100).toFixed(2)}%,0,0)` }}>
                <PencilRule fade="start" className="w-full text-cream/45" />
              </div>
            </div>
          </div>
          {/* (the pencil's filter is let go of as the moon moves off, or it'd clip it
              to the row; and it's left off on touch screens, where working it out
              again for every step of the drawing makes the phone stutter) */}
          <div className={`${clearing ? '' : '[@media(pointer:fine)]:[filter:url(#pencil-icon)]'} flex items-center gap-2.5 md:gap-3`}>
            {PHASES.map((ph, i) => {
              const full = ph.p === 1;
              return (
                <div
                  key={i}
                  ref={full ? moonRef : undefined}
                  className={full ? 'relative' : undefined}
                  style={full
                    ? { opacity: landed ? 0 : 1, ...flight }
                    : fades}
                >
                  <div style={full ? { opacity: clearing ? 0 : 1, transition: `opacity ${CARRY_MS * 0.6}ms ease ${CARRY_DELAY_MS + CARRY_MS * 0.2}ms` } : undefined}>
                    <DrawnPhase p={ph.p} waning={ph.waning} size={full ? 18 : 13} draw={drawOf(i)} />
                  </div>
                  {/* on its way up the full moon wanes into the hero's crescent (the same
                      mark, its lit disc laid over this one's: 62.5% of its width, at 41%) */}
                  {full && clearing && (
                    <span
                      className="absolute"
                      style={{
                        width: 18 * 1.4, left: 9 - 18 * 1.4 * 0.414, top: 9 - 18 * 1.4 * 0.5,
                        animation: `bakedIn ${CARRY_MS * 0.6}ms ease ${CARRY_DELAY_MS + CARRY_MS * 0.2}ms both`,
                      }}
                    >
                      <CelestialMark name="crescent" className="block w-full" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden py-2 -my-2" style={fades}>
            <div className="overflow-hidden py-2 -my-2 will-change-transform" style={{ transform: `translate3d(${(-(1 - rule) * 100).toFixed(2)}%,0,0)` }}>
              <div className="will-change-transform" style={{ transform: `translate3d(${((1 - rule) * 100).toFixed(2)}%,0,0)` }}>
                <PencilRule fade="end" className="w-full text-cream/45" />
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default Loader;
