import React, { useEffect, useState } from 'react';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';
import { ImageReveal } from '../UI/Reveal';
import CountUp from '../UI/CountUp';
import SoftAura from '../UI/SoftAura';
import CelestialMark from '../UI/CelestialMark';
import { trackEvent } from '../../services/analytics';
import { REVEAL_FLIGHT_MS } from '../Layout/Loader';

interface AboutProps {
  isIndonesian?: boolean;
}


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

  // The sheet's rounded top peeks over the bottom of the hero. Keep it tucked just
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
      className="bg-paper relative z-10 isolate overflow-hidden text-ink lg:min-h-[72vh] -mt-[2.75rem] lg:-mt-[4.5rem] rounded-t-[2.75rem] lg:rounded-t-[4.5rem] shadow-[0_-30px_70px_-22px_rgba(6,4,20,0.55)]">
      <SoftAura />
      {/* portrait and text side by side on desktop (portrait first on phones) */}
      <div className="relative mx-auto px-8 lg:min-h-[72vh] flex flex-col lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 xl:gap-24 lg:items-center">
        {/* portrait — printed as a tarot card rather than bled to the edge: a cream card
            face (numeral, framed photo, title) laid over the deck's own card back, both a
            little askew like cards set down on the table; straightens on hover */}
        <figure className="group/card relative mx-auto translate-x-[9%] lg:translate-x-0 w-[min(66vw,18.5rem)] lg:w-full lg:max-w-[22rem] pt-16 pb-2 lg:py-24 lg:order-2">
          <div className="relative">
            {/* the card back, peeking out behind */}
            <div aria-hidden
              className="absolute inset-0 rounded-[1.15rem] -rotate-[9deg] -translate-x-[17%] translate-y-[3%] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:group-hover/card:-rotate-[12deg] lg:group-hover/card:-translate-x-[21%] ring-1 ring-white/10 [box-shadow:0_30px_60px_-30px_rgba(12,8,30,0.6)]"
              style={{ background: 'radial-gradient(130% 110% at 50% 0%, #3a2558 0%, #241638 55%, #150c24 100%)' }}>
              <div className="absolute inset-[0.6rem] rounded-[0.8rem] ring-1 ring-[#C9B8E8]/25" />
              <div className="absolute inset-[1.05rem] rounded-[0.55rem] ring-1 ring-[#C9B8E8]/10" />
              <CelestialMark name="crescent" className="print-ink absolute left-[5%] top-1/2 -translate-y-1/2 w-7 text-[#C9B8E8]/70" />
            </div>

            {/* the face */}
            <div className="relative rotate-[2.5deg] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:group-hover/card:rotate-0 rounded-[1.15rem] bg-[#F7F2EA] p-3 md:p-3.5 ring-1 ring-ink/10 [box-shadow:0_34px_70px_-30px_rgba(24,14,40,0.55),0_2px_6px_-2px_rgba(24,14,40,0.15)]">
              <div className="rounded-[0.8rem] ring-1 ring-ink/15 px-2.5 md:px-3 pb-3 pt-2">
                <div className="print-ink flex items-center justify-center gap-2.5 pb-2 text-moon/70">
                  <span className="h-px w-6 bg-current opacity-50" />
                  <span className="font-elegant italic text-[1.15rem] leading-none tracking-[0.15em] text-ink/60">0</span>
                  <span className="h-px w-6 bg-current opacity-50" />
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
                  <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[0.45rem] ring-1 ring-inset ring-ink/10" />
                </div>
                <figcaption className="pt-3 flex flex-col items-center gap-1 text-center">
                  <span className="print-text font-elegant font-semibold uppercase tracking-[0.28em] text-[0.8rem] md:text-[0.85rem] text-ink/80 pl-[0.28em]">
                    {isIndonesian ? 'Sang Pembaca' : 'The Reader'}
                  </span>
                  <span className="print-body font-elegant italic text-[0.8rem] text-ink/45">
                    {isIndonesian ? 'Mayanov · sejak 2009' : 'Mayanov · since 2009'}
                  </span>
                </figcaption>
              </div>
            </div>
          </div>
        </figure>

        <FadeIn dir="left" className="w-full pt-14 pb-20 md:pb-28 lg:py-28">
          {/* hook title */}
          <h2 className="print-text pb-[0.14em] -mb-[0.14em] font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.1rem] lg:text-[3.7rem] leading-[1.02] tracking-[-0.03em]">
            <MaskReveal>
              {isIndonesian ? 'Perkenalkan, saya Mayanov' : 'Meet Mayanov'}
            </MaskReveal>
          </h2>

          <div className="print-body mt-7 md:mt-9 space-y-5">
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

          {/* goal — a flush-left closing statement (aligned with the title), with
              a decorative quote mark above and a signature, so it stays designed */}
          <figure className="relative mt-10 md:mt-12">
            {/* (the ink texture sits on an inner box with room round the glyph — a mask clips to
                its box, and this line box is far shorter than the mark) */}
            <span aria-hidden className="block font-serif text-moon/45 text-[4rem] leading-[0.4] h-7 select-none"><span className="print-ink mix-blend-multiply inline-block py-[0.5em] -my-[0.5em]">”</span></span>
            <blockquote className="print-text font-elegant text-ink text-[1.5rem] md:text-[1.9rem] leading-[1.24] tracking-[-0.02em]">
              {isIndonesian
                ? 'Tujuan saya simpel: memberikan kejelasan agar kamu bisa mengambil keputusan dengan percaya diri.'
                : 'My goal is simple: to give you the clarity to make decisions with confidence.'}
            </blockquote>
            <figcaption className="print-body mt-5 flex items-center gap-2.5 font-elegant italic text-[1.05rem] tracking-[0.01em] text-moon">
              <span aria-hidden className="h-px w-6 bg-moon/60" /> Mayanov
            </figcaption>
          </figure>

          {/* quiet credentials — a calm 3-up proof row (big serif numbers that count up), not a KPI bar */}
          <div className="mt-10 md:mt-12 pt-8 border-t border-ink/10 grid grid-cols-3 gap-x-5 sm:gap-x-8">
            {[
              { n: isIndonesian ? '7.700+' : '7,700+', l: isIndonesian ? 'sesi tarot' : 'readings' },
              { n: isIndonesian ? '1.500+' : '1,500+', l: isIndonesian ? 'orang terbantu' : 'people guided' },
              { n: '5.0', l: isIndonesian ? 'rating Google' : 'on Google' },
            ].map((s, i) => (
              <div key={i} className={i > 0 ? 'pl-5 sm:pl-8 border-l border-ink/10' : undefined}>
                {/* (only the faint grain here — two masks stacked washed the purple out) */}
                <div className="print-body font-elegant font-semibold text-moon text-[1.9rem] md:text-[2.4rem] leading-none tracking-[-0.02em] pb-[0.14em] -mb-[0.14em]"><CountUp value={s.n} duration={1400 + i * 200} /></div>
                <div className="print-body mt-2.5 text-ink/50 font-normal text-[13px] md:text-sm leading-snug">{s.l}</div>
              </div>
            ))}
          </div>

        </FadeIn>
      </div>
    </section>
  );
};

export default About;
