import React, { useEffect, useRef, useState } from 'react';

// The photo band above "Event & collaboration": the photos as polaroid prints laid
// loosely on the purple band, like prints on a table — each tilted at its own angle,
// at slightly different heights and overlapping a little, held by a strip of
// translucent tape. Photos carry a soft vintage tone that clears on hover, when the
// print also straightens and lifts forward. On scroll-in they drop into place one
// after another. A faint star dust on the band adds depth.

type Props = { photos: string[]; isIndonesian: boolean; onOpen: (src: string) => void };

// per print: tilt, vertical offset (desktop), tape angle + side, caption
const PRINTS = [
  { rot: -4, y: 0, tape: -8, tapeX: '38%', id: 'di balik meja', en: 'at the table' },
  { rot: 3, y: 2.5, tape: 6, tapeX: '52%', id: 'sesi bersama', en: 'reading together' },
  { rot: -2, y: -1, tape: -4, tapeX: '45%', id: 'malam event', en: 'event night' },
  { rot: 4, y: 2, tape: 9, tapeX: '40%', id: 'kartu terbuka', en: 'cards on the table' },
];
const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const BOUNCE = 'cubic-bezier(0.34,1.4,0.5,1)';

// a fixed sprinkle of faint stars for the band (seeded, so it never changes)
const STARS = (() => {
  let t = 777;
  const r = () => { t = (t * 16807) % 2147483647; return t / 2147483647; };
  return Array.from({ length: 60 }, () => {
    const x = (r() * 100).toFixed(2), y = (r() * 100).toFixed(2);
    const rad = (0.5 + r() * 1).toFixed(2), o = (0.2 + r() * 0.45).toFixed(2);
    return `radial-gradient(${rad}px ${rad}px at ${x}% ${y}%, rgba(255,255,255,${o}) 0%, rgba(255,255,255,0) 60%)`;
  }).join(',');
})();

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
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative isolate overflow-hidden bg-[#2A2258] text-cream px-6 md:px-8 pt-20 md:pt-28 pb-20 md:pb-28">
      <div aria-hidden className="absolute inset-0 -z-10 opacity-60" style={{ backgroundImage: STARS }} />
      <div ref={ref} className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-0">
        {photos.map((src, i) => {
          const pr = PRINTS[i % PRINTS.length];
          return (
            <div
              key={src}
              // desktop: the prints overlap a little (negative margins) and sit at
              // different heights; the drop-in lands with a small bounce
              className="relative hover:z-20 md:-mx-3"
              style={{
                zIndex: 10 - Math.abs(i - 1.5) * 2,
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
                // hover cancels the print's tilt (--r), lifts it and deepens the shadow
                className="group relative bg-paper block w-full p-2.5 md:p-3 pb-0 rounded-[3px] shadow-[0_18px_34px_-16px_rgba(8,5,22,0.75)] transition-[transform,box-shadow] duration-500 hover:shadow-[0_34px_60px_-20px_rgba(8,5,22,0.85)] hover:[transform:rotate(var(--r))_translateY(-12px)_scale(1.05)]"
                style={{ ['--r' as any]: `${-pr.rot}deg`, transitionTimingFunction: EASE }}
              >
                {/* a strip of translucent tape holding the print */}
                <span
                  aria-hidden
                  className="absolute -top-3 z-10 h-6 w-20 md:w-24 -translate-x-1/2 rounded-[2px] bg-[#E6DCF5]/55 backdrop-blur-[1px] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                  style={{ left: pr.tapeX, transform: `translateX(-50%) rotate(${pr.tape}deg)` }}
                />
                <span className="relative block aspect-[4/5] overflow-hidden bg-ink/10">
                  <img
                    src={src}
                    alt={isIndonesian ? `Sesi tarot Mayanov di event ${i + 1}` : `Mayanov tarot session at event ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    // soft vintage tone that clears on hover
                    className="absolute inset-0 w-full h-full object-cover [filter:sepia(0.22)_saturate(0.85)_contrast(1.05)] group-hover:[filter:none] transition-[filter,transform] duration-700 group-hover:scale-[1.03]"
                  />
                  {/* a gentle inner vignette, like a printed photo */}
                  <span aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(30,18,50,0.25)]" />
                </span>
                <span className="flex items-baseline justify-between gap-2 px-1 py-3 md:py-4">
                  <span className="font-elegant italic text-ink/75 text-[0.95rem] md:text-[1.05rem]">{isIndonesian ? pr.id : pr.en}</span>
                  <span className="font-elegant italic text-moon/70 text-xs tabular-nums">{String(i + 1).padStart(2, '0')}</span>
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
