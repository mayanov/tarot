import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Layout/Header';
import Hero from './components/Sections/Hero';
import About from './components/Sections/About';
import WhyChoose from './components/Sections/WhyChoose';
import TarotIntro from './components/Sections/TarotIntro';
import Footer from './components/Layout/Footer';
import Loader from './components/Layout/Loader';
import BookingModal from './components/Booking/BookingModal';
import { trackEvent, setUserProperties, trackPageView } from './services/analytics';
import { initLenis, destroyLenis, initParallax, destroyParallax, smoothScrollTo, smoothScrollToId } from './components/UI/scroll';
import { ArrowUp, RefreshCw } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

// Lazy Load below-the-fold components
const Services = React.lazy(() => import('./components/Sections/Services'));
const Interlude = React.lazy(() => import('./components/Sections/Interlude'));
const Events = React.lazy(() => import('./components/Sections/Events'));
const FAQ = React.lazy(() => import('./components/Sections/FAQ'));
const Disclaimer = React.lazy(() => import('./components/Sections/Disclaimer'));
const AnalyticsDashboard = React.lazy(() => import('./components/Dashboard/AnalyticsDashboard'));
const AdminLogin = React.lazy(() => import('./components/Admin/AdminLogin'));
const NotFound = React.lazy(() => import('./components/Layout/NotFound'));


