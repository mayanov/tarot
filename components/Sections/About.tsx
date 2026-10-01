import React, { useEffect } from 'react';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';
import { ImageReveal } from '../UI/Reveal';
import { trackEvent } from '../../services/analytics';

interface AboutProps {
  isIndonesian?: boolean;
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

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
    <section id="about" className="relative z-10 isolate overflow-hidden text-ink lg:min-h-[90vh] rounded-t-[1.75rem] md:rounded-t-[2.75rem] shadow-[0_-26px_60px_-34px_rgba(0,0,0,0.3)]" style={{ background: '#ffffff' }}>
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
        {/* fine film grain — ties the portrait to the site's texture */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50 mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '140px 140px' }} />
        {/* crisp editorial seam between the text and the portrait */}
        <div aria-hidden className="hidden lg:block absolute inset-y-0 left-0 w-px bg-ink/10" />
      </div>

      {/* text — inside the page container, held to the left so the portrait can bleed right */}
      <div className="relative max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 lg:min-h-[90vh] flex items-center">
        <FadeIn className="w-full lg:w-[53%] lg:pr-14 py-14 md:py-20">
          {/* credential overline */}
          <div className="flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-ink/45">
            <span aria-hidden className="h-px w-8 sm:w-10 bg-moon-deep/50" />
            <span>{isIndonesian ? '15+ Tahun · Sejak 2009' : '15+ Years · Since 2009'}</span>
          </div>

          {/* hook title */}
          <h2 className="mt-5 md:mt-6 font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.1rem] lg:text-[3.7rem] leading-[1.02] tracking-[-0.03em]">
            <MaskReveal>
              {isIndonesian ? (
                <><span className="text-moon-deep">Kejelasan</span>, bukan ramalan.</>
              ) : (
                <><span className="text-moon-deep">Clarity</span>, not fortune-telling.</>
              )}
            </MaskReveal>
          </h2>

          <div className="mt-7 md:mt-9 space-y-5 text-[15px] md:text-base text-ink/70 font-light leading-[1.75] max-w-xl">
            <p className="first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-elegant first-letter:font-semibold first-letter:text-ink first-letter:text-[3.1rem] first-letter:leading-[0.78]">
              {isIndonesian
                ? 'Saya telah mendalami seni membaca kartu Tarot sejak 2009. Dengan pengalaman lebih dari 15 tahun, saya menemukan bahwa kartu Tarot adalah medium yang baik untuk melakukan refleksi diri dan mencari solusi sebuah permasalahan.'
                : 'I’ve been studying the art of reading Tarot since 2009. With over 15 years of experience, I’ve found that the cards are a wonderful medium for self-reflection and for working through a problem.'}
            </p>
            <p>
              {isIndonesian
                ? 'Karena pada dasarnya pembacaan Tarot bukanlah sesederhana ‘menerawang’ masa depan, melainkan menjadi sesi konsultasi yang mendewasakan baik Anda maupun saya.'
                : 'Because a Tarot reading isn’t simply about ‘predicting’ the future — it becomes a consultation that helps both you and me grow.'}
            </p>
          </div>

          {/* emphasized closing — the goal, as a confident last word */}
          <div className="mt-8 md:mt-10 pt-6 border-t border-ink/10 max-w-xl">
            <p className="font-elegant text-ink text-[1.25rem] md:text-[1.5rem] leading-[1.3] tracking-[-0.015em]">
              {isIndonesian ? (
                <>Tujuan saya simpel: memberikan <span className="text-moon-deep italic">kejelasan</span> agar kamu bisa mengambil keputusan dengan percaya diri.</>
              ) : (
                <>My goal is simple: to give you the <span className="text-moon-deep italic">clarity</span> to make decisions with confidence.</>
              )}
            </p>
          </div>

        </FadeIn>
      </div>
    </section>
  );
};

export default About;
