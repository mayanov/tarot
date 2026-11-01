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
const tear = (flip: boolean) => svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='48' viewBox='0 0 1600 48' preserveAspectRatio='none'>` +
  `<filter id='f' x='0' y='-50%' width='100%' height='200%'>` +
  `<feTurbulence type='fractalNoise' baseFrequency='0.5 0.9' numOctaves='2' seed='${flip ? 11 : 7}'/>` +
  `<feDisplacementMap in='SourceGraphic' scale='1.6' xChannelSelector='R' yChannelSelector='G'/>` +
  `</filter>` +
  // the bottom edge is the same tear turned upside down (paper above it)
  (flip ? `<g transform='translate(0 48) scale(1 -1)'>` : '<g>') +
  `<path d='${tearPath}' fill='white' filter='url(#f)'/>` +
  `</g></svg>`,
);
const TEAR = tear(false);
const TEAR_BOTTOM = tear(true);

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

/** a sheet of the paper (.bg-paper) filling its box, one edge torn. Only the 48px
    band along the tear is masked: a mask over a whole tall sheet makes the browser
    keep a masked copy of all of it, which on a phone (3× pixels) runs to hundreds of
    MB and gets the tab killed. The grain lines up across the seam. */
export const TornPaper: React.FC<{ edge: 'top' | 'bottom' }> = ({ edge }) => {
  const top = edge === 'top';
  const tear = top ? TEAR : TEAR_BOTTOM;
  const strip: React.CSSProperties = {
    WebkitMaskImage: tear,
    maskImage: tear,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    // the band's grain continues the sheet's, which starts where the band ends
    backgroundPosition: top ? 'center top 46px' : 'center bottom 46px',
  };
  return (
    <>
      <div className="absolute inset-x-0 bg-paper" style={top ? { top: 46, bottom: 0 } : { top: 0, bottom: 46, backgroundPosition: 'center bottom' }} />
      <div className={`absolute inset-x-0 h-12 bg-paper ${top ? 'top-0' : 'bottom-0'}`} style={strip} />
    </>
  );
};

/** mask for a sheet whose bottom edge is torn (the 48px band at the bottom), solid above */
export const tornBottom: React.CSSProperties = {
  WebkitMaskImage: `${TEAR_BOTTOM}, linear-gradient(#000, #000)`,
  maskImage: `${TEAR_BOTTOM}, linear-gradient(#000, #000)`,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 48px, 100% calc(100% - 46px)',
  maskSize: '100% 48px, 100% calc(100% - 46px)',
  WebkitMaskPosition: '0 100%, 0 0',
  maskPosition: '0 100%, 0 0',
};

// ---- a torn slip of the paper, for a line of text pasted over the sky ---------------

// the slip's outline across a 1000 x 120 box (stretched to the slip): top and bottom
// torn along the grain, so only faintly deckled; the two ends ripped across it, ragged
const slipPath = (() => {
  let s = 1984;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const pts: string[] = [];
  const end = (x0: number, dir: number, from: number, to: number) => {
    for (let y = from; dir * (to - y) > 0; y += dir * (5 + rnd() * 9)) {
      pts.push(`${(x0 + (rnd() - 0.5) * 16 + Math.sin(y / 23) * 6).toFixed(1)} ${y.toFixed(1)}`);
    }
  };
  const side = (y0: number, dir: number, from: number, to: number) => {
    for (let x = from; dir * (to - x) > 0; x += dir * (14 + rnd() * 22)) {
      pts.push(`${x.toFixed(1)} ${(y0 + Math.sin(x / 140) * 2 + (rnd() - 0.5) * 2.4).toFixed(1)}`);
    }
  };
  side(10, 1, 22, 980);   // top, left to right
  end(984, 1, 8, 112);    // right end, down
  side(110, -1, 978, 20); // bottom, right to left
  end(16, -1, 112, 8);    // left end, up
  return `M${pts.join(' L')} Z`;
})();
const slip = (fray: number, grow = 0) => svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='120' viewBox='0 0 1000 120' preserveAspectRatio='none'>` +
  `<filter id='f' x='-5%' y='-20%' width='110%' height='140%'>` +
  `<feTurbulence type='fractalNoise' baseFrequency='0.35 0.5' numOctaves='2' seed='5'/>` +
  `<feDisplacementMap in='SourceGraphic' scale='${fray}' xChannelSelector='R' yChannelSelector='G'/>` +
  `</filter>` +
  `<path d='${slipPath}' fill='white' stroke='white' stroke-width='${grow}' stroke-linejoin='round' filter='url(#f)'/>` +
  `</svg>`,
);
const maskOf = (url: string): React.CSSProperties => ({
  WebkitMaskImage: url, maskImage: url,
  WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
});
const SLIP = maskOf(slip(3));
// a tear shows the paper's paler core as a thin fibrous rim just outside the face
const SLIP_RIM = maskOf(slip(6, 5));

/** a torn slip of the paper filling its box (put it behind the text, in a relative
    parent), with the shadow it casts lying a little off whatever is under it. On a
    paper section, `onPaper` makes it a paler, heavier stock with a lighter shadow, so
    it reads as a second sheet laid on the first */
export const TornSlip: React.FC<{ className?: string; onPaper?: boolean }> = ({ className = '', onPaper = false }) => (
  <span aria-hidden className={`pointer-events-none absolute -z-10 ${className}`}>
    {/* the shadow: the slip's shape, blurred (the blur goes on a wrapper, since a
        mask is applied after an element's own filter) */}
    <span className="absolute inset-0" style={onPaper ? { filter: 'blur(5px)', transform: 'translate(2px,5px)' } : { filter: 'blur(6px)', transform: 'translate(2px,7px)' }}>
      <span className="absolute inset-0" style={{ ...SLIP, background: onPaper ? 'rgba(46,30,52,0.3)' : 'rgba(8,5,20,0.5)' }} />
    </span>
    <span className="absolute inset-0 bg-[#fdfcf9]" style={SLIP_RIM} />
    <span className="absolute inset-0 bg-paper" style={SLIP} />
    {/* the paler stock: a cream veil over the grain */}
    {onPaper && <span className="absolute inset-0 bg-[#fbf8f1]/70" style={SLIP} />}
  </span>
);
