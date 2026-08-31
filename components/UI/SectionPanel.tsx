import React from 'react';

interface SectionPanelProps {
  children: React.ReactNode;
  /** Extra classes for the inner panel (e.g. custom padding). */
  className?: string;
}

/**
 * A floating, rounded card that sits on the page's dark sunrise background
 * with a page gutter around it. Rendered as a warm LIGHT surface so it lifts
 * off the dark page and breaks up the run of full-bleed dark sections.
 * NOTE: content inside is on a light background — use dark (ink) text.
 */
const SectionPanel: React.FC<SectionPanelProps> = ({ children, className = '' }) => (
  <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
    <div
      className={
        'relative overflow-hidden rounded-xl md:rounded-2xl text-ink ' +
        'border border-black/5 bg-[#F5F1EA] ' +
        'shadow-[0_40px_120px_-55px_rgba(0,0,0,0.7)] ' +
        'px-6 sm:px-10 md:px-14 lg:px-16 py-14 md:py-20 ' +
        className
      }
    >
      {children}
    </div>
  </div>
);

export default SectionPanel;
