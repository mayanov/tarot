import React from 'react';

// The hand-made faces of the site's buttons, drawn on the paper instead of CSS
// boxes. Wrap the contents of every button styled with a class from ./buttons
// (those make it `relative isolate group/btn`) in one: the face sits behind the
// label, and the label gets the same print wear as the headings.
//   primary   → a painted swatch (gouache, ragged edges, pooled rim, paper grain),
//               ruled round in felt-tip marker; on a dark ground, a scrap of the
//               paper instead (painted on hover)
//   secondary → a box ruled round it in felt-tip marker;
//               on hover the swatch is painted in behind it

const useInkId = () => {
  const raw = React.useId();
  const seed = [...raw].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 997, 7);
  return { id: raw.replace(/:/g, ''), seed };
};

const PAPER_IMG = `${import.meta.env.BASE_URL}paper.webp`;

/** a flat-ish patch of paint in currentColor, filling its box; `round` makes it a
    drop of ink, its edge a little less even. `paper` lays a scrap of the site's paper
    (its grain, edged like the paint) under it, for a swatch that sits on a dark
    ground: there the paint's skips show paper, as they do on the paper sections */
export const PaintSwatch: React.FC<{ className?: string; round?: boolean; paper?: boolean }> = ({ className = '', round = false, paper = false }) => {
  const { id, seed } = useInkId();
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${className}`}>
      <svg className="block h-full w-full overflow-visible">
        <defs>
          <filter id={`${id}s`} x="-15%" y="-40%" width="130%" height="180%" colorInterpolationFilters="sRGB">
            {/* a steady hand: the edge only frays a little, it doesn't wave */}
            <feTurbulence type="fractalNoise" baseFrequency={round ? '0.08' : '0.22 0.3'} numOctaves={round ? 2 : 1} seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={round ? 3.5 : 1.6} xChannelSelector="R" yChannelSelector="G" result="d" />
            {/* the paint pools a touch darker along its edge as it dries */}
            <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 40 0" result="shape" />
            <feMorphology in="shape" operator="erode" radius="2" result="er" />
            <feGaussianBlur in="er" stdDeviation="2.5" result="erb" />
            <feComposite in="shape" in2="erb" operator="out" result="band" />
            <feComposite in="d" in2="band" operator="in" result="rim" />
            <feComponentTransfer in="rim" result="rimd">
              <feFuncR type="linear" slope="0.8" />
              <feFuncG type="linear" slope="0.8" />
              <feFuncB type="linear" slope="0.8" />
              <feFuncA type="linear" slope="0.55" />
            </feComponentTransfer>
            <feMerge result="m">
              <feMergeNode in="d" />
              <feMergeNode in="rimd" />
            </feMerge>
            {/* the paper's tooth shows through here and there */}
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed={seed + 1} result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.4 1.28" result="ga" />
            <feComposite in="m" in2="ga" operator="in" />
          </filter>
          {paper && (
            <>
              <pattern id={`${id}g`} patternUnits="userSpaceOnUse" width="600" height="600">
                <rect width="600" height="600" fill="#f3f1ec" />
                <image href={PAPER_IMG} width="600" height="600" />
              </pattern>
              {/* the scrap's edge frays like the paint's, without the skips */}
              <filter id={`${id}e`} x="-15%" y="-40%" width="130%" height="180%">
                <feTurbulence type="fractalNoise" baseFrequency="0.22 0.3" numOctaves="1" seed={seed} result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </>
          )}
        </defs>
        {paper && <rect width="100%" height="100%" rx={4} ry={4} fill={`url(#${id}g)`} filter={`url(#${id}e)`} />}
        <rect width="100%" height="100%" rx={round ? '50%' : 4} ry={round ? '50%' : 4} fill="currentColor" filter={`url(#${id}s)`} />
      </svg>
    </span>
  );
};

/** four pencil lines sketched round its box, crossing at the corners */
export const PencilFrame: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { id, seed } = useInkId();
  return (
    <span aria-hidden className={`pointer-events-none absolute -inset-[3px] -z-10 ${className}`}>
      <svg className="block h-full w-full overflow-visible">
        <defs>
          <filter id={`${id}p`} x="-10%" y="-40%" width="120%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed={seed} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves="2" seed={seed + 1} result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.05" result="ga" />
            <feComposite in="d" in2="ga" operator="in" />
          </filter>
        </defs>
        {/* the box is inset 3px, so each line runs 3px past the corners it meets;
            nested svgs shifted by -3px give the far edges without calc() */}
        <g filter={`url(#${id}p)`} stroke="currentColor" strokeLinecap="round" fill="none">
          <line x1="0" y1="3.4" x2="100%" y2="2.6" strokeWidth="1.5" />
          <line x1="3.2" y1="0" x2="2.6" y2="100%" strokeWidth="1.4" />
          <svg y="-3" overflow="visible">
            <line x1="1" y1="100%" x2="100%" y2="100%" strokeWidth="1.5" />
          </svg>
          <svg x="-3" overflow="visible">
            <line x1="100%" y1="1" x2="100%" y2="100%" strokeWidth="1.4" />
          </svg>
          {/* a lighter second pass along the top, where the hand went over it again */}
          <line x1="6%" y1="4.6" x2="72%" y2="3.8" strokeWidth="1" strokeOpacity="0.4" />
        </g>
      </svg>
    </span>
  );
};

