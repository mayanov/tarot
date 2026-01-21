import React from 'react';
import { ArrowRight } from 'lucide-react';
import FadeIn from '../UI/FadeIn';

interface CTAProps {
    isIndonesian?: boolean;
}

const CTA: React.FC<CTAProps> = ({ isIndonesian = false }) => {
  const scrollToServices = () => {
    const element = document.getElementById('services');
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-24 relative overflow-hidden bg-bg-deep">
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <FadeIn>
          {/* Main Card Container */}
          <div className="relative rounded-[2.5rem] p-10 md:p-20 overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(138,96,208,0.3)] transition-shadow duration-500">
            
            {/* Alive Background: Vibrant Purple Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#9F75E8] via-[#7B52C6] to-[#5E3B96] animate-pulse-slow"></div>
            
            {/* Grain Texture Overlay for 'Alive' feel */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50 mix-blend-overlay contrast-125 brightness-110"></div>
            
            {/* Subtle Sheen */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-bold text-white font-serif mb-6 leading-tight drop-shadow-md">
                  {isIndonesian 
                    ? "Mari temukan jawaban yang kamu cari."
                    : "Let’s uncover the answers you’ve been looking for."}
                </h2>
                <p className="text-white/95 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
                  {isIndonesian 
                    ? "Merasa stuck atau sekadar penasaran? Saya di sini membantu menavigasi langkahmu selanjutnya dengan percaya diri."
                    : "Whether you're feeling stuck or just curious, I'm here to help you navigate your next steps with confidence and care."}
                </p>
              </div>
              
              <div className="flex-shrink-0">
                <button 
                    onClick={scrollToServices}
                    className="bg-white text-[#1a1a2e] px-8 py-4 md:px-10 md:py-5 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 group"
                >
                    {isIndonesian ? "Pesan Bacaan" : "Book a Reading"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default CTA;