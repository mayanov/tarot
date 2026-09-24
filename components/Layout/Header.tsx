import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { smoothScrollTo, smoothScrollToId } from '../UI/scroll';

interface HeaderProps {
  isIndonesian?: boolean;
  onSwitchRegion?: (toID: boolean) => void;
}

const REGIONS = {
  global: { flag: '🌐', name: 'Global', sub: 'English · USD' },
  id: { flag: '🇮🇩', name: 'Indonesia', sub: 'Bahasa · IDR' },
} as const;

// Region switcher: a two-segment toggle with a sliding white thumb.
const RegionSwitcher: React.FC<{ isIndonesian: boolean; onSwitch: (toID: boolean) => void }> = ({ isIndonesian, onSwitch }) => {
  const options = [['global', false], ['id', true]] as const;
  return (
    <div
      role="group"
      aria-label="Site version"
      className="relative flex items-center p-0.5 rounded-full border border-cream/20 bg-cream/[0.05]"
    >
      {/* sliding thumb — glides under the active segment */}
      <span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-cream shadow-[0_8px_20px_-12px_rgba(0,0,0,0.6)] transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: isIndonesian ? 'translateX(100%)' : 'translateX(0)' }}
      />
      {options.map(([key, toID]) => {
        const r = REGIONS[key];
        const active = toID === isIndonesian;
        return (
          <button
            key={key}
            onClick={() => onSwitch(toID)}
            aria-pressed={active}
            title={`Switch to the ${r.name} version`}
            className={`relative z-10 flex items-center justify-center gap-2 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${active ? 'text-ink' : 'text-cream/55 hover:text-cream/80'}`}
          >
            <span className={`text-base leading-none transition-[filter,opacity] duration-300 ${active ? '' : 'grayscale opacity-70'}`}>{r.flag}</span>
            {r.name}
          </button>
        );
      })}
    </div>
  );
};

interface NavItem {
  name: string;
  id: string;
  children?: { name: string; id: string }[];
}

