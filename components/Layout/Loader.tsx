import React, { useEffect, useRef, useState } from 'react';
import { stopLenis, startLenis } from '../UI/scroll';
import { PHASES } from '../UI/MoonPhaseDivider';
import Background from './Background';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// The loader is a cover sheet of the site's paper laid over the hero. While the page
// loads, a tarot card is drawn onto it in pencil, stroke by stroke as the loading
// progresses: the card's edges ruled in, a crescent moon outlined and hatched in
// coloured pencil, a few stars, the moon phases along its foot, and the name pressed
// in last. Once everything is in, a drop of the night sky's paint lands on the
// crescent and blooms out across the wet paper, its edge feathering and wandering
// as watercolour does, until the whole sheet is the night sky: the hero.

// The hand-off's timing (ms). The hero and About time their entrances against these.
const DROP_MS = 420;    // the drop lands on the crescent and soaks in a little
const BLOOM_MS = 1700;  // the paint blooms out across the sheet
// when the hero starts its entrance, counted from mt:reveal (fired as the bloom starts)
export const REVEAL_FLIGHT_MS = 1150;
// Scrolling stays locked until the hero's entrance (and the About sheet rising under
// it) has finished, so an early scroll can't catch the page mid-animation.
const SCROLL_UNLOCK_MS = REVEAL_FLIGHT_MS + 1400;

// Loading is REAL: progress comes from the work the page actually waits on.
const TASKS = ['fonts', 'paper', 'app', 'page'] as const;
const MIN_CLIMB_MS = 2600;    // even on a fast connection the drawing takes this long to draw
const SETTLE_MS = 450;        // the finished drawing holds a beat before the paint drops
const TASK_TIMEOUT_MS = 6000; // never wait forever on a single task
const PAPER_IMG = `${import.meta.env.BASE_URL}paper.webp`;

// ---- the drawing ----
// A card in a 200 × 320 box. Each stroke is drawn along its length (a dash pulled
// along the path) in its turn; `w` is its share of the time, roughly its length.
type Stroke = { d: string; w: number; tone: 'graphite' | 'violet'; width: number; opacity?: number; hatch?: boolean };

// the crescent: an outer arc round the left and the terminator's shallower arc
const CRESCENT = 'M112 93.5 A48 48 0 1 0 112 186.5 A52 52 0 0 1 112 93.5 Z';
const cross = (x: number, y: number, s: number): Stroke[] => [
  { d: `M${x - s} ${y + 0.4} L${x + s} ${y - 0.3}`, w: 0.35, tone: 'graphite', width: 0.9 },
  { d: `M${x + 0.3} ${y - s} L${x - 0.2} ${y + s}`, w: 0.35, tone: 'graphite', width: 0.9 },
];
const STROKES: Stroke[] = [
  // the card's edges, each ruled a little past the corners
  { d: 'M4 12 C 60 10.5, 140 11.6, 196 10.8', w: 2, tone: 'graphite', width: 1.3 },
  { d: 'M189.4 4 C 190.6 100, 189.2 220, 190 316', w: 2.6, tone: 'graphite', width: 1.3 },
  { d: 'M196 309.4 C 130 310.6, 70 308.8, 4 309.8', w: 2, tone: 'graphite', width: 1.3 },
  { d: 'M10.8 316 C 9.6 210, 11.3 100, 10.4 4', w: 2.6, tone: 'graphite', width: 1.3 },
  // a finer inner border
  { d: 'M21 25 Q21 21 25 21 L175 21 Q179 21 179 25 L179 295 Q179 299 175 299 L25 299 Q21 299 21 295 Z', w: 4, tone: 'graphite', width: 0.6, opacity: 0.55 },
  // the crescent, outlined in coloured pencil, then gone over again more lightly
  { d: 'M112 93.5 A48 48 0 1 0 112 186.5', w: 2.4, tone: 'violet', width: 1.5 },
  { d: 'M112 186.5 A52 52 0 0 1 112 93.5', w: 1.6, tone: 'violet', width: 1.2 },
  { d: 'M108 95.5 A46.5 46.5 0 1 0 110 185', w: 1.4, tone: 'violet', width: 0.6, opacity: 0.45 },
  // hatched in, short diagonal strokes across the lit part (clipped to it)
  ...Array.from({ length: 13 }, (_, i): Stroke => ({
    d: `M${40 + i * 6.5} ${196} L${78 + i * 6.5} ${86}`, w: 0.42, tone: 'violet', width: 0.75, opacity: 0.6, hatch: true,
  })),
  // stars, a few crosses and pinpoints
  ...cross(52, 64, 4.5), ...cross(150, 58, 3.5), ...cross(158, 206, 4), ...cross(48, 226, 3),
  { d: 'M140 112 l0.1 0.1', w: 0.15, tone: 'graphite', width: 2.2 },
  { d: 'M70 196 l0.1 0.1', w: 0.15, tone: 'graphite', width: 1.8 },
  { d: 'M166 140 l0.1 0.1', w: 0.15, tone: 'graphite', width: 1.6 },
  // a rule above the card's foot
  { d: 'M42 246 C 80 245.2, 120 246.6, 158 245.6', w: 1.4, tone: 'graphite', width: 0.7, opacity: 0.6 },
];
const PHASE_W = 0.5; // each moon of the row along the foot
const TOTAL_W = STROKES.reduce((n, s) => n + s.w, 0) + PHASES.length * PHASE_W;

