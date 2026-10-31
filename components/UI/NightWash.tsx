import React from 'react';

/**
 * A band of night-sky watercolour across the top of the page, for the floating nav
 * bar: a deep indigo wash laid on in one sweep, a lighter violet pass dragged
 * through it, a rose bloom at one end, the pigment pooled darker along the ragged
 * lower edge, and the paper's grain. It hangs a little below its box (the -bottom-4
 * overhang), so the ragged edge spills over the page instead of being cut straight.
 */
const NightWash: React.FC<{ className?: string }> = ({ className = '' }) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 -bottom-4 ${className}`}>
      <svg className="block h-full w-full overflow-visible">
        <defs>
          <filter id={`${id}w`} x="-5%" y="-60%" width="110%" height="220%" colorInterpolationFilters="sRGB">
            {/* streaky noise along the sweep, so the edge tears horizontally */}
            <feTurbulence type="fractalNoise" baseFrequency="0.005 0.035" numOctaves="3" seed="9" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="1.1" result="soft" />
            <feColorMatrix in="soft" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 30 0" result="shape" />
            <feMorphology in="shape" operator="erode" radius="4" result="er" />
            <feGaussianBlur in="er" stdDeviation="5" result="erb" />
            <feComposite in="shape" in2="erb" operator="out" result="band" />
            <feComposite in="soft" in2="band" operator="in" result="rim" />
            <feComponentTransfer in="rim" result="rimd">
              <feFuncR type="linear" slope="0.6" />
              <feFuncG type="linear" slope="0.6" />
              <feFuncB type="linear" slope="0.7" />
              <feFuncA type="linear" slope="0.6" />
            </feComponentTransfer>
            <feMerge result="m">
              <feMergeNode in="soft" />
              <feMergeNode in="rimd" />
            </feMerge>
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="10" result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.5 1.3" result="ga" />
            <feComposite in="m" in2="ga" operator="in" />
          </filter>
          <filter id={`${id}p`} x="-20%" y="-100%" width="140%" height="300%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.05" numOctaves="2" seed="12" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="6" />
          </filter>
        </defs>

        {/* the band reaches up off the screen; its lower edge ends about where the bar does */}
        <g filter={`url(#${id}w)`} fill="#1c1a4c" fillOpacity="0.92">
          <rect x="-3%" y="-60" width="106%" height="70" />
          <rect x="-3%" y="0" width="106%" height="76%" />
        </g>
        <g filter={`url(#${id}p)`}>
          <rect x="8%" y="22%" width="62%" height="34%" fill="#4a3a8c" fillOpacity="0.35" />
          <ellipse cx="86%" cy="40%" rx="12%" ry="45%" fill="#8a4f8f" fillOpacity="0.28" />
        </g>
      </svg>
    </span>
  );
};

export default NightWash;
