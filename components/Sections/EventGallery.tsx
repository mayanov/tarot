import React, { useEffect, useRef, useState } from 'react';

// The photo band above "Event & collaboration" — kept simple: a row of four photos
// (2×2 on phones) on the purple band. Small touches keep it from feeling flat:
// alternate photos sit a little lower, each is uncovered with a gentle curtain one
// after another, a small italic label sits above, and each photo carries its number.

type Props = { photos: string[]; isIndonesian: boolean; onOpen: (src: string) => void };

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
      <div ref={ref} className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => onOpen(src)}
            aria-label={isIndonesian ? `Lihat foto event ${i + 1}` : `View event photo ${i + 1}`}
            // every other photo sits a little lower, for rhythm
            className={`group relative block w-full aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-white/5 ${i % 2 ? 'translate-y-6 md:translate-y-10' : ''}`}
            style={{
              clipPath: shown ? 'inset(0% 0% 0% 0% round 1.25rem)' : 'inset(100% 0% 0% 0% round 1.25rem)',
              transition: `clip-path 1100ms ${EASE} ${i * 120}ms`,
            }}
          >
            <img
              src={src}
              alt={isIndonesian ? `Sesi tarot Mayanov di event ${i + 1}` : `Mayanov tarot session at event ${i + 1}`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1300ms] group-hover:scale-[1.04]"
              style={{ transform: shown ? undefined : 'scale(1.15)', transitionTimingFunction: EASE }}
            />
            {/* soft violet duotone that clears on hover */}
            <span className="pointer-events-none absolute inset-0 bg-plum mix-blend-color opacity-35 group-hover:opacity-0 transition-opacity duration-500" />
            <span className="pointer-events-none absolute left-4 bottom-3 font-elegant italic text-cream/85 text-sm tabular-nums [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">
              {String(i + 1).padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventGallery;
