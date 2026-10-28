import React, { useEffect, useRef, useState } from 'react';

// The photo band above "Event & collaboration".
//
// Desktop: a zoom-out reveal. The purple band pins while the page scrolls. It opens
// on the first photo filling the whole screen (with a line of text over it); as you
// scroll, that photo shrinks into its place in a row of four while its corners round,
// and the other three photos rise into the row beside it.
// Phones / reduced motion: no pinning — a swipeable row with a curtain reveal.

type Props = { photos: string[]; isIndonesian: boolean; onOpen: (src: string) => void };

const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const PIN_VH = 220;            // how long the pin lasts (section height, in vh)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// the final row's cell rects, from the viewport size
const rowRects = (n: number, vw: number, vh: number) => {
  const gap = 16;
  const avail = Math.min(vw - 64, 1240);
  let w = (avail - gap * (n - 1)) / n;
  let h = (w * 4) / 3;
  if (h > vh * 0.72) { h = vh * 0.72; w = (h * 3) / 4; }
  const rowW = n * w + gap * (n - 1);
  const left0 = (vw - rowW) / 2;
  const top = (vh - h) / 2 + vh * 0.03;
  return Array.from({ length: n }, (_, i) => ({ left: left0 + i * (w + gap), top, width: w, height: h }));
};

const EventGallery: React.FC<Props> = ({ photos, isIndonesian, onOpen }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const textRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [shown, setShown] = useState(false); // curtain on the phone row

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
    const on = () => setPinned(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // desktop: drive every frame from the scroll position (imperative — no re-renders)
  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const outer = outerRef.current;
      if (!outer) return;
      const vw = outer.clientWidth, vh = window.innerHeight; // clientWidth: excludes the scrollbar
      const r = outer.getBoundingClientRect();
      const p = clamp01(-r.top / Math.max(1, r.height - vh));
      const rects = rowRects(photos.length, vw, vh);

      // the first photo: full screen → its cell
      const e = easeInOut(clamp01(p / 0.7));
      const hero = cellRefs.current[0];
      if (hero) {
        const t = rects[0];
        hero.style.left = `${(t.left * e).toFixed(1)}px`;
        hero.style.top = `${(t.top * e).toFixed(1)}px`;
        hero.style.width = `${(vw + (t.width - vw) * e).toFixed(1)}px`;
        hero.style.height = `${(vh + (t.height - vh) * e).toFixed(1)}px`;
        hero.style.borderRadius = `${(20 * e).toFixed(1)}px`;
      }
      // the others rise into the row once the first has mostly shrunk
      for (let i = 1; i < photos.length; i++) {
        const cell = cellRefs.current[i];
        if (!cell) continue;
        const t = rects[i];
        const k = easeInOut(clamp01((p - 0.4 - i * 0.06) / 0.35));
        cell.style.left = `${t.left.toFixed(1)}px`;
        cell.style.top = `${t.top.toFixed(1)}px`;
        cell.style.width = `${t.width.toFixed(1)}px`;
        cell.style.height = `${t.height.toFixed(1)}px`;
        cell.style.opacity = k.toFixed(3);
        cell.style.transform = `translate3d(0, ${((1 - k) * 90).toFixed(1)}px, 0) scale(${(0.92 + k * 0.08).toFixed(3)})`;
      }
      // the line over the full-screen photo fades as it shrinks
      if (textRef.current) {
        const f = clamp01(1 - p / 0.28);
        textRef.current.style.opacity = f.toFixed(3);
        textRef.current.style.transform = `translate3d(0, ${((1 - f) * -30).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [pinned, photos.length]);

  // phone row: curtains lift when it comes into view
  useEffect(() => {
    if (pinned) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const el = outerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      setShown(true);
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [pinned]);

  const label = isIndonesian ? 'Di balik meja tarot' : 'From the reading table';
  const alt = (i: number) => (isIndonesian ? `Sesi tarot Mayanov di event ${i + 1}` : `Mayanov tarot session at event ${i + 1}`);
  const aria = (i: number) => (isIndonesian ? `Lihat foto event ${i + 1}` : `View event photo ${i + 1}`);

  if (!pinned) {
    // phones / reduced motion — a swipeable row with a curtain reveal
    return (
      <div ref={outerRef} className="bg-[#2A2258] text-cream pt-16 pb-12">
        <p className="px-8 font-elegant italic text-[#C9B8E8] text-base">{label}</p>
        <div className="mt-6 flex items-start gap-4 overflow-x-auto snap-x snap-mandatory px-8 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => onOpen(src)}
              aria-label={aria(i)}
              className="relative shrink-0 w-[70vw] aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-white/5 snap-center"
              style={{
                marginTop: i % 2 ? '2.5rem' : 0,
                clipPath: shown ? 'inset(0% 0% 0% 0% round 1.25rem)' : 'inset(100% 0% 0% 0% round 1.25rem)',
                transition: `clip-path 1200ms ${EASE} ${i * 140}ms`,
              }}
            >
              <img src={src} alt={alt(i)} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" style={{ transform: shown ? 'scale(1)' : 'scale(1.2)', transition: `transform 1400ms ${EASE} ${i * 140}ms` }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={outerRef} className="relative bg-[#2A2258] text-cream" style={{ height: `${PIN_VH}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {photos.map((src, i) => (
          <button
            key={src}
            ref={(el) => { cellRefs.current[i] = el; }}
            type="button"
            onClick={() => onOpen(src)}
            aria-label={aria(i)}
            className="group absolute overflow-hidden bg-white/5 will-change-transform"
            style={i === 0 ? { left: 0, top: 0, width: '100%', height: '100%', zIndex: 2 } : { opacity: 0, zIndex: 1 }}
          >
            <img src={src} alt={alt(i)} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            {/* soft violet duotone that clears on hover */}
            <span className="pointer-events-none absolute inset-0 bg-plum mix-blend-color opacity-30 group-hover:opacity-0 transition-opacity duration-500" />
          </button>
        ))}

        {/* the line over the full-screen photo */}
        <div ref={textRef} className="pointer-events-none absolute inset-x-0 bottom-[12vh] z-[3] text-center">
          <div className="absolute inset-x-0 -bottom-[12vh] h-[60vh] bg-gradient-to-t from-[#140f30]/80 to-transparent" />
          <p className="relative font-elegant italic text-[#E6DCF5] text-xl">{isIndonesian ? 'Momen bersama' : 'Moments with'}</p>
          <h3 className="relative mt-2 font-elegant font-semibold text-cream text-[4.5rem] xl:text-[5.5rem] leading-[0.95] tracking-[-0.02em]">{label}</h3>
        </div>
      </div>
    </div>
  );
};

export default EventGallery;
