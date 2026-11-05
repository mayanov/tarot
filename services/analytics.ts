// Type definitions for global analytics objects
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        fbq: (...args: any[]) => void;
    }
}

// Global store for user properties to ensure they are sent with every event
let globalUserProperties: Record<string, any> = {};

/**
 * Sets global user properties that will be attached to all subsequent events.
 * Also sends a 'set user_properties' command to GA4.
 */
export const setUserProperties = (properties: Record<string, any>) => {
    globalUserProperties = { ...globalUserProperties, ...properties };

    if (typeof window !== 'undefined') {
        // Google Analytics 4 User Properties
        if (window.gtag) {
            window.gtag('set', 'user_properties', properties);
        }
        // Facebook Pixel doesn't have a standard "User Property" set command 
        // that persists automatically without Advanced Matching, 
        // so we manually merge these into event params in trackEvent below.
    }
};

/**
 * Tracks a Page View event
 */
export const trackPageView = (params?: Record<string, any>) => {
    trackEvent('page_view', params, 'PageView', params);
};

/**
 * Tracks an event to both Google Analytics 4 and Facebook Pixel
 * Automatically includes global user properties.
 * 
 * @param eventName - The GA4 event name (e.g., 'initiate_checkout', 'contact')
 * @param gaParams - Parameters for the GA4 event (e.g., { item_name: '...' })
 * @param pixelEventName - The Facebook Pixel event name (e.g., 'InitiateCheckout', 'Contact')
 * @param pixelParams - Parameters for the Facebook Pixel event (e.g., { value: 12.00, currency: 'USD' })
 */
export const trackEvent = (
    eventName: string,
    gaParams?: Record<string, any>,
    pixelEventName?: string,
    pixelParams?: Record<string, any>
) => {
    if (typeof window !== 'undefined') {
        // Merge global properties with specific event parameters
        const finalGaParams = { ...gaParams, ...globalUserProperties };
        const finalPixelParams = { ...pixelParams, ...globalUserProperties };

        // Google Analytics 4
        if (window.gtag) {
            // Check if this is an ecommerce-like event with 'item_name'
            // If so, we must structure it as { items: [{ item_name: ... }] } 
            // for the standard 'itemName' dimension to populate in reports.
            if (finalGaParams.item_name) {
                const { item_name, value, currency, ...otherParams } = finalGaParams;

                const ecommerceParams = {
                    ...otherParams,
                    value: value,
                    currency: currency,
                    items: [{
                        item_name: item_name,
                        // Include other item-level properties if present in top-level
                        // (Mapping common ones for safety)
                        brand: 'Mayanov Tarot',
                        category: finalGaParams.content_category || 'Service'
                    }]
                };
                window.gtag('event', eventName, ecommerceParams);
            } else {
                window.gtag('event', eventName, finalGaParams);
            }
        }

        // Facebook Pixel
        if (window.fbq && pixelEventName) {
            window.fbq('track', pixelEventName, finalPixelParams);
        }
    }
};
// WhatsApp clicks, one event wherever the button is: GA4 'contact' (method WhatsApp)
// with the place it was clicked from, so the dashboard can count them per place. The
// place goes in link_text too: that's a built-in GA4 dimension (linkText), so it can
// be reported without registering a custom one. The Pixel's Contact goes only with
// the "get in touch" buttons, not the promo's or the payment proof's (those are part
// of buying, already counted as checkout).
export type WhatsAppPlace = 'floating' | 'menu' | 'footer' | 'faq' | 'promo' | 'payment_proof';
export const WHATSAPP_PLACES: Record<WhatsAppPlace, string> = {
    floating: 'Floating button',
    menu: 'Menu',
    footer: 'Footer',
    faq: 'FAQ',
    promo: 'Promo card',
    payment_proof: 'Payment proof (after booking)',
};
export const trackWhatsApp = (place: WhatsAppPlace, market: 'ID' | 'Global') => {
    const pixel = place !== 'promo' && place !== 'payment_proof';
    trackEvent(
        'contact',
        { method: 'WhatsApp', market, location: place, link_text: place },
        pixel ? 'Contact' : undefined,
        { content_name: 'WhatsApp Chat', content_category: market, location: place },
    );
};

// The booking form, step by step: one event per step reached (once per opening of the
// form), so the dashboard can show where people stop. Each step has its own event
// name (eventName is a built-in GA4 dimension) and the market goes in link_text (also
// built in), so none of it needs a custom dimension registered in GA4. GA4 only.
export type FormStep = 'open' | 'schedule' | 'details' | 'review' | 'done';
export const FORM_STEPS: [FormStep, string][] = [
    ['open', 'Opened the form'],
    ['schedule', 'Picking a date & time'],
    ['details', 'Filling in their details'],
    ['review', 'At the payment step'],
    ['done', 'Booked'],
];
export const trackFormStep = (step: FormStep, market: 'ID' | 'Global', service?: string) =>
    trackEvent(`form_${step}`, { market, service, link_text: market });

