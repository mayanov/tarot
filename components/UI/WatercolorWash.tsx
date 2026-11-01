import React from 'react';
import Baked from './Baked';

interface WatercolorWashProps {
  className?: string;
  /**
   * 'panel' (default): a madder-rose wash over a block of text, roughly its shape.
   * 'stroke': one broad brushstroke swept across the page, streaked where the
   * bristles ran dry — cooler (blue-lilac), for a single line of content like a quote.
   * 'pool': a loose, rounded patch of violet laid wet, a rose bloom run into one side
   * and a cooler one into the other; stronger than the panel, for a pull quote.
   */
  variant?: 'panel' | 'stroke' | 'pool';
}

/**
 * A pale watercolour wash to sit behind a block of text on the light paper sections,
 * in place of a bordered, tinted box: two overlapping madder-rose brush passes with ragged
 * edges where the pigment pooled as it dried, a few wet-in-wet blooms (rose, coral,
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

/**
 * A broad brushstroke: edges torn along the direction of the sweep, the paint pooled
 * along its rims, and dry streaks where the bristles skipped over the paper.
 */
const brushFilter = (id: string, seed: number, scale: number) => (
  <filter id={id} x="-10%" y="-30%" width="120%" height="160%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.03" numOctaves="3" seed={seed} result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" result="d" />
    <feGaussianBlur in="d" stdDeviation="1.4" result="soft" />
    <feColorMatrix in="soft" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 40 0" result="shape" />
    <feMorphology in="shape" operator="erode" radius="5" result="er" />
    <feGaussianBlur in="er" stdDeviation="6" result="erb" />
    <feComposite in="shape" in2="erb" operator="out" result="band" />
    <feComposite in="soft" in2="band" operator="in" result="rim" />
    <feMerge result="m">
      <feMergeNode in="soft" />
      <feMergeNode in="rim" />
      <feMergeNode in="rim" />
    </feMerge>
    {/* bristle streaks running along the stroke: some run dry and leave paper showing */}
    <feTurbulence type="fractalNoise" baseFrequency="0.0015 0.11" numOctaves="2" seed={seed + 3} result="s" />
    <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.3" result="sa" />
    <feComposite in="m" in2="sa" operator="in" result="streaked" />
    <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed={seed + 2} result="g" />
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9" result="ga" />
    <feComposite in="streaked" in2="ga" operator="in" />
  </filter>
);

const WatercolorWash: React.FC<WatercolorWashProps> = ({ className = '', variant = 'panel' }) => {
  const id = React.useId().replace(/:/g, '');
  if (variant === 'stroke') {
    return (
      <Baked className={className} bleed={90}>
      <svg aria-hidden style={{ transform: 'rotate(-2.5deg)' }} className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          {brushFilter(`${id}a`, 5, 70)}
          {brushFilter(`${id}b`, 13, 50)}
          <filter id={`${id}p`} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="80" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="20" />
          </filter>
        </defs>

        {/* the main sweep, loaded with paint, then a narrower blue pass dragged through
            its lower half and a rose one along the top */}
        <rect x="1%" y="14%" width="97%" height="70%" rx="9%" ry="50%" fill="#7a52b4" fillOpacity="0.06" filter={`url(#${id}a)`} />
        <rect x="9%" y="46%" width="72%" height="34%" rx="9%" ry="50%" fill="#6f86d6" fillOpacity="0.07" filter={`url(#${id}b)`} />
        <rect x="30%" y="12%" width="66%" height="30%" rx="9%" ry="50%" fill="#d77fa6" fillOpacity="0.075" filter={`url(#${id}b)`} />
        {/* where the brush first touched down, the paint pooled */}
        <g filter={`url(#${id}p)`}>
          <ellipse cx="6%" cy="46%" rx="7%" ry="26%" fill="#b48ad6" fillOpacity="0.12" />
          <ellipse cx="88%" cy="34%" rx="9%" ry="18%" fill="#e3a0c4" fillOpacity="0.1" />
          <ellipse cx="22%" cy="76%" rx="9%" ry="16%" fill="#6fb0c4" fillOpacity="0.09" />
        </g>
      </svg>
      </Baked>
    );
  }
  if (variant === 'pool') {
    return (
      <Baked className={className} bleed={90}>
      <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          {washFilter(`${id}a`, 7, '0.004 0.006', 120)}
          {washFilter(`${id}b`, 17, '0.005 0.007', 90)}
          <filter id={`${id}p`} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="21" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="90" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="18" />
          </filter>
        </defs>

        {/* the patch, laid on loosely (rounder than the panel, no straight sides),
            then a second, smaller pass off-centre so the edges double up unevenly */}
        <rect x="-2%" y="0%" width="102%" height="100%" rx="22%" ry="46%" fill="#7a52b4" fillOpacity="0.085" filter={`url(#${id}a)`} />
        <rect x="8%" y="10%" width="80%" height="78%" rx="22%" ry="46%" fill="#8a5cc0" fillOpacity="0.05" filter={`url(#${id}b)`} />
        {/* blooms run into it while wet: rose to the right, a cool blue-green low left */}
        <g filter={`url(#${id}p)`}>
          <ellipse cx="82%" cy="30%" rx="18%" ry="30%" fill="#d77fa6" fillOpacity="0.13" />
          <ellipse cx="14%" cy="72%" rx="16%" ry="26%" fill="#6fa0c8" fillOpacity="0.1" />
          <ellipse cx="44%" cy="20%" rx="14%" ry="18%" fill="#b48ad6" fillOpacity="0.1" />
        </g>
      </svg>
      </Baked>
    );
  }
  return (
    <Baked className={className} bleed={70}>
    <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible">
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
      <rect x="0.5%" y="1%" width="98%" height="97%" rx="60" fill="#b5435a" fillOpacity="0.05" filter={`url(#${id}a)`} />
      {/* second pass, offset and narrower, so the edges double up unevenly */}
      <rect x="4%" y="5%" width="93%" height="92%" rx="80" fill="#a8445e" fillOpacity="0.035" filter={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`} filter={`url(#${id}p)`}>
        <ellipse cx="86%" cy="18%" rx="22%" ry="26%" fill="#d9707a" fillOpacity="0.11" />
        <ellipse cx="12%" cy="78%" rx="20%" ry="24%" fill="#c25a6e" fillOpacity="0.09" />
        <ellipse cx="54%" cy="96%" rx="26%" ry="14%" fill="#b48ad6" fillOpacity="0.06" />
        <ellipse cx="34%" cy="8%" rx="16%" ry="12%" fill="#e6a0a0" fillOpacity="0.1" />
      </g>
    </svg>
    </Baked>
  );
};

export default WatercolorWash;
