
export interface DailyVisit {
    date: string;
    visits: number;      // Total
    visitsID: number;    // Indonesia
    visitsGlobal: number;// Others
}

export interface UserLocation {
    country: string;
    city: string;
    count: number;
}

export interface UserDevice {
    device: string;
    count: number;
}

export interface ServicePerformance {
    name: string;
    views: number;    // pricelist card opened
    clicks: number;   // "Pesan" clicked (booking form / WhatsApp opened)
    bookings: number; // booking form completed
    revenuePotential: number; // clicks × starting price
}

export interface AnalyticsSummary {
    totalVisits: number;
    avgDuration: string;
    bounceRate: string;
    activeNow: number;
}

// Helper to generate dates between two dates
const getDatesInRange = (startDate: Date, endDate: Date) => {
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// WhatsApp button clicks: in all, and per place on the site
export interface WhatsAppClicks {
    clicks: number;
    people: number;
    places: { place: string; clicks: number; people: number }[];
}

// The booking form per market: how many reached each step, and the payments that
// didn't go through (by reason)
export interface FormFunnel {
    steps: { step: string; label: string; count: number }[];
    issues: { reason: string; label: string; count: number }[];
}
export type FormFunnels = Record<'ID' | 'Global', FormFunnel>;

// The visit beyond the form, per market: the "Book" buttons pressed (and how many
// bookings came from visitors who pressed that one first), FAQ questions opened and how
// far down the page people got; plus the site-version switches (with the country).
export interface MarketJourney {
    books: { place: string; label: string; clicks: number; people: number; booked: number }[];
    faq: { question: string; opens: number; people: number }[];
    sections: { id: string; label: string; people: number }[];
}
export interface Journey {
    ID: MarketJourney;
    Global: MarketJourney;
    switches: { to: 'ID' | 'Global'; country: string; count: number; people: number }[];
}

// Mock Data Generator
// Now accepts optional start/end dates. Defaults to last 7 days.
export const getMockAnalyticsData = (startStr?: string, endStr?: string) => {
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    let endDate = new Date();

    if (startStr) startDate = new Date(startStr);
    if (endStr) endDate = new Date(endStr);

    const dates = getDatesInRange(startDate, endDate);

    const dailyVisits: DailyVisit[] = dates.map(date => {
        const idVisits = Math.floor(Math.random() * 30) + 5;
        const globalVisits = Math.floor(Math.random() * 20) + 5;
        return {
            date,
            visits: idVisits + globalVisits,
            visitsID: idVisits,
            visitsGlobal: globalVisits
        };
    });

    const locations: UserLocation[] = [
        { country: 'Indonesia', city: 'Jakarta', count: 145 },
        { country: 'Indonesia', city: 'Bali', count: 42 },
        { country: 'USA', city: 'New York', count: 25 },
        { country: 'Singapore', city: 'Singapore', count: 18 },
        { country: 'Australia', city: 'Sydney', count: 12 },
    ];

    const devices: UserDevice[] = [
        { device: 'Mobile', count: 65 },
        { device: 'Desktop', count: 30 },
        { device: 'Tablet', count: 5 },
    ];

    const summary: AnalyticsSummary = {
        totalVisits: dailyVisits.reduce((acc, curr) => acc + curr.visits, 0),
        avgDuration: '2m 14s',
        bounceRate: '42%',
        activeNow: Math.floor(Math.random() * 5) + 1,
    };

    // Mock service engagement (same services as the live pricelist)
    const topServicesID: ServicePerformance[] = [
        { name: 'Operation Happy Birthday', views: 64, clicks: 21, bookings: 0, revenuePotential: 0 },
        { name: 'Edisi Spesial', views: 30, clicks: 6, bookings: 2, revenuePotential: 250000 * 6 },
        { name: 'Konsultasi via Chat', views: 52, clicks: 14, bookings: 5, revenuePotential: 140000 * 14 },
        { name: 'Panggilan Suara & Video', views: 41, clicks: 9, bookings: 3, revenuePotential: 220000 * 9 },
        { name: 'Sesi Tatap Muka', views: 18, clicks: 3, bookings: 1, revenuePotential: 450000 * 3 },
    ];

    const topServicesGlobal: ServicePerformance[] = [
        { name: 'Operation Happy Birthday (Global)', views: 9, clicks: 2, bookings: 0, revenuePotential: 0 },
        { name: '3-Card Spread', views: 12, clicks: 4, bookings: 1, revenuePotential: 12 * 4 },
        { name: '5-Card Deep', views: 15, clicks: 5, bookings: 2, revenuePotential: 20 * 5 },
    ];

    const whatsapp: WhatsAppClicks = {
        clicks: 0, people: 0,
        places: [['Floating button', 14, 11], ['Menu', 6, 5], ['FAQ', 4, 4], ['Footer', 2, 2], ['Payment proof (after booking)', 3, 3]]
            .map(([place, clicks, people]) => ({ place: place as string, clicks: clicks as number, people: people as number })),
    };
    whatsapp.clicks = whatsapp.places.reduce((n, p) => n + p.clicks, 0);
    whatsapp.people = 22;

    const form: FormFunnels = {
        ID: {
            steps: [['open', 'Opened the form', 40], ['schedule', 'Picking a date & time', 22], ['details', 'Filling in their details', 25], ['review', 'At the payment step', 14], ['done', 'Booked', 8]]
                .map(([step, label, count]) => ({ step: step as string, label: label as string, count: count as number })),
            issues: [{ reason: 'closed', label: 'Closed the payment window without paying', count: 4 }, { reason: 'slot_taken', label: 'Slot taken while they were booking', count: 1 }],
        },
        Global: {
            steps: [['open', 'Opened the form', 18], ['schedule', 'Picking a date & time', 0], ['details', 'Filling in their details', 15], ['review', 'At the payment step', 9], ['done', 'Booked', 5]]
                .map(([step, label, count]) => ({ step: step as string, label: label as string, count: count as number })),
            issues: [{ reason: 'closed', label: 'Closed the payment window without paying', count: 3 }, { reason: 'declined', label: 'Card or payment declined', count: 1 }],
        },
    };

    const sec = (n: number[]) => [['hero', 'Hero'], ['about', 'About'], ['tarot-intro', 'What a reading is'], ['services', 'Readings & prices'], ['interlude', 'How it works'], ['why-choose', 'Why choose'], ['testimonials', 'Testimonials'], ['events', 'Events'], ['faq', 'FAQ'], ['end', 'Bottom of the page']]
        .map(([id, label], i) => ({ id, label, people: n[i] }));
    const journey: Journey = {
        ID: {
            books: [{ place: 'card', label: 'A reading card (scrolled to it)', clicks: 30, people: 22, booked: 4 }, { place: 'hero', label: 'Hero button', clicks: 18, people: 16, booked: 3 }, { place: 'nav', label: 'Top bar “Book”', clicks: 9, people: 8, booked: 1 }, { place: 'interlude', label: '“How it works” button', clicks: 4, people: 4, booked: 0 }],
            faq: [{ question: 'Apakah ramalan tarot itu akurat?', opens: 12, people: 10 }, { question: 'Bagaimana cara pembayaran?', opens: 7, people: 6 }],
            sections: sec([120, 104, 90, 76, 60, 52, 45, 38, 30, 21]),
        },
        Global: {
            books: [{ place: 'hero', label: 'Hero button', clicks: 10, people: 9, booked: 2 }, { place: 'card', label: 'A reading card (scrolled to it)', clicks: 8, people: 7, booked: 2 }],
            faq: [{ question: 'Is tarot reading accurate?', opens: 5, people: 5 }],
            sections: sec([60, 50, 41, 33, 25, 21, 18, 14, 11, 7]),
        },
        switches: [{ to: 'ID', country: 'Indonesia', count: 6, people: 5 }, { to: 'Global', country: 'Indonesia', count: 2, people: 2 }, { to: 'ID', country: 'Singapore', count: 1, people: 1 }],
    };

    return { dailyVisits, locations, devices, summary, topServicesID, topServicesGlobal, whatsapp, form, journey };
};
