import React from 'react';

export type ArrowDir = 'right' | 'left' | 'up' | 'down' | 'up-right';

const TURN: Record<ArrowDir, number> = { right: 0, 'up-right': -45, up: -90, left: 180, down: 90 };

/** The site's one arrow, drawn in pencil (#pencil-icon, index.html): a slightly
    uneven shaft and an open head of two strokes, in currentColor. The same drawing is
    turned to point any way, so every arrow on the site reads as the same hand.
    Size it with w-/h- classes (it fills its box); `className` may add transitions. */
const PencilArrow: React.FC<{ dir?: ArrowDir; className?: string; strokeWidth?: number }> = ({ dir = 'right', className = 'w-4 h-4', strokeWidth = 1.6 }) => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    className={`shrink-0 overflow-visible [filter:url(#pencil-icon)] ${className}`}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <g transform={`rotate(${TURN[dir]} 12 12)`}>
      <path d="M3.6 12.4 C 8.5 12.1, 14 11.8, 19.6 11.9" strokeWidth={strokeWidth} />
      <path d="M14.2 6.3 C 16.2 8.3, 18.1 10.2, 19.7 11.9 C 18 13.5, 16.1 15.4, 14.5 17.6" strokeWidth={strokeWidth * 0.94} />
    </g>
  </svg>
);

export default PencilArrow;
