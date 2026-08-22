import React from 'react';
import { Mail, Instagram, Clock } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';

interface FooterProps {
    isIndonesian?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isIndonesian = false }) => {
    const currentYear = new Date().getFullYear();

    const socialClass = "w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-[#C4B5A4] hover:bg-terracotta hover:text-paper transition-all duration-300 border border-white/10";

    return (
        <footer className="relative bg-espresso pt-16 pb-8 overflow-hidden">
            {/* Accent pattern: deep plum grounding with a low ember glow (third distinct blend) */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `
                        radial-gradient(90% 120% at 12% 118%, rgba(216,128,90,0.28) 0%, rgba(216,128,90,0) 52%),
                        radial-gradient(80% 110% at 92% 0%, rgba(93,122,153,0.30) 0%, rgba(93,122,153,0) 50%),
                        linear-gradient(180deg, #3B2E4A 0%, #322943 60%, #2A2338 100%)
                    `,
                }}
            ></div>
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-overlay"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
                    backgroundSize: '200px 200px',
                }}
            ></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">

                    {/* Brand */}
                    <div className="text-center md:text-left space-y-3">
                        <div className="flex items-center gap-2.5 justify-center md:justify-start">
                            <span className="grid place-items-center w-8 h-8 rounded-full border border-gold/40 text-gold-soft font-serif text-lg leading-none">
                                M
                            </span>
                            <span className="text-2xl font-serif font-semibold text-[#F7F0E6] tracking-tight">
                                Mayanov <span className="italic font-normal text-[#C4B5A4]">Tarot</span>
                            </span>
                        </div>

                        {isIndonesian ? (
                            <div className="flex items-center gap-2 text-sm text-[#C4B5A4] mt-1 justify-center md:justify-start">
                                <Clock className="w-4 h-4 text-gold-soft" />
                                <span>Waktu Layanan: 11:00 - 20.00</span>
                            </div>
                        ) : (
                            <p className="text-sm text-[#C4B5A4] max-w-xs leading-relaxed font-light">
                                Helping you find clarity in a chaotic world. Honest, kind, and strategic guidance.
                            </p>
                        )}
                    </div>

                    {/* Socials */}
                    <div className="flex gap-4">
                        <a
                            href="mailto:tarotreadingbymayanov@gmail.com"
                            onClick={() => trackEvent('contact', { method: 'Email', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'Email Lead', content_category: isIndonesian ? 'ID' : 'Global' })}
                            className={socialClass}
                            aria-label="Email"
                        >
                            <Mail className="w-5 h-5" />
                        </a>
                        <a
                            href="https://www.instagram.com/mayanov_/"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('view_item', { item_name: 'Instagram Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'Instagram', content_category: isIndonesian ? 'ID' : 'Global' })}
                            className={socialClass}
                            aria-label="Instagram"
                        >
                            <Instagram className="w-5 h-5" />
                        </a>
                        {isIndonesian && (
                            <>
                                <a
                                    href="https://www.tiktok.com/@mayanov_"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackEvent('view_item', { item_name: 'TikTok Profile', market: 'ID' }, 'ViewContent', { content_name: 'TikTok', content_category: 'ID' })}
                                    className={socialClass}
                                    aria-label="TikTok"
                                >
                                    <FaTiktok size={16} />
                                </a>
                                <a
                                    href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackEvent('contact', { method: 'WhatsApp', market: 'ID' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: 'ID' })}
                                    className={socialClass}
                                    aria-label="WhatsApp"
                                >
                                    <FaWhatsapp size={20} />
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-center md:justify-between items-center gap-4 text-xs text-[#8C7F72] tracking-wide">
                    <div>&copy; {currentYear} Mayanov Tarot. {isIndonesian ? "Hak Cipta Dilindungi." : "All Rights Reserved."}</div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
