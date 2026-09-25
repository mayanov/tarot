import React, { useEffect } from 'react';
import FadeIn from '../UI/FadeIn';
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
    <section id="about" className="relative isolate overflow-hidden text-ink lg:min-h-[90vh] rounded-t-[1.75rem] md:rounded-t-[2.75rem] shadow-[0_-26px_60px_-34px_rgba(0,0,0,0.3)]" style={{ background: '#ffffff' }}>
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
        {/* feature caption */}
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 bg-gradient-to-t from-[#0E0B24]/92 via-[#0E0B24]/35 to-transparent">
          <div className="font-elegant text-cream text-xl md:text-2xl leading-none">Mayanov</div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-cream/80">
            <span>{isIndonesian ? 'Pembaca Tarot' : 'Tarot Reader'}</span>
            <span className="w-1 h-1 rounded-full bg-moon" />
            <span>{isIndonesian ? 'Sejak 2009' : 'Since 2009'}</span>
            <span className="w-1 h-1 rounded-full bg-moon" />
            <span>{isIndonesian ? '15+ Tahun' : '15+ Years'}</span>
          </div>
        </div>
      </div>

      {/* text — inside the page container, held to the left so the portrait can bleed right */}
      <div className="relative max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 lg:min-h-[90vh] flex items-center">
        <FadeIn className="w-full lg:w-[53%] lg:pr-14 py-14 md:py-20">
          <span aria-hidden className="block text-moon-deep text-lg leading-none mb-5">✦</span>
          <h2 className="font-elegant font-medium text-ink text-[2.8rem] sm:text-[3.8rem] lg:text-[4.8rem] leading-[0.96] tracking-[-0.035em]">
            {isIndonesian ? 'Tentang Saya' : 'About Me'}
          </h2>

          {/* pull quote — big, with a single violet accent */}
          <p className="mt-7 md:mt-9 font-elegant italic text-ink text-[1.35rem] md:text-[1.65rem] lg:text-[1.9rem] leading-[1.28] tracking-[-0.01em]">
            {isIndonesian ? (
              <>Tarot, buat saya, bukan soal takdir yang menakutkan — melainkan ruang tenang untuk berhenti sejenak, mendengarkan diri, dan menemukan <span className="text-moon-deep">kejernihan</span> di tengah hiruk-pikuk.</>
            ) : (
              <>Tarot, for me, isn’t about scary fate — it’s a calm space to pause, listen to yourself, and find <span className="text-moon-deep">clarity</span> in the middle of the noise.</>
            )}
          </p>

          <div className="mt-7 md:mt-9 space-y-4 text-[15px] md:text-base text-ink/70 font-light leading-[1.7] max-w-xl">
            <p>
              {isIndonesian
                ? 'Saya sudah mendalami seni membaca Tarot sejak 2009 — lebih dari 15 tahun menjadikannya medium untuk refleksi diri dan menemukan solusi yang nyata. Sesi bersama saya terasa seperti percakapan jujur, bukan ramalan. Kita bedah situasimu, kenali pola yang bikin stuck, lalu susun langkah konkret — analitis, hangat, tanpa menghakimi.'
                : 'I’ve been reading Tarot since 2009 — over 15 years using the cards as a medium for self-reflection and finding real solutions. A session feels like an honest conversation, not a prediction. We unpack your situation, spot what keeps you stuck, and map concrete next steps — analytical, warm, never judgmental.'}
            </p>
            <p>
              {isIndonesian
                ? 'Kamu tidak perlu tahu apa-apa soal Tarot. Datang saja apa adanya — dengan pertanyaan besar, kegelisahan kecil, atau sekadar butuh didengar. Yang kamu bawa pulang bukan ketakutan, tapi ketenangan dan arah yang lebih jelas untuk melangkah.'
                : 'You don’t need to know anything about Tarot. Just come as you are — with the big questions, the small worries, or simply the need to be heard. What you leave with isn’t fear, but calm and a clearer sense of direction for your next step.'}
            </p>
          </div>

          {/* closing statement + signature */}
          <div className="mt-8 md:mt-10">
            <p className="font-elegant text-ink text-[1.2rem] md:text-[1.4rem] lg:text-[1.55rem] leading-[1.25] tracking-[-0.015em]">
              {isIndonesian
                ? 'Tujuan saya simpel: memberi kejelasan agar kamu bisa mengambil keputusan dengan percaya diri.'
                : 'My goal is simple — the clarity you need to make decisions with confidence.'}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="font-elegant italic text-ink text-lg md:text-xl">Mayanov</span>
              <span aria-hidden className="text-moon-deep leading-none">✦</span>
              <span className="text-[11px] uppercase tracking-[0.22em] text-ink/45">{isIndonesian ? 'Pembaca Tarot' : 'Tarot Reader'}</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default About;
