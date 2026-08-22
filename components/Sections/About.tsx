import React, { useEffect, useRef } from 'react';
import FadeIn from '../UI/FadeIn';
import { Quote, Star } from 'lucide-react';
import { trackEvent } from '../../services/analytics';
import { useParallax } from '../UI/scroll';

interface AboutProps {
  isIndonesian?: boolean;
}

const About: React.FC<AboutProps> = ({ isIndonesian = false }) => {
  const photoRef = useRef<HTMLDivElement>(null);
  useParallax(photoRef, -0.07);

  useEffect(() => {
    trackEvent(
      'view_item',
      { item_name: 'About Me', market: isIndonesian ? 'ID' : 'Global' },
      'ViewContent',
      { content_name: 'About Me', content_category: isIndonesian ? 'ID' : 'Global' }
    );
  }, [isIndonesian]);

  const handleReviewsClick = () => {
    trackEvent(
      'outbound_click',
      { event_category: 'trust', event_label: 'google_reviews', market: isIndonesian ? 'ID' : 'Global' },
      'ViewContent',
      { content_name: 'Google Review', content_category: isIndonesian ? 'ID' : 'Global' }
    );
  };

  const stats = [
    { value: '1,500+', label: isIndonesian ? 'Orang Terbantu' : 'People Helped' },
    { value: '3,200+', label: isIndonesian ? 'Jam Sesi' : 'Hours of Guidance' },
    { value: '7,700+', label: isIndonesian ? 'Total Sesi' : 'Sessions Done' },
  ];

  return (
    <section
      id="about"
      className="py-12 md:py-16 relative overflow-hidden border-b border-line"
      style={{
        background:
          'radial-gradient(58% 50% at 92% -2%, rgba(184,137,76,0.26), rgba(243,237,230,0) 58%), radial-gradient(56% 55% at 2% 102%, rgba(86,77,77,0.22), rgba(243,237,230,0) 60%), linear-gradient(160deg, #EDE6DB 0%, #E7E2D8 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

            {/* LEFT: Image Composition */}
            <div ref={photoRef} className="relative mx-auto md:mx-0 max-w-sm md:max-w-full will-change-transform">
              <div className="absolute inset-0 bg-plum/15 rounded-[1.75rem] rotate-3 transition-transform duration-500"></div>
              <div className="absolute inset-0 border border-line rounded-[1.75rem] -rotate-3 transition-transform duration-500 bg-surface-1"></div>

              <div className="relative rounded-[1.75rem] overflow-hidden shadow-[0_30px_60px_-30px_rgba(42,35,32,0.45)]">
                <img
                  src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
                  alt="Mayanov"
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Floating Experience Badge */}
              <div className="absolute -bottom-6 -right-4 md:-right-6 bg-surface-1 p-4 rounded-2xl shadow-[0_20px_40px_-20px_rgba(42,35,32,0.4)] border border-line animate-float-delayed">
                <div className="flex flex-col">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-plum">
                    {isIndonesian ? 'Membaca Sejak' : 'Reading Since'}
                  </span>
                  <span className="text-2xl font-serif font-semibold leading-none text-ink mt-1">2009</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Content */}
            <div className="relative z-10 space-y-7 text-center md:text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-plum mb-4">
                  {isIndonesian ? 'Tentang Reader' : 'Meet The Reader'}
                </p>
                <h2 className="text-4xl md:text-5xl font-serif font-medium text-ink tracking-tight leading-tight">
                  {isIndonesian ? 'Halo, saya Mayanov.' : "Hi, I'm Mayanov."}
                </h2>
              </div>

              <div className="space-y-5 text-lg text-ink-soft font-light leading-relaxed">
                {isIndonesian ? (
                  <>
                    <p>
                      Saya telah mendalami seni membaca kartu Tarot sejak 2009. Dengan pengalaman lebih dari 15 tahun, saya menemukan bahwa kartu Tarot adalah medium yang baik untuk melakukan refleksi diri dan mencari solusi sebuah permasalahan.
                    </p>
                    <p>
                      Karena pada dasarnya pembacaan Tarot bukanlah sesederhana ‘menerawang’ masa depan, melainkan menjadi sesi konsultasi yang mendewasakan baik Anda maupun saya.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      For me, Tarot isn't about predicting a scary, fixed future. That's the old way.
                    </p>
                    <p>
                      With more than 15 years of experience, my approach is{' '}
                      <strong className="text-plum font-medium">Analytical &amp; Strategic</strong>. We uncover what's keeping you stuck, map out the situation, and build a concrete plan to move forward.
                    </p>
                  </>
                )}
              </div>

              {/* Quote Block */}
              <div className="relative bg-paper-2 border-l-2 border-plum pl-6 pr-8 py-5 rounded-r-xl">
                <Quote className="absolute top-4 right-4 w-7 h-7 text-plum/15" />
                <p className="italic text-ink font-serif text-lg leading-relaxed">
                  {isIndonesian
                    ? '"Tujuan saya simpel: memberikan kejelasan agar kamu bisa mengambil keputusan dengan percaya diri."'
                    : '"My goal is simple: to provide the clarity you need to make decisions with confidence."'}
                </p>
              </div>

              {/* Signature */}
              <p className="font-serif text-2xl text-plum italic pt-1">Mayanov</p>
            </div>

          </div>

          {/* ---- By the numbers (merged from the old Trust section) ---- */}
          <div className="mt-10 md:mt-14 border-t border-line pt-8 md:pt-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 items-end">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center md:border-l md:border-line md:first:border-l-0">
                  <div className="font-serif font-medium text-4xl md:text-[3.25rem] leading-none text-ink">
                    {stat.value}
                  </div>
                  <p className="mt-3 text-[0.7rem] md:text-xs text-taupe uppercase tracking-[0.18em]">
                    {stat.label}
                  </p>
                </div>
              ))}

              {/* Rating cell — carries the star accent */}
              <div className="text-center md:border-l md:border-line">
                <div className="font-serif font-medium text-4xl md:text-[3.25rem] leading-none text-ink">5.0</div>
                <div className="flex justify-center gap-0.5 text-coral mt-2.5 mb-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" strokeWidth={0} />
                  ))}
                </div>
                <p className="text-[0.7rem] md:text-xs text-taupe uppercase tracking-[0.18em]">
                  {isIndonesian ? 'Rating Google' : 'Google Rating'}
                </p>
              </div>
            </div>

            {/* Verified reviews link */}
            <div className="mt-10 text-center">
              <a
                href="https://www.google.com/search?sca_esv=ef40956f7e4432eb&sxsrf=ANbL-n7SdVoM--CpcK3sNMDGosFTkoIWNg:1769068673057&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOVbcCtc4v5CIiAET9zkHteUbRsgQt_Fpl3GV3F0FBTI5EvY7ur0sclLFX70p-8HpGb9DWBLb3vb0m5xByDWdvJPYkiNoXJpeI-f10yU8hV2jeBa8TQ%3D%3D&q=Tarot+Reading+by+Mayanov+Reviews&sa=X&ved=2ahUKEwj64dyu1p6SAxWSxzgGHSkADDwQ0bkNegQIJxAF"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleReviewsClick}
                className="inline-flex items-center gap-2 text-sm font-medium text-ink border-b border-coral/40 hover:border-coral pb-0.5 transition-colors group"
              >
                {isIndonesian ? 'Baca ulasan terverifikasi di Google' : 'Read verified reviews on Google'}
                <span className="text-plum group-hover:translate-x-0.5 transition-transform">→</span>
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default About;
