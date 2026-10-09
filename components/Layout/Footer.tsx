import React, { useRef, useEffect, useState } from 'react';
import { Instagram } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';
import CelestialMark from '../UI/CelestialMark';

interface FooterProps {
    isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

// Flips true once the footer scrolls into view, so the close animates in.
const useInView = (threshold = 0.15, rootMargin = '0px 0px -8% 0px') => {
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
 * night sky it opened on. No columns, no labels, no sitemap: just the moon,
 * the name, where to find her, and a quiet sign-off. It renders transparent
 * over the shared night-sky backdrop set behind the Disclaimer + Footer.
 */
const Footer: React.FC<FooterProps> = ({ isIndonesian = false }) => {
    const year = new Date().getFullYear();
    const v = useInView();

    // supporting content: a soft blur-rise that settles into focus
    const rise = (delay: number): React.CSSProperties => ({
        opacity: v.inView ? 1 : 0,
        transform: v.inView ? 'translateY(0)' : 'translateY(16px)',
        filter: v.inView ? 'blur(0px)' : 'blur(5px)',
        transition: `opacity 0.9s ease ${delay}ms, transform 1s ${EASE} ${delay}ms, filter 0.9s ease ${delay}ms`,
        willChange: 'transform, opacity, filter',
    });

    // the wordmark words rise up from behind a clip mask
    const maskInner = (delay: number): React.CSSProperties => ({
        display: 'block',
        transform: v.inView ? 'translateY(0)' : 'translateY(110%)',
        transition: `transform 1.2s ${EASE} ${delay}ms`,
        willChange: 'transform',
    });

    const social = 'inline-flex items-center justify-center text-cream/55 hover:text-cream transition-all duration-500 hover:-translate-y-0.5';

    return (
        <footer ref={v.ref} className="relative z-10 text-cream text-center overflow-hidden">
            <div className="mx-auto px-8 max-w-3xl flex flex-col items-center py-20 md:py-28">
                {/* the night closes under the moon — bookends the hero */}
                <div style={rise(0)}>
                    <CelestialMark name="crescent" className="w-10 md:w-12 text-cream/85 [filter:drop-shadow(0_6px_30px_rgba(6,4,14,0.6))]" />
                </div>

                {/* sign-off wordmark — rises word by word from behind a mask */}
                <h2
                    aria-label="Mayanov Tarot"
                    className="mt-8 md:mt-10 flex flex-wrap justify-center items-baseline gap-x-[0.28em] font-elegant font-medium leading-[0.95] tracking-[-0.02em] text-[clamp(2.6rem,10vw,6.5rem)] select-none [text-shadow:0_8px_60px_rgba(6,4,14,0.55)]"
                >
                    <span className="inline-block overflow-hidden"><span className="block pb-[0.14em]" style={maskInner(120)}>Mayanov</span></span>
                    <span className="inline-block overflow-hidden"><span className="block pb-[0.14em] text-[#C9B8E8]" style={maskInner(240)}>Tarot</span></span>
                </h2>

                {/* a warm farewell */}
                <p style={rise(360)} className="mt-6 md:mt-7 font-elegant italic text-cream/60 text-lg md:text-xl">
                    {isIndonesian ? 'Sampai pertanyaan berikutnya.' : 'Until your next question.'}
                </p>

                {/* the only actions that matter — where to find her */}
                <div style={rise(460)} className="mt-9 md:mt-11 flex items-center gap-8">
                    <a
                        href="https://www.instagram.com/mayanov_/" target="_blank" rel="noopener noreferrer"
                        onClick={() => trackEvent('view_item', { item_name: 'Instagram Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'Instagram', content_category: isIndonesian ? 'ID' : 'Global' })}
                        className={social} aria-label="Instagram">
                        <Instagram className="w-[26px] h-[26px]" strokeWidth={1.6} />
                    </a>
                    <a
                        href="https://www.tiktok.com/@mayanov_" target="_blank" rel="noopener noreferrer"
                        onClick={() => trackEvent('view_item', { item_name: 'TikTok Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'TikTok', content_category: isIndonesian ? 'ID' : 'Global' })}
                        className={social} aria-label="TikTok">
                        <FaTiktok size={23} />
                    </a>
                    <a
                        href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading" target="_blank" rel="noopener noreferrer"
                        onClick={() => trackEvent('contact', { method: 'WhatsApp', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: isIndonesian ? 'ID' : 'Global' })}
                        className={social} aria-label="WhatsApp">
                        <FaWhatsapp size={26} />
                    </a>
                </div>

                {/* one quiet line — place + copyright, said gently */}
                <p style={rise(560)} className="mt-12 md:mt-16 inline-flex items-center gap-2 text-[11px] tracking-[0.06em] text-cream/40">
                    <span>Jakarta</span>
                    <CelestialMark name="sparkle" className="w-2 h-2 text-cream/45" />
                    <span>© {year} Mayanov Tarot</span>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
