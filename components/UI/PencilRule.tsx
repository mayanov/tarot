import React from 'react';

interface PencilRuleProps {
  /** colour via text-* (the line uses currentColor), plus spacing/size/position classes */
  className?: string;
  /** a vertical line (fills its box's height) instead of a horizontal one */
  vertical?: boolean;
  /** which ends the pencil lifts off at — 'start'/'end' for the flanking lines of an ornament */
  fade?: 'both' | 'start' | 'end';
  /**
   * By default the line takes up only 1px of the layout (like the border it replaces)
   * and its wobble spills over the margins. Pass false to give it its full 12px.
   */
  collapse?: boolean;
}

/**
 * A line drawn by hand on the paper instead of a CSS border: a pencil line that
 * wobbles a little, breaks up where the lead skips over the paper's tooth, lifts off
 * at the ends, with a fainter second pass where the hand went over it again. Every
 * instance gets its own wobble. Drawn in pixel units, so it keeps its scale at any length.
 */
const PencilRule: React.FC<PencilRuleProps> = ({ className = '', vertical = false, fade = 'both', collapse = true }) => {
  const rawId = React.useId();
  const id = rawId.replace(/:/g, '');
  const seed = [...rawId].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 997, 7);
  const [a, b] = vertical ? ['0.3', '0.012'] : ['0.012', '0.3'];
  // fills its box along its length unless a length is given (w-6, flex-1…)
  const sized = vertical ? /(^|\s)h-/.test(className) : /(^|\s)(w-|flex-1)/.test(className);
  const size = vertical ? `w-3 ${sized ? '' : 'h-full'}` : `h-3 ${sized ? '' : 'w-full'}`;
  const flow = collapse ? (vertical ? '-mx-[5.5px]' : '-my-[5.5px]') : '';
  const start = fade === 'end' ? 1 : 0;
  const end = fade === 'start' ? 1 : 0;
  // main stroke runs end to end; the second pass is shorter and slightly askew
  const along = (from: string, to: string, across0: string, across1: string) =>
    vertical ? { x1: across0, y1: from, x2: across1, y2: to } : { x1: from, y1: across0, x2: to, y2: across1 };
  return (
    <svg aria-hidden className={`block shrink-0 overflow-visible ${size} ${flow} ${className}`}>
      <defs>
        <filter id={`${id}f`} x="-200%" y="-200%" width="500%" height="500%">
          <feTurbulence type="fractalNoise" baseFrequency={`${a} ${b}`} numOctaves="2" seed={seed} result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves="2" seed={seed + 1} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.05" result="ga" />
          <feComposite in="d" in2="ga" operator="in" />
        </filter>
        {/* the pencil lifts off at the ends */}
        <linearGradient id={`${id}g`} x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
          <stop offset="0" stopColor="#fff" stopOpacity={start} />
          <stop offset="0.05" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.94" stopColor="#fff" stopOpacity={end ? 1 : 0.85} />
          <stop offset="1" stopColor="#fff" stopOpacity={end} />
        </linearGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
          {/* the gradient spans exactly the line's length, so the fades land at its ends */}
          <rect {...(vertical ? { x: '-50%', y: 0, width: '200%', height: '100%' } : { x: 0, y: '-50%', width: '100%', height: '200%' })} fill={`url(#${id}g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}m)`} filter={`url(#${id}f)`} stroke="currentColor" strokeLinecap="round" fill="none">
        <line {...along('0.5%', '99.5%', '50%', '50%')} strokeWidth="1.9" strokeOpacity="0.85" />
        <line {...along('6%', '88%', '62%', '40%')} strokeWidth="1.1" strokeOpacity="0.4" />
      </g>
    </svg>
  );
};

export default PencilRule;
