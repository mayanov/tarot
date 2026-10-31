import React from 'react';

/**
 * A card face painted in watercolour: the card's colour graded softly from a light
 * corner to a deep one, then a few pools of the lighter and deeper tone dropped in
 * wet off the diagonal (edges wandering, barely darker where they dried), and the
 * pigment settling into the paper's tooth (granulation). Fills its
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
    <span aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`} style={{ background: `radial-gradient(135% 120% at 15% -15%, ${light} 0%, ${mid} 52%, ${deep} 100%)` }}>
      {/* drawn in a 100 x 160 box (the card's 5:8), stretched to fit */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          {/* a pool of paint: wandering edge, soft body, a darker rim where it dried */}
          <filter id={`${id}p`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="4" result="soft" />
            <feGaussianBlur in="soft" stdDeviation="4.5" result="wide" />
            <feComposite in="soft" in2="wide" operator="arithmetic" k2="1" k3="-1" result="edge" />
            <feComponentTransfer in="edge" result="rim">
              <feFuncR type="linear" slope="0.7" />
              <feFuncG type="linear" slope="0.7" />
              <feFuncB type="linear" slope="0.7" />
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="soft" />
              <feMergeNode in="rim" />
            </feMerge>
          </filter>
        </defs>

        {/* the deeper tone gathering into the far corner, and a little low on the left */}
        <g filter={`url(#${id}p)`}>
          <ellipse cx="102" cy="166" rx="66" ry="58" fill={deep} opacity="0.32" transform="rotate(-30 102 166)" />
          <ellipse cx="22" cy="118" rx="24" ry="18" fill={deep} opacity="0.12" transform="rotate(-25 22 118)" />
        </g>
        {/* the lighter tone dropped in at the lit corner, and a faint bloom across from it */}
        <g filter={`url(#${id}p)`}>
          <ellipse cx="8" cy="0" rx="52" ry="44" fill={light} opacity="0.28" transform="rotate(-30 8 0)" />
          <ellipse cx="76" cy="48" rx="20" ry="16" fill={light} opacity="0.1" />
        </g>
      </svg>
      {/* pigment settling into the tooth: fine dark specks across the wash (in pixel
          space, so the grain stays fine whatever the card's size) */}
      <svg className="absolute inset-0 h-full w-full">
        <filter id={`${id}g`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed={seed + 1} />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.1" />
        </filter>
        <rect width="100%" height="100%" fill={deep} filter={`url(#${id}g)`} opacity="0.12" />
      </svg>
    </span>
  );
};

export default CardWash;