// Payments that didn't go through, and why. link_text carries "market:reason" (see above).
export type PaymentIssue = 'closed' | 'declined' | 'failed' | 'slot_taken' | 'not_opened' | 'save_failed';
export const PAYMENT_ISSUES: Record<PaymentIssue, string> = {
    closed: 'Closed the payment window without paying',
    declined: 'Card or payment declined',
    failed: 'Payment failed or expired',
    slot_taken: 'Slot taken while they were booking',
    not_opened: 'Payment couldn’t open',
    save_failed: 'Paid, but the booking didn’t save',
};
export const trackPaymentIssue = (reason: PaymentIssue, method: 'PayPal' | 'Midtrans' | 'Manual', market: 'ID' | 'Global') =>
    trackEvent('payment_issue', { reason, method, market, link_text: `${market}:${reason}` });

// The item_name each service is tracked under (pricelist card opens, "Pesan"
// clicks and finished bookings all use the same name, so the admin's Service
// Engagement table can line them up). Keyed by the booking form's service id.
export const SERVICE_TRACK_NAME: Record<string, string> = {
    special: 'Edisi Spesial',
    chat: 'Konsultasi via Chat',
    call: 'Panggilan Suara & Video',
    meetup: 'Sesi Tatap Muka',
    '3card': '3-Card Spread',
    '5card': '5-Card Deep',
    live: 'Live Session',
};
// The birthday promo appears in both markets; the global one gets its own name.
// Prefixed so it doesn't mix with the old pricelist (still on the live site),
// which sends plain 'Operation Happy Birthday' without any card-open step.
export const promoTrackName = (isIndonesian: boolean) =>
    isIndonesian ? 'Promo · Operation Happy Birthday' : 'Promo · Operation Happy Birthday (Global)';

// Where bookings start: every "Book" button sends 'book_click' with its place, and the
// first one pressed in a visit is remembered, so a finished booking can say where that
// visitor began ('booked_via'). link_text carries "market:place" (built-in dimension).
export type BookPlace = 'hero' | 'nav' | 'menu' | 'menu_reading' | 'card' | 'interlude' | 'footer';
export const BOOK_PLACES: Record<BookPlace | 'none', string> = {
    hero: 'Hero button',
    nav: 'Top bar “Book”',
    menu: 'Menu “Book a Reading”',
    menu_reading: 'A reading in the menu',
    card: 'A reading card (scrolled to it)',
    interlude: '“How it works” button',
    footer: 'Footer button',
    none: 'No button recorded',
};
const FIRST_BOOK_KEY = 'mt_first_book';
let firstBook: BookPlace | null = null;
export const trackBookClick = (place: BookPlace, market: 'ID' | 'Global') => {
    if (!firstBook) {
        try { firstBook = (sessionStorage.getItem(FIRST_BOOK_KEY) as BookPlace) || null; } catch { /* storage blocked */ }
        if (!firstBook) {
            firstBook = place;
            try { sessionStorage.setItem(FIRST_BOOK_KEY, place); } catch { /* storage blocked */ }
        }
    }
    trackEvent('book_click', { market, location: place, link_text: `${market}:${place}` });
};
export const trackBookedVia = (market: 'ID' | 'Global') => {
    let place: string | null = firstBook;
    if (!place) { try { place = sessionStorage.getItem(FIRST_BOOK_KEY); } catch { /* storage blocked */ } }
    trackEvent('booked_via', { market, location: place || 'none', link_text: `${market}:${place || 'none'}` });
};

// FAQ questions opened (not the one shown open by default). link_text "market:question",
// cut to GA's 100-character limit.
export const trackFaqOpen = (question: string, market: 'ID' | 'Global') =>
    trackEvent('faq_open', { market, link_text: `${market}:${question}`.slice(0, 100) });

// Site-version switches: link_text "ID>Global" / "Global>ID"; the report pairs it with
// the visitor's country (built in), so it shows when the location guess was wrong.
export const trackRegionSwitch = (toID: boolean, where: 'bar' | 'menu') =>
    trackEvent('region_switch', { where, link_text: toID ? 'Global>ID' : 'ID>Global' });

// How far down the page people get: one 'section_view' per section per page load,
// link_text "market:section".
export const PAGE_SECTIONS: [string, string][] = [
    ['hero', 'Hero'],
    ['about', 'About'],
    ['tarot-intro', 'What a reading is'],
    ['services', 'Readings & prices'],
    ['interlude', 'How it works'],
    ['why-choose', 'Why choose'],
    ['testimonials', 'Testimonials'],
    ['events', 'Events'],
    ['faq', 'FAQ'],
    ['end', 'Bottom of the page'],
];
export const trackSectionView = (section: string, market: 'ID' | 'Global') =>
    trackEvent('section_view', { market, link_text: `${market}:${section}` });
