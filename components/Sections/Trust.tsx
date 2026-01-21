import React from 'react';
import FadeIn from '../UI/FadeIn';
import { trackEvent } from '../../services/analytics';
import { Users, Clock, MessageCircle, Star, Info, ShieldCheck, FileWarning, Heart } from 'lucide-react';

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
        value: "2,000+", 
        label: isIndonesian ? "Jam Sesi" : "Hours of Guidance" 
    },
    { 
        icon: MessageCircle, 
        value: "3,500+", 
        label: isIndonesian ? "Total Sesi" : "Sessions Done" 
    },
    { 
        icon: Star, 
        value: "5.0", 
        label: isIndonesian ? "Rating Google Review" : "Google Review Rating" 
    },
  ];

  const policies = [
    {
      icon: <Info className="w-5 h-5 text-teal-accent" />,
      title: isIndonesian ? "Panduan & Refleksi" : "Guidance & Reflection",
      text: isIndonesian 
        ? "Bacaan untuk wawasan, kejelasan, dan hiburan."
        : "Readings are for insight, clarity, and entertainment."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-lilac" />,
      title: isIndonesian ? "Privat & Aman" : "Private & Safe",
      text: isIndonesian
        ? "Pertanyaan dan ceritamu 100% rahasia."
        : "Your questions and stories are 100% confidential."
    },
    {
      icon: <FileWarning className="w-5 h-5 text-teal-accent" />,
      title: isIndonesian ? "Kamu Kendalinya" : "You Are In Control",
      text: isIndonesian
        ? "Saya baca energinya, tapi keputusan tetap di tanganmu."
        : "I read the energy, but you always hold the power to choose."
    },
    {
      icon: <Heart className="w-5 h-5 text-lilac" />,
      title: isIndonesian ? "Tidak Ada Refund" : "Final Sale",
      text: isIndonesian
        ? "Karena waktu dan energi terpakai, bacaan tidak dapat di-refund."
        : "Because time and energy are used, readings are non-refundable."
    }
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
            <span className="text-lilac font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                {isIndonesian ? "Kepercayaan & Pengalaman" : "Trust & Experience"}
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                {isIndonesian ? "Kamu di Tangan yang Tepat" : "You're in Good Hands"}
            </h2>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20 relative">
             {/* Decorative connector line for desktop */}
             <div className="hidden md:block absolute top-1/2 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10"></div>

            {stats.map((stat, idx) => (
              <div key={idx} className="group relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-teal-accent/20 to-lilac/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative h-full flex flex-col items-center justify-center p-6 md:p-8 bg-[#1E1E2E]/80 backdrop-blur-sm rounded-2xl border border-white/10 group-hover:border-teal-accent/40 transition-all duration-300 shadow-xl group-hover:-translate-y-2 group-hover:shadow-teal-accent/10">
                    
                    {/* Icon Container */}
                    <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-[#252538] to-[#1A1A27] border border-white/5 group-hover:border-teal-accent/30 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-teal-accent group-hover:text-white transition-colors duration-300" />
                    </div>
                    
                    {/* Number with gradient text */}
                    <div className="text-3xl md:text-5xl font-bold mb-2 tracking-tight font-serif text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400 group-hover:from-white group-hover:to-teal-accent transition-all duration-300">
                        {stat.value}
                    </div>
                    
                    <p className="text-[10px] md:text-xs text-text-subtle font-bold uppercase tracking-widest group-hover:text-teal-accent/80 transition-colors">
                        {stat.label}
                    </p>
                </div>
              </div>
            ))}
          </div>

          {/* GOOGLE REVIEWS BUTTON */}
          <div className="text-center mb-20">
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
          
          {/* POLICIES GRID */}
          <div className="border-t border-white/10 pt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {policies.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition duration-300 border border-transparent hover:border-white/5">
                    <div className="p-2 rounded-lg bg-[#252538] border border-white/10 shrink-0">
                        {item.icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white mb-1">{item.title}</h3>
                        <p className="text-xs text-text-subtle leading-relaxed">{item.text}</p>
                    </div>
                </div>
                ))}
            </div>
          </div>

        </FadeIn>
      </div>
    </section>
  );
};

export default Trust;