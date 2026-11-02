import React from 'react';
import FadeIn from '../UI/FadeIn';
import PencilRule from '../UI/PencilRule';
import ButtonInk from '../UI/ButtonInk';
import { btnPrimaryDark } from '../UI/buttons';
import WatercolorSky, { EVENING } from '../Layout/WatercolorSky';

interface InterludeProps {
  isIndonesian?: boolean;
}

// what people actually come with, for the visitor who's just seen the prices and
// doesn't know what they'd ask; each with the part of life it's about, pencilled
// beside it (the pencil face is subset in index.html: add letters there if these change)
const QUESTIONS: { topic: [string, string]; q: [string, string] }[] = [
  { topic: ['karier', 'career'], q: ['Apakah aku harus pindah kerja tahun ini?', 'Should I change jobs this year?'] },
  { topic: ['hubungan', 'love'], q: ['Ke mana arah hubunganku sama dia?', 'Where is this relationship going?'] },
  { topic: ['diri', 'self'], q: ['Kenapa aku merasa stuck akhir-akhir ini?', 'Why do I feel so stuck lately?'] },
  { topic: ['keputusan', 'choices'], q: ['Pilihan mana yang paling selaras untukku?', 'Which choice sits right with me?'] },
  { topic: ['melepaskan', 'letting go'], q: ['Apa yang perlu aku lepaskan?', 'What do I need to let go of?'] },
];

// The sky's top and bottom edges as a wash leaves them on paper: a mask whose edge
// wanders (low noise pushing it about), softened, with a paler fringe of pigment run
// ahead of it. One tile of each, repeated across (the noise stitched so the tiles
// meet), with the middle of the section solid between them.
const EDGE = 180;
const washEdge = (seed: number, flip: boolean) => {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='${EDGE}' viewBox='0 0 1200 ${EDGE}'>` +
    `<filter id='w' x='-10%' y='-60%' width='120%' height='220%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='0.006 0.009' numOctaves='4' seed='${seed}' stitchTiles='stitch' result='n'/>` +
    `<feDisplacementMap in='SourceGraphic' in2='n' scale='90' xChannelSelector='R' yChannelSelector='G'/>` +
    `<feGaussianBlur stdDeviation='9'/>` +
    `</filter>` +
    `<filter id='f' x='-10%' y='-60%' width='120%' height='220%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='0.01 0.014' numOctaves='3' seed='${seed + 3}' stitchTiles='stitch' result='n'/>` +
    `<feDisplacementMap in='SourceGraphic' in2='n' scale='110' xChannelSelector='G' yChannelSelector='R'/>` +
    `<feGaussianBlur stdDeviation='16'/>` +
    `</filter>` +
    `<g${flip ? ` transform='translate(0 ${EDGE}) scale(1 -1)'` : ''}>` +
    `<rect x='-200' y='40' width='1600' height='400' fill='white' fill-opacity='0.35' filter='url(#f)'/>` +
    `<rect x='-200' y='85' width='1600' height='400' fill='white' filter='url(#w)'/>` +
    `</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
const washMask = [
  `${washEdge(5, false)} top / 1200px ${EDGE}px repeat-x`,
  `${washEdge(17, true)} bottom / 1200px ${EDGE}px repeat-x`,
  `linear-gradient(#000, #000) center / 100% calc(100% - ${EDGE * 2 - 8}px) no-repeat`,
].join(', ');
const washEdges: React.CSSProperties = { WebkitMask: washMask, mask: washMask };

// the booking form (BookingModal) opens on this event
const openBooking = () => window.dispatchEvent(new CustomEvent('open-booking'));

/**
 * A break of night sky between the pricelist and "why Mayanov", for whoever's
 * hovering over the prices without knowing what they'd even ask. Set like a page
 * of a book: the question and its reassurance on the left; on the right a short
 * list of the questions people bring, ruled off in pencil.
 */
const Interlude: React.FC<InterludeProps> = ({ isIndonesian = false }) => {
  const t = (pair: [string, string]) => (isIndonesian ? pair[0] : pair[1]);
  return (
    <section
      id="interlude"
      className="relative overflow-hidden isolate text-cream py-36 md:py-44"
    >
      {/* a watercolour evening sky, lighter than the hero's twilight, its top and bottom
          left as the wash's own ragged, bleeding edge into the paper rather than cut
          straight across (washEdges) */}
      <div aria-hidden className="absolute inset-0 -z-10" style={washEdges}>
        <WatercolorSky palette={EVENING} className="absolute inset-0" />
        {/* a soft shade behind each column only, so the cream type keeps its contrast
            over the pale washes without darkening the whole sky (the type is pressed
            like the rest of the site's, so it carries no glow of its own) */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 70% at 28% 50%, rgba(30,20,70,0.3), transparent 72%), radial-gradient(55% 75% at 70% 50%, rgba(30,20,70,0.28), transparent 70%)' }} />
      </div>

      <div className="relative z-10 mx-auto px-8 max-w-6xl grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-x-24 gap-y-14 lg:gap-y-10">
        {/* the question, and the reassurance */}
        <FadeIn dir="left" className="lg:self-end">
          <h2 className="letterpress-lg pb-[0.14em] -mb-[0.14em] [text-wrap:balance] font-elegant italic font-bold text-cream text-[2.5rem] sm:text-[3.2rem] md:text-[3.8rem] lg:text-[4.2rem] leading-[1.02] tracking-[-0.02em]">
            {isIndonesian ? 'Bingung mau tanya apa?' : 'Not sure what to ask?'}
          </h2>
          {/* pressed with the heading's own impression, so the two read as one voice */}
          <p className="letterpress-lg mt-6 md:mt-7 max-w-[34ch] font-elegant text-cream text-lg md:text-[1.35rem] leading-[1.5]">
            {isIndonesian
              ? 'Kamu nggak perlu datang dengan pertanyaan yang sempurna. Ini beberapa yang sering dibawa ke meja, atau cukup cerita, kita cari pertanyaannya bareng.'
              : 'You don’t need the perfect question. Here are a few that often come to the table, or just tell me what’s going on and we’ll find it together.'}
          </p>
        </FadeIn>

        {/* the questions, ruled off in pencil */}
        <ol className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
          {QUESTIONS.map((item, i) => (
            <li key={item.q[0]}>
              <FadeIn delay={i * 110} dir="up" distance={0.5}>
                {i > 0 && <PencilRule weight="fine" className="text-cream/40" />}
                {/* labelled by hand in pencil, like a note in the margin */}
                <div className="py-6 md:py-7">
                  <div>
                    <span className="inline-block -rotate-2 font-['Reenie_Beanie',cursive] text-cream/90 text-[1.75rem] md:text-[2.05rem] leading-none [filter:url(#pencil-icon)]">{t(item.topic)}</span>
                    <p className="letterpress-lg mt-1 font-elegant text-cream text-[1.35rem] sm:text-[1.5rem] md:text-[1.75rem] leading-[1.25] tracking-[-0.01em] [text-wrap:pretty]">
                      &ldquo;{t(item.q)}&rdquo;
                    </p>
                  </div>
                </div>
              </FadeIn>
            </li>
          ))}
        </ol>

        {/* the way in (after the list on a phone, under the heading beside it on a
            wide screen) */}
        <FadeIn dir="left" delay={150} className="lg:col-start-1 lg:row-start-2 lg:self-start">
          <button type="button" onClick={openBooking} className={`${btnPrimaryDark} inline-flex group gap-3 px-8 py-3.5 text-[1.05rem]`}>
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
