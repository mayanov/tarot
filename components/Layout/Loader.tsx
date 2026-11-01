import React, { useEffect, useRef, useState } from 'react';
import { stopLenis, startLenis } from '../UI/scroll';
import { PHASES } from '../UI/MoonPhaseDivider';
import PencilRule from '../UI/PencilRule';
import { TornPaper } from '../UI/PaperEdge';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// The loader is a cover sheet of the site's paper laid over the hero. While the page
// loads, the moon-phase divider is pencilled onto it, the rules drawn outward and the
// moons outlined and shaded in pair by pair (the outer pair first, the full moon last).
// Once everything is in, the paper gives way: it wears through in patches, from the
// edges in, the night sky showing where it's gone, while the ink stays where it was
// put. The name lightens to cream and grows into the hero's title, and the full moon
// goes up into the hero's crescent; the rest of the drawing goes with the paper.

// The hand-off's timing (ms). The hero and About time their entrances against these.
const DISSOLVE_MS = 1800;             // the paper wears away
const CARRY_DELAY_MS = 150;           // the ink starts to move once the paper's going
const CARRY_MS = 1200;                // the name and the moon reach the hero's title and crescent
// when the ink has landed (from mt:reveal): the hero's title and crescent take over then
export const REVEAL_FLIGHT_MS = CARRY_DELAY_MS + CARRY_MS;
// Scrolling stays locked until the hero's entrance (and the About sheet rising under
// it) has finished, so an early scroll can't catch the page mid-animation.
const SCROLL_UNLOCK_MS = REVEAL_FLIGHT_MS + 1400;

// Loading is REAL: progress comes from the work the page actually waits on.
const TASKS = ['fonts', 'paper', 'app', 'page'] as const;
const MIN_CLIMB_MS = 1600;    // even on a fast connection the drawing takes this long (no flash)
const SETTLE_MS = 450;        // the finished drawing holds a beat before the sheet lifts
const TASK_TIMEOUT_MS = 6000; // never wait forever on a single task
const PAPER_IMG = `${import.meta.env.BASE_URL}paper.webp`;

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

// ---- the paper giving way ----
// Smooth noise on a coarse grid (value noise, two octaves), with the middle of the sheet
// weighted to last: the paper goes from the edges in, in uneven patches, the drawing's
// ground last. Worked out once per hand-off on a small grid, then scaled up (softly)
// over the sheet each frame as a mask.
const wearMap = (w: number, h: number) => {
  const grid = (n: number) => Array.from({ length: (n + 2) * (n + 2) }, () => Math.random());
  const oct = (g: number[], n: number, x: number, y: number) => {
    const gx = x * n, gy = y * n, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
    const at = (i: number, j: number) => g[j * (n + 2) + i];
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
    const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
    return a + (b - a) * sy;
  };
  const g1 = grid(6), g2 = grid(17);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    const d = Math.min(1, Math.hypot((u - 0.5) * 1.3, v - 0.5) / 0.72);
    // (plus a little grain at the finest scale: the torn fibres at the edge of a hole)
    out[y * w + x] = 0.42 * oct(g1, 6, u, v) + 0.16 * oct(g2, 17, u, v) + 0.4 * (1 - d) + (Math.random() - 0.5) * 0.035;
  }
  return out;
};

