import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';
import { smoothScrollToId } from '../UI/scroll';
import { btnPrimaryDark, btnSecondaryDark } from '../UI/buttons';

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

const WA_NUMBER = '6287786280310';
const WA_HELLO = `https://wa.me/${WA_NUMBER}?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading`;

/**
 * The footer is the close of the evening — the page settles back onto the night sky
 * it opened on. An editorial sign-off rather than a card: the invitation on the
 * left, the real ways to reach Mayanov on the right, and a giant wordmark running
 * edge to edge along the bottom like a signature.
 */
const Footer: React.FC<FooterProps> = ({ isIndonesian = false }) => {
    const year = new Date().getFullYear();
    const v = useInView();
    const t = (id: string, en: string) => (isIndonesian ? id : en);
    const market = isIndonesian ? 'ID' : 'Global';
    const goServices = (e: React.MouseEvent) => { e.preventDefault(); smoothScrollToId('services', 80); };
    const trackWA = () => trackEvent('contact', { method: 'WhatsApp', market }, 'Contact', { content_name: 'WhatsApp Chat', content_category: market });

    // soft blur-rise that settles into focus
    const rise = (delay: number): React.CSSProperties => ({
        opacity: v.inView ? 1 : 0,
        transform: v.inView ? 'translateY(0)' : 'translateY(16px)',
        filter: v.inView ? 'blur(0px)' : 'blur(5px)',
        transition: `opacity 0.9s ease ${delay}ms, transform 1s ${EASE} ${delay}ms, filter 0.9s ease ${delay}ms`,
        willChange: 'transform, opacity, filter',
    });

    // the contact list — real details, set like a colophon
    const contacts: { label: string; value: string; href?: string; onClick?: () => void }[] = [
        { label: 'WhatsApp', value: '+62 877 8628 0310', href: WA_HELLO, onClick: trackWA },
        {
            label: 'Instagram', value: '@mayanov_', href: 'https://www.instagram.com/mayanov_/',
            onClick: () => trackEvent('view_item', { item_name: 'Instagram Profile', market }, 'ViewContent', { content_name: 'Instagram', content_category: market }),
        },
        {
            label: 'TikTok', value: '@mayanov_', href: 'https://www.tiktok.com/@mayanov_',
            onClick: () => trackEvent('view_item', { item_name: 'TikTok Profile', market }, 'ViewContent', { content_name: 'TikTok', content_category: market }),
        },
        { label: t('Jam sesi', 'Session hours'), value: '11.00 – 20.00 WIB' },
        { label: t('Lokasi', 'Based in'), value: 'Jakarta Selatan' },
    ];

    const SH = '[@media(max-height:780px)]'; // short screens: the pinned footer must stay shorter than the screen

    return (
        <footer ref={v.ref} className="relative z-10 text-cream overflow-hidden">
            <div className={`mx-auto px-6 md:px-10 max-w-6xl pt-8 md:pt-14 ${SH}:pt-3 ${SH}:md:pt-8`}>
                <div className={`grid md:grid-cols-12 gap-y-8 ${SH}:gap-y-5 md:gap-x-12 md:items-end`}>
                    {/* LEFT — the invitation */}
                    <div style={rise(0)} className="md:col-span-7">
                        <h2 className={`font-elegant font-medium text-cream leading-[1.04] tracking-[-0.02em] text-[clamp(2.2rem,5vw,4.3rem)] ${SH}:text-[clamp(2rem,3.8vw,3.1rem)] max-w-[14ch] [text-shadow:0_8px_60px_rgba(6,4,14,0.55)]`}>
                            {isIndonesian
                                ? <>Siap untuk pikiran yang lebih <span className="italic">jernih</span>?</>
                                : <>Ready for a <span className="italic">clearer</span> view?</>}
                        </h2>
                        <p className={`mt-5 ${SH}:hidden text-cream/65 font-light text-[0.95rem] leading-relaxed max-w-md`}>
                            {t('Lewat chat, call, atau tatap muka di Jakarta Selatan — pilih yang paling nyaman buatmu.',
                               'By chat, call, or in person in South Jakarta — whichever feels easiest for you.')}
                        </p>
                        <div className={`mt-7 ${SH}:mt-5 flex flex-wrap items-center gap-3`}>
                            <a href="#services" onClick={goServices} className={`${btnPrimaryDark} inline-flex group gap-3 px-8 py-3.5 text-sm`}>
                                {t('Pesan Sesi', 'Book a Reading')}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a href={WA_HELLO} target="_blank" rel="noopener noreferrer" onClick={trackWA} className={`${btnSecondaryDark} inline-flex gap-2.5 px-7 py-3.5 text-sm`}>
                                <FaWhatsapp size={17} />
                                {t('Chat di WhatsApp', 'Chat on WhatsApp')}
                            </a>
                        </div>
                    </div>

                    {/* RIGHT — ways to reach Mayanov, as ruled rows */}
                    <dl style={rise(180)} className="md:col-span-4 md:col-start-9 text-sm grid grid-cols-2 gap-x-6 gap-y-4 border-t border-cream/15 pt-5 md:block md:border-t-0 md:pt-0">
                        {contacts.map((c) => (
                            <div key={c.label} className={`md:flex md:items-baseline md:justify-between md:gap-6 md:border-t md:border-cream/15 md:py-3 ${SH}:md:py-2.5 md:last:border-b`}>
                                <dt className="text-cream/50 text-[11px] tracking-[0.16em] uppercase">{c.label}</dt>
                                <dd className="mt-1 md:mt-0 md:text-right">
                                    {c.href ? (
                                        <a href={c.href} target="_blank" rel="noopener noreferrer" onClick={c.onClick} className="text-cream/90 hover:text-cream underline-offset-4 hover:underline decoration-cream/40">
                                            {c.value}
                                        </a>
                                    ) : (
                                        <span className="text-cream/90">{c.value}</span>
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* small print, above the signature */}
                <div style={rise(320)} className={`mt-10 md:mt-16 ${SH}:mt-7 ${SH}:md:mt-8 flex items-center justify-between gap-4 text-[11px] tracking-[0.08em] text-cream/45`}>
                    <span>© {year} Mayanov Tarot · 18+</span>
                    <span className="hidden sm:inline">{t('Dibuat dengan tenang di Jakarta', 'Made calmly in Jakarta')}</span>
                </div>
            </div>

            {/* THE SIGNATURE — a giant wordmark running edge to edge, its baseline tucked
                just under the bottom edge so it reads as part of the sky */}
            <div style={rise(420)} aria-hidden className="mt-3 -mx-3 sm:-mx-5 md:-mx-6 -mb-3 sm:-mb-5 md:-mb-6 select-none overflow-hidden">
                <div className={`font-serif font-medium uppercase whitespace-nowrap text-center leading-[0.78] tracking-[-0.02em] text-cream/90 text-[12.6vw] ${SH}:md:text-[8.5vw] translate-y-[12%] [text-shadow:0_10px_80px_rgba(6,4,14,0.5)]`}>
                    Mayanov Tarot
                </div>
            </div>
        </footer>
    );
};

export default Footer;
