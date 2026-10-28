import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

// The photo band above "Event & collaboration".
//
// Desktop: a pinned horizontal gallery. The purple band sticks to the screen while the
// page scrolls, and the photos — set as an editorial collage of different sizes and
// heights — travel sideways past it. Each photo also drifts a little inside its frame
// (parallax), and a huge faint italic word slides behind them at a slower speed. A
// counter and hairline show progress.
// Every photo enters with a curtain: it's uncovered from the bottom while the image
// settles from a slight zoom.
// Phones / reduced motion: no pinning — a swipeable row with the same collage feel.

type Props = { photos: string[]; isIndonesian: boolean; onOpen: (src: string) => void };

// collage layout per photo: width (vw on desktop) and vertical offset (vh)
const LAYOUT = [
  { w: 30, ratio: '3 / 4', y: -6 },
  { w: 24, ratio: '4 / 5', y: 9 },
  { w: 33, ratio: '4 / 5', y: -3 },
  { w: 25, ratio: '3 / 4', y: 7 },
];

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

const EventGallery: React.FC<Props> = ({ photos, isIndonesian, onOpen }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [pinned, setPinned] = useState(false);      // desktop + motion allowed
  const [height, setHeight] = useState<number | null>(null);
  const [shown, setShown] = useState(false);        // curtains lifted
  const [active, setActive] = useState(0);          // counter

  // pin only on wide screens with motion allowed
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
    const on = () => setPinned(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // the outer box is as tall as the sideways distance, so the pin lasts exactly that long
  useLayoutEffect(() => {
    if (!pinned) { setHeight(null); return; }
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const travel = Math.max(0, track.scrollWidth - window.innerWidth);
      setHeight(window.innerHeight + travel);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [pinned, photos.length]);

  // scroll → sideways position, word drift, photo parallax, progress (imperative, no re-render per frame)
  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const outer = outerRef.current, track = trackRef.current;
      if (!outer || !track) return;
      const r = outer.getBoundingClientRect();
      const range = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / range));
      const travel = Math.max(0, track.scrollWidth - window.innerWidth);
      track.style.transform = `translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
      if (wordRef.current) wordRef.current.style.transform = `translate3d(${(-p * travel * 0.35).toFixed(1)}px,0,0)`;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      imgRefs.current.forEach((img, i) => {
        if (!img) return;
        const box = img.parentElement!.getBoundingClientRect();
        const c = (box.left + box.width / 2) / window.innerWidth - 0.5; // -0.5 … 0.5 across the screen
        img.style.transform = `translate3d(${(-c * 8).toFixed(2)}%,0,0) scale(1.12)`;
      });
      setActive((a) => {
        const n = Math.min(photos.length - 1, Math.round(p * (photos.length - 1)));
        return n === a ? a : n;
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [pinned, photos.length, height]);

  // curtains lift when the band comes into view
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const el = outerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setShown(true);
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const word = isIndonesian ? 'Momen' : 'Moments';
  const label = isIndonesian ? 'Di balik meja tarot' : 'From the reading table';

  const photo = (src: string, i: number) => {
    const L = LAYOUT[i % LAYOUT.length];
    return (
      <button
        key={src}
        type="button"
        onClick={() => onOpen(src)}
        aria-label={isIndonesian ? `Lihat foto event ${i + 1}` : `View event photo ${i + 1}`}
        className="group relative shrink-0 overflow-hidden rounded-[1.25rem] bg-white/5 snap-center"
        style={{
          width: pinned ? `${L.w}vw` : `${Math.round(L.w * 2.3)}vw`,
          aspectRatio: L.ratio,
          transform: pinned ? `translateY(${L.y}vh)` : undefined,
          // curtain: uncovered from the bottom
          clipPath: shown ? 'inset(0% 0% 0% 0% round 1.25rem)' : 'inset(100% 0% 0% 0% round 1.25rem)',
          transition: `clip-path 1200ms ${EASE} ${i * 140}ms`,
        }}
      >
        <img
          ref={(el) => { imgRefs.current[i] = el; }}
          src={src}
          alt={isIndonesian ? `Sesi tarot Mayanov di event ${i + 1}` : `Mayanov tarot session at event ${i + 1}`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
          style={{
            transform: shown ? 'scale(1.12)' : 'scale(1.3)',
            transition: pinned ? `transform 1400ms ${EASE} ${i * 140}ms` : `transform 1400ms ${EASE} ${i * 140}ms`,
          }}
        />
        {/* violet duotone that clears on hover, and the index in the corner */}
        <span className="pointer-events-none absolute inset-0 bg-plum mix-blend-color opacity-35 group-hover:opacity-0 transition-opacity duration-500" />
        <span className="pointer-events-none absolute left-4 bottom-3 font-elegant italic text-cream/80 text-sm tabular-nums [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">
          {String(i + 1).padStart(2, '0')}
        </span>
      </button>
    );
  };

  // drop the entrance transition on the image once it's settled, so parallax isn't eased
  useEffect(() => {
    if (!shown || !pinned) return;
    const t = window.setTimeout(() => imgRefs.current.forEach((img) => { if (img) img.style.transition = 'none'; }), 1400 + photos.length * 140);
    return () => clearTimeout(t);
  }, [shown, pinned, photos.length]);

  if (!pinned) {
    // phones / reduced motion — a swipeable collage row
    return (
      <div ref={outerRef} className="bg-[#2A2258] text-cream pt-16 pb-12">
        <p className="px-8 font-elegant italic text-[#C9B8E8] text-base">{label}</p>
        <div className="mt-6 flex items-center gap-4 overflow-x-auto snap-x snap-mandatory px-8 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((src, i) => (
            <div key={src} style={{ marginTop: i % 2 ? '2.5rem' : 0 }}>{photo(src, i)}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={outerRef} className="relative bg-[#2A2258] text-cream" style={{ height: height ?? '100vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* the huge faint word, drifting slower than the photos */}
        <div ref={wordRef} aria-hidden className="absolute left-[6vw] top-1/2 -translate-y-1/2 whitespace-nowrap font-elegant italic font-medium text-cream/[0.05] leading-none select-none will-change-transform" style={{ fontSize: '30vw' }}>
          {word} {word}
        </div>

        <p className="absolute left-8 top-24 font-elegant italic text-[#C9B8E8] text-lg">{label}</p>

        <div className="absolute inset-0 flex items-center">
          <div ref={trackRef} className="flex items-center gap-[4vw] pl-[30vw] pr-[12vw] will-change-transform">
            {photos.map(photo)}
          </div>
        </div>

        {/* progress — counter + hairline */}
        <div className="absolute left-8 right-8 bottom-10 flex items-center gap-5">
          <span className="font-elegant italic text-cream/80 text-sm tabular-nums">
            {String(active + 1).padStart(2, '0')} <span className="text-cream/40">/ {String(photos.length).padStart(2, '0')}</span>
          </span>
          <span className="relative h-px flex-1 bg-cream/15 overflow-hidden">
            <span ref={barRef} className="absolute inset-0 origin-left bg-[#C9B8E8]" style={{ transform: 'scaleX(0)' }} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventGallery;
