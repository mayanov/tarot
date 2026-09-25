import React, { useRef, useEffect } from 'react';
import { Instagram, Clock, ArrowRight, MapPin } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';
import { smoothScrollToId } from '../UI/scroll';
import FadeIn from '../UI/FadeIn';

interface FooterProps {
    isIndonesian?: boolean;
}

// Film-grain noise — same texture the site background uses.
const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")";

const Footer: React.FC<FooterProps> = ({ isIndonesian = false }) => {
    const currentYear = new Date().getFullYear();
    const footerRef = useRef<HTMLElement>(null);

    // As you reach the bottom, the footer rises up into the white backdrop above it,
    // like a dark panel sliding into place. Settles flush at rest.
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const el = footerRef.current;
        if (!el) return;
        let raf = 0;
        const update = () => {
            const rect = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const t = Math.min(Math.max((vh - rect.top) / (vh * 0.62), 0), 1);
            const shift = (1 - t) * 64; // starts lower, rises to its resting spot
            el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
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

    // Square, bordered social button — fills with cream on hover.
    const socialClass = "grid place-items-center w-11 h-11 rounded-lg border border-white/20 text-white hover:text-plum-deep hover:bg-moon hover:border-moon transition-all duration-300 hover:-translate-y-0.5";
    const labelClass = "text-[11px] uppercase tracking-[0.24em] text-moon mb-5";
    const infoClass = "flex items-start gap-2.5 text-[0.82rem] text-white/80 font-light leading-relaxed";

    const goTo = (id: string) => smoothScrollToId(id, 80);

    return (
        <footer
            ref={footerRef}
            className="relative z-20 rounded-t-[1.75rem] md:rounded-t-[2.75rem] pt-12 md:pt-16 pb-6 overflow-hidden isolate will-change-transform shadow-[0_-40px_90px_-50px_rgba(0,0,0,0.5)]"
            style={{ background: '#0C1430' }}
        >
            {/* deep-blue dusk sky photo */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}sky-footer.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 40%',
                }}
            />
            {/* dark overlay so the footer text stays readable over the dusk */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'linear-gradient(180deg, rgba(10,12,30,0.82) 0%, rgba(10,12,30,0.66) 46%, rgba(20,12,14,0.72) 100%)' }}
            />

            {/* film grain — matches the site background (subtle) */}
            <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />

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
                                Mayanov <span className="font-normal text-white/70">Tarot</span>
                            </span>
                        </div>
                        <p className="mt-5 text-[0.9rem] md:text-[0.95rem] text-white/60 font-light leading-relaxed max-w-sm">
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
                                <Clock className="w-4 h-4 mt-0.5 text-moon shrink-0" />
                                <span>{isIndonesian ? 'Waktu Layanan: 11:00 – 20:00' : 'Service Hours: 11:00 – 20:00'}</span>
                            </li>
                            <li className={infoClass}>
                                <MapPin className="w-4 h-4 mt-0.5 text-moon shrink-0" />
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

                {/* Oversized brand wordmark — reads like the name glowing on the dusk
                    horizon (moonstone at the top, fading into the dark). Turns the
                    footer into a signature close rather than a utility block. */}
                <div className="pt-6 md:pt-10 -mb-3 md:-mb-6" aria-hidden>
                    <span
                        className="block whitespace-nowrap text-center font-elegant font-semibold leading-[0.78] tracking-[-0.045em] text-transparent bg-clip-text select-none"
                        style={{
                            fontSize: 'clamp(3.2rem, 19vw, 17rem)',
                            backgroundImage: 'linear-gradient(180deg, rgba(219,205,242,0.46) 0%, rgba(198,178,228,0.16) 50%, rgba(12,20,48,0) 92%)',
                        }}
                    >
                        Mayanov
                    </span>
                </div>

                {/* Bottom bar */}
                <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 text-xs text-white/55 tracking-wide">
                    <span>&copy; {currentYear} Mayanov Tarot. {isIndonesian ? "Hak Cipta Dilindungi." : "All Rights Reserved."}</span>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="group inline-flex items-center gap-2 uppercase tracking-[0.2em] text-[10px] text-white/60 hover:text-moon transition-colors"
                    >
                        {isIndonesian ? 'Kembali ke atas' : 'Back to top'}
                        <ArrowRight className="w-3.5 h-3.5 -rotate-90 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </FadeIn>
        </footer>
    );
};

export default Footer;
