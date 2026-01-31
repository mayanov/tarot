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