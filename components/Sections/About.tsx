import React, { useEffect, useRef } from 'react';
import FadeIn from '../UI/FadeIn';
import GrainyMesh from '../UI/GrainyMesh';
import { Star } from 'lucide-react';
import { trackEvent } from '../../services/analytics';
import { useParallax } from '../UI/scroll';

// Denser film grain for the aura-gradient panel.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.95'/%3E%3C/svg%3E\")";

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
      className="py-16 md:py-24 relative overflow-hidden isolate border-b border-white/10"
    >
      <div className="max-w-[1640px] mx-auto px-4 md:px-8 lg:px-10">
        <FadeIn>
          <div className="grid lg:grid-cols-12 gap-y-12 gap-x-10 lg:gap-x-16 items-start">

            {/* LEFT: editorial portrait */}
            <div className="lg:col-span-5 relative">
              {/* Oversized background numeral for depth */}
              <span
                aria-hidden
                className="pointer-events-none select-none absolute -top-10 md:-top-14 -left-3 md:-left-8 font-serif font-bold text-cream/[0.07] leading-none z-0"
                style={{ fontSize: 'clamp(7rem, 16vw, 13rem)' }}
              >
                15
              </span>

              <div ref={photoRef} className="relative z-10 will-change-transform">
                <div className="relative overflow-hidden rounded-lg shadow-[0_18px_40px_-32px_rgba(42,35,32,0.35)]">
                  <img
                    src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
                    alt="Mayanov"
                    className="w-full h-[26rem] md:h-[32rem] object-cover object-top"
                  />
                  {/* warm bottom gradient to seat the caption */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(42,35,32,0.55) 0%, rgba(42,35,32,0) 42%)' }} />
                  {/* overlaid caption */}
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="font-serif font-semibold text-cream text-lg tracking-tight">Mayanov</span>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT: story */}
            <div className="lg:col-span-7 lg:pt-6">
              <h2 className="font-serif font-semibold text-cream tracking-[-0.03em] leading-[1.0] text-[2.5rem] md:text-[3.4rem]">
                {isIndonesian ? (
                  <>Halo, saya <span className="font-normal text-coral">Mayanov.</span></>
                ) : (
                  <>Hi, I&rsquo;m <span className="font-normal text-coral">Mayanov.</span></>
                )}
              </h2>

              <div className="mt-7 space-y-5 text-cream/75 font-light leading-relaxed max-w-xl">
                {isIndonesian ? (
                  <>
                    <p className="text-xl text-cream/90">
                      Saya telah mendalami seni membaca kartu Tarot sejak 2009 — lebih dari 15 tahun menjadikan Tarot sebagai medium untuk refleksi diri dan mencari solusi.
                    </p>
                    <p className="text-lg">
                      Karena pada dasarnya pembacaan Tarot bukanlah sesederhana &lsquo;menerawang&rsquo; masa depan, melainkan menjadi sesi konsultasi yang mendewasakan baik Anda maupun saya.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl text-cream/90">
                      For me, Tarot isn&rsquo;t about predicting a scary, fixed future. That&rsquo;s the old way.
                    </p>
                    <p className="text-lg">
                      With more than 15 years of experience, my approach is{' '}
                      <strong className="text-coral font-medium">analytical &amp; strategic</strong>. We uncover what&rsquo;s keeping you stuck, map out the situation, and build a concrete plan to move forward.
                    </p>
                  </>
                )}
              </div>

              {/* Hanging editorial pull-quote */}
              <blockquote className="relative mt-10 pl-8 md:pl-10">
                <span aria-hidden className="absolute left-0 -top-4 font-serif text-coral/40 leading-none text-6xl md:text-7xl">&ldquo;</span>
                <p className="font-serif font-medium text-cream text-2xl md:text-[2rem] leading-[1.2] tracking-[-0.02em]">
                  {isIndonesian
                    ? 'Tujuan saya simpel: memberi kejelasan agar kamu bisa mengambil keputusan dengan percaya diri.'
                    : 'My goal is simple — the clarity you need to make decisions with confidence.'}
                </p>
              </blockquote>

              {/* Signature */}
              <div className="mt-8 flex items-center gap-4">
                <span className="h-px w-12 bg-coral/50" />
                <span className="font-serif font-bold text-2xl md:text-3xl text-coral tracking-tight">Mayanov</span>
              </div>
            </div>
          </div>

          {/* ---- By the numbers — grainy aura-gradient panel ---- */}
          <div className="relative overflow-hidden rounded-[1.75rem] mt-16 md:mt-20 p-8 md:p-12 lg:p-14 isolate">
            {/* Aura / mesh gradient */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background: `
                  radial-gradient(60% 65% at 16% 22%, #E47423 0%, rgba(225,116,63,0) 60%),
                  radial-gradient(55% 55% at 84% 12%, #F0A15C 0%, rgba(230,166,131,0) 55%),
                  radial-gradient(70% 70% at 82% 88%, #39234E 0%, rgba(107,84,128,0) 62%),
                  radial-gradient(58% 62% at 10% 90%, #C25E14 0%, rgba(193,73,58,0) 58%),
                  radial-gradient(75% 80% at 52% 55%, #29527B 0%, rgba(93,122,153,0) 66%),
                  linear-gradient(135deg, #2E1B40 0%, #3A2450 55%, #2C1A3C 100%)
                `,
              }}
            />
            {/* Film grain */}
            <div
              className="absolute inset-0 -z-10 opacity-[0.6] mix-blend-overlay"
              style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="md:border-l md:border-cream/20 md:pl-6 md:first:border-l-0 md:first:pl-0">
                  <div className="font-serif font-medium text-[2.75rem] md:text-[3.5rem] leading-none text-cream tracking-tight [text-shadow:0_2px_22px_rgba(20,12,26,0.4)]">
                    {stat.value}
                  </div>
                  <p className="mt-3 text-[0.7rem] md:text-xs text-cream/70 uppercase tracking-[0.2em]">
                    {stat.label}
                  </p>
                </div>
              ))}

              {/* Rating cell */}
              <div className="md:border-l md:border-cream/20 md:pl-6">
                <div className="font-serif font-medium text-[2.75rem] md:text-[3.5rem] leading-none text-cream tracking-tight [text-shadow:0_2px_22px_rgba(20,12,26,0.4)]">5.0</div>
                <div className="flex gap-0.5 text-gold-soft mt-3 mb-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" strokeWidth={0} />
                  ))}
                </div>
                <p className="text-[0.7rem] md:text-xs text-cream/70 uppercase tracking-[0.2em]">
                  {isIndonesian ? 'Rating Google' : 'Google Rating'}
                </p>
              </div>
            </div>

            {/* Verified reviews link */}
            <div className="mt-10 pt-8 border-t border-cream/15">
              <a
                href="https://www.google.com/search?sca_esv=ef40956f7e4432eb&sxsrf=ANbL-n7SdVoM--CpcK3sNMDGosFTkoIWNg:1769068673057&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOVbcCtc4v5CIiAET9zkHteUbRsgQt_Fpl3GV3F0FBTI5EvY7ur0sclLFX70p-8HpGb9DWBLb3vb0m5xByDWdvJPYkiNoXJpeI-f10yU8hV2jeBa8TQ%3D%3D&q=Tarot+Reading+by+Mayanov+Reviews&sa=X&ved=2ahUKEwj64dyu1p6SAxWSxzgGHSkADDwQ0bkNegQIJxAF"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleReviewsClick}
                className="inline-flex items-center gap-2 text-sm font-medium text-cream border-b border-cream/40 hover:border-cream pb-0.5 transition-colors group"
              >
                {isIndonesian ? 'Baca ulasan terverifikasi di Google' : 'Read verified reviews on Google'}
                <span className="text-gold-soft group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default About;
