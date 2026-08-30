import React, { useEffect, useRef } from 'react';
import FadeIn from '../UI/FadeIn';
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
      className="py-20 md:py-28 lg:py-32 relative overflow-hidden isolate border-b border-white/10"
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10">
        <FadeIn>
          {/* oversized editorial heading — starts at the page margin */}
          <h2 className="font-serif font-semibold text-cream tracking-[-0.03em] leading-[0.9] text-[3rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] xl:text-[7rem]">
            {isIndonesian ? (
              <>Halo, saya <span className="text-coral">Mayanov.</span></>
            ) : (
              <>Hi, I&rsquo;m <span className="text-coral">Mayanov.</span></>
            )}
          </h2>

          <div className="mt-12 md:mt-16 grid lg:grid-cols-12 gap-y-14 gap-x-10 lg:gap-x-20 items-start">
            {/* LEFT — portrait with clean overlay */}
            <div className="lg:col-span-5">
              <div ref={photoRef} className="relative will-change-transform">
                <div className="relative overflow-hidden rounded-xl shadow-[0_40px_80px_-50px_rgba(0,0,0,0.7)]">
                  <img
                    src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
                    alt="Mayanov"
                    className="w-full h-[30rem] md:h-[38rem] xl:h-[42rem] object-cover object-top"
                  />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(16,10,24,0.72) 0%, rgba(16,10,24,0) 44%)' }} />
                  <div className="absolute inset-x-6 bottom-6 flex items-end justify-between">
                    <div>
                      <div className="font-serif font-semibold text-cream text-xl md:text-2xl tracking-tight">Mayanov</div>
                      <div className="mt-1 text-white/65 text-[0.62rem] uppercase tracking-[0.24em]">{isIndonesian ? 'Pembaca Tarot' : 'Tarot Reader'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif font-bold text-coral text-[2.6rem] md:text-[3.2rem] leading-none">15+</div>
                      <div className="mt-1 text-white/65 text-[0.58rem] uppercase tracking-[0.22em]">{isIndonesian ? 'Tahun Praktik' : 'Years Reading'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — story */}
            <div className="lg:col-span-7 lg:pt-3">
              {/* wellness hook */}
              <p className="font-serif text-cream text-[1.65rem] md:text-[2.1rem] xl:text-[2.4rem] leading-[1.25] tracking-[-0.01em]">
                {isIndonesian
                  ? <>Tarot, buat saya, bukan soal takdir yang menakutkan — melainkan <span className="text-coral">ruang tenang</span> untuk berhenti sejenak, mendengarkan diri, dan menemukan kejernihan di tengah hiruk-pikuk.</>
                  : <>Tarot, for me, isn&rsquo;t about scary fate — it&rsquo;s a <span className="text-coral">calm space</span> to pause, listen to yourself, and find clarity in the middle of the noise.</>}
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-x-10 gap-y-6 text-base md:text-lg text-cream/80 font-light leading-relaxed">
                <p>
                  {isIndonesian
                    ? <>Saya sudah mendalami seni membaca Tarot sejak 2009 — lebih dari <span className="text-cream font-normal">15 tahun</span> menjadikannya medium untuk refleksi diri dan menemukan solusi yang nyata.</>
                    : <>I&rsquo;ve been reading Tarot since 2009 — over <span className="text-cream font-normal">15 years</span> using the cards as a medium for self-reflection and finding real solutions.</>}
                </p>
                <p>
                  {isIndonesian
                    ? <>Sesi bersama saya terasa seperti <span className="text-cream font-normal">percakapan jujur</span>, bukan ramalan. Kita bedah situasimu, kenali pola yang bikin stuck, lalu susun langkah konkret — <span className="text-coral font-normal">analitis, hangat, tanpa menghakimi.</span></>
                    : <>A session feels like an <span className="text-cream font-normal">honest conversation</span>, not a prediction. We unpack your situation, spot what keeps you stuck, and map concrete next steps — <span className="text-coral font-normal">analytical, warm, never judgmental.</span></>}
                </p>
                <p>
                  {isIndonesian
                    ? <>Kamu tidak perlu tahu apa-apa soal Tarot. Datang saja apa adanya — dengan pertanyaan besar, kegelisahan kecil, atau sekadar butuh didengar.</>
                    : <>You don&rsquo;t need to know anything about Tarot. Just come as you are — with the big questions, the small worries, or simply the need to be heard.</>}
                </p>
                <p>
                  {isIndonesian
                    ? <>Yang kamu bawa pulang bukan ketakutan, tapi <span className="text-cream font-normal">ketenangan</span> dan arah yang lebih jelas untuk melangkah.</>
                    : <>What you leave with isn&rsquo;t fear, but <span className="text-cream font-normal">calm</span> and a clearer sense of direction for your next step.</>}
                </p>
              </div>

            </div>
          </div>

          {/* full-width closing statement */}
          <div className="mt-16 md:mt-24 pt-10 md:pt-14 border-t border-white/10">
            <p className="font-serif text-cream text-[1.6rem] md:text-[2.3rem] lg:text-[2.7rem] xl:text-[3.1rem] leading-[1.2] tracking-[-0.015em] max-w-5xl">
              {isIndonesian
                ? <>Tujuan saya simpel: memberi <span className="text-coral">kejelasan</span> agar kamu bisa mengambil keputusan dengan percaya diri.</>
                : <>My goal is simple — the <span className="text-coral">clarity</span> you need to make decisions with confidence.</>}
            </p>
            <div className="mt-8 md:mt-10 flex items-center gap-5">
              <span className="font-serif font-bold text-2xl md:text-3xl text-coral tracking-tight">Mayanov</span>
              <span className="h-px flex-1 bg-white/15" />
              <span className="text-white/45 text-[0.66rem] uppercase tracking-[0.24em] whitespace-nowrap">{isIndonesian ? 'Pembaca Tarot · Sejak 2009' : 'Tarot Reader · Since 2009'}</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default About;
