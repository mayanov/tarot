import React, { useEffect, useRef, useState } from 'react';
import CelestialMark from '../UI/CelestialMark';
import CardStock from '../UI/CardStock';
import CardWash, { DECK_WASH } from '../UI/CardWash';
import { PaperShadow, paperCut } from '../UI/PaperEdge';

// The photo band above "Event & collaboration": the photos as tarot cards dealt
// loosely on the paper — a tarot card like the About portrait, in the same twilight plum (numeral at
// the head, framed photo, title) — each tilted at its own angle, at slightly different
// heights and overlapping a little. Photos carry a soft vintage tone that clears on
// hover, when the card also straightens and lifts forward. On scroll-in they're dealt
// one after another, with soft real shadows.

type Props = { photos: string[]; isIndonesian: boolean };

// per card: tilt, vertical offset, numeral, caption (every card is the deck's twilight
// plum, DECK_WASH[1], like the About portrait)
const PRINTS = [
  { rot: -4, y: 0, n: 'I', id: 'di balik meja', en: 'at the table' },
  { rot: 3, y: 2.5, n: 'II', id: 'sesi bersama', en: 'reading together' },
  { rot: -2, y: -1, n: 'III', id: 'malam event', en: 'event night' },
  { rot: 4, y: 2, n: 'IV', id: 'kartu terbuka', en: 'cards on the table' },
];
const EASE = 'cubic-bezier(0.16,1,0.3,1)';
// Everything on the card face is sized in container units (cqw) against a 256px-wide
// card, as the pricelist cards are, so a card is the same drawing scaled at any width:
// the photo window keeps one shape and the caption never wraps, phone to desktop.
const cq = (px: number) => `${(px / 2.56).toFixed(3)}cqw`;
const BOUNCE = 'cubic-bezier(0.34,1.4,0.5,1)';


const EventGallery: React.FC<Props> = ({ photos, isIndonesian }) => {
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
      <div ref={ref} className="mx-auto w-full sm:w-[92%] max-w-[76rem] grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 lg:gap-x-0">
        {photos.map((src, i) => {
          const pr = PRINTS[i % PRINTS.length];
          return (
            <div
              key={src}
              // desktop: the prints overlap a little (negative margins) and sit at
              // different heights; the drop-in lands with a small bounce
              // stacking: the middle prints sit on top by default (--z); the hovered print
              // always comes to the front (a class, so it can override the default)
              className="group/print relative self-start z-[var(--z)] hover:z-30 lg:-mx-1"
              style={{
                ['--z' as any]: 10 - Math.abs(i - 1.5) * 2,
                ['--r' as any]: `${-pr.rot}deg`,
                marginTop: `${pr.y}rem`,
                transform: shown ? `rotate(${pr.rot}deg)` : `translateY(-48px) rotate(${pr.rot * 2.5}deg) scale(1.06)`,
                opacity: shown ? 1 : 0,
                transition: `transform 1100ms ${BOUNCE} ${i * 140}ms, opacity 500ms ease ${i * 140}ms`,
              }}
            >
              {/* lying on the page; picked up on hover, it straightens and lifts: the
                  resting shadow fades and one wide, very soft shadow takes its place */}
              <PaperShadow radius="1rem" className="transition-opacity duration-500 group-hover/print:opacity-0" />
              <span
                aria-hidden
                className="pointer-events-none absolute -z-10 inset-[10%_8%_3%_8%] rounded-[1rem] bg-[rgba(38,24,34,0.3)] blur-[18px] opacity-0 transition-opacity duration-500 group-hover/print:opacity-100 [transform:rotate(var(--r))_translateY(10px)]"
              />
              <div
                // a tarot card's 5:8, like the pricelist cards (the photo takes the height
                // left after the head and foot); hover cancels the card's tilt (--r) and
                // brings it a little closer (grows in place, so nothing under it is
                // uncovered); its edge is hand-cut (paperCut)
                className="group relative flex aspect-[5/8] w-full flex-col rounded-[1rem] [container-type:inline-size] transition-transform duration-500 group-hover/print:[transform:rotate(var(--r))_scale(1.045)]"
                style={{ transitionTimingFunction: EASE, ...paperCut(31 + i * 17, 16, 20) }}
              >
                {/* the card's face, painted in watercolour */}
                <CardWash colors={DECK_WASH[1]} />
                {/* inner frame */}
                {/* (the card is the size container, so its own padding can't be in cqw: the
                    frame is inset by a margin instead) */}
                <span className="relative flex min-h-0 flex-1 flex-col" style={{ margin: cq(10), padding: `${cq(6)} ${cq(8)} ${cq(10)}` }}>
                <span aria-hidden className="print-ink pointer-events-none absolute inset-0 ring-1 ring-white/[0.16]" style={{ borderRadius: cq(11) }} />
                {/* head: the card's numeral between two rules */}
                <span aria-hidden className="print-ink flex items-center justify-center text-cream/60" style={{ gap: cq(8), paddingBottom: cq(6) }}>
                  <span className="h-px bg-gradient-to-r from-transparent to-current opacity-60" style={{ width: cq(24) }} />
                  <span className="font-elegant italic leading-none tracking-[0.12em]" style={{ fontSize: cq(13.6) }}>{pr.n}</span>
                  <span className="h-px bg-gradient-to-l from-transparent to-current opacity-60" style={{ width: cq(24) }} />
                </span>
                <span className="relative block min-h-0 flex-1 overflow-hidden bg-ink/10" style={{ borderRadius: cq(5) }}>
                  <img
                    src={src}
                    alt={isIndonesian ? `Sesi tarot Mayanov di event ${i + 1}` : `Mayanov tarot session at event ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    // soft vintage tone that clears on hover
                    className="absolute inset-0 w-full h-full object-cover [filter:sepia(0.22)_saturate(0.85)_contrast(1.05)] group-hover:[filter:none] transition-[filter] duration-700"
                  />
                  {/* a gentle inner vignette, like a printed photo */}
                  <span aria-hidden className="print-ink pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" style={{ borderRadius: cq(5), boxShadow: `inset 0 0 ${cq(40)} rgba(30,18,50,0.25)` }} />
                </span>
                {/* foot: the title, set like a card name */}
                <span className="flex items-center justify-center text-center" style={{ gap: cq(8), paddingTop: cq(12) }}>
                  <span className="block shrink-0" style={{ width: cq(8) }}><CelestialMark name="sparkle" className="print-ink block w-full text-cream/50" /></span>
                  <span className="letterpress on-dark whitespace-nowrap font-elegant font-semibold uppercase tracking-[0.24em] text-cream/90 pl-[0.2em]" style={{ fontSize: cq(11.5) }}>{isIndonesian ? pr.id : pr.en}</span>
                  <span className="block shrink-0" style={{ width: cq(8) }}><CelestialMark name="sparkle" className="print-ink block w-full text-cream/50" /></span>
                </span>
                </span>
                {/* printed on tarot card stock */}
                <CardStock />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventGallery;
