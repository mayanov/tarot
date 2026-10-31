import React from 'react';

// Edges and shadows for things made of paper, so they read as cut card lying on the
// page rather than screen rectangles floating over it.

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/**
 * A hand-cut edge for a card: a mask (as a 9-slice border image, so the corners keep
 * their size whatever the card's) whose outline wavers very slightly, with corners not
 * quite even. Spread it into the card face's style; the face's own border-radius stays
 * as the fallback where masks aren't supported. `seed` varies the cut card to card.
 */
export const paperCut = (seed: number, radius = 18, width = 24): React.CSSProperties => {
  const k = width / 30; // a 30-unit slice of the 120-unit image → `width` px
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>` +
    `<filter id='e' x='-10%' y='-10%' width='120%' height='120%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='0.09' numOctaves='2' seed='${seed}'/>` +
    `<feDisplacementMap in='SourceGraphic' scale='3' xChannelSelector='R' yChannelSelector='G'/>` +
    `</filter>` +
    `<rect x='2.5' y='2.5' width='115' height='115' rx='${(radius / k).toFixed(1)}' fill='white' filter='url(#e)'/>` +
    `</svg>`;
  const v = `${svgUrl(svg)} 30 fill / ${width}px`;
  return { WebkitMaskBoxImage: v, maskBorder: v } as React.CSSProperties;
};

/**
 * The shadow of a card lying on paper: tight and dark right along the edge where it
 * touches, and a soft one under the corner that lifts a little off the page. Goes
 * behind the card, as a sibling inside the same (relative, stacking) parent.
 * `className` positions/animates the whole shadow; `contactClassName` the touching
 * edge (e.g. fade it when the card is picked up).
 */
export const PaperShadow: React.FC<{ radius?: string; className?: string; contactClassName?: string }> = ({
  radius = '1.15rem', className = '', contactClassName = '',
}) => (
  <span aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${className}`}>
    {/* where the card touches the page */}
    <span className={`absolute inset-[1px] ${contactClassName}`} style={{ borderRadius: radius, boxShadow: '0 1px 1.5px rgba(38,24,34,0.42), 0 0 0.5px rgba(38,24,34,0.3)' }} />
    {/* the corner that lifts: a soft shadow skewed toward the lower right (a filled,
        blurred shape, not a box-shadow, so nothing hollow shows if the card moves) */}
    <span className="absolute" style={{ inset: '14% 3% 0 22%', borderRadius: radius, background: 'rgba(38,24,34,0.22)', filter: 'blur(7px)', transform: 'translate(4px,6px) rotate(1.2deg)' }} />
  </span>
);

// ---- the About sheet's torn top edge -------------------------------------------

// a soft deckled edge across a 1600 x 48 band: a barely-there wave with small irregular
// steps, fibres lightly frayed by a displacement filter; everything below it is paper
const tearPath = (() => {
  let s = 20250114;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  let d = 'M0 48 L0 22';
  for (let x = 0; x <= 1600; x += 6 + rnd() * 7) {
    const y = 22 + Math.sin(x / 260) * 1.6 + Math.sin(x / 70 + 1.3) * 0.6 + (rnd() - 0.5) * 1.4;
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + ' L1600 22 L1600 48 Z';
})();
const TEAR = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='48' viewBox='0 0 1600 48' preserveAspectRatio='none'>` +
  `<filter id='f' x='0' y='-50%' width='100%' height='200%'>` +
  `<feTurbulence type='fractalNoise' baseFrequency='0.5 0.9' numOctaves='2' seed='7'/>` +
  `<feDisplacementMap in='SourceGraphic' scale='1.6' xChannelSelector='R' yChannelSelector='G'/>` +
  `</filter>` +
  `<path d='${tearPath}' fill='white' filter='url(#f)'/>` +
  `</svg>`,
);

/** mask for a sheet whose top edge is torn (the 48px band at the top), solid below */
export const tornTop: React.CSSProperties = {
  WebkitMaskImage: `${TEAR}, linear-gradient(#000, #000)`,
  maskImage: `${TEAR}, linear-gradient(#000, #000)`,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 48px, 100% calc(100% - 46px)',
  maskSize: '100% 48px, 100% calc(100% - 46px)',
  WebkitMaskPosition: '0 0, 0 46px',
  maskPosition: '0 0, 0 46px',
};
