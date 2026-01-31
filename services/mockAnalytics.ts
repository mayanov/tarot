
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
    clicks: number;
    revenuePotential: number; // Mock metric to show value
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

    // Mock Service Clicks based on your actual services
    const topServicesID: ServicePerformance[] = [
        { name: '3 Question Chat', clicks: 42, revenuePotential: 315000 * 42 },
        { name: 'New Year Reading 2026', clicks: 28, revenuePotential: 250000 * 28 },
        { name: 'Promo Beli 3 Dapat 5', clicks: 15, revenuePotential: 315000 * 15 },
        { name: '30-Min Call', clicks: 8, revenuePotential: 220000 * 8 },
        { name: '1 Question Chat', clicks: 35, revenuePotential: 140000 * 35 },
        { name: 'Meetup Session', clicks: 3, revenuePotential: 450000 * 3 },
    ];

    const topServicesGlobal: ServicePerformance[] = [
        { name: '5-Card Deep', clicks: 12, revenuePotential: 20 * 12 },
        { name: '3-Card Spread', clicks: 8, revenuePotential: 12 * 8 },
        { name: 'Live Call Session', clicks: 4, revenuePotential: 45 * 4 },
    ];

    return { dailyVisits, locations, devices, summary, topServicesID, topServicesGlobal };
};