const Header: React.FC<HeaderProps> = ({ isIndonesian = false, onSwitchRegion }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock scroll while the menu overlay is open; close on Escape.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'unset';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    const found = smoothScrollToId(id, 80);
    if (!found) window.location.href = `/#${id}`;
  };

  const handleLogoClick = () => {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      smoothScrollTo(0);
    } else {
      window.location.href = '/';
    }
  };

  const navLinks: NavItem[] = [
    { name: isIndonesian ? 'Tentang' : 'About', id: 'about' },
    {
      name: isIndonesian ? 'Layanan' : 'Services',
      id: 'services',
      children: isIndonesian ? [
        { name: 'Edisi Spesial', id: 'service-special' },
        { name: 'Chat', id: 'service-chat' },
        { name: 'Call/Video Call', id: 'service-call' },
        { name: 'Meetup', id: 'service-meetup' }
      ] : undefined
    },
    { name: isIndonesian ? 'Kenapa Mayanov?' : 'Values', id: 'why-choose' },
    { name: isIndonesian ? 'Testimony' : 'Reviews', id: 'testimonials' },
    { name: isIndonesian ? 'Events & Collaborations' : 'Track Record', id: 'events' },
    { name: isIndonesian ? 'FAQ' : 'FAQ', id: 'faq' },
  ];

  // Brand mark — badge always; full wordmark eases in once scrolled.
  const Wordmark = () => (
    <div className="flex items-center gap-2.5 cursor-pointer group whitespace-nowrap" onClick={handleLogoClick}>
      <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full border border-cream/40 text-cream font-serif text-lg leading-none transition-colors duration-300 group-hover:bg-cream group-hover:text-ink">
        M
      </span>
      <span className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled ? 'max-w-[220px]' : 'max-w-0'}`}>
        <span className="pl-0.5 text-lg font-serif font-bold uppercase tracking-tight text-cream">
          Mayanov <span className="text-cream/55">Tarot</span>
        </span>
      </span>
    </div>
  );

  return (
    <>
      <header className={`fixed left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'top-2 md:top-3' : 'top-3 md:top-5'}`}>
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12">
          <div
            className={`relative flex justify-between items-center gap-3 rounded-full pl-4 pr-2 py-2 border transition-all duration-300 ${isScrolled
                ? 'bg-[#0C0C0D]/85 backdrop-blur-xl border-white/10 shadow-[0_16px_44px_-26px_rgba(0,0,0,0.6)]'
                : 'bg-[#0C0C0D]/55 backdrop-blur-md border-white/10'
              }`}
          >
            {/* LEFT — brand */}
            <div className="shrink-0">
              <Wordmark />
            </div>

            {/* RIGHT — Book Now + Menu trigger */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-booking'))}
                className="hidden sm:inline-flex px-5 py-2.5 rounded-full bg-cream text-ink text-sm font-semibold hover:bg-white transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap shadow-[0_14px_36px_-18px_rgba(0,0,0,0.7)]"
              >
                {isIndonesian ? 'Pesan Sekarang' : 'Book Now'}
              </button>

              <button
                onClick={() => setMenuOpen(true)}
                aria-label={isIndonesian ? 'Buka menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className="group inline-flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-full text-cream hover:bg-white/[0.06] transition-colors duration-200"
              >
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Menu</span>
                <span className="flex flex-col items-end gap-[3px] w-4">
                  <span className="block h-px w-4 bg-cream transition-all duration-300 group-hover:w-4" />
                  <span className="block h-px w-2.5 bg-cream transition-all duration-300 group-hover:w-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen editorial menu overlay */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        style={{ background: 'linear-gradient(180deg, #0C0C0D 0%, #050505 100%)' }}
        aria-hidden={!menuOpen}
      >
        {/* faint moonstone bloom, low — the only whisper of colour */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 60% at 78% 108%, rgba(198,178,228,0.10) 0%, transparent 60%)' }} />

        <div className="relative h-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 flex flex-col">
          {/* Top row — brand + close */}
          <div className="flex items-center justify-between py-5 md:py-7 shrink-0">
            <Wordmark />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label={isIndonesian ? 'Tutup menu' : 'Close menu'}
              className="group inline-flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-full text-cream hover:bg-white/[0.06] transition-colors duration-200"
            >
              <span className="text-[11px] uppercase tracking-[0.2em] font-medium">{isIndonesian ? 'Tutup' : 'Close'}</span>
              <span className="relative block w-4 h-4">
                <span className="absolute top-1/2 left-0 h-px w-4 bg-cream -translate-y-1/2 rotate-45" />
                <span className="absolute top-1/2 left-0 h-px w-4 bg-cream -translate-y-1/2 -rotate-45" />
              </span>
            </button>
          </div>

          {/* Center — the links */}
          <nav
            key={menuOpen ? 'open' : 'closed'}
            className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center py-6"
          >
            <ul className="w-full">
              {navLinks.map((link, i) => (
                <li
                  key={link.name}
                  className={menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'}
                  style={{ animationDelay: `${i * 70 + 120}ms` }}
                >
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="group w-full flex items-baseline gap-4 md:gap-7 py-2.5 md:py-3 text-left border-b border-white/[0.07]"
                  >
                    <span className="font-serif text-xs md:text-sm tabular-nums text-cream/35 w-7 shrink-0 pt-1">
                      0{i + 1}
                    </span>
                    <span className="flex-1 font-elegant font-medium text-cream/80 group-hover:text-cream text-[2rem] sm:text-[2.8rem] md:text-[3.6rem] leading-[1.05] tracking-[-0.02em] transition-all duration-300 group-hover:translate-x-1.5">
                      {link.name}
                    </span>
                    <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8 text-cream/30 self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </button>

                  {/* Services sub-links (ID) */}
                  {link.children && (
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pl-11 md:pl-[4.4rem] pt-2 pb-1">
                      {link.children.map(child => (
                        <button
                          key={child.name}
                          onClick={() => scrollToSection(child.id)}
                          className="text-xs md:text-sm uppercase tracking-[0.14em] text-cream/45 hover:text-cream transition-colors"
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom — region toggle + contact/CTA */}
          <div className="shrink-0 py-5 md:py-7 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {onSwitchRegion && (
                <RegionSwitcher isIndonesian={isIndonesian} onSwitch={onSwitchRegion} />
              )}
            </div>

            <div className="flex items-center gap-5">
              <a
                href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] uppercase tracking-[0.2em] text-cream/55 hover:text-cream transition-colors"
              >
                WhatsApp
              </a>
              <a
                href="https://www.instagram.com/mayanov_/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] uppercase tracking-[0.2em] text-cream/55 hover:text-cream transition-colors"
              >
                Instagram
              </a>
              <button
                onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('open-booking')); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cream text-ink text-sm font-semibold hover:bg-white transition-all duration-300 hover:-translate-y-0.5"
              >
                {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
