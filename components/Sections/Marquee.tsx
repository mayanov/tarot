import React from 'react';

interface MarqueeProps {
    isIndonesian?: boolean;
}

const Marquee: React.FC<MarqueeProps> = ({ isIndonesian = false }) => {
    const words = isIndonesian
        ? ['Kejernihan', 'Refleksi', 'Insight', 'Perspektif', 'Percakapan Jujur']
        : ['Clarity', 'Reflection', 'Insight', 'Perspective', 'Real Talk'];

    // One group, wide enough; rendered twice so translateX(-50%) loops seamlessly.
    const Group = () => (
        <div className="flex items-center shrink-0">
            {[...words, ...words, ...words].map((w, i) => (
                <span key={i} className="flex items-center">
                    <span className="text-3xl md:text-5xl font-serif font-semibold uppercase tracking-tight text-cream px-6 md:px-10 whitespace-nowrap">{w}</span>
                    <span className="text-coral text-xl md:text-2xl">✦</span>
                </span>
            ))}
        </div>
    );

    return (
        <section className="relative overflow-hidden bg-espresso py-5 md:py-7 select-none" aria-hidden="true">
            <div className="flex w-max animate-[marquee_26s_linear_infinite] will-change-transform">
                <Group />
                <Group />
            </div>
        </section>
    );
};

export default Marquee;
