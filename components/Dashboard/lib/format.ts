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
// What was charged when paid online (Midtrans: rupiah; PayPal: dollars, e.g. "45.00")
// is exact, so it comes first; otherwise the price written in the service name.
export const amountForBooking = (b: Booking): { amount: number; currency: Cur } | null => {
    const due = Number(b.amountDue);
    if (due > 0) return { amount: due, currency: b.market === 'ID' ? 'IDR' : 'USD' };
    return parseAmount(priceToken(b.price) || priceToken(b.serviceName) || SERVICE_PRICE_FALLBACK[b.serviceId] || null);
};

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

// ---- one way to describe a booking, on every page ----

// Short admin names per service (the same ones the Revenue charts use).
export const SERVICE_NAME: Record<string, string> = {
    chat: 'Chat', call: 'Call / Video', meetup: 'Meetup', special: 'Edisi Spesial',
    '3card': '3-Card Spread', '5card': '5-Card Deep', live: 'Live Session',
};

const isPricePart = (s: string) => /^(Rp|\$)\s?[\d.,]/i.test(s.trim());
const nameParts = (b: Booking) => (b.serviceName || '').split(/\s+[·—]\s+/).map((p) => p.trim()).filter(Boolean);

/** the service on its own: "Chat", "Call / Video", "3-Card Spread" */
export const serviceTitle = (b: Booking) => SERVICE_NAME[b.serviceId] || nameParts(b)[0] || b.serviceId || '—';

/** what was picked within it, without the price: "3 Pertanyaan", "30 Menit", or '' */
export const packageOf = (b: Booking) => nameParts(b).slice(1).filter((p) => !isPricePart(p)).join(' · ');

/** "Chat · 3 Pertanyaan", "Meetup · 2 Jam", "Live Session" (the price lives in its own column) */
export const serviceLabel = (b: Booking) => [serviceTitle(b), packageOf(b)].filter(Boolean).join(' · ');

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** when the session happens: "08 Nov 2026 · 13:00–15:00", or '' for an order without a time */
export const sessionWhen = (b: Booking) => {
    if (!b.date || !b.time) return '';
    const [h, m] = b.time.split(':').map(Number);
    const dur = b.durationMin > 0 ? b.durationMin : 30;
    return `${fmtDate(b.date)} · ${b.time}–${hhmm(h * 60 + m + dur)}`;
};

/** how it was paid: "PayPal", "Midtrans · QRIS", "Transfer / QRIS", "Manual", or '' while unpaid */
export const paymentMethodOf = (b: Booking) => {
    if (b.paymentMethod) {
        return b.paymentMethod.replace(/·\s*(\w+)/, (_, w: string) => `· ${w.length <= 4 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).replace(/_/g, ' ')}`);
    }
    if (b.paymentStatus !== 'paid') return '';
    if (b.source === 'manual') return 'Manual';
    return b.market === 'ID' ? 'Transfer / QRIS' : 'PayPal';
};

/** the booking's amount, formatted ("Rp 220.000", "$45"), or '—' */
export const amountLabel = (b: Booking) => {
    const a = amountForBooking(b);
    return a ? fmtMoney(a.amount, a.currency) : '—';
};

// The form's contact line is "WA: 0812… · Email: a@b.co"; a manual order may be a bare number.
export const emailOf = (contact?: string) => ((contact || '').match(/[^\s:·<>]+@[^\s·<>]+\.[a-z]{2,}/i) || [])[0] || '';
export const phoneOf = (contact?: string) => {
    const c = contact || '';
    const wa = (c.match(/WA:\s*([^·]+)/i) || [])[1];
    if (wa) return wa.trim();
    const rest = c.replace(/[^\s:·]+@[^\s·]+/, '').replace(/Email:/i, '').replace(/·/g, ' ').trim();
    return /\d{6,}/.test(rest.replace(/[\s-]/g, '')) ? rest : '';
};
