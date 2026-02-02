import React from 'react';
import { Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import FadeIn from '../UI/FadeIn';

interface HeroProps {
  isIndonesian?: boolean;
}

const Hero: React.FC<HeroProps> = ({ isIndonesian = false }) => {
  const scrollToServices = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('services');
    if (element) {
      const offset = 80; // Height of sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToAbout = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const element = document.getElementById('about');
    if (element) {
      // About section usually has padding-top, so we might want to scroll exactly to it or slightly offset
      // Since it's the next section, standard offset usually works well.
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="hero" className="relative min-h-[60vh] md:min-h-[60vh] flex flex-col justify-center pt-28 pb-12 md:pt-32 md:pb-20 text-center overflow-hidden">

      {/* --- Added Splash Backgrounds (Updated for Visibility) --- */}
      {/* Purple Splash (Top Left/Center) - Significantly increased opacity and moved closer */}
      <div className="absolute top-[-10%] left-[-5%] md:left-[10%] w-[500px] h-[500px] md:w-[800px] md:h-[800px] bg-purple-600/50 rounded-full blur-[100px] md:blur-[130px] pointer-events-none -z-20 animate-pulse-slower mix-blend-screen" />

      {/* Teal Splash (Bottom Right) - Significantly increased opacity and moved closer */}
      <div className="absolute bottom-[-5%] right-[-5%] md:right-[10%] w-[500px] h-[500px] md:w-[800px] md:h-[800px] bg-teal-600/40 rounded-full blur-[100px] md:blur-[130px] pointer-events-none -z-20 animate-pulse-slow mix-blend-screen" />
      {/* -------------------------------- */}

      {/* Dynamic Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[800px] md:h-[800px] border border-white/5 rounded-full animate-spin-slow pointer-events-none opacity-30 -z-10">
        <div className="absolute top-0 left-1/2 w-4 h-4 bg-lilac/50 rounded-full blur-md" />
        <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-teal-accent/50 rounded-full blur-md" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] border border-white/5 rounded-full animate-spin-reverse-slow pointer-events-none opacity-30 -z-10 dashed">
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <FadeIn>
          {/* Icon Visual with Float Animation */}
          <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 md:mb-8 animate-float">
            <div className="absolute inset-0 bg-lilac/20 blur-xl rounded-full" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-b from-lilac/10 to-transparent border border-lilac/30 flex items-center justify-center shadow-[0_0_30px_rgba(192,160,255,0.2)] backdrop-blur-sm">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-lilac drop-shadow-[0_0_10px_rgba(192,160,255,0.8)]" />
            </div>
          </div>

          <h1 className="text-4xl md:text-7xl mb-4 md:mb-6 leading-tight font-serif text-white drop-shadow-2xl tracking-normal">
            {isIndonesian ? (
              <>
                Sesi Tarot yang Analitis, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lilac via-white to-teal-accent">Bukan Mistis!</span>
              </>
            ) : (
              <>
                Find Your Clarity. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lilac via-white to-teal-accent">Own Your Path.</span>
              </>
            )}
          </h1>

          <p className="text-lg md:text-2xl text-text-subtle mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-light px-4">
            {isIndonesian
              ? "Dapatkan bacaan yang jelas, analitis, dan solutif—bukan sekadar ramalan tanpa arah."
              : "Real talk, practical advice, and a fresh perspective on what comes next. Tarot for self-reflection, not just prediction."
            }
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-12 md:mb-16">
            <a
              href="#services"
              onClick={scrollToServices}
              className="group relative inline-flex items-center justify-center px-8 py-3 md:px-10 md:py-4 font-bold text-[#05050A] transition-all duration-200 bg-lilac text-base md:text-lg rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lilac hover:bg-white hover:scale-105 shadow-[0_0_20px_rgba(192,160,255,0.4)] gap-2"
            >
              <span className="relative">
                {isIndonesian ? "Pilih Paket & Pesan Sesi" : "Book a Reading"}
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </FadeIn>
      </div>

      {/* Scroll Indicator */}
      <div
        role="button"
        tabIndex={0}
        onClick={scrollToAbout}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            scrollToAbout(e);
          }
        }}
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow opacity-50 hover:opacity-100 transition-opacity cursor-pointer hidden md:block"
        aria-label="Scroll to next section"
      >
        <ChevronDown className="w-6 h-6 text-white" />
      </div>
    </section>
  );
};

export default Hero;