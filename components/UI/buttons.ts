// ── Button system ─────────────────────────────────────────────────────────
// The single source of truth for the public-site buttons. MAIN (primary)
// buttons are filled; SECONDARY buttons are transparent/outline. Pick the
// variant by the background the button sits on — dark (hero sky, footer, CTA)
// or light (paper sections). Each button appends its own size (px/py/text-…)
// and extras (gap, group, arrow, shadow); the variant owns colour + hover.
//
//   MAIN       dark bg → white,  hover #6B3FA0 (moon)
//              light bg → #6B3FA0 (moon), hover #39234E (plum)
//   SECONDARY  dark bg → transparent, hover white
//              light bg → transparent, hover #39234E (plum)

// Note: the display (inline-flex / hidden sm:inline-flex) is set per button, so
// the variant stays out of the way of responsive hiding (e.g. the nav pill).
const BASE = 'items-center justify-center rounded-full font-medium transition-colors duration-300';

export const btnPrimaryDark = `${BASE} bg-white text-ink hover:bg-moon hover:text-cream`;
export const btnPrimaryLight = `${BASE} bg-moon text-cream hover:bg-plum hover:text-cream`;

export const btnSecondaryDark = `${BASE} bg-transparent border border-cream/45 text-cream hover:bg-white hover:text-ink hover:border-white`;
export const btnSecondaryLight = `${BASE} bg-transparent border border-ink/30 text-ink hover:bg-plum hover:text-cream hover:border-plum`;
