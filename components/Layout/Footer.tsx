import React, { useRef } from 'react';
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

    // Square, bordered social button — fills with moonstone on hover.
    const socialClass = "grid place-items-center w-11 h-11 rounded-lg border border-white/20 text-white hover:text-plum-deep hover:bg-moon hover:border-moon transition-all duration-300 hover:-translate-y-0.5";
    const labelClass = "text-[11px] uppercase tracking-[0.24em] text-moon mb-5";
    const infoClass = "flex items-start gap-2.5 text-[0.82rem] text-white/80 font-light leading-relaxed";

    const goTo = (id: string) => smoothScrollToId(id, 80);

    return (
        <footer
            ref={footerRef}
            className="relative z-20 rounded-[1.75rem] md:rounded-[2.5rem] pt-12 md:pt-16 pb-8 md:pb-10 overflow-hidden isolate shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)]"
            style={{ background: '#0B0B16' }}
        >
            {/* cosmic star field — same image as the page background */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}sky-hero.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%',
                }}
            />
            {/* even, neutral darkening so the stars read cleanly (no muddy colour cast) */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: 'rgba(9,9,20,0.55)' }}
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

                {/* Oversized wordmark — glows on the star field */}
                <div className="pt-6 md:pt-10 -mb-3 md:-mb-6" aria-hidden>
                    <span
                        className="block whitespace-nowrap text-center font-elegant font-semibold leading-[0.78] tracking-[-0.045em] text-transparent bg-clip-text select-none"
                        style={{
                            fontSize: 'clamp(3.2rem, 19vw, 17rem)',
                            backgroundImage: 'linear-gradient(180deg, rgba(219,205,242,0.42) 0%, rgba(198,178,228,0.14) 50%, rgba(11,11,22,0) 92%)',
                        }}
                    >
                        Mayanov
                    </span>
                </div>

                {/* Bottom bar */}
                <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 text-xs text-white/55 tracking-wide">
                    <span>&copy; {currentYear} Mayanov Tarot. {isIndonesian ? "Hak Cipta Dilindungi." : "All Rights Reserved."}</span>
                </div>
            </FadeIn>
        </footer>
    );
};

export default Footer;
