import React, { useRef, useEffect } from 'react';
import { Mail, Instagram, Clock, ArrowRight, MapPin } from 'lucide-react';
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

    // As you reach the bottom, the footer rises up into the section above it —
    // so it feels like the footer is pushing that section up. Settles to 0 at rest
    // (no gap), and reveals the deep panel from below.
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const el = footerRef.current;
        if (!el) return;
        let raf = 0;
        const update = () => {
            const rect = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const t = Math.min(Math.max((vh - rect.top) / (vh * 0.62), 0), 1);
            const shift = (1 - t) * 72; // starts lower, rises to its resting spot
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

    const socialClass = "w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center text-[#C4B5A4] hover:bg-coral hover:text-cream transition-all duration-300 border border-white/10";
    const linkClass = "text-sm text-[#C4B5A4] hover:text-[#F7F0E6] transition-colors";
    const labelClass = "text-[0.68rem] uppercase tracking-[0.24em] text-gold-soft mb-5";

    const navLinks = isIndonesian
        ? [{ name: 'Tentang', id: 'about' }, { name: 'Layanan', id: 'services' }, { name: 'Testimoni', id: 'testimonials' }, { name: 'Event', id: 'events' }, { name: 'FAQ', id: 'faq' }]
        : [{ name: 'About', id: 'about' }, { name: 'Services', id: 'services' }, { name: 'Reviews', id: 'testimonials' }, { name: 'Events', id: 'events' }, { name: 'FAQ', id: 'faq' }];

    const goTo = (id: string) => smoothScrollToId(id, 80);

    return (
        <footer
            ref={footerRef}
            className="relative z-20 mt-3 md:mt-6 rounded-t-[1.75rem] md:rounded-t-[2.75rem] pt-20 md:pt-28 pb-8 overflow-hidden isolate will-change-transform shadow-[0_-44px_100px_-46px_rgba(0,0,0,0.85)]"
            style={{ background: 'linear-gradient(180deg, #1B1230 0%, #120B1E 100%)' }}
        >

            {/* Oversized faint wordmark */}
            <span
                aria-hidden
                className="pointer-events-none select-none absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-[26%] font-serif font-bold text-white/[0.035] leading-none tracking-[-0.05em] whitespace-nowrap -z-10"
                style={{ fontSize: '21vw' }}
            >
                MAYANOV
            </span>

            <FadeIn className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
                {/* Top — CTA line */}
                <div className="grid lg:grid-cols-12 gap-y-8 lg:gap-x-16 items-end pb-14 border-b border-white/10">
                    <h2 className="lg:col-span-8 font-serif font-semibold text-[#F7F0E6] text-[2.5rem] md:text-[3.4rem] leading-[1.0] tracking-[-0.03em]">
                        {isIndonesian ? 'Siap untuk pikiran yang lebih jernih?' : 'Ready for a clearer view?'}
                    </h2>
                    <div className="lg:col-span-4 lg:justify-self-end">
                        <a
                            href="#services"
                            onClick={(e) => { e.preventDefault(); goTo('services'); }}
                            className="group inline-flex items-center gap-2.5 pl-8 pr-6 py-4 rounded-full bg-coral text-cream text-base font-medium hover:bg-coral-deep hover:-translate-y-0.5 transition-all duration-200 shadow-[0_18px_44px_-16px_rgba(216,128,90,0.8)]"
                        >
                            {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                            <span className="grid place-items-center w-7 h-7 rounded-full bg-cream/15 group-hover:bg-cream/25 transition-colors">
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                        </a>
                    </div>
                </div>

                {/* Middle — columns */}
                <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-12 py-14 md:py-16">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-4">
                        <div className="flex items-center gap-2.5">
                            <span className="grid place-items-center w-9 h-9 rounded-full border border-gold/40 text-gold-soft font-serif text-lg leading-none">M</span>
                            <span className="text-2xl font-serif font-semibold text-[#F7F0E6] tracking-tight">
                                Mayanov <span className="font-normal text-[#C4B5A4]">Tarot</span>
                            </span>
                        </div>
                        <p className="mt-5 text-sm text-[#C4B5A4] max-w-xs leading-relaxed font-light">
                            {isIndonesian
                                ? 'Tarot sebagai ruang refleksi—analitis, hangat, dan membumi.'
                                : 'Helping you find clarity in a chaotic world. Honest, kind, and strategic guidance.'}
                        </p>
                    </div>

                    {/* Explore */}
                    <div className="md:col-span-3">
                        <h4 className={labelClass}>{isIndonesian ? 'Jelajahi' : 'Explore'}</h4>
                        <ul className="space-y-3">
                            {navLinks.map((l) => (
                                <li key={l.id}>
                                    <button onClick={() => goTo(l.id)} className={linkClass}>{l.name}</button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="md:col-span-3">
                        <h4 className={labelClass}>{isIndonesian ? 'Kontak' : 'Contact'}</h4>
                        <ul className="space-y-3.5">
                            <li>
                                <a
                                    href="mailto:tarotreadingbymayanov@gmail.com"
                                    onClick={() => trackEvent('contact', { method: 'Email', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'Email Lead', content_category: isIndonesian ? 'ID' : 'Global' })}
                                    className={`${linkClass} flex items-start gap-2.5`}
                                >
                                    <Mail className="w-4 h-4 mt-0.5 text-gold-soft shrink-0" />
                                    <span className="break-all">tarotreadingbymayanov@gmail.com</span>
                                </a>
                            </li>
                            {isIndonesian && (
                                <>
                                    <li className="flex items-start gap-2.5 text-sm text-[#C4B5A4]">
                                        <Clock className="w-4 h-4 mt-0.5 text-gold-soft shrink-0" />
                                        <span>Waktu Layanan: 11:00 – 20:00</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-sm text-[#C4B5A4]">
                                        <MapPin className="w-4 h-4 mt-0.5 text-gold-soft shrink-0" />
                                        <span>Jakarta Selatan</span>
                                    </li>
                                </>
                            )}
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
                            <a href="mailto:tarotreadingbymayanov@gmail.com"
                                onClick={() => trackEvent('contact', { method: 'Email', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'Email Lead', content_category: isIndonesian ? 'ID' : 'Global' })}
                                className={socialClass} aria-label="Email">
                                <Mail className="w-5 h-5" />
                            </a>
                            {isIndonesian && (
                                <>
                                    <a href="https://www.tiktok.com/@mayanov_" target="_blank" rel="noopener noreferrer"
                                        onClick={() => trackEvent('view_item', { item_name: 'TikTok Profile', market: 'ID' }, 'ViewContent', { content_name: 'TikTok', content_category: 'ID' })}
                                        className={socialClass} aria-label="TikTok">
                                        <FaTiktok size={16} />
                                    </a>
                                    <a href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading" target="_blank" rel="noopener noreferrer"
                                        onClick={() => trackEvent('contact', { method: 'WhatsApp', market: 'ID' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: 'ID' })}
                                        className={socialClass} aria-label="WhatsApp">
                                        <FaWhatsapp size={20} />
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-white/10 text-center text-xs text-[#8C7F72] tracking-wide">
                    &copy; {currentYear} Mayanov Tarot. {isIndonesian ? "Hak Cipta Dilindungi." : "All Rights Reserved."}
                </div>
            </FadeIn>
        </footer>
    );
};

export default Footer;
