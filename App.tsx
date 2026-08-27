import React, { useState, useEffect } from 'react';
import Background from './components/Layout/Background';
import Header from './components/Layout/Header';
import Hero from './components/Sections/Hero';
import About from './components/Sections/About';
import WhyChoose from './components/Sections/WhyChoose';
import Footer from './components/Layout/Footer';
import { trackEvent, setUserProperties, trackPageView } from './services/analytics';
import { initLenis, destroyLenis, smoothScrollTo, smoothScrollToId } from './components/UI/scroll';
import { Moon, ArrowUp, RefreshCw } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

// Lazy Load below-the-fold components
const Services = React.lazy(() => import('./components/Sections/Services'));
const Testimonials = React.lazy(() => import('./components/Sections/Testimonials'));
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
      setShowBackToTop(window.scrollY > 500);
    };

    // Handle Payment Redirects
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get('payment_success');
    if (successParam === '3card' || successParam === '5card') {
      setTimeout(() => { window.location.href = `/thankyou-page-${successParam}.html`; }, 500);
    }

    performLocationCheck();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth inertia scrolling (Lenis) for the whole page.
  useEffect(() => {
    initLenis();
    return () => destroyLenis();
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
      return localStorage.getItem('admin_session') === 'true';
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
      try {
        await fetch('http://localhost:3001/api/logout', { method: 'POST' });
        localStorage.removeItem('authToken');
      } catch (e) {
        console.error("Logout failed", e);
      }
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
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-ink">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Moon className="w-10 h-10 text-coral animate-spin-slow" strokeWidth={1.5} />
          <span className="text-xs tracking-[0.3em] uppercase text-taupe">Loading...</span>
        </div>
      </div>
    );
  }

  if (isGeoError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-ink p-4 text-center">
        <div className="bg-surface-1 p-8 rounded-2xl border border-line max-w-md shadow-[0_24px_60px_-30px_rgba(42,35,32,0.4)]">
          <div className="mx-auto mb-4 w-12 h-16 border-2 border-terracotta rounded-lg flex items-center justify-center relative bg-terracotta/10 animate-float">
            <div className="w-8 h-12 border border-terracotta/50 rounded-sm flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
          </div>
          <h2 className="text-2xl font-serif font-medium mb-2 text-ink">Something Went Wrong</h2>
          <p className="text-ink-soft mb-6 font-light">
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
      <React.Suspense fallback={<div className="min-h-screen bg-bg-dark" />}>
        <NotFound isIndonesian={isIndonesian} />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen relative font-sans text-ink selection:bg-coral/25">
      <Background />

      <Header isIndonesian={isIndonesian} onSwitchRegion={handleSwitchRegion} />

      {/* DEV MODE INDICATOR */}
      {isDevOverride && (
        <div className="fixed bottom-4 left-4 z-[9999] bg-red-600 text-white px-4 py-2 rounded-md shadow-lg text-xs font-bold font-mono pointer-events-none opacity-80">
          DEV MODE: {isIndonesian ? 'INDONESIA' : 'GLOBAL'} VIEW
        </div>
      )}

      <main className="relative z-10">
        <Hero isIndonesian={isIndonesian} />
        <About isIndonesian={isIndonesian} />

        <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-white/20">Loading...</div>}>
          <Services isIndonesian={isIndonesian} />
          <WhyChoose isIndonesian={isIndonesian} />
          <Testimonials isIndonesian={isIndonesian} />
          <Events isIndonesian={isIndonesian} />
          <FAQ isIndonesian={isIndonesian} />
          <Disclaimer isIndonesian={isIndonesian} />
        </React.Suspense>
      </main>

      <div className="relative z-10">
        <Footer isIndonesian={isIndonesian} />
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4 items-end">
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="p-3 rounded-full bg-surface-1 text-terracotta shadow-[0_10px_30px_-12px_rgba(42,35,32,0.5)] hover:bg-terracotta hover:text-paper transition-all duration-300 border border-line hover:-translate-y-1"
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