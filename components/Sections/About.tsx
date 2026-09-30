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
        {/* cosmic tint — melts the portrait toward the twilight palette */}
        <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ background: 'linear-gradient(215deg, rgba(58,42,94,0.20) 0%, transparent 38%, rgba(18,14,44,0.5) 100%)' }} />
        {/* soft left fade so the photo dissolves into the white page (no hard seam) */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-28 hidden lg:block bg-gradient-to-r from-white to-transparent" />
      </div>

      {/* text — inside the page container, held to the left so the portrait can bleed right */}
      <div className="relative max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 lg:min-h-[90vh] flex items-center">
        <FadeIn className="w-full lg:w-[53%] lg:pr-14 py-14 md:py-20">
          {/* eyebrow */}
          <div className="flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.34em] text-ink/50">
            <span aria-hidden className="h-px w-8 sm:w-12 bg-moon-deep/50" />
            <span>{isIndonesian ? 'Tentang Saya' : 'About Me'}</span>
          </div>

          {/* lead statement — the section's headline (shortened) */}
          <h2 className="mt-6 md:mt-8 font-elegant font-medium text-ink text-[1.9rem] sm:text-[2.5rem] lg:text-[3.05rem] leading-[1.12] tracking-[-0.02em]">
            <MaskReveal>
              {isIndonesian ? (
                <>Tarot bukan soal takdir menakutkan — tapi ruang tenang untuk menemukan <span className="text-moon-deep italic">kejernihan</span>.</>
              ) : (
                <>Tarot isn’t about scary fate — it’s a calm space to find <span className="text-moon-deep italic">clarity</span>.</>
              )}
            </MaskReveal>
          </h2>

          {/* one tight bio line */}
          <p className="mt-6 md:mt-7 text-[15px] md:text-base text-ink/70 font-light leading-[1.7] max-w-lg">
            {isIndonesian
              ? 'Saya Mayanov — membaca Tarot sejak 2009. Lebih dari 15 tahun menjadikannya percakapan jujur untuk refleksi, bukan ramalan. Datang apa adanya, pulang dengan arah yang lebih jelas.'
              : 'I’m Mayanov — reading Tarot since 2009. Over 15 years turning the cards into honest conversations for reflection, not prediction. Come as you are, leave with a clearer direction.'}
          </p>

          {/* approach — a small editorial tag row */}
          <div className="mt-8 md:mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-ink/10 pt-6">
            {(isIndonesian ? ['Analitis', 'Hangat', 'Jujur'] : ['Analytical', 'Warm', 'Honest']).map((w) => (
              <span key={w} className="flex items-center gap-2 text-[13px] md:text-sm text-ink/75">
                <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-moon-deep/70" />
                {w}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default About;
