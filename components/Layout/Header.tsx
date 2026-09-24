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

// Region switcher: a two-segment toggle with a sliding white thumb (used in the overlay).
const RegionSwitcher: React.FC<{ isIndonesian: boolean; onSwitch: (toID: boolean) => void }> = ({ isIndonesian, onSwitch }) => {
  const options = [['global', false], ['id', true]] as const;
  return (
    <div
      role="group"
      aria-label="Site version"
      className="relative flex w-full max-w-[16rem] items-center p-0.5 rounded-full border border-cream/20 bg-cream/[0.05]"
    >
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
            className={`relative z-10 flex-1 basis-0 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${active ? 'text-ink' : 'text-cream/55 hover:text-cream/80'}`}
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
    handleScroll();
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

  // The floating bar has no container; its text/marks flip from cream (over the
  // dark hero) to ink once a light frosted scrim fades in on scroll.
  const dark = !isScrolled; // cream marks over the hero
  const markText = dark ? 'text-cream' : 'text-ink';

  // Brand mark — badge always; full wordmark eases in once scrolled.
  const Wordmark: React.FC<{ onDark?: boolean }> = ({ onDark = dark }) => (
    <div className="flex items-center gap-2.5 cursor-pointer group whitespace-nowrap" onClick={handleLogoClick}>
      <span className={`grid place-items-center w-8 h-8 shrink-0 rounded-full border font-serif text-lg leading-none transition-colors duration-300 ${onDark ? 'border-cream/40 text-cream group-hover:bg-cream group-hover:text-ink' : 'border-ink/30 text-ink group-hover:bg-ink group-hover:text-cream'}`}>
        M
      </span>
      <span className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled || menuOpen ? 'max-w-[220px]' : 'max-w-0'}`}>
        <span className={`pl-0.5 text-lg font-serif font-bold uppercase tracking-tight ${onDark ? 'text-cream' : 'text-ink'}`}>
          Mayanov <span className={onDark ? 'text-cream/55' : 'text-ink/45'}>Tarot</span>
        </span>
      </span>
    </div>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        {/* frosted scrim — fades in only once scrolled, keeps text legible over white */}
        <div className={`absolute inset-0 transition-opacity duration-300 bg-white/70 backdrop-blur-xl border-b border-black/[0.06] ${isScrolled && !menuOpen ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 flex justify-between items-center py-4 md:py-5">
          {/* LEFT — brand (hidden while the overlay owns the top row) */}
          <div className={`transition-opacity duration-200 ${menuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Wordmark />
          </div>

          {/* RIGHT — Book Now + Menu trigger */}
          <div className={`flex items-center gap-4 md:gap-6 transition-opacity duration-200 ${menuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-booking'))}
              className={`hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 hover:-translate-y-0.5 ${dark ? 'bg-cream text-ink hover:bg-white' : 'bg-ink text-cream hover:bg-black'}`}
            >
              {isIndonesian ? 'Pesan Sekarang' : 'Book Now'}
            </button>

            <button
              onClick={() => setMenuOpen(true)}
              aria-label={isIndonesian ? 'Buka menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className={`group inline-flex items-center gap-2.5 transition-colors duration-300 ${markText}`}
            >
              <span className="text-[11px] uppercase tracking-[0.22em] font-medium">Menu</span>
              <span className="flex flex-col items-end gap-[4px] w-5">
                <span className={`block h-px w-5 transition-all duration-300 ${dark ? 'bg-cream' : 'bg-ink'}`} />
                <span className={`block h-px w-3 group-hover:w-5 transition-all duration-300 ${dark ? 'bg-cream' : 'bg-ink'}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen editorial menu overlay */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        style={{ background: 'linear-gradient(180deg, #0C0C0D 0%, #050505 100%)' }}
        aria-hidden={!menuOpen}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(55% 55% at 82% 110%, rgba(198,178,228,0.09) 0%, transparent 62%)' }} />

        <div className="relative h-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 flex flex-col">
          {/* Top row — brand + close */}
          <div className="flex items-center justify-between py-4 md:py-5 shrink-0">
            <Wordmark onDark />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label={isIndonesian ? 'Tutup menu' : 'Close menu'}
              className="group inline-flex items-center gap-2.5 text-cream"
            >
              <span className="text-[11px] uppercase tracking-[0.22em] font-medium">{isIndonesian ? 'Tutup' : 'Close'}</span>
              <span className="relative block w-4 h-4">
                <span className="absolute top-1/2 left-0 h-px w-4 bg-cream -translate-y-1/2 rotate-45 transition-transform duration-300 group-hover:rotate-[135deg]" />
                <span className="absolute top-1/2 left-0 h-px w-4 bg-cream -translate-y-1/2 -rotate-45 transition-transform duration-300 group-hover:rotate-[45deg]" />
              </span>
            </button>
          </div>

          {/* Main — links (left) + meta panel (right) */}
          <div key={menuOpen ? 'open' : 'closed'} className="flex-1 min-h-0 overflow-y-auto grid lg:grid-cols-12 gap-y-12 lg:gap-x-16 items-center py-8">
            {/* Links */}
            <nav className="lg:col-span-8">
              <ul className="group/nav">
                {navLinks.map((link, i) => (
                  <li
                    key={link.name}
                    className={`${menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'} transition-opacity duration-300 lg:group-hover/nav:opacity-35 lg:hover:!opacity-100`}
                    style={{ animationDelay: `${i * 65 + 120}ms` }}
                  >
                    <button
                      onClick={() => scrollToSection(link.id)}
                      className="group/link w-full flex items-center gap-4 py-1.5 md:py-2 text-left"
                    >
                      <span className="flex-1 font-elegant font-medium text-cream text-[2.1rem] sm:text-[3rem] md:text-[3.8rem] leading-[1.08] tracking-[-0.025em] transition-transform duration-300 group-hover/link:translate-x-2">
                        <span className="align-super text-[0.62rem] md:text-xs font-serif tabular-nums text-cream/35 mr-3 md:mr-4">0{i + 1}</span>
                        {link.name}
                      </span>
                      <ArrowUpRight className="w-7 h-7 md:w-9 md:h-9 text-cream shrink-0 opacity-0 -translate-x-3 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-300" />
                    </button>

                    {/* Services quick-links (ID) */}
                    {link.children && (
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 pl-9 md:pl-11 pt-1 pb-2">
                        {link.children.map(child => (
                          <button
                            key={child.name}
                            onClick={() => scrollToSection(child.id)}
                            className="text-[0.7rem] md:text-xs uppercase tracking-[0.16em] text-cream/40 hover:text-cream transition-colors"
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

            {/* Meta panel */}
            <div className={`lg:col-span-4 lg:col-start-9 flex flex-col gap-8 ${menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'}`} style={{ animationDelay: '520ms' }}>
              {onSwitchRegion && (
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.22em] text-cream/40 mb-3">{isIndonesian ? 'Versi Situs' : 'Site Version'}</p>
                  <RegionSwitcher isIndonesian={isIndonesian} onSwitch={onSwitchRegion} />
                </div>
              )}

              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.22em] text-cream/40 mb-3">{isIndonesian ? 'Terhubung' : 'Get in Touch'}</p>
                <div className="flex flex-col gap-2">
                  <a href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading" target="_blank" rel="noopener noreferrer" className="w-fit text-sm text-cream/75 hover:text-cream transition-colors">WhatsApp</a>
                  <a href="https://www.instagram.com/mayanov_/" target="_blank" rel="noopener noreferrer" className="w-fit text-sm text-cream/75 hover:text-cream transition-colors">Instagram</a>
                  <a href="https://www.tiktok.com/@mayanov_" target="_blank" rel="noopener noreferrer" className="w-fit text-sm text-cream/75 hover:text-cream transition-colors">TikTok</a>
                </div>
              </div>

              <button
                onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('open-booking')); }}
                className="inline-flex items-center justify-between gap-3 w-full sm:w-auto lg:w-full px-6 py-3.5 rounded-full bg-cream text-ink text-sm font-semibold hover:bg-white transition-all duration-300 hover:-translate-y-0.5"
              >
                {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom — footnote */}
          <div className="shrink-0 py-4 md:py-5 border-t border-white/[0.08] flex items-center justify-between text-[0.68rem] uppercase tracking-[0.2em] text-cream/40">
            <span>{isIndonesian ? 'Sejak 2009 · Jakarta Selatan' : 'Since 2009 · South Jakarta'}</span>
            <span className="hidden sm:inline">{isIndonesian ? '11:00 – 20:00' : 'Daily 11:00 – 20:00'}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
