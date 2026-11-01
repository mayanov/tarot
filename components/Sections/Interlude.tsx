import React from 'react';
import FadeIn from '../UI/FadeIn';
import PencilRule from '../UI/PencilRule';
import PencilArrow from '../UI/PencilArrow';
import ButtonInk from '../UI/ButtonInk';
import { btnPrimaryDark } from '../UI/buttons';
import WatercolorSky, { EVENING } from '../Layout/WatercolorSky';

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

// the booking form (BookingModal) opens on this event; a question goes into its
// "your question" field
const openBooking = (question?: string) =>
  window.dispatchEvent(new CustomEvent('open-booking', { detail: question ? { question } : {} }));

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
      {/* a watercolour evening sky, lighter than the hero's twilight */}
      <WatercolorSky palette={EVENING} className="absolute inset-0 -z-10" />
      {/* a soft shade behind each column only, so the cream type keeps its contrast
          over the pale washes without darkening the whole sky */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'radial-gradient(60% 70% at 28% 50%, rgba(30,20,70,0.22), transparent 70%), radial-gradient(55% 75% at 70% 50%, rgba(30,20,70,0.2), transparent 70%)' }} />

      <div className="relative z-10 mx-auto px-8 max-w-6xl grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-x-24 gap-y-14 lg:gap-y-10">
        {/* the question, and the reassurance */}
        <FadeIn dir="left" className="lg:self-end">
          <h2 className="[text-wrap:balance] font-elegant italic font-bold text-cream text-[2.5rem] sm:text-[3.2rem] md:text-[3.8rem] lg:text-[4.2rem] leading-[1.02] tracking-[-0.02em] [text-shadow:0_4px_30px_rgba(6,4,14,0.45)]">
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
                {i > 0 && <PencilRule weight="fine" className="text-cream/40" />}
                {/* the whole row books a reading with this question filled in: on hover
                    a pencil line is drawn under it and "ask this" shows (always shown on
                    touch screens, which have no hover) */}
                <button
                  type="button"
                  onClick={() => openBooking(t(item.q))}
                  className="group/q w-full text-left grid grid-cols-[2.75rem_minmax(0,1fr)] md:grid-cols-[3.5rem_minmax(0,1fr)] items-baseline py-6 md:py-7 focus-visible:outline-none"
                >
                  <span className="font-elegant italic text-cream/70 text-xl md:text-2xl [text-shadow:0_2px_16px_rgba(30,20,70,0.45)]">{ROMAN[i]}.</span>
                  <span className="block">
                    <span className="block font-elegant italic lowercase text-cream/75 text-base md:text-lg [text-shadow:0_2px_16px_rgba(30,20,70,0.45)]">{t(item.topic)}</span>
                    <span className="relative inline-block mt-1 font-elegant text-cream text-[1.35rem] sm:text-[1.5rem] md:text-[1.75rem] leading-[1.25] tracking-[-0.01em] [text-wrap:pretty] [text-shadow:0_3px_24px_rgba(6,4,14,0.45)]">
                      &ldquo;{t(item.q)}&rdquo;
                      <span aria-hidden className="absolute left-0 -bottom-1.5 h-3 w-full overflow-hidden [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover/q:[clip-path:inset(0_0_0_0)] group-focus-visible/q:[clip-path:inset(0_0_0_0)]">
                        <PencilRule fade="end" className="w-full text-cream/70" />
                      </span>
                    </span>
                    <span className="mt-2.5 flex items-center gap-1.5 font-elegant italic text-cream/85 text-[0.95rem] md:text-base opacity-0 -translate-x-1 transition-[opacity,transform] duration-500 group-hover/q:opacity-100 group-hover/q:translate-x-0 group-focus-visible/q:opacity-100 [@media(hover:none)]:opacity-75 [@media(hover:none)]:translate-x-0">
                      {isIndonesian ? 'Tanyakan ini' : 'Ask this'}
                      <PencilArrow className="w-3.5 h-3.5" />
                    </span>
                  </span>
                </button>
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
          <button type="button" onClick={() => openBooking()} className={`${btnPrimaryDark} mt-9 md:mt-10 inline-flex group gap-3 px-8 py-3.5 text-[1.05rem]`}>
            <ButtonInk kind="primary" tone="dark">
              {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
            </ButtonInk>
          </button>
        </FadeIn>
      </div>
    </section>
  );
};

export default Interlude;
