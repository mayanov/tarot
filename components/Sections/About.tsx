import React, { useEffect, useState } from 'react';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';
import { ImageReveal } from '../UI/Reveal';
import SoftAura from '../UI/SoftAura';
import { trackEvent } from '../../services/analytics';
import { REVEAL_FLIGHT_MS } from '../Layout/Loader';

interface AboutProps {
  isIndonesian?: boolean;
}


const About: React.FC<AboutProps> = ({ isIndonesian = false }) => {
  useEffect(() => {
    trackEvent(
      'view_item',
      { item_name: 'About Me', market: isIndonesian ? 'ID' : 'Global' },
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
      {/* portrait — top on mobile, bleeds to the right viewport edge on desktop; soft
          organic radius on the edges that face the content (arch-like, wellness feel) */}
      <div className="relative lg:absolute lg:top-0 lg:right-0 lg:bottom-0 lg:w-[47%] min-h-[62vh] lg:min-h-0 overflow-hidden rounded-b-[2.75rem] lg:rounded-b-none lg:rounded-l-[4.5rem]">
        <ImageReveal
          src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
          alt="Mayanov"
          // peeks in at the bottom of the screen on landing — unveil as soon as any of it shows
          threshold={0}
          className="absolute inset-0"
          imgClassName="w-full h-full object-cover object-top"
          loading="eager"
        />
        {/* flat plum tint (no directional gradient) to cohere with the palette */}
        <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ background: 'rgba(42,24,57,0.14)' }} />
      </div>

      {/* text — inside the page container, held to the left so the portrait can bleed right */}
      <div className="relative mx-auto px-8 lg:min-h-[72vh] flex items-center">
        <FadeIn dir="left" className="w-full lg:w-[53%] lg:pr-14 py-20 md:py-28">
          {/* hook title */}
          <h2 className="font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.1rem] lg:text-[3.7rem] leading-[1.02] tracking-[-0.03em]">
            <MaskReveal>
              {isIndonesian ? 'Perkenalkan, saya Mayanov' : 'Meet Mayanov'}
            </MaskReveal>
          </h2>

          <div className="mt-7 md:mt-9 space-y-5">
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
            <span aria-hidden className="block font-serif text-moon/30 text-[4rem] leading-[0.4] h-7 select-none">”</span>
            <blockquote className="font-elegant text-ink text-[1.5rem] md:text-[1.9rem] leading-[1.24] tracking-[-0.02em]">
              {isIndonesian
                ? 'Tujuan saya simpel: memberikan kejelasan agar kamu bisa mengambil keputusan dengan percaya diri.'
                : 'My goal is simple: to give you the clarity to make decisions with confidence.'}
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-2.5 font-elegant italic text-[1.05rem] tracking-[0.01em] text-moon">
              <span aria-hidden className="h-px w-6 bg-moon/60" /> Mayanov
            </figcaption>
          </figure>

          {/* quiet credentials — a calm 3-up proof row (big serif numbers), not a KPI bar */}
          <div className="mt-10 md:mt-12 pt-8 border-t border-ink/10 grid grid-cols-3 gap-x-5 sm:gap-x-8">
            {[
              { n: isIndonesian ? '7.700+' : '7,700+', l: isIndonesian ? 'sesi tarot' : 'readings' },
              { n: isIndonesian ? '1.500+' : '1,500+', l: isIndonesian ? 'orang terbantu' : 'people guided' },
              { n: '5.0', l: isIndonesian ? 'rating Google' : 'on Google' },
            ].map((s, i) => (
              <div key={i} className={i > 0 ? 'pl-5 sm:pl-8 border-l border-ink/10' : undefined}>
                <div className="font-elegant font-semibold text-moon text-[1.9rem] md:text-[2.4rem] leading-none tracking-[-0.02em]">{s.n}</div>
                <div className="mt-2.5 text-ink/50 font-normal text-[13px] md:text-sm leading-snug">{s.l}</div>
              </div>
            ))}
          </div>

        </FadeIn>
      </div>
    </section>
  );
};

export default About;