// Helper to fetch with timeout
const fetchWithTimeout = async (url: string, timeout = 2500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

function App() {
  const [isIndonesian, setIsIndonesian] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeoError, setIsGeoError] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isDevOverride, setIsDevOverride] = useState<boolean>(false);

  // Footer "scroll-reveal": the footer is pinned behind the page; the content gets a
  // bottom margin equal to the footer's height, so scrolling to the end slides the
  // content up and uncovers the footer.
  const footerRef = useRef<HTMLDivElement>(null);
  const footerInnerRef = useRef<HTMLDivElement>(null);
  const footerSkyRef = useRef<HTMLDivElement>(null);
  const [footerH, setFooterH] = useState(0);
  // The footer's sky photo is the biggest image on the page but only seen at the very
  // bottom — fetch it a couple of seconds after the hero is up, not during start-up.
  const [footerSkyOn, setFooterSkyOn] = useState(false);
  useEffect(() => {
    let t: number | undefined;
    const later = () => { t = window.setTimeout(() => setFooterSkyOn(true), 2000); };
    window.addEventListener('mt:reveal', later, { once: true });
    const fallback = window.setTimeout(() => setFooterSkyOn(true), 9000);
    return () => { window.removeEventListener('mt:reveal', later); if (t) clearTimeout(t); clearTimeout(fallback); };
  }, []);
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const measure = () => setFooterH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [isIndonesian, isLoading]);

  // Animate the footer as it's uncovered: its content rises + fades into place and
  // the sky behind it parallaxes a touch — so the reveal doesn't feel plain.
  useEffect(() => {
    if (reduceMotion || footerH <= 0) return;
    let raf = 0;
    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const rp = Math.min(Math.max((window.scrollY - (maxScroll - footerH)) / footerH, 0), 1);
      const e = rp * rp * (3 - 2 * rp); // smoothstep
      if (footerInnerRef.current) {
        footerInnerRef.current.style.transform = `translateY(${((1 - e) * 64).toFixed(1)}px)`;
        footerInnerRef.current.style.opacity = (0.12 + e * 0.88).toFixed(3);
      }
      if (footerSkyRef.current) {
        footerSkyRef.current.style.transform = `scale(1.1) translateY(${((1 - e) * -26).toFixed(1)}px)`;
      }
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [reduceMotion, footerH]);

  // Define location check as a reusable function so we can retry from UI
  const performLocationCheck = async () => {
    setIsLoading(true);
    setIsGeoError(false);

    try {
      const params = new URLSearchParams(window.location.search);

      // 0. MANUAL REGION OVERRIDE (user picked a version via the switcher)
      // Highest priority so their choice sticks across reloads, in dev and prod.
      // An explicit ?geo= param still wins for testing.
      const regionOverride = localStorage.getItem('region_override');
      if (regionOverride && !params.has('geo')) {
        const isID = regionOverride === 'id';
        console.log(`[GEO] Using manual region override: ${isID ? 'Indonesia' : 'Global'}`);
        setIsIndonesian(isID);
        setIsLoading(false);
        setUserProperties({
          country: isID ? 'Indonesia (Manual)' : 'Global (Manual)',
          source: 'manual_override'
        });
        trackPageView({
          page_path: isID ? '/id' : '/en',
          page_title: isID ? 'Mayanov Tarot (Indonesia)' : 'Mayanov Tarot (Global)'
        });
        return;
      }

      // 1. CHECK CACHE FIRST
      const cachedCountry = localStorage.getItem('user_country');
      if (cachedCountry && !params.has('geo') && !import.meta.env.DEV) {
        console.log(`[GEO] Using cached location: ${cachedCountry}`);
        const isID = cachedCountry === 'ID';
        setIsIndonesian(isID);
        setIsLoading(false);
        setUserProperties({
          country: isID ? 'Indonesia (Cached)' : (cachedCountry || 'Global (Cached)'),
          source: 'cache'
        });
        trackPageView({
          page_path: isID ? '/id' : '/en',
          page_title: isID ? 'Mayanov Tarot (Indonesia)' : 'Mayanov Tarot (Global)'
        });
        return;
      }

      // 2. SIMULATION MODES
      if (params.get('simulate_geo_error') === 'true') {
        throw new Error("Simulated Geo Error");
      }

      if (import.meta.env.DEV || params.has('geo')) {
        const geoParam = params.get('geo');
        if (geoParam === 'id' || geoParam === 'global') {
          const isID = geoParam === 'id';
          console.log(`[DEV MODE] 🔒 Overriding location to: ${isID ? 'Indonesia' : 'Global'}`);
          setIsIndonesian(isID);
          setIsDevOverride(true);
          setUserProperties({ country: isID ? 'Indonesia (Dev)' : 'Global (Dev)', status: 'DEV_OVERRIDE' });
          trackPageView({
            page_path: isID ? '/id' : '/en',
            page_title: isID ? 'Mayanov Tarot (Indonesia)' : 'Mayanov Tarot (Global)'
          });
          setIsLoading(false);
          return;
        }
      }

      // 3. REAL LOCATION CHECK (Waterfall)
      let countryCode = '';
      let city = '';
      let source = '';

      // Attempt 1: get.geojs.io
      try {
        console.log('Attempting GeoJS...');
        const data = await fetchWithTimeout('https://get.geojs.io/v1/ip/geo.json', 2500);
        countryCode = data.country_code;
        city = data.city;
        source = 'geojs';
      } catch (e) {
        console.warn('GeoJS failed, trying ipapi.co...');
        // Attempt 2: ipapi.co
        try {
          const data = await fetchWithTimeout('https://ipapi.co/json/', 2500);
          countryCode = data.country_code; // ipapi uses country_code
          city = data.city;
          source = 'ipapi';
        } catch (e2) {
          console.warn('ipapi.co failed, trying ip-api.com...');
          // Attempt 3: ipwho.is (Backup 2 - HTTPS enabled)
          try {
            // ipwho.is returns 'country_code'
            const data = await fetchWithTimeout('https://ipwho.is/', 2500);
            if (!data.success) throw new Error("ipwho.is failed");
            countryCode = data.country_code;
            city = data.city;
            source = 'ipwhois';
          } catch (e3) {
            console.error('All Geo providers failed.');
            throw new Error("All Geo Providers Failed");
          }
        }
      }

      // Process Success
      const isID = countryCode === 'ID';
      setIsIndonesian(isID);

      // Cache the result
      localStorage.setItem('user_country', countryCode || 'Global');

      console.log(`[GEO] Detected: ${countryCode} via ${source}`);
      setUserProperties({
        country: isID ? 'Indonesia' : (countryCode || 'Global'),
        city: city || 'Unknown',
        source: source
      });
      // Send Virtual Page View to distinguish traffic in Dashboard
      trackPageView({
        page_path: isID ? '/id' : '/en',
        page_title: isID ? 'Mayanov Tarot (Indonesia)' : 'Mayanov Tarot (Global)'
      });

    } catch (error) {
      console.error("Critical Location Failure:", error);
      setIsGeoError(true);
      trackEvent('error', { type: 'geo_failure' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const v = window.scrollY > 500;
      setShowBackToTop((prev) => (prev === v ? prev : v));
    };

    // Handle Payment Redirects
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get('payment_success');
    if (successParam === '3card' || successParam === '5card') {
      setTimeout(() => { window.location.href = `/thankyou-page-${successParam}.html`; }, 500);
    }

    performLocationCheck();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth inertia scrolling (Lenis) + global background parallax for the whole page.
  useEffect(() => {
    initLenis();
    initParallax();
    return () => { destroyLenis(); destroyParallax(); };
  }, []);

  // Handle Hash Navigation after Loading
  useEffect(() => {
    if (!isLoading && window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        smoothScrollToId(id, 80);
      }, 500);
    }
  }, [isLoading]);

  const scrollToTop = () => {
    smoothScrollTo(0);
  };

  // Let the visitor switch between the Global and Indonesian versions.
  // Persists the choice so it sticks on reload; updates live without a full reload.
  const handleSwitchRegion = (toID: boolean) => {
    if (toID === isIndonesian) return;
    try {
      localStorage.setItem('region_override', toID ? 'id' : 'global');
      localStorage.setItem('user_country', toID ? 'ID' : 'Global');
    } catch { /* ignore storage errors */ }
    setIsIndonesian(toID);
    trackEvent(
      'select_content',
      { content_type: 'region_switch', item_id: toID ? 'ID' : 'Global' },
      'ViewContent',
      { content_name: 'Region Switch', content_category: toID ? 'ID' : 'Global' }
    );
    trackPageView({
      page_path: toID ? '/id' : '/en',
      page_title: toID ? 'Mayanov Tarot (Indonesia)' : 'Mayanov Tarot (Global)'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ------------------------------------------------------------
  // 1. ADMIN / DASHBOARD ROUTING (Bypasses Geo Check)
  // ------------------------------------------------------------
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      if (localStorage.getItem('admin_session') !== 'true') return false;
      // Only stay "logged in" while the JWT is still present and unexpired,
      // otherwise the dashboard shows but every admin API call 401s.
      const tok = localStorage.getItem('authToken');
      if (!tok) return false;
      const payload = JSON.parse(atob(tok.split('.')[1]));
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });
  const path = window.location.pathname;

  // Legacy query param support
  const params = new URLSearchParams(window.location.search);
  const isDashboardMode = params.get('dashboard') === 'true' || path === '/admin';

  if (isDashboardMode) {
    const handleAdminLogin = () => {
      localStorage.setItem('admin_session', 'true');
      setIsAdminLoggedIn(true);
    };

    const handleAdminLogout = async () => {
      const base = import.meta.env.DEV ? 'http://localhost:3001' : '';
      try {
        await fetch(`${base}/api/logout`, { method: 'POST', credentials: 'include' });
      } catch (e) {
        console.error("Logout failed", e);
      }
      localStorage.removeItem('authToken');
      localStorage.removeItem('admin_session');
      setIsAdminLoggedIn(false);
      // Optional: Reset other states if needed, but unmounting Dashboard does it.
    };

    // If authenticating for admin
    if (path === '/admin' && !isAdminLoggedIn) {
      return (
        <React.Suspense fallback={<div className="min-h-screen bg-bg-dark" />}>
          <AdminLogin onLogin={handleAdminLogin} />
        </React.Suspense>
      );
    }
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-bg-dark" />}>
        <AnalyticsDashboard onLogout={handleAdminLogout} />
      </React.Suspense>
    );
  }

  // ------------------------------------------------------------
  // 2. MAIN APP LOGIC (Geo Checks only happen here)
  // ------------------------------------------------------------
  if (isGeoError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-ink p-4 text-center">
        <div className="bg-paper p-8 rounded-2xl border border-ink/10 max-w-md shadow-[0_24px_60px_-30px_rgba(42,35,32,0.4)]">
          <div className="mx-auto mb-4 w-12 h-16 border-2 border-terracotta rounded-lg flex items-center justify-center relative bg-terracotta/10 animate-float">
            <div className="w-8 h-12 border border-terracotta/50 rounded-sm flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
          </div>
          <h2 className="text-2xl font-serif font-medium mb-2 text-ink">Something Went Wrong</h2>
          <p className="text-ink/60 mb-6 font-light">
            We encountered an issue loading the page. Please check your connection and try again.
          </p>
          <button
            onClick={performLocationCheck}
            className="px-6 py-3 rounded-full bg-terracotta text-paper font-medium hover:bg-terracotta-dark transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // 3. 404 NOT FOUND CHECK
  // ------------------------------------------------------------
  // We only allow root /, /index.html, and /admin (handled above).
  // Everything else is a 404.
  // Note: Anchors (#section) do not change pathname.
  const isNotFound = !['/', '/index.html'].includes(path) && !path.endsWith('.html');

  if (isNotFound) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-cream" />}>
        <NotFound isIndonesian={isIndonesian} />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen relative font-sans text-cream selection:bg-ink/20">
      <Loader ready={!isLoading} isIndonesian={isIndonesian} />

      <Header isIndonesian={isIndonesian} onSwitchRegion={handleSwitchRegion} />

      {/* DEV MODE INDICATOR */}
      {isDevOverride && (
        <div className="fixed bottom-4 left-4 z-[9999] bg-red-600 text-white px-4 py-2 rounded-md shadow-lg text-xs font-bold font-mono pointer-events-none opacity-80">
          DEV MODE: {isIndonesian ? 'INDONESIA' : 'GLOBAL'} VIEW
        </div>
      )}

      <main className="relative z-10 bg-paper" style={{ marginBottom: footerH }}>
        <Hero isIndonesian={isIndonesian} />
        <About isIndonesian={isIndonesian} />
        <TarotIntro isIndonesian={isIndonesian} />

        <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-white/20">Loading...</div>}>
          <Services isIndonesian={isIndonesian} />
          {/* Dark cosmic pull-quote as a deliberate break between the pricelist and
              the "why" section — so two white panels never touch, and WhyChoose rises
              over a dark section (its rounded-corner peek reveals sky, not a notch). */}
          <Interlude isIndonesian={isIndonesian} />
          <WhyChoose isIndonesian={isIndonesian} />
          <Events isIndonesian={isIndonesian} />
          {/* FAQ + Disclaimer share ONE white ground and ONE soft wash so there's no
              seam between them — the two sections themselves are transparent. */}
          <div className="relative isolate overflow-hidden">
            <FAQ isIndonesian={isIndonesian} />
            <Disclaimer isIndonesian={isIndonesian} />
          </div>
        </React.Suspense>
      </main>

      {/* Night-sky Footer, PINNED behind the page (scroll-reveal): the content above
          has a bottom margin equal to this footer's height, so scrolling to the end
          slides the page up and uncovers the footer sitting here. */}
      <div
        ref={footerRef}
        className="fixed bottom-0 inset-x-0 z-0 isolate overflow-hidden rounded-t-[2.25rem] md:rounded-t-[3.5rem]"
      >
        {/* the sky photo spanning the whole region (same sky as the hero — bookends the page) */}
        <div
          ref={footerSkyRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 will-change-transform"
          style={{
            backgroundImage: footerSkyOn ? `url(${import.meta.env.BASE_URL}sky-hero.jpg)` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'scale(1.1)',
          }}
        />
        {/* legibility veil so cream text stays readable over the brighter nebula */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'linear-gradient(180deg, rgba(16,16,40,0.56) 0%, rgba(16,16,40,0.42) 48%, rgba(16,16,40,0.54) 100%)' }}
        />

        <div ref={footerInnerRef} className="relative p-3 sm:p-5 md:p-8 will-change-transform" style={reduceMotion ? undefined : { opacity: 0.12 }}>
          <Footer isIndonesian={isIndonesian} />
        </div>
      </div>

      <BookingModal isIndonesian={isIndonesian} />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4 items-end">
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="p-3 rounded-lg bg-ink/30 backdrop-blur-md text-cream/70 hover:text-cream hover:bg-ink/55 transition-all duration-300 border border-cream/15 hover:-translate-y-1"
            title="Back to Top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        {/* WhatsApp Floating Button */}
        {isIndonesian && (
          <a
            href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('contact', { method: 'WhatsApp', market: 'ID' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: 'ID' })}
            className="p-3 rounded-full bg-[#25D366] text-white shadow-[0_0_15px_rgba(37,211,102,0.4)] hover:bg-[#20bd5a] hover:scale-110 transition-all duration-300 flex items-center justify-center"
            title="Chat on WhatsApp"
          >
            <FaWhatsapp size={24} />
          </a>
        )}
      </div>
    </div>
  );
}

export default App;