import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, Instagram } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';
import { smoothScrollToId } from '../UI/scroll';
import { btnPrimaryDark } from '../UI/buttons';

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

const WA_HELLO = 'https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading';

/**
 * The footer is the close of the evening — kept simple: one centred line and one
 * button on the night sky, then a hairline with the small print and socials.
 */
const Footer: React.FC<FooterProps> = ({ isIndonesian = false }) => {
    const year = new Date().getFullYear();
    const v = useInView();
    const market = isIndonesian ? 'ID' : 'Global';

    // soft rise into place
    const rise = (delay: number): React.CSSProperties => ({
        opacity: v.inView ? 1 : 0,
        transform: v.inView ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 0.9s ease ${delay}ms, transform 1s ${EASE} ${delay}ms`,
    });

    const icon = 'inline-flex text-cream/60 hover:text-cream transition-colors duration-300';

    return (
        <footer ref={v.ref} className="relative z-10 text-cream">
            <div className="mx-auto px-6 md:px-10 max-w-5xl">
                {/* the close */}
                <div style={rise(0)} className="flex flex-col items-center text-center pt-14 md:pt-20 pb-12 md:pb-16">
                    <h2 className="font-elegant font-medium text-cream leading-[1.08] tracking-[-0.015em] text-[clamp(1.9rem,4vw,3.1rem)] max-w-[18ch]">
                        {isIndonesian
                            ? <>Siap untuk pikiran yang lebih <span className="italic">jernih</span>?</>
                            : <>Ready for a <span className="italic">clearer</span> view?</>}
                    </h2>
                    <a
                        href="#services"
                        onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
                        className={`${btnPrimaryDark} mt-8 inline-flex group gap-3 px-8 py-3.5 text-sm`}
                    >
                        {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>

                {/* small print */}
                <div style={rise(200)} className="border-t border-cream/15 py-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-xs text-cream/50">
                    <span>© {year} Mayanov Tarot · Jakarta</span>
                    <nav className="flex items-center gap-6" aria-label="Social">
                        <a
                            href="https://www.instagram.com/mayanov_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={icon}
                            onClick={() => trackEvent('view_item', { item_name: 'Instagram Profile', market }, 'ViewContent', { content_name: 'Instagram', content_category: market })}
                        ><Instagram className="w-[18px] h-[18px]" strokeWidth={1.7} /></a>
                        <a
                            href="https://www.tiktok.com/@mayanov_" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={icon}
                            onClick={() => trackEvent('view_item', { item_name: 'TikTok Profile', market }, 'ViewContent', { content_name: 'TikTok', content_category: market })}
                        ><FaTiktok size={16} /></a>
                        <a
                            href={WA_HELLO} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={icon}
                            onClick={() => trackEvent('contact', { method: 'WhatsApp', market }, 'Contact', { content_name: 'WhatsApp Chat', content_category: market })}
                        ><FaWhatsapp size={18} /></a>
                    </nav>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
