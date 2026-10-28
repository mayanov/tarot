import React, { useEffect, useRef, useState } from 'react';

// The photo band above "Event & collaboration": the photos as polaroid prints laid on
// the purple band — a paper border, a short caption in italic serif, each tilted at
// its own small angle. On scroll-in they drop into place one after another; hovering
// straightens a print and lifts it to the front. Row of four (2×2 on phones).

type Props = { photos: string[]; isIndonesian: boolean; onOpen: (src: string) => void };

// placeholder captions + tilt per print (swap in real event names when known)
const PRINTS = [
  { rot: -3.5, id: 'di balik meja', en: 'at the table' },
  { rot: 2.5, id: 'sesi bersama', en: 'reading together' },
  { rot: -1.5, id: 'malam event', en: 'event night' },
  { rot: 3, id: 'kartu terbuka', en: 'cards on the table' },
];
const EASE = 'cubic-bezier(0.16,1,0.3,1)';

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
    <div className="bg-[#2A2258] text-cream px-8 pt-16 md:pt-24 pb-20 md:pb-28">
      <p className="font-elegant italic text-[#C9B8E8] text-base md:text-lg">
        {isIndonesian ? 'Di balik meja tarot' : 'From the reading table'}
      </p>
      <div ref={ref} className="mt-8 md:mt-10 mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8 md:gap-x-8">
        {photos.map((src, i) => {
          const pr = PRINTS[i % PRINTS.length];
          return (
            <div
              key={src}
              className="relative hover:z-10"
              // the drop-in: from a little higher, more tilted, then settles at its own angle
              style={{
                transform: shown ? `rotate(${pr.rot}deg)` : `translateY(-36px) rotate(${pr.rot * 2.4}deg)`,
                opacity: shown ? 1 : 0,
                transition: `transform 1000ms ${EASE} ${i * 130}ms, opacity 600ms ease ${i * 130}ms`,
              }}
            >
              <button
                type="button"
                onClick={() => onOpen(src)}
                aria-label={isIndonesian ? `Lihat foto event ${i + 1}` : `View event photo ${i + 1}`}
                // hover cancels the print's tilt (--r) and lifts it
                className="group bg-paper block w-full p-2.5 md:p-3 pb-0 rounded-[3px] shadow-[0_22px_40px_-18px_rgba(8,5,22,0.75)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:[transform:rotate(var(--r))_translateY(-10px)_scale(1.04)]"
                style={{ ['--r' as any]: `${-pr.rot}deg` }}
              >
                <span className="relative block aspect-[4/5] overflow-hidden bg-ink/10">
                  <img
                    src={src}
                    alt={isIndonesian ? `Sesi tarot Mayanov di event ${i + 1}` : `Mayanov tarot session at event ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </span>
                <span className="block py-3 md:py-4 text-center font-elegant italic text-ink/75 text-[0.95rem] md:text-[1.05rem]">
                  {isIndonesian ? pr.id : pr.en}
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
