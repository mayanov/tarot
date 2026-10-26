
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

    return { dailyVisits, locations, devices, summary, topServicesID, topServicesGlobal };
};
