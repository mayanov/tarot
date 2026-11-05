import React from 'react';
import PencilRule from './PencilRule';

/**
 * Progress shaded in with a pencil: a faint hand-ruled line to run along, and over it,
 * as far as you've got, a band of quick slanted strokes (a first pass, then a lighter
 * cross pass, as you'd shade in a box on a form), their ends ragged where the hand
 * didn't stop at the same place each time, the paper's tooth breaking the graphite up.
 */
const PencilProgress: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => {
  const id = React.useId().replace(/:/g, '');
  const pct = Math.max(0.06, Math.min(1, value)) * 100;
  return (
    <div className={`relative h-4 ${className}`}>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-ink/30">
        <PencilRule collapse={false} weight="fine" />
      </div>
      <div className="absolute inset-y-0 left-0 text-moon transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }}>
        <svg aria-hidden className="block h-full w-full overflow-visible">
          <defs>
            {/* the strokes: one every ~4px, slanted, each a little longer or shorter */}
            <pattern id={`${id}h`} patternUnits="userSpaceOnUse" width="16" height="16">
              <path d="M1.2 15.2L5.6 0.6M5.4 16.4L9.4 1.2M9.2 15.6L13.8 0.2M13.4 16.2L17.4 1" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" fill="none" />
            </pattern>
            <pattern id={`${id}x`} patternUnits="userSpaceOnUse" width="22" height="16">
              <path d="M2 1.4L8.4 15M9.4 0.8L15.2 14.6M16.6 1.6L22.6 15.4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.5" fill="none" />
            </pattern>
            <filter id={`${id}p`} x="-4%" y="-60%" width="108%" height="220%">
              {/* the hand's wobble, then the graphite catching only on the paper's tooth */}
              <feTurbulence type="fractalNoise" baseFrequency="0.08 0.3" numOctaves="2" seed="3" result="w" />
              <feDisplacementMap in="SourceGraphic" in2="w" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d" />
              <feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves="2" seed="7" result="g" />
              <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.85" result="ga" />
              <feComposite in="d" in2="ga" operator="in" />
            </filter>
            {/* the band's top and bottom edges uneven, where each stroke started and stopped */}
            <filter id={`${id}e`} x="-4%" y="-60%" width="108%" height="220%">
              <feTurbulence type="fractalNoise" baseFrequency="0.25 0.02" numOctaves="2" seed="5" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <mask id={`${id}m`}>
              <rect x="0" y="12%" width="100%" height="76%" fill="#fff" filter={`url(#${id}e)`} />
            </mask>
          </defs>
          <g filter={`url(#${id}p)`} mask={`url(#${id}m)`}>
            <rect width="100%" height="100%" fill={`url(#${id}h)`} />
            <rect width="100%" height="100%" fill={`url(#${id}x)`} />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default PencilProgress;
