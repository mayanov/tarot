import React from 'react';
import { trackBookClick } from '../../services/analytics';
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
// beside it (the pencil face is cut down to the letters it needs: add any new ones in scripts/handwriting-fonts.mjs and run it)
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
// much of the sky shows, so the strokes are the sky's own colours), with
// a faint wet bleed running ahead so the wash fades in rather than starts. One
// tile of each edge, repeated across (the noise stitched and the strokes wrapped
// round, so the tiles meet), the middle of the section solid between them.
// drawn on a 240px-tall tile, laid down squeezed into EDGE so the band stays shallow
const DRAWN = 240;
const EDGE = 170;
const TILE = 1400;
// Every filter works over three tiles' width (the strokes are wrapped round into the
// tiles either side), but its noise is made over exactly one tile and repeated
// (feTile): noise stitched over the whole width repeats every three tiles, not every
// one, so one tile's right side didn't carry on into the next one's left (a straight
// break in the wash every 1400px on a wide screen)
const REGION = `filterUnits='userSpaceOnUse' x='${-TILE}' y='${-DRAWN}' width='${TILE * 3}' height='${DRAWN * 3}'`;
const noise = (attrs: string, result: string) =>
  `<feTurbulence type='fractalNoise' ${attrs} stitchTiles='stitch' x='0' y='${-DRAWN}' width='${TILE}' height='${DRAWN * 3}' result='${result}-1'/>` +
  `<feTile in='${result}-1' result='${result}'/>`;
