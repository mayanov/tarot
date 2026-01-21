import React from 'react';
import { Mail, Instagram, Moon, Clock } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';

interface FooterProps {
    isIndonesian?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isIndonesian = false }) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-bg-deep pt-16 pb-8 overflow-hidden border-t border-white/5">
            {/* Decorative background gradient to break up the plain black */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0F0F16] to-[#1A1A27] -z-20"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-lilac/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">

                    {/* Brand */}
                    <div className="text-center md:text-left space-y-3">
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            <div className="p-1.5 rounded-full bg-lilac/10 border border-lilac/20">
                                <Moon className="w-5 h-5 text-lilac" />
                            </div>
                            <span className="text-2xl font-bold text-white font-serif tracking-wide">Mayanov Tarot</span>
                        </div>

                        {isIndonesian ? (
                            <div className="flex items-center gap-2 text-sm text-text-subtle mt-1 justify-center md:justify-start">
                                <Clock className="w-4 h-4 text-lilac" />
                                <span>Waktu Layanan: 11:00 - 20.00</span>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                                Helping you find clarity in a chaotic world. Honest, kind, and strategic guidance.
                            </p>
                        )}
                    </div>

                    {/* Socials */}
                    <div className="flex gap-4">
                        <a
                            href="mailto:tarotreadingbymayanov@gmail.com"
                            onClick={() => trackEvent('contact', { method: 'Email', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'Email Lead', content_category: isIndonesian ? 'ID' : 'Global' })}
                            className="w-10 h-10 rounded-full bg-[#1E1E2E] flex items-center justify-center text-gray-400 hover:bg-lilac hover:text-white transition-all duration-300 border border-white/10"
                            aria-label="Email"
                        >
                            <Mail className="w-5 h-5" />
                        </a>
                        <a
                            href="https://www.instagram.com/mayanov_/"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('view_item', { item_name: 'Instagram Profile', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'Instagram', content_category: isIndonesian ? 'ID' : 'Global' })}
                            className="w-10 h-10 rounded-full bg-[#1E1E2E] flex items-center justify-center text-gray-400 hover:bg-lilac hover:text-white transition-all duration-300 border border-white/10"
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
                                    className="w-10 h-10 rounded-full bg-[#1E1E2E] flex items-center justify-center text-gray-400 hover:bg-[#00f2ea] hover:text-black transition-all duration-300 border border-white/10"
                                    aria-label="TikTok"
                                >
                                    <FaTiktok size={16} />
                                </a>
                                <a
                                    href="https://wa.me/6282122042079?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackEvent('contact', { method: 'WhatsApp', market: 'ID' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: 'ID' })}
                                    className="w-10 h-10 rounded-full bg-[#1E1E2E] flex items-center justify-center text-gray-400 hover:bg-[#25D366] hover:text-white transition-all duration-300 border border-white/10"
                                    aria-label="WhatsApp"
                                >
                                    <FaWhatsapp size={20} />
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-center md:justify-between items-center gap-4 text-xs text-gray-600 tracking-wide">
                    <div>&copy; {currentYear} Mayanov Tarot. {isIndonesian ? "Hak Cipta Dilindungi." : "All Rights Reserved."}</div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;