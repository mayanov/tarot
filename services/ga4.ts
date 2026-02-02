import { DailyVisit, UserLocation, UserDevice, AnalyticsSummary, ServicePerformance } from './mockAnalytics';

// Types for Google API
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

const DISCOVERY_DOCS = ['https://analyticsdata.googleapis.com/$discovery/rest?version=v1beta'];
const SCOPES = 'https://www.googleapis.com/auth/analytics.readonly';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// 1. Initialize API Client
export const initGoogleAPI = (clientId: string) => {
    return new Promise<boolean>((resolve, reject) => {
        // Determine if scripts are loaded
        const checkScripts = setInterval(() => {
            if (typeof window.gapi !== 'undefined' && typeof window.google !== 'undefined') {
                clearInterval(checkScripts);
                loadGapi(clientId, resolve);
            }
        }, 100);
    });
};

const loadGapi = (clientId: string, resolve: (val: boolean) => void) => {
    window.gapi.load('client', async () => {
        await window.gapi.client.init({
            discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;

        // Init Identity Service for Auth
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: '', // defined at request time
        });
        gisInited = true;
        resolve(true);
    });
};

// 2. Trigger Login (with Persistence)
export const loginToGoogle = () => {
    return new Promise<void>((resolve, reject) => {
        if (!gisInited) return reject("Google API not initialized. Enter Client ID first.");

        // 1. Check in-memory token first
        const existingToken = window.gapi.client.getToken();
        if (existingToken && existingToken.access_token) {
            resolve();
            return;
        }

        // 2. Check localStorage for persisted token
        const storedToken = localStorage.getItem('google_access_token');
        const storedExpiry = localStorage.getItem('google_token_expiry');
        const now = Date.now();

        if (storedToken && storedExpiry && now < parseInt(storedExpiry)) {
            // Restore token
            window.gapi.client.setToken({ access_token: storedToken });
            resolve();
            return;
        }

        // 3. Request new token if none found or expired
        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                reject(resp);
                return;
            }

            // Save token to localStorage (expires in 50 minutes to be safe, standard is 1h)
            if (resp.access_token) {
                // Manually set token just in case, though client usually does it
                // Note: gapi client does it automatically via internal callback, but we can double check
                localStorage.setItem('google_access_token', resp.access_token);
                localStorage.setItem('google_token_expiry', (Date.now() + 50 * 60 * 1000).toString());
            }

            resolve();
        };

        // Try silent prompt if possible, otherwise standard
        // Note: prompt: '' might still show account chooser if not signed in to browser. 
        // But preventing 'consent' force is key.
        tokenClient.requestAccessToken({ prompt: '' });
    });
};

// 3. Fetch Real Data
// 4. Update the Server code first? No, I can't edit the previous tool call.
// I will update the Server file again in the next step to support batchRunReports.

// This tool call is for ga4.ts
// I will implement a fetchFromBackend switch.

