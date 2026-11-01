import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import FadeIn from '../UI/FadeIn';
import CelestialMark from '../UI/CelestialMark';
import WatercolorSky, { MIDNIGHT } from '../Layout/WatercolorSky';

interface InterludeProps {
  isIndonesian?: boolean;
}

// what people actually come with, for the visitor who's just seen the prices and
// doesn't know what they'd ask. `big` ones are set larger, so the run doesn't read
// as a list; `y` nudges each off the line a little (desktop), like notes jotted down
const QUESTIONS: { id: string; en: string; big?: boolean; y: number }[] = [
  { id: 'Apakah aku harus pindah kerja tahun ini?', en: 'Should I change jobs this year?', big: true, y: -6 },
  { id: 'Ke mana arah hubunganku sama dia?', en: 'Where is this relationship going?', y: 10 },
  { id: 'Kenapa aku merasa stuck?', en: 'Why do I feel stuck?', y: -2 },
  { id: 'Apa yang sebenarnya aku butuhkan sekarang?', en: 'What do I actually need right now?', big: true, y: 8 },
  { id: 'Gimana cara menghadapi keputusan ini?', en: 'How do I face this decision?', y: -8 },
  { id: 'Apa yang perlu aku lepaskan?', en: 'What do I need to let go of?', big: true, y: 4 },
];

/**
 * The questions as a constellation: each one hangs under its own star, and the stars
 * along a row are joined in faint pencil, drawn in as the band comes into view (rows
 * aren't joined to each other, so no line runs through the words). On a phone the
 * questions stack, one star each, unjoined.
 */
const Constellation: React.FC<{ isIndonesian: boolean }> = ({ isIndonesian }) => {
  const boxRef = useRef<HTMLUListElement>(null);
  const starRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [lines, setLines] = useState<[number, number, number, number][]>([]);
  const [drawn, setDrawn] = useState(false);

  // join neighbouring stars that sit on the same row
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      // laid-out positions (offsets, not the screen rect), so the fade-ins' own
      // movement doesn't throw the lines off while they're still arriving
      const pts = starRefs.current.map((el) => {
        let x = el!.offsetWidth / 2, y = el!.offsetHeight / 2;
        for (let n: HTMLElement | null = el; n && n !== box; n = n.offsetParent as HTMLElement | null) {
          x += n.offsetLeft; y += n.offsetTop;
        }
        return { x, y };
      });
      const next: [number, number, number, number][] = [];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], c = pts[i];
        if (Math.abs(a.y - c.y) < 40 && c.x > a.x) next.push([a.x, a.y, c.x, c.y]);
      }
      setLines(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [isIndonesian]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(box);
    return () => io.disconnect();
  }, []);

  return (
    <ul ref={boxRef} className="relative mt-10 md:mt-14 flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-y-7 md:gap-y-12 md:gap-x-14">
      {/* the lines between the stars, a little in from each so they don't touch it */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-cream/30 [filter:url(#pencil-icon)]">
        {lines.map(([x1, y1, x2, y2], i) => {
          const len = Math.hypot(x2 - x1, y2 - y1), k = 14 / len;
          return (
            <line
              key={i}
              x1={x1 + (x2 - x1) * k} y1={y1 + (y2 - y1) * k}
              x2={x2 - (x2 - x1) * k} y2={y2 - (y2 - y1) * k}
              pathLength={1}
              stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="1"
              style={{ strokeDashoffset: drawn ? 0 : 1, transition: `stroke-dashoffset 1400ms cubic-bezier(0.65,0,0.35,1) ${500 + i * 260}ms` }}
            />
          );
        })}
      </svg>
      {QUESTIONS.map((q, i) => (
        <li key={q.id} className="contents">
          <FadeIn delay={120 + i * 110} dir="blur">
            <span style={{ ['--y' as string]: `${q.y}px` }} className="relative flex flex-col items-center md:top-[var(--y)]">
              <span ref={(el) => { starRefs.current[i] = el; }} className="relative mb-2.5">
                <CelestialMark name="sparkle" className={`${q.big ? 'w-3.5 text-cream/85' : 'w-2.5 text-cream/55'} [filter:drop-shadow(0_0_6px_rgba(240,232,255,0.55))]`} />
              </span>
              <span
                className={`block [text-wrap:balance] font-elegant italic leading-[1.2] tracking-[-0.01em] [text-shadow:0_3px_24px_rgba(6,4,14,0.5)] ${
                  q.big
                    ? 'text-cream text-[1.35rem] sm:text-[1.5rem] md:text-[1.75rem] lg:text-[2rem]'
                    : 'text-cream/75 text-[1.15rem] sm:text-[1.3rem] md:text-[1.45rem] lg:text-[1.6rem]'
                }`}
              >
                &ldquo;{isIndonesian ? q.id : q.en}&rdquo;
              </span>
            </span>
          </FadeIn>
        </li>
      ))}
    </ul>
  );
};

/**
 * A break of night sky between the pricelist and "why Mayanov": for whoever's
 * hovering over the prices without knowing what they'd even ask, a handful of the
 * questions people bring, scattered over the sky like notes, and the reassurance
 * that a story is enough to start with.
 */
const Interlude: React.FC<InterludeProps> = ({ isIndonesian = false }) => {
  return (
    <section
      id="interlude"
      className="relative overflow-hidden isolate text-cream py-24 md:py-32"
    >
      {/* a watercolour night sky — the footer's painting in a midnight palette */}
      <WatercolorSky palette={MIDNIGHT} className="absolute inset-0 -z-10" />
      {/* a light veil so the cream type keeps its contrast over the paler washes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg, rgba(8,12,34,0.12) 0%, rgba(8,12,34,0.22) 100%)' }} />

      <div className="mx-auto px-6 md:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <FadeIn className="flex flex-col items-center">
            <CelestialMark name="sun" className="w-10 md:w-[3.25rem] text-cream/80 [filter:drop-shadow(0_4px_28px_rgba(6,4,14,0.5))]" />
            <h2 className="mt-8 md:mt-10 [text-wrap:balance] font-elegant italic font-bold text-cream text-[2.3rem] sm:text-[3rem] md:text-[3.8rem] lg:text-[4.4rem] leading-[1.03] tracking-[-0.02em] [text-shadow:0_4px_30px_rgba(6,4,14,0.45)]">
              {isIndonesian ? 'Bingung mau tanya apa?' : 'Not sure what to ask?'}
            </h2>
            <p className="mt-4 md:mt-5 font-elegant italic text-cream/60 text-lg md:text-xl">
              {isIndonesian ? 'Misalnya…' : 'For instance…'}
            </p>
          </FadeIn>

          <Constellation isIndonesian={isIndonesian} />

          {/* and if none of those fit: just come and talk, signed by hand */}
          <FadeIn delay={200} className="mt-12 md:mt-16 flex flex-col items-center">
            <p className="font-elegant text-cream/85 text-lg md:text-[1.4rem] leading-snug max-w-[30ch] md:max-w-none">
              {isIndonesian
                ? <>Atau cukup cerita — kita cari pertanyaannya <em className="italic">bareng</em>.</>
                : <>Or just tell me what’s going on — we’ll find the question <em className="italic">together</em>.</>}
            </p>
            <span className="mt-2 inline-block py-[0.3em] -my-[0.3em] px-2 font-signature text-cream/90 text-[2.4rem] md:text-[2.8rem] leading-none">Mayanov</span>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default Interlude;
