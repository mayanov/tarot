import React, { useEffect, useMemo, useRef, useState } from 'react';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';
import { ImageReveal } from '../UI/Reveal';
import CountUp from '../UI/CountUp';
import CelestialMark from '../UI/CelestialMark';
import CardStock, { PhotoPrint } from '../UI/CardStock';
import CardWash, { DECK_WASH } from '../UI/CardWash';
import { PaperShadow, paperCut, tornTop } from '../UI/PaperEdge';
import { Phase } from '../UI/MoonPhaseDivider';
import PencilRule from '../UI/PencilRule';
import { moonNow } from '../Layout/MenuMoon';
import { trackEvent } from '../../services/analytics';
import { REVEAL_FLIGHT_MS } from '../Layout/Loader';

interface AboutProps {
  isIndonesian?: boolean;
}


const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const CORNERS = ['left-1.5 top-1.5', 'right-1.5 top-1.5', 'left-1.5 bottom-1.5', 'right-1.5 bottom-1.5'];

// The portrait, printed as a tarot card: a night-plum card face (tonight's moon at its head,
// framed photo, title), set down a little askew. Dealt into place when it
// scrolls into view; on desktop it tips toward the pointer with a soft sheen.
const PortraitCard: React.FC<{ isIndonesian: boolean }> = ({ isIndonesian }) => {
  const figRef = useRef<HTMLElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const [dealt, setDealt] = useState(false);
  const [hover, setHover] = useState(false);
  const moon = useMemo(() => moonNow(), []);
  const reduced = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const canTilt = useMemo(() => !reduced && typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches, [reduced]);

  useEffect(() => {
    if (reduced) { setDealt(true); return; }
    const el = figRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDealt(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const onMove = (e: React.PointerEvent) => {
    const face = faceRef.current, fig = figRef.current;
    if (!canTilt || !face || !fig) return;
    const r = fig.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    face.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
    face.style.setProperty('--rx', `${(-y * 9).toFixed(2)}deg`);
    face.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
    face.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
    if (!hover) setHover(true);
  };
  const onLeave = () => {
    const face = faceRef.current;
    if (face) ['--rx', '--ry'].forEach((v) => face.style.setProperty(v, '0deg'));
    setHover(false);
  };

  const faceTransform = !dealt
    ? 'perspective(1000px) translateY(8%) rotate(-1deg)'
    : `perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) rotate(${hover ? 0 : 2.5}deg)`;

  return (
    <figure
      ref={figRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative mx-auto w-[min(76vw,20.5rem)] sm:w-[22rem] lg:w-[92%] lg:max-w-[28rem] lg:mr-0 lg:order-2"
    >
      <div className="relative" style={{ opacity: dealt ? 1 : 0, transition: `opacity 600ms ${EASE}` }}>
        {/* the card, lying on the page (it tips as a whole, shadow and all) */}
        <div
          ref={faceRef}
          className="relative isolate"
          style={{
            transform: faceTransform,
            // tracks the pointer quickly; otherwise eases
            transition: hover ? 'transform 250ms ease-out' : `transform 1100ms ${EASE}`,
          }}
        >
        <PaperShadow />
        {/* the face, its edge hand-cut */}
        <div className="relative rounded-[1.15rem] p-3 md:p-3.5" style={paperCut(53)}>
          {/* the deck's twilight plum (as the event photo cards), painted in watercolour,
              so it stands off the paper */}
          <CardWash colors={DECK_WASH[1]} />
          <div className="relative rounded-[0.8rem] ring-1 ring-[#C9B8E8]/25 px-2.5 md:px-3 pb-3 pt-2">
            {/* a tiny sparkle in each corner of the inner frame */}
            {CORNERS.map((c) => (
              <CelestialMark key={c} name="sparkle" className={`print-ink absolute ${c} w-2 text-[#C9B8E8]/55`} />
            ))}
            {/* head: tonight's moon between two rules */}
            <div aria-hidden className="print-ink flex items-center justify-center gap-2.5 pb-2 text-[#C9B8E8]/80">
              <span className="h-px w-7 bg-gradient-to-r from-transparent to-current opacity-60" />
              <Phase p={moon.p} waning={moon.waning} size={13} />
              <span className="h-px w-7 bg-gradient-to-l from-transparent to-current opacity-60" />
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[0.45rem]">
              <ImageReveal
                src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
                alt="Mayanov"
                // peeks in at the bottom of the screen on landing — unveil as soon as any of it shows
                threshold={0}
                className="absolute inset-0"
                imgClassName="w-full h-full object-cover object-[45%_28%]"
                loading="eager"
              />
              {/* flat plum tint (no directional gradient) to cohere with the palette */}
              <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ background: 'rgba(42,24,57,0.14)' }} />
              {/* printed onto the card: plum blacks, the paper's grain through it */}
              <PhotoPrint />
            </div>
            <figcaption className="pt-3 flex flex-col items-center gap-1 text-center">
              <span className="print-text font-elegant font-semibold uppercase tracking-[0.28em] text-[0.8rem] md:text-[0.85rem] text-cream/90 pl-[0.28em]">
                {isIndonesian ? 'Sang Pembaca' : 'The Reader'}
              </span>
              <span className="print-body font-elegant italic text-[0.8rem] text-[#C9B8E8]/60">
                {isIndonesian ? 'Mayanov · sejak 2009' : 'Mayanov · since 2009'}
              </span>
            </figcaption>
          </div>
          {/* printed on tarot card stock */}
          <CardStock />
          {/* sheen that follows the pointer */}
          <div aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.15rem] mix-blend-screen"
            style={{
              background: 'radial-gradient(circle at var(--mx, 50%) var(--my, 0%), rgba(201,184,232,0.16), rgba(201,184,232,0) 55%)',
              opacity: hover ? 1 : 0,
              transition: 'opacity 400ms ease-out',
            }} />
        </div>
        </div>
      </div>
    </figure>
  );
};

const About: React.FC<AboutProps> = ({ isIndonesian = false }) => {
  useEffect(() => {
    // a section view, not a product — kept out of the booking funnel's item reports
    trackEvent(
      'view_section',
      { section: 'About Me', market: isIndonesian ? 'ID' : 'Global' },
      'ViewContent',
      { content_name: 'About Me', content_category: isIndonesian ? 'ID' : 'Global' }
    );
  }, [isIndonesian]);

  // The sheet's torn top peeks over the bottom of the hero. Keep it tucked just
  // below the screen while the loader hands off, then let it rise into place once
  // the moon and title have landed — so it arrives as its own beat, not a pop.
  const [risen, setRisen] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setRisen(true); return; }
    let t: number | undefined;
    const rise = () => { t = window.setTimeout(() => setRisen(true), REVEAL_FLIGHT_MS + 250); };
    window.addEventListener('mt:reveal', rise, { once: true });
    const fallback = window.setTimeout(() => setRisen(true), 6000);
    return () => { window.removeEventListener('mt:reveal', rise); if (t) clearTimeout(t); clearTimeout(fallback); };
  }, []);

  return (
    <section
      id="about"
      style={{
        transform: risen ? 'none' : 'translateY(6rem)',
        transition: 'transform 1100ms cubic-bezier(0.16,1,0.3,1)',
      }}
      className="relative z-10 isolate overflow-hidden text-ink -mt-[2.75rem] lg:-mt-[4.5rem]">
      {/* the sheet of paper, its top edge torn, laid over the sky: the tear casts a soft
          shadow onto the sky just above it */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-14 [filter:blur(6px)]">
          <div className="h-full" style={{ ...tornTop, background: 'rgba(6,4,20,0.55)' }} />
        </div>
        <div className="absolute inset-0 bg-paper" style={tornTop} />
      </div>
      {/* portrait and text side by side on desktop (portrait first on phones) */}
      <div className="relative mx-auto px-8 pt-14 md:pt-20 pb-14 md:pb-20 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)] lg:gap-16 xl:gap-24 lg:items-start">
        <PortraitCard isIndonesian={isIndonesian} />

        <FadeIn dir="left" className="w-full pt-12 md:pt-14 lg:pt-0">
          {/* hook title */}
          <h2 className="print-text pb-[0.14em] -mb-[0.14em] font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.1rem] lg:text-[3.7rem] leading-[1.02] tracking-[-0.03em]">
            <MaskReveal>
              {isIndonesian ? 'Perkenalkan, saya Mayanov' : 'Meet Mayanov'}
            </MaskReveal>
          </h2>

          <div lang={isIndonesian ? 'id' : 'en'} className="print-body mt-7 md:mt-9 space-y-5 text-justify hyphens-auto">
            <p className="text-[15px] md:text-base leading-[1.8] text-ink/60 font-light first-letter:float-left first-letter:mr-3 first-letter:mt-1.5 first-letter:font-elegant first-letter:font-semibold first-letter:text-ink first-letter:text-[3.4rem] first-letter:leading-[0.72]">
              {isIndonesian
                ? 'Saya sudah membaca kartu Tarot sejak 2009 — lebih dari 15 tahun menjadikannya ruang untuk refleksi diri. Pada dasarnya, Tarot bekerja dengan membaca energi: gambaran dari situasi dan perasaan yang sedang kamu bawa saat ini.'
                : 'I’ve been reading Tarot since 2009 — over 15 years using it as a space for self-reflection. At its core, Tarot works by reading energy: a snapshot of the situation and feelings you’re carrying right now.'}
            </p>
            <p className="text-[15px] md:text-base leading-[1.8] text-ink/60 font-light">
              {isIndonesian
                ? 'Dari situ kita lihat pola yang mungkin belum kamu sadari — soal karier, hubungan, keuangan, keluarga, atau keputusan besar — lalu menerjemahkannya jadi langkah yang jelas dan bisa kamu ambil.'
                : 'From there we spot patterns you might not have noticed — around career, relationships, finances, family, or a big decision — and turn them into clear steps you can actually take.'}
            </p>
            <p className="text-[15px] md:text-base leading-[1.8] text-ink/60 font-light">
              {isIndonesian
                ? 'Jadi ini bukan soal ‘menerawang’ masa depan, melainkan sesi konsultasi yang jujur dan menenangkan — bukan untuk menakuti, tapi untuk memberi arah.'
                : 'So it isn’t about ‘predicting’ the future — it’s an honest, grounding consultation, not to frighten you but to give you direction.'}
            </p>
          </div>

          {/* goal — the closing statement, set as a pull quote: a large opening mark hangs in
              its own indent beside the first line, the key word is picked out in purple
              italic, and it's signed by hand */}
          <figure className="relative mt-12 md:mt-16 pl-12 md:pl-16">
            {/* (the ink texture sits on an inner box with room round the glyph — a mask clips
                to its box) */}
            <span aria-hidden className="absolute left-0 -top-[0.14em] font-elegant font-semibold text-moon/80 text-[4.5rem] md:text-[5.75rem] leading-none select-none">
              <span className="print-ink mix-blend-multiply inline-block py-[0.2em] -my-[0.2em] pr-[0.1em]">“</span>
            </span>
            <blockquote className="print-text font-elegant text-ink text-[1.6rem] md:text-[2.1rem] leading-[1.2] tracking-[-0.02em]">
              {isIndonesian
                ? <>Tujuan saya simpel: memberikan <em className="italic text-moon">kejelasan</em> agar kamu bisa mengambil keputusan dengan percaya diri.</>
                : <>My goal is simple: to give you the <em className="italic text-moon">clarity</em> to make decisions with confidence.</>}
            </blockquote>
            {/* signed by hand (a script face, loaded for just these letters), printed in plum */}
            <figcaption className="mt-4 flex items-center gap-3 text-moon">
              <PencilRule fade="start" className="w-6 text-moon/60" />
              <span className="print-body inline-block py-[0.3em] -my-[0.3em] pr-3 font-signature text-[2.5rem] md:text-[2.9rem] leading-none">Mayanov</span>
            </figcaption>
          </figure>

          {/* quiet credentials — a calm 3-up proof row (big serif numbers that count up), not a KPI bar */}
          <div className="mt-10 md:mt-12"><PencilRule className="text-ink/30" /></div>
          <div className="pt-8 grid grid-cols-3 gap-x-5 sm:gap-x-8">
            {[
              { n: isIndonesian ? '7.700+' : '7,700+', l: isIndonesian ? 'sesi tarot' : 'readings' },
              { n: isIndonesian ? '1.500+' : '1,500+', l: isIndonesian ? 'orang terbantu' : 'people guided' },
              // a rating shouldn't count up through 2.5, 3.8… — it simply appears
              { n: '5.0', l: isIndonesian ? 'rating di Google' : 'rating on Google', still: true },
            ].map((s, i) => (
              <div key={i} className={i > 0 ? 'relative pl-5 sm:pl-8' : undefined}>
                {i > 0 && <PencilRule vertical className="absolute inset-y-0 left-0 text-ink/30" />}
                {/* (only the faint grain here — two masks stacked washed the purple out) */}
                <div className="print-body font-elegant font-semibold text-moon text-[1.7rem] sm:text-[2rem] md:text-[2.6rem] leading-none tracking-[-0.02em] pb-[0.14em] -mb-[0.14em] pr-2 -mr-2">
                  {'still' in s ? s.n : <CountUp value={s.n} duration={1400 + i * 200} />}
                </div>
                <div className="print-body mt-2.5 font-elegant italic text-ink/55 text-[0.95rem] md:text-[1.05rem] leading-snug">{s.l}</div>
              </div>
            ))}
          </div>

        </FadeIn>
      </div>
    </section>
  );
};

export default About;
