import React, { useEffect, useRef, useState } from 'react';

// The photo band above "Event & collaboration": the photos as polaroid prints laid
// loosely on the purple band, like prints on a table — each tilted at its own angle,
// at slightly different heights and overlapping a little. Photos carry a soft vintage
// tone that clears on hover, when the print also straightens and lifts forward. On
// scroll-in they drop into place one after another.
// They rest on the page's own paper (no coloured band), with soft real shadows.

type Props = { photos: string[]; isIndonesian: boolean; onOpen: (src: string) => void };

// per print: tilt, vertical offset, caption
const PRINTS = [
  { rot: -4, y: 0, id: 'di balik meja', en: 'at the table' },
  { rot: 3, y: 2.5, id: 'sesi bersama', en: 'reading together' },
  { rot: -2, y: -1, id: 'malam event', en: 'event night' },
  { rot: 4, y: 2, id: 'kartu terbuka', en: 'cards on the table' },
];
const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const BOUNCE = 'cubic-bezier(0.34,1.4,0.5,1)';


const EventGallery: React.FC<Props> = ({ photos, isIndonesian, onOpen }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setShown(true);
    }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // on the page's own paper — no band — so the prints rest on the same surface
    // as Event & collaboration below
    <div className="relative px-6 md:px-8 pt-6 md:pt-8 pb-6 md:pb-10">
      <div ref={ref} className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-0">
        {photos.map((src, i) => {
          const pr = PRINTS[i % PRINTS.length];
          return (
            <div
              key={src}
              // desktop: the prints overlap a little (negative margins) and sit at
              // different heights; the drop-in lands with a small bounce
              // stacking: the middle prints sit on top by default (--z); the hovered print
              // always comes to the front (a class, so it can override the default)
              className="relative z-[var(--z)] hover:z-30 md:-mx-3"
              style={{
                ['--z' as any]: 10 - Math.abs(i - 1.5) * 2,
                marginTop: `${pr.y}rem`,
                transform: shown ? `rotate(${pr.rot}deg)` : `translateY(-48px) rotate(${pr.rot * 2.5}deg) scale(1.06)`,
                opacity: shown ? 1 : 0,
                transition: `transform 1100ms ${BOUNCE} ${i * 140}ms, opacity 500ms ease ${i * 140}ms`,
              }}
            >
              <button
                type="button"
                onClick={() => onOpen(src)}
                aria-label={isIndonesian ? `Lihat foto event ${i + 1}` : `View event photo ${i + 1}`}
                // hover cancels the print's tilt (--r) and lifts it (no zoom); deeper shadow
                className="group relative bg-plum block w-full p-2.5 md:p-3 pb-0 rounded-[3px] ring-1 ring-white/10 shadow-[0_14px_30px_-14px_rgba(42,24,57,0.55)] transition-[transform,box-shadow] duration-500 hover:shadow-[0_28px_50px_-18px_rgba(42,24,57,0.45)] hover:[transform:rotate(var(--r))_translateY(-10px)]"
                style={{ ['--r' as any]: `${-pr.rot}deg`, transitionTimingFunction: EASE }}
              >
                <span className="relative block aspect-[4/5] overflow-hidden bg-ink/10">
                  <img
                    src={src}
                    alt={isIndonesian ? `Sesi tarot Mayanov di event ${i + 1}` : `Mayanov tarot session at event ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    // soft vintage tone that clears on hover
                    className="absolute inset-0 w-full h-full object-cover [filter:sepia(0.22)_saturate(0.85)_contrast(1.05)] group-hover:[filter:none] transition-[filter] duration-700"
                  />
                  {/* a gentle inner vignette, like a printed photo */}
                  <span aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(30,18,50,0.25)]" />
                </span>
                <span className="flex items-baseline justify-between gap-2 px-1 py-3 md:py-4">
                  <span className="font-elegant italic text-[#E6DCF5] text-[0.95rem] md:text-[1.05rem]">{isIndonesian ? pr.id : pr.en}</span>
                  <span className="font-elegant italic text-[#C9B8E8]/70 text-xs tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventGallery;
