import React from 'react';

interface SkyLayerProps {
  className?: string;
  /** rgba fill for the small drifting clouds */
  cloud?: string;
  /** rgba colour for the stars */
  star?: string;
  /** optional full CSS background for a soft glow behind everything */
  glow?: string;
  /** dim the starfield (0–1) */
  starOpacity?: number;
}

/**
 * A self-contained "sky" for the coloured section bands: a soft twinkling
 * starfield + a few small drifting clouds + an optional glow. Drop it inside a
 * `relative overflow-hidden` parent, behind the content (which should be z-10).
 * Colours are passed in so each band can be a different twilight hue.
 */
export const SkyLayer: React.FC<SkyLayerProps> = ({
  className = '',
  cloud = 'rgba(255,255,255,0.10)',
  star = 'rgba(255,255,255,0.9)',
  glow,
  starOpacity = 0.55,
}) => (
  <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
    {glow && <div className="absolute inset-0" style={{ background: glow }} />}

    {/* starfield — twinkles gently, denser up top */}
    <div
      className="absolute inset-0 animate-[skyTwinkle_7s_ease-in-out_infinite]"
      style={{
        backgroundImage:
          `radial-gradient(1.5px 1.5px at 20px 30px, ${star}, transparent 60%),` +
          `radial-gradient(1px 1px at 80px 70px, ${star}, transparent 60%),` +
          `radial-gradient(1.6px 1.6px at 140px 40px, ${star}, transparent 62%),` +
          `radial-gradient(1px 1px at 110px 120px, ${star}, transparent 60%),` +
          `radial-gradient(1.3px 1.3px at 190px 90px, ${star}, transparent 60%),` +
          `radial-gradient(1px 1px at 40px 160px, ${star}, transparent 60%),` +
          `radial-gradient(1.4px 1.4px at 230px 150px, ${star}, transparent 60%)`,
        backgroundSize: '250px 250px',
        opacity: starOpacity,
        maskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, rgba(0,0,0,0.4) 80%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, rgba(0,0,0,0.4) 80%, transparent 100%)',
      }}
    />

    {/* small drifting clouds */}
    <div className="absolute top-[10%] -left-[6%] w-[34%] h-[16%] rounded-[50%] blur-[38px] mix-blend-screen animate-[cloudA_80s_ease-in-out_infinite_alternate]" style={{ background: cloud }} />
    <div className="absolute top-[28%] right-[0%] w-[26%] h-[12%] rounded-[50%] blur-[34px] mix-blend-screen animate-[cloudB_96s_ease-in-out_infinite_alternate]" style={{ background: cloud }} />
    <div className="absolute bottom-[18%] left-[12%] w-[30%] h-[13%] rounded-[50%] blur-[40px] mix-blend-screen animate-[cloudA_112s_ease-in-out_infinite_alternate]" style={{ background: cloud }} />
    <div className="absolute bottom-[6%] right-[8%] w-[22%] h-[10%] rounded-[50%] blur-[32px] mix-blend-screen animate-[cloudB_88s_ease-in-out_infinite_alternate]" style={{ background: cloud }} />
  </div>
);

export default SkyLayer;
