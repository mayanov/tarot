import React from 'react';

interface MarqueeProps {
  isIndonesian?: boolean;
}

// A full-bleed kinetic strip — big words drifting sideways over a dark cosmic band.
// Breaks the run of white panels with motion and a change of texture.
const Marquee: React.FC<MarqueeProps> = ({ isIndonesian = false }) => {
  // Gentle self-care phrases rather than value/selling words.
  const words = isIndonesian
    ? ['Tarik napas', 'Pelan-pelan aja', 'Datang apa adanya', 'Kamu berhak jeda', 'Lembut sama diri sendiri', 'Dengar hatimu', 'Nggak apa-apa nggak tahu']
    : ['Breathe', 'Slow down', 'Come as you are', "You're allowed to pause", 'Be gentle with yourself', 'Listen inward', "It's okay to not know"];

  const Row = () => (
    <div className="flex items-center shrink-0">
      {words.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className="px-8 md:px-12 font-elegant font-medium text-cream/90 text-[2rem] md:text-[3.2rem] leading-none tracking-[-0.02em]">
            {w}
          </span>
          <span aria-hidden className="text-moon-deep text-lg md:text-2xl leading-none">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <section aria-hidden className="relative overflow-hidden isolate py-8 md:py-12 border-y border-white/[0.06]" style={{ background: 'linear-gradient(180deg, #0C0C0D 0%, #14102E 100%)' }}>
      <div className="flex w-max animate-[marquee_34s_linear_infinite] will-change-transform">
        <Row />
        <Row />
      </div>
    </section>
  );
};

export default Marquee;
