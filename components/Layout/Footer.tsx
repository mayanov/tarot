import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { trackEvent } from '../../services/analytics';
import { smoothScrollToId } from '../UI/scroll';
import CelestialMark from '../UI/CelestialMark';

interface FooterProps {
    isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

// Flips true once the footer scrolls into view, so the close animates in.
const useInView = (threshold = 0.12, rootMargin = '0px 0px -6% 0px') => {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setInView(true); return; }
        const io = new IntersectionObserver(
            (entries) => { if (entries.some((e) => e.isIntersecting)) { setInView(true); io.disconnect(); } },
            { threshold, rootMargin }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [threshold, rootMargin]);
    return { ref, inView };
};

/**
 * The footer is the close of the evening — the page dissolves back into the
 * night sky it opened on. Two quiet bands: a closing invitation to book, then
 * a brand sign-off. No columns, no labels, no social buttons. It renders
 * transparent over the shared night-sky backdrop behind Disclaimer + Footer.
 */
const Footer: React.FC<FooterProps> = ({ isIndonesian = false }) => {
    const year = new Date().getFullYear();
    const v = useInView();

    // soft blur-rise that settles into focus
    const rise = (delay: number): React.CSSProperties => ({
        opacity: v.inView ? 1 : 0,
        transform: v.inView ? 'translateY(0)' : 'translateY(16px)',
        filter: v.inView ? 'blur(0px)' : 'blur(5px)',
        transition: `opacity 0.9s ease ${delay}ms, transform 1s ${EASE} ${delay}ms, filter 0.9s ease ${delay}ms`,
        willChange: 'transform, opacity, filter',
    });

    const socialLink = 'text-cream/75 hover:text-cream transition-colors duration-500 hover:underline underline-offset-[6px] decoration-cream/40';

    return (
        <footer ref={v.ref} className="relative z-10 text-cream text-center overflow-hidden">
            <div className="mx-auto px-8 max-w-3xl flex flex-col items-center py-20 md:py-28">

                {/* ===== closing invitation — the moment to book ===== */}
                <p style={rise(0)} className="inline-flex items-center gap-2 text-[#C9B8E8] text-sm font-medium tracking-wide">
                    <CelestialMark name="sparkle" className="w-3.5 h-3.5 shrink-0" />
                    {isIndonesian ? 'Sebelum kamu pergi' : 'Before you go'}
                </p>
                <h2
                    style={rise(90)}
                    className="mt-5 font-elegant font-medium leading-[1.1] tracking-[-0.015em] text-[clamp(1.5rem,4vw,2.3rem)] max-w-[18ch] [text-shadow:0_6px_40px_rgba(6,4,14,0.5)]"
                >
                    {isIndonesian ? 'Siap untuk pikiran yang lebih jernih?' : 'Ready for a clearer view?'}
                </h2>
                <p style={rise(190)} className="mt-5 text-cream/60 font-light text-base md:text-lg max-w-md leading-relaxed">
                    {isIndonesian
                        ? 'Mulai dari satu pertanyaan — sisanya kita bahas bareng.'
                        : 'Start with a single question — we’ll take it from there.'}
                </p>
                <div style={rise(290)} className="mt-9">
                    <a
                        href="#services"
                        onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
                        className="group inline-flex items-center gap-3 rounded-full bg-cream text-ink px-9 py-4 text-sm font-medium hover:bg-plum hover:text-cream transition-colors duration-500"
                    >
                        {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>

                {/* ===== quiet sign-off — a signature, not a second hero ===== */}
                <div style={rise(440)} className="mt-16 md:mt-20 w-full flex flex-col items-center">
                    <span aria-hidden className="block h-px w-16 bg-cream/20" />

                    <div
                        aria-label="Mayanov Tarot"
                        className="mt-9 md:mt-10 font-elegant font-medium leading-[0.95] tracking-[-0.02em] text-[clamp(2.6rem,9vw,5.5rem)] select-none [text-shadow:0_8px_60px_rgba(6,4,14,0.55)]"
                    >
                        Mayanov <span className="text-[#C9B8E8]">Tarot</span>
                    </div>

                    {/* socials — plain text links, ✦-separated (no buttons) */}
                    <nav className="mt-4 flex items-center gap-3.5 text-[0.9rem]" aria-label="Social">
                        <a
                            href="https://www.instagram.com/mayanov_/" target="_blank" rel="noopener noreferrer"
                            onClick={() => trackEvent('view_item', { item_name: 'Instagram Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'Instagram', content_category: isIndonesian ? 'ID' : 'Global' })}
                            className={socialLink}>Instagram</a>
                        <CelestialMark name="sparkle" className="w-2 h-2 text-cream/30 shrink-0" />
                        <a
                            href="https://www.tiktok.com/@mayanov_" target="_blank" rel="noopener noreferrer"
                            onClick={() => trackEvent('view_item', { item_name: 'TikTok Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'TikTok', content_category: isIndonesian ? 'ID' : 'Global' })}
                            className={socialLink}>TikTok</a>
                        <CelestialMark name="sparkle" className="w-2 h-2 text-cream/30 shrink-0" />
                        <a
                            href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading" target="_blank" rel="noopener noreferrer"
                            onClick={() => trackEvent('contact', { method: 'WhatsApp', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: isIndonesian ? 'ID' : 'Global' })}
                            className={socialLink}>WhatsApp</a>
                    </nav>

                    <p className="mt-6 text-[11px] tracking-[0.06em] text-cream/40">
                        Jakarta · © {year} Mayanov Tarot
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
