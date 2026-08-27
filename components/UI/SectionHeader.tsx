import React from 'react';

interface SectionHeaderProps {
    label: string;
    index?: string;
    num?: string;         // editorial section index, e.g. "04"
    title: React.ReactNode;
    intro?: React.ReactNode;
    accent?: string;
    className?: string;
    rule?: boolean;
}

// Editorial header: a section index + hairline masthead, then an oversized
// left-aligned heading with the intro offset into its own column.
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, intro, className = '' }) => (
    <div className={`mb-10 md:mb-14 ${className}`}>
        <div className="grid md:grid-cols-12 gap-x-8 gap-y-4 items-end">
            <h2 className="md:col-span-8 text-[2.5rem] md:text-[3.4rem] leading-[1.0] font-serif font-semibold text-cream tracking-[-0.03em]">
                {title}
            </h2>
            {intro && (
                <p className="md:col-span-4 md:col-start-9 text-cream/70 text-base md:text-[1.05rem] font-light leading-relaxed md:pb-2">
                    {intro}
                </p>
            )}
        </div>
    </div>
);

export default SectionHeader;
