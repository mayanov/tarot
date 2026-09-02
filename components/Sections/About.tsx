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
          <div className="grid lg:grid-cols-12 gap-y-10 gap-x-10 lg:gap-x-16 items-start">
            {/* LEFT — circular portrait, aligned top */}
            <div className="lg:col-span-5">
              <div ref={photoRef} className="relative w-full max-w-md mx-auto lg:max-w-none lg:mx-0 will-change-transform">
                <div className="relative aspect-square overflow-hidden rounded-full border border-ink/10 shadow-[0_40px_80px_-50px_rgba(0,0,0,0.55)]">
                  <img
                    src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
                    alt="Mayanov"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT — title + story */}
            <div className="lg:col-span-7 lg:pt-1">
              <h2 className="font-serif font-semibold text-ink text-[2.5rem] md:text-[3.4rem] leading-[1.0] tracking-[-0.03em] mb-7 md:mb-9">
                {isIndonesian ? 'Tentang Saya' : 'About Me'}
              </h2>
              {/* wellness hook — pull quote */}
              <div className="relative">
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
          <div className="mt-8 md:mt-12">
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