const brush = (id: string, s: number, scale: number, streaks: boolean) =>
  `<filter id='${id}' ${REGION} color-interpolation-filters='sRGB'>` +
  noise(`baseFrequency='0.0025 0.03' numOctaves='3' seed='${s}'`, 'n') +
  `<feDisplacementMap in='SourceGraphic' in2='n' scale='${scale}' xChannelSelector='R' yChannelSelector='G' result='d'/>` +
  `<feGaussianBlur in='d' stdDeviation='3' result='soft'/>` +
  `<feColorMatrix in='soft' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 40 0' result='shape'/>` +
  `<feMorphology in='shape' operator='erode' radius='5' result='er'/>` +
  `<feGaussianBlur in='er' stdDeviation='6' result='erb'/>` +
  `<feComposite in='shape' in2='erb' operator='out' result='band'/>` +
  `<feComposite in='soft' in2='band' operator='in' result='rim'/>` +
  `<feComponentTransfer in='rim' result='rim2'><feFuncA type='linear' slope='0.9'/></feComponentTransfer>` +
  `<feMerge result='m'><feMergeNode in='soft'/><feMergeNode in='rim2'/></feMerge>` +
  (streaks
    ? noise(`baseFrequency='0.005 0.09' numOctaves='3' seed='${s + 3}'`, 'st') +
      `<feColorMatrix in='st' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.6' result='sa'/>` +
      `<feComposite in='m' in2='sa' operator='in' result='m2'/>`
    : `<feMerge result='m2'><feMergeNode in='m'/></feMerge>`) +
  noise(`baseFrequency='0.55' numOctaves='2' seed='${s + 2}'`, 'g') +
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
      for (const dx of [-TILE, 0, TILE]) out += `<ellipse cx='${(x + dx + w / 2).toFixed(0)}' cy='${(y + h / 2).toFixed(0)}' rx='${(w / 2).toFixed(0)}' ry='${(h / 2).toFixed(0)}'/>`;
    }
    return out;
  };
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE}' height='${DRAWN}' viewBox='0 0 ${TILE} ${DRAWN}' preserveAspectRatio='none'>` +
    brush('b1', seed, 90, true) + brush('b2', seed + 20, 80, true) +
    `<filter id='wb' ${REGION}>` +
    noise(`baseFrequency='0.004 0.02' numOctaves='3' seed='${seed + 7}'`, 'n') +
    `<feDisplacementMap in='SourceGraphic' in2='n' scale='90' xChannelSelector='R' yChannelSelector='G'/>` +
    `<feGaussianBlur stdDeviation='14'/>` +
    `</filter>` +
    // everything fades to nothing before the tile's outer side, so nothing is cut off
    // straight along the section's boundary
    `<linearGradient id='fo' x1='0' y1='${flip ? 1 : 0}' x2='0' y2='${flip ? 0 : 1}'><stop offset='0' stop-color='white' stop-opacity='0'/><stop offset='0.4' stop-color='white'/></linearGradient>` +
    `<mask id='fm' maskUnits='userSpaceOnUse' x='0' y='0' width='${TILE}' height='${DRAWN}'><rect width='${TILE}' height='${DRAWN}' fill='url(#fo)'/></mask>` +
    `<g mask='url(#fm)'>` +
    `<g${flip ? ` transform='translate(0 ${DRAWN}) scale(1 -1)'` : ''} fill='white'>` +
    `<g opacity='0.12' filter='url(#wb)'>${sweeps(5, 40, 70)}</g>` +
    `<g opacity='0.42' filter='url(#b1)'>${sweeps(5, 45, 75)}</g>` +
    `<g opacity='0.72' filter='url(#b2)'>${sweeps(6, 80, 45)}</g>` +
    `<rect x='-300' y='165' width='${TILE + 600}' height='400' filter='url(#wb)'/>` +
    `</g></g></svg>`;
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
  // the pricelist above lays its own sheet of paper, tiled from its own top; carry
  // that sheet on into this section, its tiles lined up with where the pricelist's
  // stop, so the grain runs straight on past the boundary instead of jumping
  const sectionRef = React.useRef<HTMLElement>(null);
  const [paperY, setPaperY] = React.useState(0);
  React.useLayoutEffect(() => {
    const prev = sectionRef.current?.previousElementSibling as HTMLElement | null;
    if (!prev) return;
    const align = () => setPaperY(-(prev.offsetHeight % 600)); // .bg-paper's tile is 600px
    align();
    const ro = new ResizeObserver(align);
    ro.observe(prev);
    return () => ro.disconnect();
  }, []);
  return (
    <section
      ref={sectionRef}
      id="interlude"
      className="relative overflow-hidden text-cream py-28 md:py-32"
    >
      {/* a watercolour evening sky, lighter than the hero's twilight, its top and bottom
          brushed out onto the paper rather than cut straight across (washEdges), and
          multiplied into the page's paper like pigment soaked into it, so the paper's
          grain runs on through the strokes (the section isn't isolated, so the blend
          reaches the paper laid behind the page) */}
      {/* (fading out under the sky, onto the page's own paper beneath) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 bg-paper"
        style={{ height: EDGE * 2.5, backgroundPosition: `center ${paperY}px`, WebkitMaskImage: `linear-gradient(#000 ${EDGE}px, transparent)`, maskImage: `linear-gradient(#000 ${EDGE}px, transparent)` }}
      />
      {/* and the same below: "why Mayanov" lays its own sheet from its top, which is
          this section's bottom, so a tile starts exactly there */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-paper"
        style={{ height: EDGE * 2.5, backgroundPosition: `center ${EDGE * 2.5}px`, WebkitMaskImage: `linear-gradient(to top, #000 ${EDGE}px, transparent)`, maskImage: `linear-gradient(to top, #000 ${EDGE}px, transparent)` }}
      />
      <div aria-hidden className="absolute inset-0 mix-blend-multiply" style={washEdges}>
        <WatercolorSky palette={EVENING} className="absolute inset-0" />
        {/* a soft shade behind each column only, so the cream type keeps its contrast
            over the pale washes without darkening the whole sky (the type is pressed
            like the rest of the site's, so it carries no glow of its own) */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 70% at 28% 50%, rgba(30,20,70,0.3), transparent 72%), radial-gradient(55% 75% at 70% 50%, rgba(30,20,70,0.28), transparent 70%)' }} />
        {/* the paint thinning toward the ends of the strokes, as a brush does when it runs
            out onto the paper: a pale tint of the sky's own lilac (not the paper's colour,
            which turns grey under the multiply) */}
        <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(222,214,246,0.7), rgba(222,214,246,0.3) ${EDGE * 0.6}px, transparent ${EDGE * 1.1}px, transparent calc(100% - ${EDGE * 1.1}px), rgba(222,214,246,0.3) calc(100% - ${EDGE * 0.6}px), rgba(222,214,246,0.7))` }} />
      </div>

      <div className="relative z-10 mx-auto px-8 max-w-6xl grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-x-24 gap-y-14 lg:gap-y-10">
        {/* the question, and the reassurance */}
        <FadeIn dir="left" className="lg:self-end">
          <h2 className="letterpress-lg pb-[0.14em] -mb-[0.14em] [text-wrap:balance] font-elegant italic font-bold text-cream text-[2.5rem] sm:text-[3.2rem] md:text-[3.8rem] lg:text-[4.2rem] leading-[1.02] tracking-[-0.02em]">
            {isIndonesian ? 'Bingung mau tanya apa?' : 'Not sure what to ask?'}
          </h2>
          {/* pressed with the heading's own impression, so the two read as one voice */}
          <p className="letterpress-lg mt-6 md:mt-7 max-w-[36rem] lg:max-w-[34ch] font-elegant text-cream text-lg md:text-[1.35rem] leading-[1.5]">
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
          <button type="button" onClick={() => { trackBookClick('interlude', isIndonesian ? 'ID' : 'Global'); openBooking(); }} className={`${btnPrimaryDark} inline-flex group gap-3 px-8 py-3.5 text-[1.05rem]`}>
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
