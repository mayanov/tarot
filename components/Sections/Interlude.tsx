import React from 'react';
import FadeIn from '../UI/FadeIn';
import CelestialMark from '../UI/CelestialMark';
import PencilRule from '../UI/PencilRule';
import WatercolorSky, { MIDNIGHT } from '../Layout/WatercolorSky';

interface InterludeProps {
  isIndonesian?: boolean;
}

// what people actually come with, for the visitor who's just seen the prices and
// doesn't know what they'd ask; each under the part of life it's about
const QUESTIONS: { topic: [string, string]; q: [string, string] }[] = [
  { topic: ['karier', 'career'], q: ['Apakah aku harus pindah kerja tahun ini?', 'Should I change jobs this year?'] },
  { topic: ['hubungan', 'love'], q: ['Ke mana arah hubunganku sama dia?', 'Where is this relationship going?'] },
  { topic: ['diri', 'self'], q: ['Kenapa aku merasa stuck akhir-akhir ini?', 'Why do I feel so stuck lately?'] },
  { topic: ['keputusan', 'choices'], q: ['Pilihan mana yang paling selaras untukku?', 'Which choice sits right with me?'] },
  { topic: ['melepaskan', 'letting go'], q: ['Apa yang perlu aku lepaskan?', 'What do I need to let go of?'] },
];

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v'];

/**
 * A break of night sky between the pricelist and "why Mayanov", for whoever's
 * hovering over the prices without knowing what they'd even ask. Set like a page
 * of a book: the question and its reassurance on the left; on the right a short
 * numbered list of the questions people bring, each under the part of life it's
 * about, ruled off in pencil.
 */
const Interlude: React.FC<InterludeProps> = ({ isIndonesian = false }) => {
  const t = (pair: [string, string]) => (isIndonesian ? pair[0] : pair[1]);
  return (
    <section
      id="interlude"
      className="relative overflow-hidden isolate text-cream py-24 md:py-32"
    >
      {/* a watercolour night sky — the footer's painting in a midnight palette */}
      <WatercolorSky palette={MIDNIGHT} className="absolute inset-0 -z-10" />
      {/* a light veil so the cream type keeps its contrast over the paler washes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg, rgba(8,12,34,0.12) 0%, rgba(8,12,34,0.22) 100%)' }} />

      <div className="relative z-10 mx-auto px-8 max-w-6xl grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-x-24 gap-y-14 lg:gap-y-10">
        {/* the question, and the reassurance */}
        <FadeIn dir="left" className="lg:self-end">
          <CelestialMark name="sun" className="w-9 md:w-11 text-cream/75 [filter:drop-shadow(0_4px_28px_rgba(6,4,14,0.5))]" />
          <h2 className="mt-7 md:mt-9 [text-wrap:balance] font-elegant italic font-bold text-cream text-[2.5rem] sm:text-[3.2rem] md:text-[3.8rem] lg:text-[4.2rem] leading-[1.02] tracking-[-0.02em] [text-shadow:0_4px_30px_rgba(6,4,14,0.45)]">
            {isIndonesian ? 'Bingung mau tanya apa?' : 'Not sure what to ask?'}
          </h2>
          <p className="mt-6 md:mt-7 max-w-[34ch] font-elegant text-cream/80 text-lg md:text-[1.35rem] leading-[1.5]">
            {isIndonesian
              ? 'Kamu nggak perlu datang dengan pertanyaan yang sempurna. Ini beberapa yang sering dibawa ke meja.'
              : 'You don’t need the perfect question. Here are a few that often come to the table.'}
          </p>
        </FadeIn>

        {/* the questions, numbered like a contents page and ruled off in pencil */}
        <ol className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
          {QUESTIONS.map((item, i) => (
            <li key={item.q[0]}>
              <FadeIn delay={i * 110} dir="up" distance={0.5}>
                {i > 0 && <PencilRule weight="fine" className="text-cream/25" />}
                <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] md:grid-cols-[3.5rem_minmax(0,1fr)] items-baseline py-6 md:py-7">
                  <span className="font-elegant italic text-[#C9B8E8]/80 text-xl md:text-2xl">{ROMAN[i]}.</span>
                  <div>
                    <span className="block font-elegant italic lowercase text-[#C9B8E8]/80 text-base md:text-lg">{t(item.topic)}</span>
                    <p className="mt-1 font-elegant text-cream text-[1.35rem] sm:text-[1.5rem] md:text-[1.75rem] leading-[1.25] tracking-[-0.01em] [text-wrap:pretty] [text-shadow:0_3px_24px_rgba(6,4,14,0.45)]">
                      &ldquo;{t(item.q)}&rdquo;
                    </p>
                  </div>
                </div>
              </FadeIn>
            </li>
          ))}
        </ol>

        {/* if none of those fit: just come and talk, signed by hand (after the list
            on a phone, under the heading beside it on a wide screen) */}
        <FadeIn dir="left" delay={150} className="lg:col-start-1 lg:row-start-2 lg:self-start">
          <p className="max-w-[30ch] font-elegant italic text-cream text-xl md:text-[1.6rem] leading-snug">
            {isIndonesian ? 'Atau cukup cerita, kita cari pertanyaannya bareng.' : 'Or just tell me what’s going on, and we’ll find the question together.'}
          </p>
          <div className="mt-3 flex items-center gap-3 text-cream/80">
            <PencilRule fade="start" className="w-6 text-cream/45" />
            <span className="inline-block py-[0.3em] -my-[0.3em] pr-3 font-signature text-[2.4rem] md:text-[2.8rem] leading-none">Mayanov</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Interlude;
