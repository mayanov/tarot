import React from 'react';

interface PencilRuleProps {
  /** colour via text-* (the line uses currentColor) and spacing via margin classes */
  className?: string;
}

/**
 * A divider drawn by hand on the paper instead of a CSS border: a coloured-pencil line
 * that wobbles a little, breaks up where the lead skips over the paper's tooth, lifts
 * off at both ends, with a fainter second pass where the hand went over it again.
 * Drawn in pixel units, so the wobble and grain keep their scale at any width.
 */
const PencilRule: React.FC<PencilRuleProps> = ({ className = '' }) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg aria-hidden className={`block h-3 w-full overflow-visible ${className}`}>
      <defs>
        <filter id={`${id}f`} x="-2%" y="-200%" width="104%" height="500%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.3" numOctaves="2" seed="6" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves="2" seed="2" result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.05" result="ga" />
          <feComposite in="d" in2="ga" operator="in" />
        </filter>
        {/* the pencil lifts off at both ends */}
        <linearGradient id={`${id}g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.04" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.95" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}m`}>
          <rect x="0" y="-50%" width="100%" height="200%" fill={`url(#${id}g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}m)`} filter={`url(#${id}f)`} stroke="currentColor" strokeLinecap="round" fill="none">
        <line x1="0.5%" y1="50%" x2="99.5%" y2="50%" strokeWidth="1.9" strokeOpacity="0.85" />
        <line x1="6%" y1="62%" x2="88%" y2="40%" strokeWidth="1.1" strokeOpacity="0.4" />
      </g>
    </svg>
  );
};

export default PencilRule;
