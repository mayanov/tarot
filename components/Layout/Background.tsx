import React from 'react';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")";

// Light cream ground with only faint brand-colour washes — colour leads on the
// hero / CTA / footer accents, while content sections stay calm and readable.
const Background: React.FC = () => {
  return (
    <>
      {/* Warm cream ground */}
      <div className="fixed top-0 left-0 w-full h-full -z-30 bg-cream" />

      {/* Very soft, static brand-colour washes (low opacity — accent, not wallpaper) */}
      <div className="fixed top-0 left-0 w-full h-full -z-20 pointer-events-none overflow-hidden">
        <div className="absolute -top-[12%] -right-[10%] w-[55%] h-[50%] rounded-full bg-coral/[0.05] blur-[140px] animate-[blobA_32s_ease-in-out_infinite]" />
        <div className="absolute top-[35%] -left-[12%] w-[48%] h-[45%] rounded-full bg-mauve/[0.06] blur-[150px] animate-[blobB_38s_ease-in-out_infinite]" />
        <div className="absolute -bottom-[10%] right-[10%] w-[50%] h-[45%] rounded-full bg-plum/[0.05] blur-[150px] animate-[blobC_44s_ease-in-out_infinite]" />
      </div>

      {/* Fine paper grain */}
      <div
        className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-[0.5] mix-blend-multiply"
        style={{ backgroundImage: GRAIN, backgroundSize: '150px 150px' }}
      />
    </>
  );
};

export default Background;
