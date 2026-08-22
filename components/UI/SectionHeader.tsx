import React from 'react';

interface SectionHeaderProps {
    label: string;
    index?: string;
    title: React.ReactNode;
    intro?: React.ReactNode;
    accent?: string;      // text-* colour class for the label/index
    className?: string;
}

// Editorial header: a hairline rule, a label + index row, then an oversized
// left-aligned heading with the intro offset into its own column. Asymmetric
// on purpose — the opposite of the centered-template header.
const SectionHeader: React.FC<SectionHeaderProps> = ({ label, index, title, intro, accent = 'text-terracotta', className = '' }) => (
    <div className={`border-t border-ink/15 pt-4 md:pt-5 mb-8 md:mb-10 ${className}`}>
        <div className="flex items-baseline justify-between gap-4 mb-5 md:mb-7">
            <span className={`text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.28em] ${accent}`}>{label}</span>
            {index && <span className={`text-xs font-serif italic ${accent}`}>{index}</span>}
        </div>
        <div className="grid md:grid-cols-12 gap-x-8 gap-y-4 items-end">
            <h2 className="md:col-span-8 text-[2.3rem] leading-[1.03] md:text-[3.4rem] md:leading-[1] font-serif font-medium text-ink tracking-tight">
                {title}
            </h2>
            {intro && (
                <p className="md:col-span-4 md:col-start-9 text-ink-soft text-base md:text-[1.05rem] font-light leading-relaxed md:pb-2">
                    {intro}
                </p>
            )}
        </div>
    </div>
);

export default SectionHeader;
