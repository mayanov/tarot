import React from 'react';

/**
 * Lays real card stock over a card face, so it reads as a printed tarot card that has
 * been handled rather than a flat screen shape: the felt-pressed finish of good card
 * (a fine pebble with a few fibres, lit from the top left), ink that sits a little unevenly
 * on the stock, the odd fleck in the board, and edges and corners only lightly softened
 * by handling — cared for, not worn out. Put it as the last child of the card face (which must be
 * `relative`); it takes the face's rounded corners. Every card wears differently.
 *
 * tone: 'dark' for the night-plum faces (wear shows as pale, rubbed-through board),
 *       'light' for the paper-coloured backs (wear shows as faint grime).
 */
const CardStock: React.FC<{ tone?: 'dark' | 'light'; className?: string }> = ({ tone = 'dark', className = '' }) => {
  const raw = React.useId();
  const id = raw.replace(/:/g, '');
  const seed = [...raw].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 997, 7);
  const dark = tone === 'dark';
  const wear = dark ? '#e9dcf5' : '#3b2d4a';
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}>
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          {/* felt finish: a fine, even pebble pressed into the board, with a few longer
              fibres in it, raised into a relief and lit */}
          <filter id={`${id}l`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed={seed} result="p" />
            <feTurbulence type="fractalNoise" baseFrequency="0.09 0.5" numOctaves="2" seed={seed + 1} result="fib" />
            <feComposite in="p" in2="fib" operator="arithmetic" k2="0.75" k3="0.25" result="weave" />
            <feDiffuseLighting in="weave" surfaceScale="1.3" diffuseConstant="1" lightingColor="#fff" result="lit">
              <feDistantLight azimuth="225" elevation="52" />
            </feDiffuseLighting>
            <feColorMatrix in="lit" type="saturate" values="0" />
          </filter>
          {/* the ink lying unevenly: broad, soft lighter and darker patches */}
          <filter id={`${id}i`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed={seed + 2} />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.2 0 0 0 -1.05" />
          </filter>
          {/* flecks in the board, and fine scuffs running along the card */}
          <filter id={`${id}f`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="1" seed={seed + 3} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -9 6.4" result="flecks" />
            <feTurbulence type="fractalNoise" baseFrequency="0.003 0.16" numOctaves="2" seed={seed + 4} result="s" />
            <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -14 8.6" result="scuffs" />
            <feMerge>
              <feMergeNode in="flecks" />
              <feMergeNode in="scuffs" />
            </feMerge>
          </filter>
          {/* rubbed edges: the rim worn through in patches, most at the corners */}
          <filter id={`${id}e`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed={seed + 5} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={seed + 6} result="m" />
            <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5 3.1" result="patches" />
            <feComposite in="d" in2="patches" operator="in" result="worn" />
            <feGaussianBlur in="worn" stdDeviation="0.6" />
          </filter>
          <radialGradient id={`${id}c`}>
            <stop offset="0" stopColor={wear} stopOpacity="0.9" />
            <stop offset="1" stopColor={wear} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" filter={`url(#${id}l)`} style={{ mixBlendMode: 'soft-light' }} opacity={dark ? 0.5 : 0.4} />
        <rect width="100%" height="100%" fill="#fff" filter={`url(#${id}i)`} style={{ mixBlendMode: 'soft-light' }} opacity={dark ? 0.22 : 0.12} />
        <rect width="100%" height="100%" fill={wear} filter={`url(#${id}f)`} opacity={dark ? 0.03 : 0.02} />
        <g filter={`url(#${id}e)`} fill="none" stroke={wear} opacity={dark ? 0.12 : 0.07}>
          {/* centred on the card's outline, so its inner half shows along every edge */}
          <rect width="100%" height="100%" rx="14" strokeWidth="3" />
          {/* the corners, where a card is held and shuffled */}
          <g stroke="none" fill={`url(#${id}c)`}>
            <circle cx="0" cy="0" r="9" />
            <svg x="100%" overflow="visible"><circle cx="0" cy="0" r="7" /></svg>
            <svg y="100%" overflow="visible"><circle cx="0" cy="0" r="7" /></svg>
            <svg x="100%" y="100%" overflow="visible"><circle cx="0" cy="0" r="9" /></svg>
          </g>
        </g>
      </svg>
    </span>
  );
};

export default CardStock;
