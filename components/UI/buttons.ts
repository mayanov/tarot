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
// The variant only sets the label colour: the face of every button is hand-made,
// painted or pencilled on the paper — put <ButtonInk kind tone /> (./ButtonInk)
// as its first child, matching the variant.
const BASE = 'group/btn relative isolate items-center justify-center font-elegant font-semibold leading-none transition-colors duration-300';

export const btnPrimaryDark = `${BASE} text-ink hover:text-cream`;
export const btnPrimaryLight = `${BASE} text-cream`;

export const btnSecondaryDark = `${BASE} text-cream hover:text-ink`;
export const btnSecondaryLight = `${BASE} text-ink hover:text-cream`;