// Helper to process reports (Shared by Backend and Frontend)
const processReports = (reports: any[]) => {
    // --- Process Report 0: Daily Visits with Page Path Segmentation ---
    const dailyDataMap = new Map<string, { visits: number, visitsID: number, visitsGlobal: number }>();
    const rows0 = reports[0].rows || [];

    rows0.forEach((row: any) => {
        const dateRaw = row.dimensionValues[0].value; // YYYYMMDD
        const formattedDate = `${dateRaw.substring(4, 6)}/${dateRaw.substring(6, 8)}`; // MM/DD
        const pagePath = row.dimensionValues[1].value;
        const sessions = parseInt(row.metricValues[0].value);

        if (!dailyDataMap.has(formattedDate)) {
            dailyDataMap.set(formattedDate, { visits: 0, visitsID: 0, visitsGlobal: 0 });
        }

        const current = dailyDataMap.get(formattedDate)!;
        current.visits += sessions;

        // LOGIC: Check Country (Server) or Virtual Path (Fallback)
        const dimVal = pagePath.toLowerCase();
        if (dimVal === 'indonesia' || dimVal.includes('/id') || dimVal.includes('indonesia')) {
            current.visitsID += sessions;
        } else {
            current.visitsGlobal += sessions; // Default to global if not explicitly ID
        }
    });

    // Convert Map to Array and Sort by Date
    const dailyVisits: DailyVisit[] = Array.from(dailyDataMap.entries())
        .map(([date, counts]) => ({ date, ...counts, unique: 0 }))
        .sort((a, b) => a.date.localeCompare(b.date));


    // --- Process Report 1: Locations ---
    const locations: UserLocation[] = reports[1].rows
        ?.map((row: any) => ({
            country: row.dimensionValues[0].value,
            city: row.dimensionValues[1].value,
            count: parseInt(row.metricValues[0].value)
        }))
        .filter((loc: UserLocation) =>
            loc.city !== '(not set)' &&
            loc.country !== '(not set)' &&
            loc.city !== ''
        ) || [];

    // --- Process Report 2: Devices ---
    const devices: UserDevice[] = reports[2].rows?.map((row: any) => ({
        device: row.dimensionValues[0].value,
        count: parseInt(row.metricValues[0].value)
    })) || [];

    // --- Process Report 3: Summary ---
    const summaryMetric = reports[3].rows?.[0]?.metricValues || [];
    const totalVisits = parseInt(summaryMetric[0]?.value || '0');
    const totalEngagement = parseFloat(summaryMetric[1]?.value || '0');
    const activeUsers = parseInt(summaryMetric[3]?.value || '1'); // Avoid div by zero
    const avgSecs = activeUsers > 0 ? totalEngagement / activeUsers : 0;
    const avgDuration = `${Math.floor(avgSecs / 60)}m ${Math.floor(avgSecs % 60)}s`;
    const bounceRate = `${(parseFloat(summaryMetric[2]?.value || '0') * 100).toFixed(1)}%`;

    const summary: AnalyticsSummary = {
        totalVisits,
        avgDuration,
        bounceRate,
        activeNow: 1 // Realtime not fetched in this batch
    };

    // --- Process Report 4: Service Clicks ---
    const eventRows = reports[4].rows || [];

    const servicesIDMap = new Map<string, number>();
    const servicesGlobalMap = new Map<string, number>();

    // Exact string match keys (must match 'item_name' sent in tracking events)
    const ID_KEYS = [
        "New Year Reading 2026", "Promo Beli 3 Dapat 5", "3 Question Chat",
        "1 Question Chat", "30-Min Call", "60-Min Call", "Meetup Session"
    ];
    const GLOBAL_KEYS = [
        "3-Card Reading", "5-Card Reading", "Live Call Session"
    ];

    // Friendly Display Name Mappings (User asked for specific display names)
    const DISPLAY_NAMES: Record<string, string> = {
        "New Year Reading 2026": "New Year Reading",
        "Promo Beli 3 Dapat 5": "Buy 3 Get 5",
        "3 Question Chat": "3 Question Chat",
        "1 Question Chat": "1 Question Chat",
        "30-Min Call": "30 Mins Call",
        "60-Min Call": "60 Mins Call",
        "Meetup Session": "Meetup Session",
        "3-Card Reading": "3 Cards Reading",
        "5-Card Reading": "5 Cards Reading",
        "Live Call Session": "Call"
    };

    // Initialize counts with 0
    Object.values(DISPLAY_NAMES).forEach(name => {
        if (Object.values(ID_KEYS).includes(Object.keys(DISPLAY_NAMES).find(key => DISPLAY_NAMES[key] === name)!)) servicesIDMap.set(name, 0);
        // Simplified initialization logic below is better
    });

    // Re-Initialize properly (easier to just clear and re-set)
    servicesIDMap.clear();
    servicesGlobalMap.clear();
    ID_KEYS.forEach(k => servicesIDMap.set(DISPLAY_NAMES[k], 0));
    GLOBAL_KEYS.forEach(k => servicesGlobalMap.set(DISPLAY_NAMES[k], 0));

    eventRows.forEach((row: any) => {
        // [itemName] - Updated layout as 'eventName' removed from server dimensions
        const itemName = row.dimensionValues[0]?.value || '';
        const count = parseInt(row.metricValues[0].value);

        if (itemName && itemName !== '(not set)') {
            if (ID_KEYS.includes(itemName)) {
                const displayName = DISPLAY_NAMES[itemName];
                servicesIDMap.set(displayName, (servicesIDMap.get(displayName) || 0) + count);
            } else if (GLOBAL_KEYS.includes(itemName)) {
                const displayName = DISPLAY_NAMES[itemName];
                servicesGlobalMap.set(displayName, (servicesGlobalMap.get(displayName) || 0) + count);
            }
        }
    });

    // Price Mapping (for revenue potential)
    const PRICES: Record<string, number> = {
        "New Year Reading": 250000,
        "Buy 3 Get 5": 315000,
        "3 Question Chat": 315000,
        "1 Question Chat": 140000,
        "30 Mins Call": 220000,
        "60 Mins Call": 360000,
        "Meetup Session": 450000,
        "3 Cards Reading": 12,
        "5 Cards Reading": 20,
        "Call": 45
    };

    const topServicesID: ServicePerformance[] = Array.from(servicesIDMap.entries()).map(([name, clicks]) => ({
        name,
        clicks,
        revenuePotential: clicks * (PRICES[name] || 0)
    })).sort((a, b) => b.clicks - a.clicks);

    const topServicesGlobal: ServicePerformance[] = Array.from(servicesGlobalMap.entries()).map(([name, clicks]) => ({
        name,
        clicks,
        revenuePotential: clicks * (PRICES[name] || 0)
    })).sort((a, b) => b.clicks - a.clicks);

    return { dailyVisits, locations, devices, summary, topServicesID, topServicesGlobal };
};

