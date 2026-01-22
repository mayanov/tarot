import React, { useEffect } from 'react';
import FadeIn from '../UI/FadeIn';
import { Sparkles, Quote } from 'lucide-react';
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
    <section id="about" className="py-24 md:py-32 relative bg-bg-deep overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#1E1E2E] to-transparent -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-lilac/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4">
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">

            {/* LEFT: Image Composition */}
            <div className="relative mx-auto md:mx-0 max-w-sm md:max-w-full">
              {/* Back Layer */}
              <div className="absolute inset-0 bg-gradient-to-tr from-lilac to-teal-accent rounded-[2rem] rotate-6 opacity-20 transition-transform duration-500 blur-sm"></div>

              {/* Middle Layer (Border) */}
              <div className="absolute inset-0 border-2 border-white/10 rounded-[2rem] -rotate-3 transition-transform duration-500 bg-[#1E1E2E]"></div>

              {/* Main Image Container */}
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl rotate-0 transition-transform duration-300">
                <img
                  src={`${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`}
                  alt="Mayanov"
                  className="w-full h-auto object-cover transition-all duration-700"
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F16] via-transparent to-transparent opacity-20"></div>
              </div>

              {/* Floating Experience Badge */}
              <div className="absolute -bottom-6 -right-6 bg-white text-bg-deep p-4 rounded-2xl shadow-xl shadow-lilac/10 animate-float-delayed border border-white/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-lilac fill-lilac" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Reading Since</span>
                    <span className="text-2xl font-serif font-bold leading-none">2009</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Content */}
            <div className="relative z-10 space-y-8 text-center md:text-left">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lilac/10 border border-lilac/20 text-lilac text-xs font-bold uppercase tracking-widest mb-4">
                  {isIndonesian ? "Tentang Reader" : "Meet The Reader"}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold font-serif text-white tracking-tight leading-tight">
                  {isIndonesian ? "Halo, saya Mayanov." : "Hi, I'm Mayanov."}
                </h2>
              </div>

              <div className="space-y-6 text-lg text-text-subtle font-light leading-relaxed">
                {isIndonesian ? (
                  <>
                    <p>
                      Saya telah mendalami seni membaca kartu Tarot sejak 2009. Dengan pengalaman lebih dari 10 tahun, saya menemukan bahwa kartu Tarot adalah medium yang baik untuk melakukan refleksi diri dan mencari solusi sebuah permasalahan.
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
                      My approach is <strong className="text-white font-medium">Analytical & Strategic</strong>. We uncover what's keeping you stuck, map out the situation, and build a concrete plan to move forward.
                    </p>
                  </>
                )}
              </div>

              {/* Quote Block */}
              <div className="relative bg-[#1A1A27] border-l-4 border-lilac p-6 rounded-r-xl my-8">
                <Quote className="absolute top-4 right-4 w-8 h-8 text-white/5" />
                <p className="italic text-gray-300 font-serif text-lg">
                  {isIndonesian
                    ? "\"Tujuan saya simpel: memberikan kejelasan agar kamu bisa mengambil keputusan dengan percaya diri.\""
                    : "\"My goal is simple: to provide the clarity you need to make decisions with confidence.\""}
                </p>
              </div>

              {/* Signature / Name */}
              <div className="pt-2">
                <p className="font-serif text-2xl text-lilac/80 italic">Mayanov</p>
              </div>
            </div>

          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default About;