// one moon of the row, outlined round then shaded in (same geometry as the divider's Phase)
const DrawnPhase: React.FC<{ p: number; waning?: boolean; x: number; y: number; r: number; draw: number }> = ({ p, waning = false, x, y, r, draw }) => {
  const rx = Math.abs(1 - 2 * p) * r;
  const lit = `M ${x} ${y - r} A ${r} ${r} 0 0 1 ${x} ${y + r} A ${rx} ${r} 0 0 ${p > 0.5 ? 1 : 0} ${x} ${y - r} Z`;
  const outline = Math.min(1, draw / 0.6);
  const shade = Math.max(0, (draw - 0.5) / 0.5);
  return (
    <g transform={waning ? `translate(${2 * x} 0) scale(-1 1)` : undefined}>
      <circle cx={x} cy={y} r={r} fill="none" stroke="currentColor" strokeOpacity={0.6} strokeWidth={0.6}
        pathLength={1} strokeDasharray="1" strokeDashoffset={1 - outline} transform={`rotate(-90 ${x} ${y})`} strokeLinecap="round" />
      {p >= 1 ? <circle cx={x} cy={y} r={r} fill="currentColor" opacity={shade * 0.85} /> : <path d={lit} fill="currentColor" opacity={shade * 0.85} />}
    </g>
  );
};

const CardDrawing: React.FC<{ progress: number; className?: string }> = ({ progress, className = '' }) => {
  const id = React.useId().replace(/:/g, '');
  let at = progress * TOTAL_W; // how far along the drawing the hand has got
  const take = (w: number) => { const v = Math.max(0, Math.min(1, at / w)); at -= w; return v; };
  const strokes = STROKES.map((s) => ({ ...s, t: take(s.w) }));
  const phases = PHASES.map((ph) => ({ ...ph, t: take(PHASE_W) }));
  const named = Math.max(0, Math.min(1, progress * 6 - 5)); // the name presses in over the last sixth
  return (
    <svg viewBox="0 0 200 320" className={`overflow-visible ${className}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id={`${id}c`}><path d={CRESCENT} /></clipPath>
      </defs>
      <g style={{ filter: 'url(#pencil-icon)' }}>
        {strokes.map((s, i) => s.t > 0 && (
          <path
            key={i}
            d={s.d}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - s.t}
            stroke={s.tone === 'violet' ? '#6B3FA0' : '#221D3C'}
            strokeWidth={s.width}
            strokeOpacity={s.opacity ?? 0.82}
            clipPath={s.hatch ? `url(#${id}c)` : undefined}
          />
        ))}
        <g className="text-moon">
          {phases.map((ph, i) => (
            <DrawnPhase key={i} p={ph.p} waning={ph.waning} x={64 + i * 12} y={268} r={ph.p === 1 ? 4.6 : 3.6} draw={ph.t} />
          ))}
        </g>
      </g>
      <text
        x="100" y="292" textAnchor="middle"
        className="letterpress font-serif font-medium uppercase"
        style={{ fontSize: 11.5, letterSpacing: '0.2em', fill: '#221D3C', opacity: named }}
      >
        Mayanov Tarot
      </text>
    </svg>
  );
};

// ---- the paint ----
// A blot of watercolour: a disc pushed about by broad and then fine noise (a wandering,
// lobed edge that frays into the paper's fibres), softly feathered. Painted once into
// a picture so it can be grown as a mask without its filters being worked out again.
const BLOT_A = 3, BLOT_B = 11, BLOT_C = 23;
// each blot: its size as it lands (px) and once spread (× the screen's longer side),
// and where it sits from the drop
const BLOT_LAYERS = [
  { drop: 46, spread: 4.6, dx: 0, dy: 0 },
  { drop: 30, spread: 3.4, dx: 0.12, dy: 0.22 },
  { drop: 22, spread: 3, dx: -0.2, dy: -0.12 },
];
const paintBlot = (seed: number) => new Promise<string>((resolve) => {
  const S = 512;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">` +
    `<filter id="f" x="-30%" y="-30%" width="160%" height="160%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="${seed}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="150" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="${seed + 1}" result="m"/>` +
    `<feDisplacementMap in="d" in2="m" scale="14" xChannelSelector="R" yChannelSelector="G" result="e"/>` +
    `<feGaussianBlur in="e" stdDeviation="2.2"/>` +
    `</filter><circle cx="${S / 2}" cy="${S / 2}" r="${S * 0.3}" fill="#000" filter="url(#f)"/></svg>`;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = S;
      c.getContext('2d')!.drawImage(img, 0, 0);
      c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : src), 'image/png');
    } catch { resolve(src); }
  };
  img.onerror = () => resolve(src);
  img.src = src;
});

