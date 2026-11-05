import React from 'react';
import PencilRule from './PencilRule';

/**
 * Progress drawn on the paper rather than a bar: a faint pencil line to run along,
 * and one stroke of a loaded flat brush dragged over it as far as you've got: its
 * edges torn along the sweep, dry streaks where the bristles skipped, the paint pooled
 * darker where the brush stopped, and the paper's tooth through it. The stroke grows
 * (it isn't clipped), so its end is always a brush end.
 */
const BrushProgress: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => {
  const id = React.useId().replace(/:/g, '');
  const pct = Math.max(0.06, Math.min(1, value)) * 100;
  return (
    <div className={`relative h-4 ${className}`}>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-ink/30">
        <PencilRule collapse={false} weight="fine" />
      </div>
      <div className="absolute inset-y-0 left-0 text-moon transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }}>
        <svg aria-hidden className="block h-full w-full overflow-visible" style={{ transform: 'rotate(-0.4deg)' }}>
          <defs>
            <filter id={`${id}b`} x="-4%" y="-60%" width="108%" height="220%" colorInterpolationFilters="sRGB">
              {/* edges torn along the direction of the sweep */}
              <feTurbulence type="fractalNoise" baseFrequency="0.035 0.18" numOctaves="3" seed="9" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d" />
              <feGaussianBlur in="d" stdDeviation="0.5" result="soft" />
              {/* the paint pools darker along the rims as it dries */}
              <feColorMatrix in="soft" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 40 0" result="shape" />
              <feMorphology in="shape" operator="erode" radius="1.6" result="er" />
              <feGaussianBlur in="er" stdDeviation="1.6" result="erb" />
              <feComposite in="shape" in2="erb" operator="out" result="band" />
              <feComposite in="soft" in2="band" operator="in" result="rim" />
              <feMerge result="m">
                <feMergeNode in="soft" />
                <feMergeNode in="rim" />
              </feMerge>
              {/* dry streaks running with the stroke, where the bristles skipped */}
              <feTurbulence type="fractalNoise" baseFrequency="0.006 0.55" numOctaves="2" seed="4" result="s" />
              <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.05" result="sa" />
              <feComposite in="m" in2="sa" operator="in" result="streaked" />
              {/* the paper's tooth */}
              <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="2" result="g" />
              <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.4" result="ga" />
              <feComposite in="streaked" in2="ga" operator="in" />
            </filter>
          </defs>
          <g filter={`url(#${id}b)`}>
            {/* the body of the stroke, thinning a little as the brush runs out… */}
            <rect x="0" y="18%" width="100%" height="64%" rx="3" fill="currentColor" fillOpacity="0.62" />
            <rect x="0" y="28%" width="82%" height="40%" rx="3" fill="currentColor" fillOpacity="0.28" />
            {/* …and pooled where it set down and where it stopped */}
            <ellipse cx="1.5%" cy="50%" rx="7" ry="6" fill="currentColor" fillOpacity="0.35" />
            <svg x="-6" overflow="visible"><ellipse cx="100%" cy="52%" rx="6" ry="6.5" fill="currentColor" fillOpacity="0.4" /></svg>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default BrushProgress;
