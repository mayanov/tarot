import React from 'react';
import { MousePointerClick, MessageSquare, Sparkles } from 'lucide-react';
import FadeIn from '../UI/FadeIn';

interface ProcessProps {
  isIndonesian?: boolean;
}

const Process: React.FC<ProcessProps> = ({ isIndonesian = false }) => {
  return (
    <section id="process" className="py-12 md:py-20 relative bg-bg-deep border-t border-white/5 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: 'radial-gradient(#C0A0FF 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <FadeIn>
          <span className="text-lilac text-sm font-bold tracking-widest uppercase mb-4 block">
            {isIndonesian ? "Mudah & Aman" : "Simple & Secure"}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-white font-serif">
            {isIndonesian ? "Cara Kerjanya" : "How It Works"}
          </h2>

          <div className="relative grid grid-cols-3 gap-4 md:gap-12 md:flex md:flex-row md:justify-between items-start md:items-center text-center">

            {/* Connecting Line (Desktop Only) */}
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent -z-10" />

            {/* Step 1 */}
            <div className="flex flex-col items-center group relative md:px-4 md:flex-1">
              <div className="relative w-14 h-14 md:w-20 md:h-20 mx-auto bg-[#252535] rounded-2xl flex items-center justify-center text-lilac mb-4 md:mb-6 border border-white/10 shadow-lg transition-all duration-300 z-10 rotate-3">
                <MousePointerClick className="w-6 h-6 md:w-8 md:h-8 relative z-10" />
              </div>
              <h3 className="text-base md:text-xl font-bold text-white mb-2">
                {isIndonesian ? "1. Pilih Layanan" : "1. Pick a Reading"}
              </h3>
              <p className="text-[10px] md:text-sm text-text-subtle md:max-w-[200px] mx-auto leading-tight opacity-80">
                {isIndonesian ? "Cari paket yang sesuai kebutuhanmu saat ini." : "Choose the option that feels right for you."}
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center group relative md:px-4 md:flex-1">
              <div className="relative w-14 h-14 md:w-20 md:h-20 mx-auto bg-[#252535] rounded-2xl flex items-center justify-center text-lilac mb-4 md:mb-6 border border-white/10 shadow-lg transition-all duration-300 z-10 -rotate-3">
                <MessageSquare className="w-6 h-6 md:w-8 md:h-8 relative z-10" />
              </div>
              <h3 className="text-base md:text-xl font-bold text-white mb-2">
                {isIndonesian ? "2. Ceritakan Masalahmu" : "2. Send Your Question"}
              </h3>
              <p className="text-[10px] md:text-sm text-text-subtle md:max-w-[200px] mx-auto leading-tight opacity-80">
                {isIndonesian ? "Kirim pertanyaan atau cerita singkat lewat form/chat." : "Tell me what's on your mind in the order notes."}
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center group relative md:px-4 md:flex-1">
              <div className="relative w-14 h-14 md:w-20 md:h-20 mx-auto bg-[#252535] rounded-2xl flex items-center justify-center text-lilac mb-4 md:mb-6 border border-white/10 shadow-lg transition-all duration-300 z-10 rotate-3">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 relative z-10" />
              </div>
              <h3 className="text-base md:text-xl font-bold text-white mb-2">
                {isIndonesian ? "3. Dapat Pencerahan" : "3. Get Your Answers"}
              </h3>
              <p className="text-[10px] md:text-sm text-text-subtle md:max-w-[200px] mx-auto leading-tight opacity-80">
                {isIndonesian ? "Saya kirimkan analisa lengkap dan saran strategis." : "Receive your personal insights & guidance."}
              </p>
            </div>

          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Process;