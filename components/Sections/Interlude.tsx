import React from 'react';
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

          {/* the questions, one after another across the sky */}
          <ul className="mt-10 md:mt-14 flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-y-5 md:gap-y-9 md:gap-x-12">
            {QUESTIONS.map((q, i) => (
              <li key={q.id} className="contents">
                <FadeIn delay={120 + i * 110} dir="blur">
                  <span
                    style={{ ['--y' as string]: `${q.y}px` }}
                    className={`block [text-wrap:balance] md:[transform:translateY(var(--y))] font-elegant italic leading-[1.2] tracking-[-0.01em] [text-shadow:0_3px_24px_rgba(6,4,14,0.5)] ${
                      q.big
                        ? 'text-cream text-[1.35rem] sm:text-[1.5rem] md:text-[1.75rem] lg:text-[2rem]'
                        : 'text-cream/75 text-[1.15rem] sm:text-[1.3rem] md:text-[1.45rem] lg:text-[1.6rem]'
                    }`}
                  >
                    &ldquo;{isIndonesian ? q.id : q.en}&rdquo;
                  </span>
                </FadeIn>
              </li>
            ))}
          </ul>

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
