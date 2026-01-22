import React from 'react';
import FadeIn from '../UI/FadeIn';
import { trackEvent } from '../../services/analytics';
import { Users, Clock, MessageCircle, Star } from 'lucide-react';

interface TrustProps {
  isIndonesian?: boolean;
}

const Trust: React.FC<TrustProps> = ({ isIndonesian = false }) => {
  const handleReviewsClick = () => {
    // Google Review Tracking
    trackEvent(
      'outbound_click',
      { event_category: 'trust', event_label: 'google_reviews', market: isIndonesian ? 'ID' : 'Global' },
      'ViewContent',
      { content_name: 'Google Review', content_category: isIndonesian ? 'ID' : 'Global' }
    );
  };

  const stats = [
    {
      icon: Users,
      value: "1,500+",
      label: isIndonesian ? "Orang Terbantu" : "People Helped"
    },
    {
      icon: Clock,
      value: "3,200+",
      label: isIndonesian ? "Jam Sesi" : "Hours of Guidance"
    },
    {
      icon: MessageCircle,
      value: "7,700+",
      label: isIndonesian ? "Total Sesi" : "Sessions Done"
    },
    {
      icon: Star,
      value: "5.0",
      label: isIndonesian ? "Rating Google Review" : "Google Review Rating"
    },
  ];

  return (
    <section id="trust" className="py-20 bg-[#13131F] border-y border-white/5 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <FadeIn>

          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
              {isIndonesian ? "Kamu di Tangan yang Tepat" : "You're in Good Hands"}
            </h2>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 relative">
            {/* Decorative connector line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10"></div>

            {stats.map((stat, idx) => (
              <div key={idx} className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-teal-accent/20 to-lilac/20 rounded-2xl blur-xl opacity-0 transition-opacity duration-500"></div>

                <div className="relative h-full flex flex-col items-center justify-center p-6 md:p-8 bg-[#1E1E2E]/80 backdrop-blur-sm rounded-2xl border border-white/10 transition-all duration-300 shadow-xl">

                  {/* Icon Container */}
                  <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-[#252538] to-[#1A1A27] border border-white/5 shadow-inner transition-transform duration-300">
                    <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-teal-accent transition-colors duration-300" />
                  </div>

                  {/* Number with gradient text */}
                  <div className="text-3xl md:text-5xl font-bold mb-2 tracking-tight font-serif text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400 transition-all duration-300">
                    {stat.value}
                  </div>

                  <p className="text-[10px] md:text-xs text-text-subtle font-bold uppercase tracking-widest transition-colors">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* GOOGLE REVIEWS BUTTON */}
          <div className="text-center">
            <a
              href="https://share.google/JFQhliOEEXSBetR9g"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleReviewsClick}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-lilac/50 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(192,160,255,0.2)]"
            >
              <span className="text-sm font-semibold text-white group-hover:text-lilac transition-colors">
                {isIndonesian ? "Baca ulasan terverifikasi di Google" : "Read verified reviews on Google"}
              </span>
              <span className="text-lilac group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>

        </FadeIn>
      </div>
    </section>
  );
};

export default Trust;