const Loader: React.FC<LoaderProps> = ({ ready = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [pct, setPct] = useState(0);              // progress, 0–100
  const [complete, setComplete] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<'draw' | 'drop' | 'bloom'>('draw');
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

  // ---- the hand-off: the night sky blooms out from the crescent ----
  // The sky above is the hero's own (the same Background), shown through a mask of a
  // few watercolour blots (painted once into pictures: soft, wandering edges) that
  // drop onto the crescent and spread until they cover the screen.
  const cardRef = useRef<HTMLDivElement>(null);
  const [blots, setBlots] = useState<string[] | null>(null);
  const [drop, setDrop] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (reduce) return;
    let live = true;
    Promise.all([BLOT_A, BLOT_B, BLOT_C].map(paintBlot)).then((b) => { if (live) setBlots(b); });
    return () => { live = false; };
  }, [reduce]);
  useEffect(() => {
    if (!complete || (!reduce && !blots)) return;
    const timers: number[] = [];
    const at = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
    at(reduce ? 0 : SETTLE_MS, () => {
      if (reduce) {
        setLeaving(true);
        window.dispatchEvent(new CustomEvent('mt:reveal'));
        at(400, () => setGone(true));
        return;
      }
      // the drop falls on the crescent (it sits at 44%, 44% of the card)
      const r = cardRef.current?.getBoundingClientRect();
      setDrop(r ? { x: r.left + r.width * 0.44, y: r.top + r.height * 0.44 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      at(30, () => setPhase('drop'));
      at(30 + DROP_MS, () => {
        setPhase('bloom');
        setLeaving(true);
        // tell the hero to play its entrance as the sky spreads
        window.dispatchEvent(new CustomEvent('mt:reveal'));
      });
      at(30 + DROP_MS + BLOOM_MS + 60, () => setGone(true));
    });
    return () => timers.forEach(clearTimeout);
  }, [complete, reduce, blots]);

  // the page under the sheet shows the paper's colour until the sky has spread (index.html
  // sets html.booting, so the first frame before React isn't the night sky)
  useEffect(() => {
    if (leaving) document.documentElement.classList.remove('booting');
  }, [leaving]);

  if (gone) return null;

  // the blots: [size, offset from the drop] for each, as it lands and once spread
  const spread = phase === 'bloom';
  const vmax = Math.max(window.innerWidth, window.innerHeight);
  const layers = BLOT_LAYERS.map((l) => {
    const size = phase === 'draw' ? 0 : spread ? l.spread * vmax : l.drop;
    const dx = spread ? l.dx * vmax : l.dx * l.drop, dy = spread ? l.dy * vmax : l.dy * l.drop;
    return { size, x: (drop?.x ?? 0) + dx - size / 2, y: (drop?.y ?? 0) + dy - size / 2 };
  });
  const maskStyle: React.CSSProperties = blots ? {
    WebkitMaskImage: blots.map((b) => `url(${b})`).join(', '),
    maskImage: blots.map((b) => `url(${b})`).join(', '),
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: layers.map((l) => `${l.size}px ${l.size}px`).join(', '),
    maskSize: layers.map((l) => `${l.size}px ${l.size}px`).join(', '),
    WebkitMaskPosition: layers.map((l) => `${l.x}px ${l.y}px`).join(', '),
    maskPosition: layers.map((l) => `${l.x}px ${l.y}px`).join(', '),
    transition: phase === 'drop'
      ? `-webkit-mask-size ${DROP_MS}ms cubic-bezier(0.2, 0.8, 0.3, 1), mask-size ${DROP_MS}ms cubic-bezier(0.2, 0.8, 0.3, 1), -webkit-mask-position ${DROP_MS}ms cubic-bezier(0.2, 0.8, 0.3, 1), mask-position ${DROP_MS}ms cubic-bezier(0.2, 0.8, 0.3, 1)`
      : spread
        ? `-webkit-mask-size ${BLOOM_MS}ms cubic-bezier(0.55, 0.05, 0.35, 1), mask-size ${BLOOM_MS}ms cubic-bezier(0.55, 0.05, 0.35, 1), -webkit-mask-position ${BLOOM_MS}ms cubic-bezier(0.55, 0.05, 0.35, 1), mask-position ${BLOOM_MS}ms cubic-bezier(0.55, 0.05, 0.35, 1)`
        : undefined,
  } : {};

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[200] bg-paper"
      style={{
        pointerEvents: leaving ? 'none' : undefined,
        opacity: leaving && reduce ? 0 : 1,
        transition: reduce ? 'opacity 380ms ease' : undefined,
      }}
    >
      {/* the card, drawn on the sheet */}
      <div className="absolute inset-0 grid place-items-center px-8">
        <div ref={cardRef}>
          <CardDrawing progress={pct / 100} className="block h-[min(58vh,26rem)] w-auto" />
        </div>
      </div>

      {/* the night sky's paint, blooming out from the drop */}
      {blots && drop && (
        <div className="absolute inset-0" style={maskStyle}>
          <Background />
        </div>
      )}
    </div>
  );
};

export default Loader;
