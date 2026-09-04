import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, Check } from 'lucide-react';
import { smoothScrollTo, smoothScrollToId } from '../UI/scroll';

interface HeaderProps {
  isIndonesian?: boolean;
  onSwitchRegion?: (toID: boolean) => void;
}

const REGIONS = {
  global: { flag: '🌐', name: 'Global', sub: 'English · USD' },
  id: { flag: '🇮🇩', name: 'Indonesia', sub: 'Bahasa · IDR' },
} as const;

// Desktop region selector: shows the current version and lets the visitor switch.
const RegionSwitcher: React.FC<{ isIndonesian: boolean; onSwitch: (toID: boolean) => void; onDark?: boolean }> = ({ isIndonesian, onSwitch, onDark = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = isIndonesian ? REGIONS.id : REGIONS.global;
  const choose = (toID: boolean) => { onSwitch(toID); setOpen(false); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Currently viewing the ${current.name} version — click to switch`}
        className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full border text-sm font-medium transition-colors ${onDark ? 'border-cream/30 text-cream hover:border-cream/60' : 'border-line text-ink hover:border-coral/50'}`}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden xl:inline">{current.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${onDark ? 'text-cream/70' : 'text-taupe'} ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-surface-1 border border-line rounded-xl shadow-xl overflow-hidden p-1.5 z-50" role="listbox">
          <p className="px-3 pt-1.5 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-taupe">Choose your version</p>
          {([['global', false], ['id', true]] as const).map(([key, toID]) => {
            const r = REGIONS[key];
            const active = toID === isIndonesian;
            return (
              <button
                key={key}
                onClick={() => choose(toID)}
                role="option"
                aria-selected={active}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${active ? 'bg-paper-2' : 'hover:bg-paper-2'}`}
              >
                <span className="text-lg leading-none">{r.flag}</span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-ink">{r.name}</span>
                  <span className="block text-xs text-taupe">{r.sub}</span>
                </span>
                {active && <Check className="w-4 h-4 text-terracotta shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false); // For mobile expand

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const found = smoothScrollToId(id, 80);
    if (!found) {
      // If element not found (e.g. on 404 page), redirect to home with hash
      window.location.href = `/#${id}`;
    }
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

  // The whole page is dark, so the header always uses cream ink; scrolled it gets a translucent frosted bar (same tint as the category chips).
  const onDark = true;

  const Wordmark = () => (
    <div className="flex items-center gap-2.5 cursor-pointer group whitespace-nowrap" onClick={handleLogoClick}>
      <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full border border-coral/50 text-coral font-serif text-lg leading-none transition-colors duration-300 group-hover:bg-coral group-hover:text-ink">
        M
      </span>
      <span className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled ? 'max-w-[220px]' : 'max-w-0'}`}>
        <span className="pl-0.5 text-lg font-serif font-bold uppercase tracking-tight text-coral">
          Mayanov <span className="text-transparent [-webkit-text-stroke:1px_#FFFFFF]">Tarot</span>
        </span>
      </span>
    </div>
  );

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'top-2 md:top-3' : 'top-3 md:top-5'}`}
      >
        <div className="max-w-[1280px] xl:max-w-[1400px] mx-auto px-4 md:px-6">
          <div
            className={`relative flex justify-between items-center gap-3 rounded-full pl-4 pr-2 py-2 transition-all duration-300 ${isScrolled
                ? 'bg-plum-deep/75 backdrop-blur-xl shadow-[0_22px_50px_-24px_rgba(0,0,0,0.75)]'
                : 'bg-white/[0.06] backdrop-blur-md shadow-[0_12px_34px_-22px_rgba(0,0,0,0.55)]'
              }`}
          >
            {/* LEFT — brand badge (always) + nav links */}
            <div className="flex items-center min-w-0">
              <div className="mr-2 lg:mr-4 shrink-0">
                <Wordmark />
              </div>

              <nav className="hidden lg:flex items-center gap-0.5">
                {navLinks.map((link, i) => (
                  <div
                    key={link.name}
                    className="relative group/menu animate-[navSlide_0.5s_cubic-bezier(0.22,1,0.36,1)_both]"
                    style={{ animationDelay: `${i * 70 + 150}ms` }}
                  >
                    <button
                      onClick={() => scrollToSection(link.id)}
                      className="flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium tracking-wide whitespace-nowrap text-cream/85 hover:text-cream hover:bg-white/10 transition-colors duration-200"
                    >
                      {link.name}
                      {link.children && <ChevronDown className="w-3 h-3 group-hover/menu:rotate-180 transition-transform duration-200" />}
                    </button>

                    {link.children && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 transform translate-y-2 group-hover/menu:translate-y-0 w-48">
                        <div className="bg-plum-deep/90 border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_24px_50px_-24px_rgba(0,0,0,0.8)] overflow-hidden p-2 flex flex-col gap-0.5">
                          {link.children.map(child => (
                            <button
                              key={child.name}
                              onClick={(e) => { e.stopPropagation(); scrollToSection(child.id); }}
                              className="text-left px-4 py-2 text-sm text-cream/75 hover:text-cream hover:bg-white/10 rounded-lg transition-colors"
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* RIGHT — region switcher + Book Now */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              {onSwitchRegion && (
                <RegionSwitcher isIndonesian={isIndonesian} onSwitch={onSwitchRegion} onDark={onDark} />
              )}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-booking'))}
                className="px-5 py-2.5 rounded-full bg-coral text-ink text-sm font-semibold hover:bg-coral-deep hover:text-cream transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap"
              >
                {isIndonesian ? 'Pesan Sekarang' : 'Book Now'}
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            {!isMobileMenuOpen && (
              <button
                className="lg:hidden transition p-2 text-cream hover:text-coral"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-cream/98 backdrop-blur-2xl z-[60] flex flex-col items-center justify-start pt-28 transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
          }`}
      >
        <button
          className="absolute top-6 right-4 text-ink hover:text-coral transition p-2 bg-paper-2 rounded-full"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="w-7 h-7" />
        </button>

        <div className="flex flex-col space-y-4 text-center p-4 w-full max-w-sm overflow-y-auto max-h-[calc(100vh-100px)]">
          <div className="mb-2 shrink-0">
            <span className="grid place-items-center w-14 h-14 mx-auto rounded-full border border-coral/40 text-coral font-serif text-2xl">
              M
            </span>
          </div>

          {/* Region switcher (mobile) */}
          {onSwitchRegion && (
            <div className="shrink-0 mb-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-taupe mb-2">
                {isIndonesian ? 'Versi Situs' : 'Site Version'}
              </p>
              <div className="flex gap-1 p-1 bg-paper-2 rounded-full border border-line">
                {([['global', false], ['id', true]] as const).map(([key, toID]) => {
                  const r = REGIONS[key];
                  const active = toID === isIndonesian;
                  return (
                    <button
                      key={key}
                      onClick={() => { onSwitchRegion(toID); setIsMobileMenuOpen(false); }}
                      aria-pressed={active}
                      className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${active ? 'bg-coral text-cream shadow-[0_8px_20px_-12px_rgba(216,128,90,0.9)]' : 'text-ink'}`}
                    >
                      <span className="mr-1.5">{r.flag}</span>{r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {navLinks.map((link, idx) => (
            <div key={link.name} className="flex flex-col w-full">
              <button
                onClick={() => {
                  if (link.children) {
                    setIsServicesOpen(!isServicesOpen);
                  } else {
                    scrollToSection(link.id);
                  }
                }}
                className={`text-2xl font-serif text-ink hover:text-coral transition-colors flex items-center justify-center gap-2 ${link.children ? 'mb-2' : ''}`}
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                {link.name}
                {link.children && <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} />}
              </button>

              {link.children && (
                <div className={`flex flex-col gap-3 bg-paper-2 rounded-xl overflow-hidden transition-all duration-300 ${isServicesOpen ? 'max-h-64 py-4 mb-4' : 'max-h-0 py-0'}`}>
                  {link.children.map(child => (
                    <button
                      key={child.name}
                      onClick={() => scrollToSection(child.id)}
                      className="text-base text-taupe hover:text-coral"
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new CustomEvent('open-booking')); }}
            className="mt-4 px-10 py-4 rounded-full bg-coral text-ink font-semibold text-lg hover:bg-coral-deep hover:text-cream transition shrink-0"
          >
            {isIndonesian ? 'Pesan Pembacaan' : 'Book a Reading'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;
