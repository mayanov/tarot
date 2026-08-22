import React from 'react';
import { ArrowRight } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import { smoothScrollToId } from '../UI/scroll';

interface CTAProps {
  isIndonesian?: boolean;
}

const CTA: React.FC<CTAProps> = ({ isIndonesian = false }) => {
  const scrollToServices = () => {
    smoothScrollToId('services', 80);
  };

  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <FadeIn>
          {/* Main Card Container */}
          <div className="relative rounded-[2.5rem] p-10 md:p-20 overflow-hidden shadow-[0_40px_80px_-40px_rgba(62,48,80,0.6)]">
            {/* Accent pattern: cool TWILIGHT — blue + sage lead, plum depth, a coral pop. Distinct temperature from the warm hero. */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(85% 95% at 10% 8%, rgba(96,132,170,0.85) 0%, rgba(96,132,170,0) 52%),
                  radial-gradient(75% 85% at 92% 22%, rgba(103,140,113,0.62) 0%, rgba(103,140,113,0) 50%),
                  radial-gradient(110% 120% at 88% 108%, rgba(107,84,128,0.9) 0%, rgba(107,84,128,0) 55%),
                  radial-gradient(50% 55% at 62% 6%, rgba(224,132,88,0.5) 0%, rgba(224,132,88,0) 48%),
                  linear-gradient(122deg, #26384C 0%, #2E2F49 55%, #2A2838 100%)
                `,
              }}
            ></div>

            {/* Living drift — two slow-moving colour pools over the base */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen">
              <div className="absolute -top-[20%] left-[8%] w-[55%] h-[80%] rounded-full bg-blue/45 blur-[90px] animate-[blobB_28s_ease-in-out_infinite]" />
              <div className="absolute -bottom-[25%] right-[6%] w-[55%] h-[85%] rounded-full bg-coral/35 blur-[90px] animate-[blobC_32s_ease-in-out_infinite]" />
            </div>

            {/* Fold-light band + strong grain */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(100deg, rgba(230,240,255,0.12) 0%, rgba(230,240,255,0) 44%)' }}
            ></div>
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.22] mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.4'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
                backgroundSize: '200px 200px',
              }}
            ></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70 mb-4">
                  {isIndonesian ? "Yuk Mulai" : "Ready When You Are"}
                </p>
                <h2 className="text-4xl md:text-5xl font-serif font-medium text-[#FBF6EF] mb-5 leading-tight">
                  {isIndonesian
                    ? "Siap untuk kejelasan?"
                    : "Let's uncover the answers you've been looking for."}
                </h2>
                {!isIndonesian && (
                  <p className="text-[#FBF6EF]/85 text-lg font-light max-w-lg leading-relaxed">
                    Whether you're feeling stuck or just curious, I'm here to help you navigate your next steps with confidence and care.
                  </p>
                )}
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={scrollToServices}
                  className="bg-[#FBF6EF] text-ink px-8 py-4 md:px-10 md:py-5 rounded-full font-medium text-lg shadow-xl hover:-translate-y-0.5 hover:bg-white transition-all duration-300 flex items-center gap-3 group"
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
