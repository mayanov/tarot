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

// The sky's top and bottom edges brushed on the way the site's brushstroke wash is
// (WatercolorWash 'stroke'): the body of the sky ends in a few broad sweeps laid across
// it, their edges torn along the stroke, the paint pooled along their rims and
// streaked where the bristles ran dry and left the paper showing. Drawn as a mask (how
// much of the sky shows, so the strokes are the sky's own colours). One tile of each
// edge, repeated across (the noise stitched and the strokes wrapped round, so the
// tiles meet), the middle of the section solid between them.
const EDGE = 240;
const TILE = 1400;
const brush = (id: string, s: number, scale: number, streaks: boolean) =>
  `<filter id='${id}' x='-10%' y='-60%' width='120%' height='220%' color-interpolation-filters='sRGB'>` +
  `<feTurbulence type='fractalNoise' baseFrequency='0.0025 0.03' numOctaves='3' seed='${s}' stitchTiles='stitch' result='n'/>` +
  `<feDisplacementMap in='SourceGraphic' in2='n' scale='${scale}' xChannelSelector='R' yChannelSelector='G' result='d'/>` +
  `<feGaussianBlur in='d' stdDeviation='3' result='soft'/>` +
  `<feColorMatrix in='soft' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 40 0' result='shape'/>` +
  `<feMorphology in='shape' operator='erode' radius='5' result='er'/>` +
  `<feGaussianBlur in='er' stdDeviation='6' result='erb'/>` +
  `<feComposite in='shape' in2='erb' operator='out' result='band'/>` +
  `<feComposite in='soft' in2='band' operator='in' result='rim'/>` +
  `<feMerge result='m'><feMergeNode in='soft'/><feMergeNode in='rim'/></feMerge>` +
  (streaks
    ? `<feTurbulence type='fractalNoise' baseFrequency='0.005 0.09' numOctaves='3' seed='${s + 3}' stitchTiles='stitch' result='st'/>` +
      `<feColorMatrix in='st' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.6' result='sa'/>` +
      `<feComposite in='m' in2='sa' operator='in' result='m2'/>`
    : `<feMerge result='m2'><feMergeNode in='m'/></feMerge>`) +
  `<feTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='2' seed='${s + 2}' stitchTiles='stitch' result='g'/>` +
  `<feColorMatrix in='g' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.2 1.7' result='ga'/>` +
  `<feComposite in='m2' in2='ga' operator='in'/>` +
  `</filter>`;
const washEdge = (seed: number, flip: boolean) => {
  // the sweeps: long rounded strokes, scattered along and a little up and down the
  // edge, each wrapped round the tile so the next tile carries it on
  let r = seed * 9301 + 49297;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const sweeps = (n: number, y0: number, spread: number) => {
    let out = '';
    for (let i = 0; i < n; i++) {
      const w = TILE * (0.35 + rand() * 0.35);
      const x = (i / n) * TILE + rand() * 120;
      const y = y0 + rand() * spread;
      const h = 46 + rand() * 30;
      for (const dx of [-TILE, 0, TILE]) out += `<rect x='${(x + dx).toFixed(0)}' y='${y.toFixed(0)}' width='${w.toFixed(0)}' height='${h.toFixed(0)}' rx='${(h / 2).toFixed(0)}'/>`;
    }
    return out;
  };
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE}' height='${EDGE}' viewBox='0 0 ${TILE} ${EDGE}'>` +
    brush('b1', seed, 90, true) + brush('b2', seed + 20, 80, true) + brush('b3', seed + 40, 60, false) +
    `<g${flip ? ` transform='translate(0 ${EDGE}) scale(1 -1)'` : ''} fill='white'>` +
    `<g opacity='0.45' filter='url(#b1)'>${sweeps(4, 55, 30)}</g>` +
    `<g opacity='0.75' filter='url(#b2)'>${sweeps(5, 85, 25)}</g>` +
    `<rect x='-300' y='125' width='${TILE + 600}' height='400' filter='url(#b3)'/>` +
    `</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
const washMask = [
  `${washEdge(5, false)} top / ${TILE}px ${EDGE}px repeat-x`,
  `${washEdge(17, true)} bottom / ${TILE}px ${EDGE}px repeat-x`,
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
      className="relative overflow-hidden text-cream py-52 md:py-60"
    >
      {/* a watercolour evening sky, lighter than the hero's twilight, its top and bottom
          brushed out onto the paper rather than cut straight across (washEdges), and
          multiplied into the page's paper like pigment soaked into it, so the paper's
          grain runs on through the strokes (the section isn't isolated, so the blend
          reaches the paper laid behind the page) */}
      <div aria-hidden className="absolute inset-0 mix-blend-multiply" style={washEdges}>
        <WatercolorSky palette={EVENING} className="absolute inset-0" />
        {/* a soft shade behind each column only, so the cream type keeps its contrast
            over the pale washes without darkening the whole sky (the type is pressed
            like the rest of the site's, so it carries no glow of its own) */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 70% at 28% 50%, rgba(30,20,70,0.3), transparent 72%), radial-gradient(55% 75% at 70% 50%, rgba(30,20,70,0.28), transparent 70%)' }} />
        {/* the pigment thinning out toward the ends of the strokes, as a brush does
            when it runs out onto the paper (paper-coloured, so under the multiply it
            only pales the sky there) */}
        <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(243,241,236,0.62), rgba(243,241,236,0.28) ${EDGE * 0.55}px, transparent ${EDGE}px, transparent calc(100% - ${EDGE}px), rgba(243,241,236,0.28) calc(100% - ${EDGE * 0.55}px), rgba(243,241,236,0.62))` }} />
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
