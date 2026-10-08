import React, { useRef, useEffect, useState } from 'react';
import { Instagram, Clock, ArrowRight, MapPin } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';
import { smoothScrollToId } from '../UI/scroll';

interface FooterProps {
    isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

// Small in-view hook: flips true once the element is sufficiently visible.
const useInView = (threshold = 0.2, rootMargin = '0px 0px -12% 0px') => {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setInView(true);
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setInView(true);
                    io.disconnect();
                }
            },
            { threshold, rootMargin }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [threshold, rootMargin]);
    return { ref, inView };
};

const Footer: React.FC<FooterProps> = ({ isIndonesian = false }) => {
    const currentYear = new Date().getFullYear();
    // The supporting content reveals when the top of the footer arrives…
    const top = useInView(0.15, '0px 0px -10% 0px');
    // …and the giant logotype reveals on its own, the moment it starts entering.
    const mark = useInView(0.08, '0px 0px -6% 0px');

    // Scroll-linked parallax drift on the logotype — it keeps moving as you scroll,
    // so the reveal reads as a living scroll animation rather than a one-shot fade.
    const parRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        let raf = 0;
        const update = () => {
            const el = parRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const rel = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
            el.style.transform = `translate3d(0, ${(rel * 44).toFixed(1)}px, 0)`;
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

    // supporting content: a soft blur-rise (defocus clears as it settles)
    const rise = (delay: number, on: boolean): React.CSSProperties => ({
        opacity: on ? 1 : 0,
        transform: on ? 'translateY(0)' : 'translateY(18px)',
        filter: on ? 'blur(0px)' : 'blur(6px)',
        transition: `opacity 0.8s ease ${delay}ms, transform 0.9s ${EASE} ${delay}ms, filter 0.8s ease ${delay}ms`,
        willChange: 'transform, opacity, filter',
    });

    // logotype words: rise up from behind a clip mask (the wrapper is overflow-hidden)
    const maskInner = (delay: number): React.CSSProperties => ({
        display: 'block',
        transform: mark.inView ? 'translateY(0)' : 'translateY(110%)',
        transition: `transform 1.15s ${EASE} ${delay}ms`,
        willChange: 'transform',
    });

    const socialClass = "inline-flex items-center justify-center p-1 text-ink hover:text-moon transition-all duration-300 hover:-translate-y-0.5";
    const labelClass = "text-[12px] tracking-[0.02em] text-ink/50 mb-5";
    const infoClass = "flex items-start gap-2.5 text-[0.82rem] text-ink/70 font-light leading-relaxed";

    const goTo = (id: string) => smoothScrollToId(id, 80);

    return (
        <footer
            className="relative z-20 rounded-[1.75rem] md:rounded-[2.5rem] pt-12 md:pt-16 pb-8 md:pb-10 overflow-hidden isolate shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)]"
            style={{ background: '#ffffff' }}
        >
            <div ref={top.ref} className="mx-auto px-8 relative z-10">
                {/* Top — CTA line */}
                <div className="grid lg:grid-cols-12 gap-y-8 lg:gap-x-16 items-end pb-10 md:pb-12 border-b border-ink/10">
                    <h2
                        className="lg:col-span-8 font-elegant font-medium text-ink text-[1.9rem] md:text-[2.6rem] leading-[1.05] tracking-[-0.03em]"
                        style={rise(0, top.inView)}
                    >
                        {isIndonesian ? 'Siap untuk pikiran yang lebih jernih?' : 'Ready for a clearer view?'}
                    </h2>
                    <div className="lg:col-span-4 lg:justify-self-end" style={rise(90, top.inView)}>
                        <a
                            href="#services"
                            onClick={(e) => { e.preventDefault(); goTo('services'); }}
                            className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-ink text-cream text-sm font-medium hover:bg-plum transition-colors duration-200"
                        >
                            {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                {/* Meta row — brand voice + visit + follow (even columns, top-aligned) */}
                <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-10 pt-10 md:pt-12">
                    {/* Brand voice */}
                    <div className="col-span-2 md:col-span-6" style={rise(140, top.inView)}>
                        <div className="flex items-center gap-2.5 mb-5">
                            <span className="grid place-items-center w-9 h-9 rounded-lg bg-ink text-cream font-serif text-lg leading-none shadow-[0_8px_20px_-10px_rgba(33,30,46,0.6)]">M</span>
                            <span className="text-[11px] tracking-[0.03em] text-ink/40">
                                {isIndonesian ? 'Jakarta · Sejak 2016' : 'Jakarta · Est. 2016'}
                            </span>
                        </div>
                        <p className="text-[0.9rem] md:text-[0.95rem] text-ink/60 font-light leading-relaxed max-w-sm">
                            {isIndonesian
                                ? 'Tarot sebagai ruang refleksi — analitis, hangat, dan membumi.'
                                : 'Tarot as a space for reflection — analytical, warm, and grounded.'}
                        </p>
                    </div>

                    {/* Visit — hours + location (bilingual) */}
                    <div className="md:col-span-3" style={rise(200, top.inView)}>
                        <h4 className={labelClass}>{isIndonesian ? 'Kunjungi' : 'Visit'}</h4>
                        <ul className="space-y-3.5">
                            <li className={infoClass}>
                                <Clock className="w-4 h-4 mt-0.5 text-ink/50 shrink-0" />
                                <span>{isIndonesian ? 'Waktu Layanan: 11:00 – 20:00' : 'Service Hours: 11:00 – 20:00'}</span>
                            </li>
                            <li className={infoClass}>
                                <MapPin className="w-4 h-4 mt-0.5 text-ink/50 shrink-0" />
                                <span>{isIndonesian ? 'Jakarta Selatan' : 'South Jakarta'}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Follow */}
                    <div className="md:col-span-3" style={rise(260, top.inView)}>
                        <h4 className={labelClass}>{isIndonesian ? 'Ikuti' : 'Follow'}</h4>
                        <div className="flex flex-wrap items-center gap-5">
                            <a href="https://www.instagram.com/mayanov_/" target="_blank" rel="noopener noreferrer"
                                onClick={() => trackEvent('view_item', { item_name: 'Instagram Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'Instagram', content_category: isIndonesian ? 'ID' : 'Global' })}
                                className={socialClass} aria-label="Instagram">
                                <Instagram className="w-[22px] h-[22px]" />
                            </a>
                            <a href="https://www.tiktok.com/@mayanov_" target="_blank" rel="noopener noreferrer"
                                onClick={() => trackEvent('view_item', { item_name: 'TikTok Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'TikTok', content_category: isIndonesian ? 'ID' : 'Global' })}
                                className={socialClass} aria-label="TikTok">
                                <FaTiktok size={20} />
                            </a>
                            <a href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading" target="_blank" rel="noopener noreferrer"
                                onClick={() => trackEvent('contact', { method: 'WhatsApp', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: isIndonesian ? 'ID' : 'Global' })}
                                className={socialClass} aria-label="WhatsApp">
                                <FaWhatsapp size={23} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Oversized logotype — full-width anchor, revealed word-by-word from a clip mask */}
                <div ref={mark.ref} className="mt-12 md:mt-16" aria-label="Mayanov Tarot">
                    <div
                        ref={parRef}
                        aria-hidden
                        className="flex flex-wrap items-baseline gap-x-[0.26em] font-elegant font-semibold leading-[0.9] tracking-[-0.045em] text-[clamp(3rem,13.5vw,13rem)] select-none will-change-transform"
                    >
                        <span className="inline-block overflow-hidden">
                            <span className="text-ink pb-[0.18em]" style={maskInner(0)}>Mayanov</span>
                        </span>
                        <span className="inline-block overflow-hidden">
                            <span className="text-moon pb-[0.18em]" style={maskInner(130)}>Tarot</span>
                        </span>
                    </div>
                </div>

                {/* Bottom bar */}
                <div
                    className="mt-10 md:mt-12 pt-6 border-t border-ink/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink/55 tracking-wide"
                    style={rise(0, mark.inView)}
                >
                    <span>&copy; {currentYear} Mayanov Tarot. {isIndonesian ? "Hak Cipta Dilindungi." : "All Rights Reserved."}</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
