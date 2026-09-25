import React from 'react';

interface MarqueeProps {
  isIndonesian?: boolean;
}

// A quiet, slim ticker — small drifting phrases, not a bold selling banner.
const Marquee: React.FC<MarqueeProps> = ({ isIndonesian = false }) => {
  const words = isIndonesian
    ? ['santai aja', 'nggak ada tekanan', 'kamu diterima di sini', 'ruang aman buat cerita', 'datang apa adanya']
    : ['take your time', 'no pressure', "you're welcome here", 'a safe space to talk', 'come as you are'];

  const Row = () => (
    <div className="flex items-center shrink-0">
      {words.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 md:px-9 font-elegant italic text-cream/45 text-base md:text-lg leading-none">
            {w}
          </span>
          <span aria-hidden className="text-cream/20 text-xs leading-none">&middot;</span>
        </span>
      ))}
    </div>
  );

  return (
    <section aria-hidden className="relative overflow-hidden isolate py-5 md:py-6 border-y border-white/[0.05]" style={{ background: 'linear-gradient(180deg, #0B0B12 0%, #12112A 100%)' }}>
      <div className="flex w-max animate-[marquee_55s_linear_infinite] will-change-transform">
        <Row />
        <Row />
      </div>
    </section>
  );
};

export default Marquee;
