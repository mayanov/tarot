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
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10">
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

        </FadeIn>
      </div>
    </section>
  );
};

export default About;
