import React from 'react';

interface SoftAuraProps {
  /** Extra classes on the wrapper (e.g. to nudge opacity per section). */
  className?: string;
}

/**
 * A faint, slowly-drifting wash of soft palette blooms placed behind a warm
 * section's cream fill. Adds quiet depth — no grain, no noise — so the flat
 * `#FAF6EF` panels feel atmospheric rather than like plain boxes.
 *
 * Sits at `-z-10` inside the section's own stacking context (the section must
 * be `relative isolate` with the cream background on it), so it floats above
 * the fill but behind all content without touching content z-indexes. The
 * wrapper clips its own blooms, so it never causes horizontal overflow.
 */
const SoftAura: React.FC<SoftAuraProps> = ({ className = '' }) => (
  <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
    <span
      className="absolute -top-32 -left-24 w-[46rem] h-[46rem] rounded-full blur-[120px] opacity-100 motion-reduce:!animate-none"
      style={{
        background: 'radial-gradient(circle, rgba(107,63,160,0.22), transparent 68%)',
        animation: 'blobA 38s ease-in-out infinite',
      }}
    />
    <span
      className="absolute top-1/4 -right-28 w-[40rem] h-[40rem] rounded-full blur-[130px] opacity-100 motion-reduce:!animate-none"
      style={{
        background: 'radial-gradient(circle, rgba(122,127,209,0.20), transparent 68%)',
        animation: 'blobB 46s ease-in-out infinite',
      }}
    />
    <span
      className="absolute -bottom-36 left-1/3 w-[36rem] h-[36rem] rounded-full blur-[130px] opacity-100 motion-reduce:!animate-none"
      style={{
        background: 'radial-gradient(circle, rgba(57,35,78,0.16), transparent 70%)',
        animation: 'blobC 54s ease-in-out infinite',
      }}
    />
  </div>
);

export default SoftAura;
