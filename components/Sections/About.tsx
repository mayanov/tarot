import React, { useEffect, useRef } from 'react';
import FadeIn from '../UI/FadeIn';
import SectionPanel from '../UI/SectionPanel';
import { trackEvent } from '../../services/analytics';
import { useParallax } from '../UI/scroll';

interface AboutProps {
  isIndonesian?: boolean;
}

const About: React.FC<AboutProps> = ({ isIndonesian = false }) => {
  const photoRef = useRef<HTMLDivElement>(null);
  useParallax(photoRef, -0.06);

  useEffect(() => {
    trackEvent(
      'view_item',
      { item_name: 'About Me', market: isIndonesian ? 'ID' : 'Global' },
      'ViewContent',
      { content_name: 'About Me', content_category: isIndonesian ? 'ID' : 'Global' }
    );
  }, [isIndonesian]);

  return (
    <section
      id="about"
      className="py-10 md:py-16 relative overflow-hidden isolate"
    >
      <SectionPanel>
        <FadeIn>
          {/* oversized editorial heading — starts at the page margin */}
          <h2 className="font-serif font-semibold text-ink text-[2.5rem] md:text-[3.4rem] leading-[1.0] tracking-[-0.03em]">
            {isIndonesian ? 'Tentang Saya' : 'About Me'}
          </h2>

          <div className="mt-12 md:mt-16 grid lg:grid-cols-12 gap-y-14 gap-x-10 lg:gap-x-20 items-stretch">
            {/* LEFT — portrait with clean overlay */}
            <div className="lg:col-span-5">
              <div ref={photoRef} className="relative h-full will-change-transform">
                {/* offset colour frame behind the portrait */}
                <div className="absolute -inset-2.5 md:-inset-3 translate-x-3 translate-y-3 rounded-t-[9rem] rounded-b-2xl bg-coral-deep/15" />
                {/* arched-top portrait */}
                <div className="relative h-full overflow-hidden rounded-t-[9rem] rounded-b-2xl border border-ink/10 shadow-[0_40px_80px_-50px_rgba(0,0,0,0.55)]">
                  <img
                    src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
                    alt="Mayanov"
                    className="w-full h-[26rem] sm:h-[32rem] lg:h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(16,10,24,0.72) 0%, rgba(16,10,24,0) 44%)' }} />
                  <div className="absolute inset-x-7 bottom-7">
                    <div className="font-serif font-semibold text-cream text-xl md:text-2xl tracking-tight">Mayanov</div>
                    <div className="mt-1 text-white/70 text-[0.62rem] uppercase tracking-[0.24em]">{isIndonesian ? 'Pembaca Tarot' : 'Tarot Reader'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — story */}
            <div className="lg:col-span-7 lg:pt-3">
              {/* wellness hook — pull quote */}
              <div className="relative">
                <span aria-hidden className="pointer-events-none absolute -left-1 -top-9 md:-top-12 font-serif text-[5rem] md:text-[7.5rem] leading-none text-coral-deep/25 select-none">&ldquo;</span>
                <p className="relative font-elegant italic text-ink text-[1.5rem] md:text-[1.9rem] xl:text-[2.15rem] leading-[1.3] tracking-[-0.01em]">
                  {isIndonesian
                    ? 'Tarot, buat saya, bukan soal takdir yang menakutkan — melainkan ruang tenang untuk berhenti sejenak, mendengarkan diri, dan menemukan kejernihan di tengah hiruk-pikuk.'
                    : 'Tarot, for me, isn’t about scary fate — it’s a calm space to pause, listen to yourself, and find clarity in the middle of the noise.'}
                </p>
              </div>

              <div className="mt-8 space-y-6 text-base md:text-lg text-ink/80 font-light leading-relaxed">
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

            </div>
          </div>

          {/* full-width closing statement */}
          <div className="mt-16 md:mt-24">
            <p className="font-serif text-ink text-[1.4rem] md:text-[2rem] lg:text-[2.3rem] xl:text-[2.6rem] leading-[1.2] tracking-[-0.015em]">
              {isIndonesian
                ? 'Tujuan saya simpel: memberi kejelasan agar kamu bisa mengambil keputusan dengan percaya diri.'
                : 'My goal is simple — the clarity you need to make decisions with confidence.'}
            </p>
          </div>
        </FadeIn>
      </SectionPanel>
    </section>
  );
};

export default About;
