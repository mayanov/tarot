import React from 'react';

/**
 * A card face painted in watercolour instead of a smooth gradient: the card's colour
 * laid in as a flat wash, then pools of a lighter and a deeper tone dropped in wet,
 * their edges wandering and drying a little darker, a pale backrun where water crept
 * back, and the pigment settling into the paper's tooth (granulation). Fills its
 * (relative, rounded) parent; put it first, under the card's contents.
 *
 * colors: [light, mid, deep] — mid is the card's body colour.
 */
const CardWash: React.FC<{ colors: readonly [string, string, string]; className?: string }> = ({ colors, className = '' }) => {
  const raw = React.useId();
  const id = raw.replace(/:/g, '');
  const seed = [...raw].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 997, 7);
  const [light, mid, deep] = colors;
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`} style={{ background: mid }}>
      {/* drawn in a 100 x 160 box (the card's 5:8), stretched to fit */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          {/* a pool of paint: wandering edge, soft body, a darker rim where it dried */}
          <filter id={`${id}p`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="1.4" result="soft" />
            <feGaussianBlur in="soft" stdDeviation="4.5" result="wide" />
            <feComposite in="soft" in2="wide" operator="arithmetic" k2="1" k3="-1" result="edge" />
            <feComponentTransfer in="edge" result="rim">
              <feFuncR type="linear" slope="0.7" />
              <feFuncG type="linear" slope="0.7" />
              <feFuncB type="linear" slope="0.7" />
              <feFuncA type="linear" slope="1.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="soft" />
              <feMergeNode in="rim" />
            </feMerge>
          </filter>
        </defs>

        {/* the deeper tone pooling low and into the far corner */}
        <g filter={`url(#${id}p)`}>
          <ellipse cx="62" cy="150" rx="88" ry="52" fill={deep} opacity="0.85" />
          <ellipse cx="104" cy="14" rx="38" ry="32" fill={deep} opacity="0.5" />
          <ellipse cx="-6" cy="96" rx="22" ry="40" fill={deep} opacity="0.35" />
        </g>
        {/* the lighter tone dropped in near the top, and a drift across the middle */}
        <g filter={`url(#${id}p)`}>
          <ellipse cx="20" cy="10" rx="56" ry="44" fill={light} opacity="0.7" />
          <ellipse cx="44" cy="84" rx="48" ry="16" fill={light} opacity="0.22" transform="rotate(-14 44 84)" />
        </g>
        {/* a pale backrun */}
        <g filter={`url(#${id}p)`}>
          <ellipse cx="72" cy="58" rx="15" ry="12" fill={light} opacity="0.2" />
        </g>
      </svg>
      {/* pigment settling into the tooth: fine dark specks across the wash (in pixel
          space, so the grain stays fine whatever the card's size) */}
      <svg className="absolute inset-0 h-full w-full">
        <filter id={`${id}g`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed={seed + 1} />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.1" />
        </filter>
        <rect width="100%" height="100%" fill={deep} filter={`url(#${id}g)`} opacity="0.28" />
      </svg>
    </span>
  );
};

export default CardWash;