/** a box ruled round its button with a felt-tip marker, one stroke per side: each
    runs a little past the corners, and where two cross the ink doubles up darker
    (the strokes are translucent). The ink feathers into the paper's fibres, pools
    darker along the edges of the stroke, and the paper's tooth breaks it up a little */
export const MarkerFrame: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { id, seed } = useInkId();
  return (
    <span aria-hidden className={`pointer-events-none absolute -inset-[4px] -z-10 ${className}`}>
      <svg className="block h-full w-full overflow-visible">
        <defs>
          <filter id={`${id}k`} x="-10%" y="-40%" width="120%" height="180%" colorInterpolationFilters="sRGB">
            {/* the hand's slow wobble, then the ink bleeding along the paper's fibres */}
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed={seed} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed + 1} result="f" />
            <feDisplacementMap in="d" in2="f" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="b" />
            <feGaussianBlur in="b" stdDeviation="0.35" result="s" />
            {/* the ink pools darker along both edges of the stroke as it soaks in */}
            <feMorphology in="s" operator="erode" radius="0.7" result="er" />
            <feComposite in="s" in2="er" operator="out" result="rim" />
            <feMerge result="m">
              <feMergeNode in="s" />
              <feMergeNode in="rim" />
            </feMerge>
            {/* the paper's tooth: the tip skips a little here and there */}
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed={seed + 2} result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.45" result="ga" />
            <feComposite in="m" in2="ga" operator="in" />
          </filter>
        </defs>
        {/* the box sits 4px in from this svg's edge, so each stroke starts and ends
            ~3px past its corners; nested svgs shifted by a few px give the far edges
            without calc() */}
        <g filter={`url(#${id}k)`} stroke="currentColor" strokeLinecap="round" fill="none" strokeWidth="2.4" strokeOpacity="0.72">
          <svg x="-1" overflow="visible">
            <line x1="2" y1="4.6" x2="100%" y2="3.7" />
          </svg>
          <svg x="-4.4" y="-1" overflow="visible">
            <line x1="100%" y1="2" x2="100%" y2="100%" />
          </svg>
          <svg x="-1" y="-4.2" overflow="visible">
            <line x1="100%" y1="100%" x2="2.5" y2="100%" />
          </svg>
          <svg y="-1" overflow="visible">
            <line x1="4.1" y1="100%" x2="4.7" y2="2" />
          </svg>
        </g>
      </svg>
    </span>
  );
};

interface ButtonInkProps {
  kind: 'primary' | 'secondary';
  /** the background the button sits on: light paper, or a dark one (sky, cards, footer) */
  tone: 'light' | 'dark';
}

const ButtonInk: React.FC<React.PropsWithChildren<ButtonInkProps>> = ({ kind, tone, children }) => {
  const fade = 'transition-[color,opacity] duration-300';
  const face = kind === 'primary'
    ? (
      <>
        {/* on a dark ground the face is a scrap of the paper itself (its grain showing),
            painted over in the moon purple on hover */}
        <PaintSwatch paper={tone === 'dark'} className={`${fade} ${tone === 'light' ? 'text-moon group-hover/btn:text-plum' : 'text-cream/0 group-hover/btn:text-moon'}`} />
        <MarkerFrame className={`${fade} ${tone === 'light' ? 'text-plum group-hover/btn:text-ink' : 'text-moon group-hover/btn:text-cream'}`} />
      </>
    )
    : (
      <>
        <PaintSwatch paper={tone === 'dark'} className={`${fade} opacity-0 group-hover/btn:opacity-100 ${tone === 'light' ? 'text-plum' : 'text-cream/0'}`} />
        <MarkerFrame className={`${fade} ${tone === 'light' ? 'text-plum group-hover/btn:text-ink' : 'text-cream group-hover/btn:text-moon'}`} />
      </>
    );
  return (
    <>
      {face}
      {/* the label is printed like the headings around it (a mask clips to its box,
          so the padding/negative margin keep the descenders); any line icon in it is
          drawn in pencil, finer than the default stroke (#pencil-icon, index.html); an
          arrow is printed with the words instead, as heavy as them (PencilArrow) */}
      <span className="print-text inline-flex items-center gap-[inherit] py-[0.2em] -my-[0.2em] [&_svg:not(.pencil-arrow)]:[filter:url(#pencil-icon)] [&_svg:not(.pencil-arrow)]:[stroke-width:1.6]">{children}</span>
    </>
  );
};

export default ButtonInk;
