import React, { useRef, useEffect } from 'react';
import { Instagram, Clock, ArrowRight, MapPin } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';
import { smoothScrollToId } from '../UI/scroll';
import FadeIn from '../UI/FadeIn';

interface FooterProps {
    isIndonesian?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isIndonesian = false }) => {
    const currentYear = new Date().getFullYear();
    const footerRef = useRef<HTMLElement>(null);
    const starRef = useRef<HTMLDivElement>(null);

    // Gentle parallax — the star field drifts as the footer scrolls up.
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        let raf = 0;
        const update = () => {
            const el = footerRef.current;
            const star = starRef.current;
            if (!el || !star) return;
            const rect = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const t = Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1);
            star.style.transform = `translate3d(0, ${((t - 0.5) * 40).toFixed(1)}px, 0) scale(1.12)`;
        };
        const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            cancelAnimationFrame(raf);
        };
    }, []);

    // Square, bordered social button — fills with moonstone on hover.
    const socialClass = "grid place-items-center w-11 h-11 rounded-lg border border-white/30 text-white hover:text-plum-deep hover:bg-moon hover:border-moon transition-all duration-300 hover:-translate-y-0.5";
    const labelClass = "text-[11px] uppercase tracking-[0.24em] text-white mb-5";
    const infoClass = "flex items-start gap-2.5 text-[0.82rem] text-white font-light leading-relaxed";

    const goTo = (id: string) => smoothScrollToId(id, 80);

    return (
        <footer
            ref={footerRef}
            className="relative z-20 rounded-[1.75rem] md:rounded-[2.5rem] pt-12 md:pt-16 pb-8 md:pb-10 overflow-hidden isolate shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)]"
            style={{ background: '#0B0B16' }}
        >
            {/* cosmic star field — same image as the page background (slow parallax) */}
            <div
                ref={starRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 will-change-transform"
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}footer-sky.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 45%',
                    transform: 'scale(1.12)',
                }}
            />
            {/* even, neutral darkening so the stars read cleanly (no muddy colour cast) */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: 'rgba(9,9,20,0.4)' }}
            />

            <FadeIn className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 relative z-10">
                {/* Top — CTA line */}
                <div className="grid lg:grid-cols-12 gap-y-8 lg:gap-x-16 items-end pb-10 border-b border-white/10">
                    <h2 className="lg:col-span-8 font-elegant font-medium text-white text-[1.9rem] md:text-[2.6rem] leading-[1.05] tracking-[-0.03em]">
                        {isIndonesian ? 'Siap untuk pikiran yang lebih jernih?' : 'Ready for a clearer view?'}
                    </h2>
                    <div className="lg:col-span-4 lg:justify-self-end">
                        <a
                            href="#services"
                            onClick={(e) => { e.preventDefault(); goTo('services'); }}
                            className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-lg bg-cream text-ink text-sm font-semibold hover:bg-white transition-colors duration-200"
                        >
                            {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                {/* Middle — brand statement on the left, meta on the right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-10 py-10 md:py-12">
                    {/* Brand */}
                    <div className="md:col-span-6">
                        <div className="flex items-center gap-3">
                            <span className="grid place-items-center w-10 h-10 rounded-lg border border-white/40 text-white font-serif text-lg leading-none">M</span>
                            <span className="text-xl font-serif font-semibold text-white tracking-tight">
                                Mayanov <span className="font-normal text-white">Tarot</span>
                            </span>
                        </div>
                        <p className="mt-5 text-[0.9rem] md:text-[0.95rem] text-white font-light leading-relaxed max-w-sm">
                            {isIndonesian
                                ? 'Tarot sebagai ruang refleksi — analitis, hangat, dan membumi.'
                                : 'Tarot as a space for reflection — analytical, warm, and grounded.'}
                        </p>
                    </div>

                    {/* Visit — hours + location (bilingual) */}
                    <div className="md:col-span-3 md:col-start-8">
                        <h4 className={labelClass}>{isIndonesian ? 'Kunjungi' : 'Visit'}</h4>
                        <ul className="space-y-3.5">
                            <li className={infoClass}>
                                <Clock className="w-4 h-4 mt-0.5 text-white shrink-0" />
                                <span>{isIndonesian ? 'Waktu Layanan: 11:00 – 20:00' : 'Service Hours: 11:00 – 20:00'}</span>
                            </li>
                            <li className={infoClass}>
                                <MapPin className="w-4 h-4 mt-0.5 text-white shrink-0" />
                                <span>{isIndonesian ? 'Jakarta Selatan' : 'South Jakarta'}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Follow */}
                    <div className="md:col-span-2">
                        <h4 className={labelClass}>{isIndonesian ? 'Ikuti' : 'Follow'}</h4>
                        <div className="flex flex-wrap gap-3">
                            <a href="https://www.instagram.com/mayanov_/" target="_blank" rel="noopener noreferrer"
                                onClick={() => trackEvent('view_item', { item_name: 'Instagram Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'Instagram', content_category: isIndonesian ? 'ID' : 'Global' })}
                                className={socialClass} aria-label="Instagram">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://www.tiktok.com/@mayanov_" target="_blank" rel="noopener noreferrer"
                                onClick={() => trackEvent('view_item', { item_name: 'TikTok Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'TikTok', content_category: isIndonesian ? 'ID' : 'Global' })}
                                className={socialClass} aria-label="TikTok">
                                <FaTiktok size={16} />
                            </a>
                            <a href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading" target="_blank" rel="noopener noreferrer"
                                onClick={() => trackEvent('contact', { method: 'WhatsApp', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: isIndonesian ? 'ID' : 'Global' })}
                                className={socialClass} aria-label="WhatsApp">
                                <FaWhatsapp size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Signature wordmark — refined two-tone, revealed on scroll */}
                <FadeIn dir="up" className="pt-8 md:pt-12">
                    <div aria-hidden>
                        <div
                            className="flex items-baseline justify-center gap-[0.28em] whitespace-nowrap leading-[1.05] select-none"
                            style={{ fontSize: 'clamp(2rem, 9vw, 7rem)' }}
                        >
                            <span className="font-elegant font-semibold text-white tracking-[-0.03em]">Mayanov</span>
                            <span className="font-elegant italic font-light text-moon tracking-[-0.01em]">Tarot</span>
                        </div>
                        {/* thin centered flourish */}
                        <div className="mx-auto mt-6 md:mt-8 h-px w-40 md:w-64 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    </div>
                </FadeIn>

                {/* Bottom bar (no divider line) */}
                <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white tracking-wide">
                    <span>&copy; {currentYear} Mayanov Tarot. {isIndonesian ? "Hak Cipta Dilindungi." : "All Rights Reserved."}</span>
                </div>
            </FadeIn>
        </footer>
    );
};

export default Footer;