const Loader: React.FC<LoaderProps> = ({ ready = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(false);      // the drawing has started
  const [pct, setPct] = useState(0);              // progress, 0–100
  const [complete, setComplete] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [unlocked, setUnlocked] = useState(false); // page may scroll again

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
    // the paper's grain: the sheet itself and every light section are printed on it
    const img = new Image();
    img.onload = safe('paper');
    img.onerror = safe('paper');
    img.src = PAPER_IMG;
    if (img.complete && img.naturalWidth) safe('paper')();
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
    // a ~30fps timer rather than rAF, so progress keeps moving even in a background tab
    const tick = () => {
      const now = performance.now();
      const real = doneRef.current / TASKS.length;
      const allDone = real >= 1;
      const timeCap = Math.min(1, (now - t0) / climb) * 100;
      const creep = allDone ? 0 : 12 * (1 - Math.exp(-(now - lastDoneAt.current) / 1800));
      const target = Math.min(timeCap, allDone ? 100 : Math.min(99, real * 100 + creep));
      p += (target - p) * (reduce ? 1 : 0.14);
      if (allDone && timeCap >= 100 && p > 99.4) p = 100;
      setPct(p);
      if (p >= 100) { clearInterval(iv); setComplete(true); }
    };
    const iv = window.setInterval(tick, 33);
    return () => clearInterval(iv);
  }, [reduce]);

  // ---- the hand-off: the paper gives way, the ink carries over to the hero ----
  const wordRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLCanvasElement>(null);
  const [carry, setCarry] = useState<{ word: string; moon: string } | null>(null);
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    if (!complete) return;
    const timers: number[] = [];
    const at = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
    at(reduce ? 0 : SETTLE_MS, () => {
      // where the ink goes: the name onto the hero's title (scaled by the type's size),
      // the full moon onto the lit disc of the hero's crescent (it sits at 41%, 50% of
      // its icon and spans 62.5% of its width, see CelestialMark)
      const move = (from?: DOMRect, to?: DOMRect, scale = 1) =>
        from && to
          ? `translate3d(${(to.left + to.width / 2 - (from.left + from.width / 2)).toFixed(1)}px, ${(to.top + to.height / 2 - (from.top + from.height / 2)).toFixed(1)}px, 0) scale(${scale.toFixed(4)})`
          : 'none';
      const word = wordRef.current, title = document.querySelector<HTMLElement>('[data-hero-title]');
      const moon = moonRef.current?.getBoundingClientRect();
      const crescent = document.querySelector('[data-hero-moon] svg')?.getBoundingClientRect();
      const fs = (el: Element | null | undefined) => parseFloat(el ? getComputedStyle(el).fontSize : '') || 1;
      if (!reduce) {
        const disc = crescent && new DOMRect(crescent.left + crescent.width * 0.414 - crescent.width * 0.3125, crescent.top + crescent.height / 2 - crescent.width * 0.3125, crescent.width * 0.625, crescent.width * 0.625);
        setCarry({
          word: move(word?.getBoundingClientRect(), title?.getBoundingClientRect(), fs(title) / fs(word)),
          // the moon's disc is 14/16 of its glyph
          moon: move(moon, disc, disc && moon ? disc.width / (moon.width * 14 / 16) : 1),
        });
      }
      setLeaving(true);
      // tell the hero to play its entrance as the ink carries over
      try { window.dispatchEvent(new CustomEvent('mt:reveal')); } catch { /* noop */ }
      at(reduce ? 0 : REVEAL_FLIGHT_MS, () => setLanded(true));
      at(reduce ? 400 : Math.max(DISSOLVE_MS, REVEAL_FLIGHT_MS + 350), () => setGone(true));
    });
    return () => timers.forEach(clearTimeout);
  }, [complete, reduce]);

  // the paper wearing away, painted onto a canvas frame by frame: the sheet's colour and
  // grain (lined up with the sheet it replaces), masked by the wear map
  useEffect(() => {
    const cv = paperRef.current;
    if (!leaving || reduce || !cv) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const k = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(vw * k); cv.height = Math.round(vh * k);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const mw = Math.ceil(vw / 3), mh = Math.ceil(vh / 3);
    const wear = wearMap(mw, mh);
    const mask = document.createElement('canvas');
    mask.width = mw; mask.height = mh;
    const mctx = mask.getContext('2d')!;
    const px = mctx.createImageData(mw, mh);
    const img = new Image();
    img.src = PAPER_IMG;
    let pattern: CanvasPattern | null = null;
    const t0 = performance.now();
    let raf = 0;
    const frame = () => {
      const t = Math.min(1, (performance.now() - t0) / DISSOLVE_MS);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const th = e * 1.2 - 0.12; // where the paper has worn through
      for (let i = 0; i < wear.length; i++) {
        const a = Math.max(0, Math.min(1, (wear[i] - th) * 32));
        px.data[i * 4 + 3] = a * 255;
      }
      mctx.putImageData(px, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, vw, vh);
      ctx.fillStyle = '#f3f1ec';
      ctx.fillRect(0, 0, vw, vh);
      if (!pattern && img.complete && img.naturalWidth) pattern = ctx.createPattern(img, 'repeat');
      if (pattern) {
        // the sheet's grain: 600px tiles, centred, ending at its bottom edge (vh + 2)
        pattern.setTransform(new DOMMatrix().translate((vw - 600) / 2, vh + 2 - 600).scale(600 / (img.naturalWidth || 600)));
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, vw, vh);
      }
      ctx.globalCompositeOperation = 'destination-in';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(mask, 0, 0, vw, vh);
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [leaving, reduce]);

  // the page under the sheet shows the paper's colour until the sheet is up (index.html
  // sets html.booting, so the first frame before React isn't the night sky)
  useEffect(() => {
    if (leaving) document.documentElement.classList.remove('booting');
  }, [leaving]);

  if (gone) return null;

  const wearing = leaving && !reduce;
  const INK_EASE = 'cubic-bezier(0.65, 0, 0.2, 1)';
  const inkMove = (to: string | undefined): React.CSSProperties => (wearing && to ? {
    transform: to,
    transition: `transform ${CARRY_MS}ms ${INK_EASE} ${CARRY_DELAY_MS}ms, color ${CARRY_MS}ms ease ${CARRY_DELAY_MS}ms, text-shadow ${CARRY_MS}ms ease ${CARRY_DELAY_MS + CARRY_MS * 0.4}ms, opacity 300ms ease`,
  } : {});
  // each pair of moons draws in its quarter of the progress, outer pair first
  const drawOf = (i: number) => {
    const ring = 3 - Math.abs(i - (PHASES.length - 1) / 2); // 0 = outer pair … 3 = full moon
    return Math.max(0, Math.min(1, (pct - ring * 25) / 25));
  };
  // the rules are drawn outward from the moons as the whole drawing progresses
  const rule = Math.min(1, pct / 100);
  // the rest of the drawing goes with the paper
  const fades: React.CSSProperties = { opacity: wearing ? 0 : 1, transition: `opacity ${DISSOLVE_MS * 0.5}ms ease ${DISSOLVE_MS * 0.15}ms` };
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 -bottom-12 z-[200]"
      style={{
        pointerEvents: leaving ? 'none' : undefined,
        opacity: leaving && reduce ? 0 : 1,
        transition: leaving && reduce ? 'opacity 380ms ease' : undefined,
      }}
    >
      {/* the sheet: the paper itself while drawing, then a painting of it that wears away */}
      {wearing ? <canvas ref={paperRef} className="absolute left-0 top-0 h-[100vh] w-[100vw]" /> : <TornPaper edge="bottom" />}

      {/* the drawing, in the middle of the screen (the sheet runs 3rem past its bottom) */}
      <div className="absolute inset-x-0 top-0 h-[calc(100%-3rem)] flex flex-col items-center justify-center px-8 text-ink">
        <div
          ref={wordRef}
          className={`${wearing ? '' : 'letterpress-lg'} font-serif font-medium uppercase whitespace-nowrap tracking-[0.02em] text-[1.45rem] md:text-[1.8rem] leading-none pb-[0.14em] -mb-[0.14em]`}
          style={{
            opacity: shown && !landed ? 1 : 0,
            transition: 'opacity 900ms ease',
            ...inkMove(carry?.word),
            textShadow: wearing ? '0 8px 60px rgba(6,4,14,0.5)' : '0 8px 60px rgba(6,4,14,0)',
            ...(wearing ? { color: '#F3F1EC' } : null),
          }}
        >
          Mayanov Tarot
        </div>

        <div className="mt-7 md:mt-8 w-full max-w-[34rem] flex items-center gap-4 md:gap-5 text-moon">
          <div className="flex-1 min-w-0" style={{ clipPath: `inset(-8px 0 -8px ${(1 - rule) * 100}%)`, ...fades }}>
            <PencilRule fade="start" className="w-full text-moon/70" />
          </div>
          {/* (the pencil's filter and print mask are let go of as the moon moves off,
              or they'd clip it to the row) */}
          <div className={`${wearing ? '' : 'print-ink [filter:url(#pencil-icon)]'} flex items-center gap-2.5 md:gap-3`}>
            {PHASES.map((ph, i) => {
              const full = ph.p === 1;
              return (
                <div
                  key={i}
                  ref={full ? moonRef : undefined}
                  style={full
                    ? { opacity: landed ? 0 : 1, ...inkMove(carry?.moon), ...(wearing ? { color: 'rgba(243,241,236,0.85)' } : null) }
                    : fades}
                >
                  <DrawnPhase p={ph.p} waning={ph.waning} size={full ? 18 : 13} draw={drawOf(i)} />
                </div>
              );
            })}
          </div>
          <div className="flex-1 min-w-0" style={{ clipPath: `inset(-8px ${(1 - rule) * 100}% -8px 0)`, ...fades }}>
            <PencilRule fade="end" className="w-full text-moon/70" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
