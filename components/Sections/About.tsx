import React, { useEffect } from 'react';
import FadeIn from '../UI/FadeIn';
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
    <section id="about" className="py-10 md:py-16 relative overflow-hidden isolate">
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
        <FadeIn>
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-[#F5F1EA] shadow-[0_40px_120px_-55px_rgba(0,0,0,0.7)] grid lg:grid-cols-12">
            {/* LEFT — full-bleed portrait */}
            <div className="lg:col-span-5 relative min-h-[24rem] lg:min-h-0">
              <img
                src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
                alt="Mayanov"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              {/* soft gradient + name plate */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(16,10,24,0.6) 0%, rgba(16,10,24,0) 42%)' }} />
              <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-3">
                <div>
                  <div className="font-serif font-semibold text-cream text-xl md:text-2xl tracking-tight leading-none">Mayanov</div>
                  <div className="mt-1.5 text-white/75 text-[0.6rem] uppercase tracking-[0.24em]">{isIndonesian ? 'Pembaca Tarot' : 'Tarot Reader'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-serif font-bold text-coral text-[2.2rem] md:text-[2.6rem] leading-none">15+</div>
                  <div className="mt-1 text-white/75 text-[0.55rem] uppercase tracking-[0.2em]">{isIndonesian ? 'Tahun' : 'Years'}</div>
                </div>
              </div>
            </div>

            {/* RIGHT — content */}
            <div className="lg:col-span-7 p-7 sm:p-10 md:p-14 lg:p-16">
              <h2 className="font-serif font-semibold text-ink text-[2.5rem] md:text-[3.4rem] leading-[1.0] tracking-[-0.03em]">
                {isIndonesian ? 'Tentang Saya' : 'About Me'}
              </h2>

              {/* pull quote */}
              <div className="relative mt-7 md:mt-9">
                <p className="relative font-elegant italic text-ink text-[1.45rem] md:text-[1.8rem] xl:text-[2rem] leading-[1.3] tracking-[-0.01em]">
                  {isIndonesian
                    ? 'Tarot, buat saya, bukan soal takdir yang menakutkan — melainkan ruang tenang untuk berhenti sejenak, mendengarkan diri, dan menemukan kejernihan di tengah hiruk-pikuk.'
                    : 'Tarot, for me, isn’t about scary fate — it’s a calm space to pause, listen to yourself, and find clarity in the middle of the noise.'}
                </p>
              </div>

              <div className="mt-7 space-y-5 text-base md:text-lg text-ink/80 font-light leading-relaxed">
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

              {/* closing statement */}
              <div className="mt-9 md:mt-11 pt-8 border-t border-coral-deep/35">
                <p className="font-serif text-ink text-[1.35rem] md:text-[1.7rem] lg:text-[1.95rem] leading-[1.2] tracking-[-0.015em]">
                  {isIndonesian
                    ? 'Tujuan saya simpel: memberi kejelasan agar kamu bisa mengambil keputusan dengan percaya diri.'
                    : 'My goal is simple — the clarity you need to make decisions with confidence.'}
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default About;