// 3. Fetch Real Data (Backend or Frontend)
export const fetchGA4Data = async (
    propertyId: string,
    startDate: string,
    endDate: string
): Promise<{
    dailyVisits: DailyVisit[];
    locations: UserLocation[];
    devices: UserDevice[];
    summary: AnalyticsSummary;
    topServicesID: ServicePerformance[];
    topServicesGlobal: ServicePerformance[];
}> => {

    // Check if Backend Server is available (Try fetching from it)
    try {
        // In local dev, use localhost. In prod (Vercel), use relative path.
        const baseUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';
        const backendUrl = `${baseUrl}/api/analytics`;

        console.log("GA4: Attempting to fetch from Backend Server...", backendUrl);
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${backendUrl}?startDate=${startDate}&endDate=${endDate}&propertyId=${propertyId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            if (res.status === 401) throw new Error("Unauthorized: Invalid API Key");
            throw new Error("Backend server invalid response");
        }

        const responseData = await res.json();
        // Determine if it's the Node.js client format or GAPI format.
        // The Node.js client `batchRunReports` returns { reports: [...] } inside the first element of the array usually.
        // Let's assume I correct the server to return exactly what GAPI returns: `response.result` equivalent.

        const reports = responseData.reports;
        if (!reports) throw new Error("Invalid backend format");

        // ... Reuse the processing logic ... 
        // To reuse logic without massive copy-paste, I should extract the processing function.
        // For now, I will proceed with the assumption that I will update the SERVER to return the exact shape matches.

        return processReports(reports);

    } catch (e) {
        console.warn("Backend fetch failed, falling back to Client-Side (Popup) mode...", e);
        // Fallback to original GAPI logic
        return fetchGA4DataClientSide(propertyId, startDate, endDate);
    }
};

// Original Client-Side Logic fallback
const fetchGA4DataClientSide = async (propertyId: string, startDate: string, endDate: string) => {
    // Batch Request to run multiple reports at once
    const batchRequest = {
        requests: [
            // 0: Daily Visits Trend
            {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'date' }, { name: 'pagePath' }],
                metrics: [{ name: 'sessions' }],
                orderBys: [{ dimension: { orderType: 'ALPHANUMERIC', dimensionName: 'date' } }]
            },
            // 1: Locations
            {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'country' }, { name: 'city' }],
                metrics: [{ name: 'activeUsers' }],
                limit: 10,
                orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
            },
            // 2: Device Categories
            {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: 'activeUsers' }],
                orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
            },
            // 3: Summary Totals
            {
                dateRanges: [{ startDate, endDate }],
                metrics: [
                    { name: 'sessions' },
                    { name: 'averageSessionDuration' },
                    { name: 'bounceRate' },
                    { name: 'active28DayUsers' }
                ]
            },
            // 4: Event Tracking
            {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'eventName' }, { name: 'itemName' }],
                metrics: [{ name: 'eventCount' }],
                dimensionFilter: {
                    filter: {
                        fieldName: 'eventName',
                        inListFilter: { values: ['initiate_checkout', 'begin_checkout', 'schedule', 'view_item'] }
                    }
                }
            }
        ]
    };

    try {
        console.log("GA4: Requesting batchRunReports (Client-Side) with propertyId:", propertyId);

        const response = await window.gapi.client.analyticsdata.properties.batchRunReports({
            property: `properties/${propertyId}`,
            resource: batchRequest
        });

        console.log("GA4: Metrics Response (Client):", response);

        const reports = response.result.reports;
        if (!reports || reports.length === 0) throw new Error("No data returned from GA4");

        return processReports(reports);

    } catch (e: any) {
        console.error("GA4 Data Fetch Error (Raw):", e);
        if (e.result && e.result.error) {
            console.error("GA4 API Error Details:", JSON.stringify(e.result.error, null, 2));
        }
        throw e;
    }
};

