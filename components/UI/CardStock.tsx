import React from 'react';

/**
 * Lays real tarot card stock over a card face, so it reads as a printed card from a
 * deck rather than a flat screen shape: the smooth satin coating of tarot cards (a very
 * fine grain under it, and a soft sheen where the light catches the lamination), ink
 * that sits a little unevenly, and gilded edges, the gold rubbed thin here and there by
 * shuffling. Put it as the last child of the card face (which must be `relative`); it
 * takes the face's rounded corners. Every card is a little different.
 *
 * tone: 'dark' for the night-plum faces, 'light' for the paper-coloured backs.
 */
const CardStock: React.FC<{ tone?: 'dark' | 'light'; className?: string }> = ({ tone = 'dark', className = '' }) => {
  const raw = React.useId();
  const id = raw.replace(/:/g, '');
  const seed = [...raw].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 997, 7);
  const dark = tone === 'dark';
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}>
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          {/* the board under the coating: a very fine, even grain, barely raised */}
          <filter id={`${id}l`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} result="g" />
            <feDiffuseLighting in="g" surfaceScale="0.7" diffuseConstant="1" lightingColor="#fff" result="lit">
              <feDistantLight azimuth="225" elevation="58" />
            </feDiffuseLighting>
            <feColorMatrix in="lit" type="saturate" values="0" />
          </filter>
          {/* the ink lying unevenly: broad, soft lighter and darker patches */}
          <filter id={`${id}i`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed={seed + 2} />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.2 0 0 0 -1.05" />
          </filter>
          {/* the satin sheen: a broad, soft band of light across the lamination */}
          <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset={`${0.28 + (seed % 20) / 100}`} stopColor="#fff" stopOpacity="0.55" />
            <stop offset={`${0.62 + (seed % 20) / 100}`} stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          {/* gilt: old gold, catching the light along the top */}
          <linearGradient id={`${id}g`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#f1d99a" />
            <stop offset="0.45" stopColor="#c9a25a" />
            <stop offset="1" stopColor="#9c7a3c" />
          </linearGradient>
          {/* the gilded edge, not quite even, rubbed thin in a few places */}
          <filter id={`${id}e`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed={seed + 5} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed={seed + 6} result="m" />
            <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.6 -0.6" result="kept" />
            <feComposite in="d" in2="kept" operator="in" />
          </filter>
        </defs>

        <rect width="100%" height="100%" filter={`url(#${id}l)`} style={{ mixBlendMode: 'soft-light' }} opacity={dark ? 0.3 : 0.25} />
        <rect width="100%" height="100%" fill="#fff" filter={`url(#${id}i)`} style={{ mixBlendMode: 'soft-light' }} opacity={dark ? 0.18 : 0.1} />
        <rect width="100%" height="100%" fill={`url(#${id}s)`} style={{ mixBlendMode: 'soft-light' }} opacity={dark ? 0.45 : 0.35} />
        {/* centred on the card's outline, so its inner half shows along every edge */}
        <rect width="100%" height="100%" rx="14" fill="none" stroke={`url(#${id}g)`} strokeWidth="3.5" filter={`url(#${id}e)`} opacity={dark ? 0.85 : 0.75} />
      </svg>
    </span>
  );
};

export default CardStock;
