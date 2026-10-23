import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, Instagram } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';
import { smoothScrollToId } from '../UI/scroll';
import { btnPrimaryDark, btnSecondaryDark } from '../UI/buttons';
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

// A face-down tarot card back — plum, a fine gold frame and a star (matches the
// pricelist's card backs). Purely visual; the parent button handles the click.
const CardBack: React.FC = () => (
    <div className="relative h-full w-full overflow-hidden rounded-[0.7rem] ring-1 ring-white/20 [box-shadow:0_24px_50px_-22px_rgba(6,4,20,0.9)]" style={{ background: 'radial-gradient(135% 120% at 15% -15%, #553172 0%, #39234E 52%, #20132f 100%)' }}>
        <div aria-hidden className="absolute inset-[0.35rem] rounded-[0.45rem] border border-[rgba(214,190,140,0.7)]" />
        <div className="absolute inset-0 grid place-items-center text-[rgba(214,190,140,0.85)]">
            <CelestialMark name="star" className="w-7" />
        </div>
    </div>
);

/**
 * The footer is the close of the evening — the page dissolves back into the night
 * sky it opened on. No white card: the invitation sits right on the sky (echoing the
 * hero's "jernih"), with three face-down tarot cards to "draw" — any of them takes you
 * to the pricelist — then a quiet sign-off bar with links and socials.
 */
