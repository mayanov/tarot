import React, { useId } from 'react';

// The Mayanov Tarot mark (logo E3c): a handwritten M over a soft watercolour moon,
// with a pencil arc round it and a four-point star at the arc's open end. The wash is
// two overlapping circles roughened by a turbulence filter so the edge bleeds like
// paint on paper. `onDark` draws it in cream for the sky; otherwise violet wash, ink M.
// The script face is the site's Mrs Saint Delafield (its cut-down face, scripts/handwriting-fonts.mjs, has the M).

const STAR = 'M0,-1 C0.06,-0.3 0.3,-0.06 1,0 C0.3,0.06 0.06,0.3 0,1 C-0.06,0.3 -0.3,0.06 -1,0 C-0.3,-0.06 -0.06,-0.3 0,-1 Z';

const LogoMark: React.FC<{ onDark?: boolean; className?: string; wash?: number }> = ({ onDark = false, className = '', wash }) => {
  const fid = `wc${useId().replace(/:/g, '')}`;
  const tone = onDark ? '#F3F1EC' : '#6B3FA0';
  const ink = onDark ? '#F3F1EC' : '#221D3C';
  const a = wash ?? (onDark ? 0.22 : 0.26);
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={`overflow-visible ${className}`} style={{ color: tone }}>
      <defs>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="9" />
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      <g filter={`url(#${fid})`}>
        <circle cx="48" cy="52" r="38" fill="currentColor" opacity={a} />
        <circle cx="56" cy="47" r="30" fill="currentColor" opacity={a * 0.6} />
      </g>
      <path d="M70 14 A43 43 0 1 0 82 78" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <path fill="currentColor" transform="translate(80 18) scale(8)" d={STAR} />
      <text x="47" y="92" textAnchor="middle" fontFamily="'Mrs Saint Delafield', cursive" fontSize="100" fill={ink}>M</text>
    </svg>
  );
};

export default LogoMark;
