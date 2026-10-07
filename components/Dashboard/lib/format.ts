// Shared formatting + price-parsing helpers for the admin dashboard.
// These were previously copy-pasted into Sales/Customers/Revenue/Bookings; this is
// the single source of truth so a pricing or date-format fix lands everywhere at once.
import { Booking } from '../../../services/booking';

export type Cur = 'IDR' | 'USD';

// Fallback prices for services whose stored serviceName carries no price token.
export const SERVICE_PRICE_FALLBACK: Record<string, string> = {
    special: 'Rp 250K', '3card': '$12', '5card': '$20', live: '$45',
};

// Pull the first money token out of a free-text string, e.g. "Rp 315.000" or "$20".
export const priceToken = (s?: string | null): string | null => {
    if (!s) return null;
    const m = s.match(/Rp\s?[\d.,]+\s?(?:K|JT|jt|rb|RB)?|\$\s?[\d.,]+/);
    return m ? m[0] : null;
};

// Parse a money token into a numeric amount + currency.
export const parseAmount = (token: string | null): { amount: number; currency: Cur } | null => {
    if (!token) return null;
    if (token.includes('$')) {
        const n = parseFloat(token.replace(/[^\d.]/g, ''));
        return Number.isFinite(n) ? { amount: n, currency: 'USD' } : null;
    }
    const m = token.match(/Rp\s?([\d.,]+)\s?(K|JT|jt|rb|RB)?/);
    if (!m) return null;
    const num = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(num)) return null;
    const suffix = (m[2] || '').toLowerCase();
    const mult = suffix === 'jt' ? 1_000_000 : (suffix === 'k' || suffix === 'rb') ? 1_000 : 1;
    return { amount: num * mult, currency: 'IDR' };
};

// Best amount for a booking: explicit price, else a token in the service name, else the fallback.
export const amountForBooking = (b: Booking) =>
    parseAmount(priceToken(b.price) || priceToken(b.serviceName) || SERVICE_PRICE_FALLBACK[b.serviceId] || null);

// Money formatting. `compact` yields chart-friendly short forms (e.g. "Rp 1.2jt").
export const fmtIDR = (v: number, compact = false) =>
    compact
        ? (v >= 1_000_000 ? `Rp ${(v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0)}jt` : `Rp ${Math.round(v / 1000)}rb`)
        : `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(v))}`;
export const fmtUSD = (v: number, compact = false) =>
    compact ? `$${v}` : `$${new Intl.NumberFormat('en-US').format(Math.round(v))}`;
export const fmtMoney = (v: number, c: Cur, compact = false) => (c === 'IDR' ? fmtIDR(v, compact) : fmtUSD(v, compact));

// Date formatting — "07 Oct 2026". Takes a date-only ISO or a full timestamp (slices to the date),
// and builds from the parts so it never drifts a day across time zones.
export const fmtDate = (iso?: string): string => {
    if (!iso) return '—';
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return '—';
    return `${String(d).padStart(2, '0')} ${new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short' })} ${y}`;
};
