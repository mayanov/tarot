import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { paintsMayStart, trackPaint } from './introGate';

/**
 * Paints a heavy SVG decoration (a watercolour wash: noise, displacement, wide blurs)
 * once into a picture, and shows the picture. Drawn live, the browser works the filters
 * out again whenever anything near it repaints (a quote fading, a card flipping), which
 * on a phone, at 3× the pixels and on the CPU, is what stalls the page.
 *
 * The child is one <svg> that fills this box (attributes only; CSS classes don't reach
 * a picture). Its paint may spill past the box by `bleed` px (washes run over their
 * edges). It's drawn hidden (not painted) until the picture is ready, then swapped out;
 * redrawn only if the box's width changes. Colours are fixed when baked, so only use
 * it for decorations that don't change on hover.
 */

// one bake at a time, each in idle time behind the loader once the hero's own things
// are ready (introGate); the loader waits for them all, so none lands on a scroll
let queue: Promise<unknown> = Promise.resolve();
const idle = () => new Promise<void>((r) => {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  if (ric) ric(() => r(), { timeout: 1200 }); else setTimeout(r, 40);
});

const bake = (svg: SVGSVGElement, w: number, h: number, bleed: number): Promise<string | null> =>
  trackPaint(queue = queue.then(paintsMayStart).then(idle).then(() => new Promise<string | null>((resolve) => {
    const W = w + bleed * 2, H = h + bleed * 2;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.removeAttribute('class');
    clone.removeAttribute('style');
    clone.setAttribute('x', String(bleed));
    clone.setAttribute('y', String(bleed));
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));
    clone.setAttribute('overflow', 'visible');
    clone.setAttribute('color', getComputedStyle(svg).color);
    // an outer sheet with room for the bleed; the drawing keeps its own box, so its
    // percentages and viewBox resolve as they did on the page
    const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${new XMLSerializer().serializeToString(clone)}</svg>`;
    const img = new Image();
    img.onload = () => {
      try {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const c = document.createElement('canvas');
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), 'image/png');
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(doc)}`;
  }))) as Promise<string | null>;

/** `blend`: a mix-blend-mode for the picture, for a drawing whose layers blend with
    what's under it (they're flattened in the picture, then blended as one) */
const Baked: React.FC<React.PropsWithChildren<{ className?: string; bleed?: number; blend?: React.CSSProperties['mixBlendMode'] }>> = ({ className = '', bleed = 60, blend, children }) => {
  const boxRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  // the live drawing's own transform (e.g. a tilted brushstroke) goes on the picture
  const [turn, setTurn] = useState('');

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      setWidth((prev) => (Math.abs(prev - w) > 2 ? w : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = boxRef.current;
    const svg = el?.querySelector('svg');
    if (!el || !svg || !width || failed) return;
    let live = true;
    setTurn(svg.style.transform);
    bake(svg, width, Math.round(el.getBoundingClientRect().height), bleed).then((url) => {
      if (!live) { if (url) URL.revokeObjectURL(url); return; }
      if (!url) { setFailed(true); return; }
      setSrc((old) => { if (old) URL.revokeObjectURL(old); return url; });
    });
    return () => { live = false; };
    // re-bake only when the width changes (a phone's address bar only changes height)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, failed]);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  return (
    <span ref={boxRef} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {/* kept (unpainted) after baking, so a new width can be baked from it */}
      <span style={{ visibility: failed ? 'visible' : 'hidden', position: 'absolute', inset: 0 }}>{children}</span>
      {src && !failed && (
        <img
          alt=""
          src={src}
          className="absolute max-w-none select-none animate-[bakedIn_0.6s_ease-out]"
          style={{ left: -bleed, top: -bleed, width: `calc(100% + ${bleed * 2}px)`, height: `calc(100% + ${bleed * 2}px)`, transform: turn || undefined, mixBlendMode: blend }}
        />
      )}
    </span>
  );
};

export default Baked;
