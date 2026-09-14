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
    <section id="about" className="relative isolate">
      {/* full-bleed warm oat band — a clean cut from the hero's sky, no floating card */}
      <div className="bg-[#EFE7DB] text-ink">
        <FadeIn>
          <div className="grid lg:grid-cols-[40%_1fr] items-stretch">
            {/* LEFT — clean portrait, full-bleed to the left/top/bottom edges */}
            <div className="relative min-h-[52vh] lg:min-h-0 order-1">
              <img
                src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
                alt="Mayanov"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            </div>

            {/* RIGHT — content */}
            <div className="order-2 flex items-center">
              <div className="w-full max-w-xl px-6 sm:px-10 md:px-14 lg:px-16 py-11 md:py-14">
                <span className="block text-[11px] uppercase tracking-[0.28em] text-coral-deep mb-3.5">
                  {isIndonesian ? 'Tentang' : 'About'}
                </span>
                <h2 className="font-serif font-semibold text-ink text-[1.7rem] md:text-[2.1rem] leading-[1.05] tracking-[-0.02em]">
                  {isIndonesian ? 'Tentang Saya' : 'About Me'}
                </h2>

                {/* credential meta line */}
                <div className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-ink/50">
                  <span>{isIndonesian ? 'Pembaca Tarot' : 'Tarot Reader'}</span>
                  <span className="w-1 h-1 rounded-full bg-coral-deep/60" />
                  <span>{isIndonesian ? 'Sejak 2009' : 'Since 2009'}</span>
                  <span className="w-1 h-1 rounded-full bg-coral-deep/60" />
                  <span>{isIndonesian ? '15+ Tahun' : '15+ Years'}</span>
                </div>

                {/* pull quote */}
                <div className="relative mt-5">
                  <p className="relative font-elegant italic text-ink text-[1.05rem] md:text-[1.22rem] xl:text-[1.3rem] leading-[1.35] tracking-[-0.01em]">
                    {isIndonesian
                      ? 'Tarot, buat saya, bukan soal takdir yang menakutkan — melainkan ruang tenang untuk berhenti sejenak, mendengarkan diri, dan menemukan kejernihan di tengah hiruk-pikuk.'
                      : 'Tarot, for me, isn’t about scary fate — it’s a calm space to pause, listen to yourself, and find clarity in the middle of the noise.'}
                  </p>
                </div>

                <div className="mt-5 space-y-3 text-sm md:text-[14.5px] text-ink/75 font-light leading-[1.65]">
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
                <div className="mt-6 pt-5 border-t border-coral-deep/30">
                  <p className="font-serif text-ink text-[1rem] md:text-[1.18rem] lg:text-[1.28rem] leading-[1.3] tracking-[-0.015em]">
                    {isIndonesian
                      ? 'Tujuan saya simpel: memberi kejelasan agar kamu bisa mengambil keputusan dengan percaya diri.'
                      : 'My goal is simple — the clarity you need to make decisions with confidence.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default About;
