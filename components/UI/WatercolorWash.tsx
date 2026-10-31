import React from 'react';

interface WatercolorWashProps {
  className?: string;
  /**
   * 'panel' (default): a lilac wash over a block of text, roughly its shape.
   * 'pool': a looser, rounded pool, warmer (rose first, lilac second) with peach and
   * blue dropped in — for a single centred piece like a quote.
   */
  variant?: 'panel' | 'pool';
}

/**
 * A pale watercolour wash to sit behind a block of text on the light paper sections,
 * in place of a bordered, tinted box: two overlapping lilac brush passes with ragged
 * edges where the pigment pooled as it dried, a few wet-in-wet blooms (rose, blue,
 * violet) and the paper's granulation. Drawn in pixel units (no viewBox), so the brush
 * texture keeps its scale whatever the box's shape — a wide panel or a tall phone column.
 */
const washFilter = (id: string, seed: number, freq: string, scale: number) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="3" seed={seed} result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" result="d" />
    <feGaussianBlur in="d" stdDeviation="1.6" result="soft" />
    {/* the rim is worked out on an opaque copy of the shape (the wash itself is too
        faint to erode), then filled with the wash's own colour */}
    <feColorMatrix in="soft" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 40 0" result="shape" />
    <feMorphology in="shape" operator="erode" radius="6" result="er" />
    <feGaussianBlur in="er" stdDeviation="8" result="erb" />
    <feComposite in="shape" in2="erb" operator="out" result="band" />
    <feComposite in="soft" in2="band" operator="in" result="rim" />
    <feMerge result="m">
      <feMergeNode in="soft" />
      <feMergeNode in="rim" />
      <feMergeNode in="rim" />
    </feMerge>
    <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed={seed + 2} result="g" />
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9" result="ga" />
    <feComposite in="m" in2="ga" operator="in" />
  </filter>
);

const WatercolorWash: React.FC<WatercolorWashProps> = ({ className = '', variant = 'panel' }) => {
  const id = React.useId().replace(/:/g, '');
  if (variant === 'pool') {
    return (
      <svg aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}>
        <defs>
          {washFilter(`${id}a`, 23, '0.0035 0.005', 120)}
          {washFilter(`${id}b`, 31, '0.0045 0.006', 95)}
          <filter id={`${id}p`} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" seed="17" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="100" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="26" />
          </filter>
        </defs>

        {/* a rose pool laid down first, then a lilac pass that only half covers it */}
        <ellipse cx="50%" cy="50%" rx="47%" ry="46%" fill="#c4689c" fillOpacity="0.05" filter={`url(#${id}a)`} />
        <ellipse cx="44%" cy="56%" rx="36%" ry="38%" fill="#7a52b4" fillOpacity="0.035" filter={`url(#${id}b)`} />
        <g filter={`url(#${id}p)`}>
          <ellipse cx="74%" cy="30%" rx="18%" ry="22%" fill="#f0b48c" fillOpacity="0.1" />
          <ellipse cx="24%" cy="70%" rx="17%" ry="20%" fill="#8fa6e2" fillOpacity="0.08" />
          <ellipse cx="58%" cy="78%" rx="16%" ry="12%" fill="#e3a0c4" fillOpacity="0.09" />
        </g>
      </svg>
    );
  }
  return (
    <svg aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}>
      <defs>
        {washFilter(`${id}a`, 3, '0.0032 0.0045', 110)}
        {washFilter(`${id}b`, 11, '0.004 0.0055', 90)}
        {/* blooms: soft, irregular pools of a second colour dropped into the wet wash */}
        <filter id={`${id}p`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="8" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="90" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="22" />
        </filter>
        <clipPath id={`${id}c`}>
          <rect x="2%" y="2%" width="96%" height="96%" rx="40" />
        </clipPath>
      </defs>

      {/* first pass: the broad wash */}
      <rect x="0.5%" y="1%" width="98%" height="97%" rx="60" fill="#7a52b4" fillOpacity="0.045" filter={`url(#${id}a)`} />
      {/* second pass, offset and narrower, so the edges double up unevenly */}
      <rect x="4%" y="5%" width="93%" height="92%" rx="80" fill="#7a52b4" fillOpacity="0.03" filter={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`} filter={`url(#${id}p)`}>
        <ellipse cx="86%" cy="18%" rx="22%" ry="26%" fill="#e3a0c4" fillOpacity="0.1" />
        <ellipse cx="12%" cy="78%" rx="20%" ry="24%" fill="#8fa6e2" fillOpacity="0.09" />
        <ellipse cx="54%" cy="96%" rx="26%" ry="14%" fill="#b48ad6" fillOpacity="0.07" />
        <ellipse cx="34%" cy="8%" rx="16%" ry="12%" fill="#c9b8e8" fillOpacity="0.09" />
      </g>
    </svg>
  );
};

export default WatercolorWash;
