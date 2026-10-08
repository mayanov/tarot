import React, { useEffect } from 'react';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';
import { ImageReveal } from '../UI/Reveal';
import { trackEvent } from '../../services/analytics';

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

  return (
    <section id="about" className="relative z-10 isolate overflow-hidden text-ink lg:min-h-[72vh] rounded-t-[1.75rem] md:rounded-t-[2.75rem] shadow-[0_-26px_60px_-34px_rgba(0,0,0,0.3)]" style={{ background: '#ffffff' }}>
      {/* full-bleed portrait — top on mobile, bleeds to the right viewport edge on desktop (breaks the page margin on purpose) */}
      <div className="relative lg:absolute lg:top-0 lg:right-0 lg:bottom-0 lg:w-[47%] min-h-[62vh] lg:min-h-0 overflow-hidden">
        <ImageReveal
          src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
          alt="Mayanov"
          className="absolute inset-0"
          imgClassName="w-full h-full object-cover object-top"
          loading="eager"
        />
        {/* flat plum tint (no directional gradient) to cohere with the palette */}
        <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ background: 'rgba(42,24,57,0.14)' }} />
        {/* crisp editorial seam between the text and the portrait */}
        <div aria-hidden className="hidden lg:block absolute inset-y-0 left-0 w-px bg-ink/10" />
      </div>

      {/* text — inside the page container, held to the left so the portrait can bleed right */}
      <div className="relative mx-auto px-8 lg:min-h-[72vh] flex items-center">
        <FadeIn dir="left" className="w-full lg:w-[53%] lg:pr-14 py-12 md:py-14">
          {/* hook title */}
          <h2 className="font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.1rem] lg:text-[3.7rem] leading-[1.02] tracking-[-0.03em]">
            <MaskReveal>
              {isIndonesian ? 'Kejelasan, bukan ramalan.' : 'Clarity, not fortune-telling.'}
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
            <span aria-hidden className="block font-serif text-moon-deep/30 text-[4rem] leading-[0.4] h-7 select-none">”</span>
            <blockquote className="font-elegant text-ink text-[1.5rem] md:text-[1.9rem] leading-[1.24] tracking-[-0.02em]">
              {isIndonesian
                ? 'Tujuan saya simpel: memberikan kejelasan agar kamu bisa mengambil keputusan dengan percaya diri.'
                : 'My goal is simple: to give you the clarity to make decisions with confidence.'}
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-2.5 font-elegant italic text-[1.05rem] tracking-[0.01em] text-moon-deep">
              <span aria-hidden className="h-px w-6 bg-moon-deep/60" /> Mayanov
            </figcaption>
          </figure>

        </FadeIn>
      </div>
    </section>
  );
};

export default About;
