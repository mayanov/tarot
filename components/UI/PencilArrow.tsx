import React from 'react';

export type ArrowDir = 'right' | 'left' | 'up' | 'down' | 'up-right';

const TURN: Record<ArrowDir, number> = { right: 0, 'up-right': -45, up: -90, left: 180, down: 90 };

/** how the arrow is printed, to match the words beside it:
    fine    → pressed like body and label text (.letterpress)
    display → pressed like headings and large type (.letterpress-lg)
    pencil  → drawn in pencil, like the line icons (#pencil-icon)
    inherit → no print of its own; the text it sits in (e.g. a button label's
              print-text mask) prints it along with the words */
export type ArrowPress = 'fine' | 'display' | 'pencil' | 'inherit';

/** the stroke follows the weight of the type beside it */
export type ArrowWeight = 'regular' | 'medium' | 'semibold';

const PRESS: Record<ArrowPress, string> = {
  fine: 'letterpress',
  display: 'letterpress-lg',
  pencil: '[filter:url(#pencil-icon)]',
  inherit: '',
};
const STROKE: Record<ArrowWeight, number> = { regular: 1.7, medium: 2.1, semibold: 2.5 };

/** The site's one arrow: a slightly uneven shaft and an open head of two strokes,
    in currentColor, turned to point any way. It takes the style of the text it goes
    with: the same colour (currentColor), the same print (`press`) and a stroke as
    heavy as the type (`weight`). Size it with w-/h- classes (it fills its box);
    `className` may add transitions. */
const PencilArrow: React.FC<{ dir?: ArrowDir; press?: ArrowPress; weight?: ArrowWeight; className?: string }> = ({
  dir = 'right',
  press = 'fine',
  weight = 'regular',
  className = 'w-4 h-4',
}) => {
  const sw = STROKE[weight];
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`pencil-arrow shrink-0 overflow-visible ${PRESS[press]} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform={`rotate(${TURN[dir]} 12 12)`}>
        <path d="M3.6 12.4 C 8.5 12.1, 14 11.8, 19.6 11.9" strokeWidth={sw} />
        <path d="M14.2 6.3 C 16.2 8.3, 18.1 10.2, 19.7 11.9 C 18 13.5, 16.1 15.4, 14.5 17.6" strokeWidth={sw * 0.94} />
      </g>
    </svg>
  );
};

export default PencilArrow;