const Footer: React.FC<FooterProps> = ({ isIndonesian = false }) => {
    const year = new Date().getFullYear();
    const v = useInView();
    const t = (id: string, en: string) => (isIndonesian ? id : en);
    const goServices = (e?: React.MouseEvent) => { e?.preventDefault(); smoothScrollToId('services', 80); };
    const goTo = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); smoothScrollToId(id, 80); };

    // soft blur-rise that settles into focus
    const rise = (delay: number): React.CSSProperties => ({
        opacity: v.inView ? 1 : 0,
        transform: v.inView ? 'translateY(0)' : 'translateY(16px)',
        filter: v.inView ? 'blur(0px)' : 'blur(5px)',
        transition: `opacity 0.9s ease ${delay}ms, transform 1s ${EASE} ${delay}ms, filter 0.9s ease ${delay}ms`,
        willChange: 'transform, opacity, filter',
    });

    // plain icons (no circular containers), with a soft shadow so they read on the starfield
    const socialLink = 'inline-flex text-cream/75 hover:text-cream transition-all duration-500 hover:-translate-y-0.5 [filter:drop-shadow(0_2px_8px_rgba(6,4,14,0.55))]';
    const textLink = 'text-cream/70 hover:text-cream transition-colors duration-300';

    // the three cards: resting fan → spread wider on hover
    const FAN = [
        { rest: 'translateX(-62%) rotate(-11deg)', open: 'translateX(-92%) translateY(-6px) rotate(-15deg)' },
        { rest: 'translateY(-8px)', open: 'translateY(-20px)' },
        { rest: 'translateX(62%) rotate(11deg)', open: 'translateX(92%) translateY(-6px) rotate(15deg)' },
    ];

    return (
        <footer ref={v.ref} className="relative z-10 text-cream overflow-hidden">
            <div className="mx-auto px-6 md:px-10 max-w-6xl pt-8 md:pt-12 [@media(max-height:780px)]:md:pt-8 pb-4 md:pb-5">

                {/* ===== the close — right on the night sky ===== */}
                <div style={rise(0)} className="flex flex-col items-center text-center">
                    <span className="text-[11px] tracking-[0.32em] uppercase text-cream/55">
                        {t('Kartu terakhir', 'One last card')}
                    </span>
                    <h2 className="mt-4 font-elegant font-medium text-cream leading-[1.05] tracking-[-0.02em] text-[clamp(2.1rem,4.6vw,3.7rem)] [@media(max-height:780px)]:text-[clamp(1.9rem,3.6vw,2.8rem)] max-w-[15ch] [text-shadow:0_8px_60px_rgba(6,4,14,0.55)]">
                        {isIndonesian
                            ? <>Siap untuk pikiran yang lebih <span className="italic">jernih</span>?</>
                            : <>Ready for a <span className="italic">clearer</span> view?</>}
                    </h2>

                    {/* three face-down cards — draw any one to see the readings */}
                    <div className="group/fan relative mt-8 md:mt-9 [@media(max-height:780px)]:mt-6 h-[7.5rem] md:h-[8.25rem] w-[4.8rem] md:w-[5.2rem] [@media(max-height:780px)]:h-[6rem] [@media(max-height:780px)]:w-[3.8rem]">
                        {FAN.map((f, i) => (
                            <a
                                key={i}
                                href="#services"
                                onClick={goServices}
                                aria-label={t('Tarik kartu — lihat layanan', 'Draw a card — see the readings')}
                                className={`absolute inset-0 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] [transform:var(--rest)] group-hover/fan:[transform:var(--open)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60 rounded-[0.7rem] ${i === 1 ? 'z-10' : ''}`}
                                style={{ ['--rest' as any]: f.rest, ['--open' as any]: f.open }}
                            >
                                <CardBack />
                            </a>
                        ))}
                    </div>
                    <p className="mt-5 text-xs tracking-wide text-cream/55 [@media(max-height:780px)]:hidden">
                        {t('Tarik satu kartu untuk melihat layanan', 'Draw a card to see the readings')}
                    </p>

                    <div className="mt-6 [@media(max-height:780px)]:mt-5 flex flex-wrap items-center justify-center gap-3">
                        <a href="#services" onClick={goServices} className={`${btnPrimaryDark} inline-flex group gap-3 px-8 py-3.5 text-sm`}>
                            {t('Pesan Sesi', 'Book a Reading')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a
                            href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading" target="_blank" rel="noopener noreferrer"
                            onClick={() => trackEvent('contact', { method: 'WhatsApp', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: isIndonesian ? 'ID' : 'Global' })}
                            className={`${btnSecondaryDark} inline-flex gap-2.5 px-7 py-3.5 text-sm`}
                        >
                            <FaWhatsapp size={17} />
                            {t('Chat di WhatsApp', 'Chat on WhatsApp')}
                        </a>
                    </div>
                </div>

                {/* ===== sign-off bar ===== */}
                <div style={rise(380)} className="mt-10 md:mt-14 [@media(max-height:780px)]:md:mt-9 pt-6 [@media(max-height:780px)]:pt-5 border-t border-cream/15">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6">
                        <div aria-label="Mayanov Tarot" className="font-elegant font-medium text-[1.6rem] leading-none tracking-[-0.01em] select-none">
                            Mayanov Tarot
                        </div>
                        <nav aria-label={t('Tautan', 'Links')} className="hidden sm:flex items-center gap-7 text-sm">
                            <a href="#services" onClick={goTo('services')} className={textLink}>{t('Layanan', 'Readings')}</a>
                            <a href="#about" onClick={goTo('about')} className={textLink}>{t('Tentang', 'About')}</a>
                            <a href="#faq" onClick={goTo('faq')} className={textLink}>FAQ</a>
                        </nav>
                        <nav className="flex items-center gap-7" aria-label="Social">
                            <a
                                href="https://www.instagram.com/mayanov_/" target="_blank" rel="noopener noreferrer"
                                onClick={() => trackEvent('view_item', { item_name: 'Instagram Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'Instagram', content_category: isIndonesian ? 'ID' : 'Global' })}
                                className={socialLink} aria-label="Instagram"><Instagram className="w-[22px] h-[22px]" strokeWidth={1.7} /></a>
                            <a
                                href="https://www.tiktok.com/@mayanov_" target="_blank" rel="noopener noreferrer"
                                onClick={() => trackEvent('view_item', { item_name: 'TikTok Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'TikTok', content_category: isIndonesian ? 'ID' : 'Global' })}
                                className={socialLink} aria-label="TikTok"><FaTiktok size={20} /></a>
                            <a
                                href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading" target="_blank" rel="noopener noreferrer"
                                onClick={() => trackEvent('contact', { method: 'WhatsApp', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: isIndonesian ? 'ID' : 'Global' })}
                                className={socialLink} aria-label="WhatsApp"><FaWhatsapp size={22} /></a>
                        </nav>
                    </div>
                    <p className="mt-5 text-center md:text-left text-xs tracking-[0.06em] text-cream/45">
                        Jakarta · © {year} · 18+
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
