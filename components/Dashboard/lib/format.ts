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

// Search: the words anywhere in the texts (any case), and a phone number however it's
// written: "0812 3456", "+62 812-3456" and "8123456" all find the same person.
export const matchesSearch = (needle: string, ...texts: (string | undefined | null)[]) => {
    const n = needle.trim().toLowerCase();
    if (!n) return true;
    if (texts.some((t) => (t || '').toLowerCase().includes(n))) return true;
    if (/[a-z@]/i.test(n)) return false; // (words, not a number)
    const digits = n.replace(/\D/g, '');
    if (digits.length < 4) return false;
    const core = digits.replace(/^(62|0)/, '');
    return texts.some((t) => (t || '').replace(/\D/g, '').includes(core));
};

// A booking code in words, for the dashboard: "C-42" → "Call · booking no. 42"
// (server/bookingStore.js nextRef). Older random codes → ''.
const REF_SERVICE: Record<string, string> = { C: 'Call', M: 'Meetup', H: 'Chat', S: 'Special Edition', T: '3-Card', F: '5-Card', L: 'Live Session', P: 'Pay as you like' };
export const refInWords = (ref?: string) => {
    const m = (ref || '').match(/^([A-Z])-(\d+)$/);
    return m ? `${REF_SERVICE[m[1]] || 'Booking'} · booking no. ${m[2]}` : '';
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
    chat: 'Chat', call: 'Call / Video', meetup: 'Meetup', special: 'Special Edition',
    '3card': '3-Card Spread', '5card': '5-Card Deep', live: 'Live Session',
    payl: 'Pay as you like',
};

const isPricePart = (s: string) => /^(Rp|\$)\s?[\d.,]/i.test(s.trim());
const nameParts = (b: Booking) => (b.serviceName || '').split(/\s+[·—]\s+/).map((p) => p.trim()).filter(Boolean);

/** the service on its own: "Chat", "Call / Video", "3-Card Spread" */
export const serviceTitle = (b: Booking) => SERVICE_NAME[b.serviceId] || nameParts(b)[0] || b.serviceId || '—';

/** a package's name in English for the dashboard (bookings keep the name they were made
    with, which for Indonesia is Indonesian): "3 Pertanyaan" → "3 questions" */
export const packageEn = (p: string) => p
    .replace(/Beli 3 Dapat 5 Pertanyaan/i, 'Buy 3, get 5 questions')
    .replace(/Tambahan\s+(\d+)\s*Menit/i, 'Extra $1 min')
    .replace(/Jam Berikutnya(\s*\(per jam\))?/i, 'Each extra hour')
    .replace(/Jam Pertama/i, 'First hour')
    .replace(/(\d+)\s*Pertanyaan/i, (_m, n: string) => `${n} question${n === '1' ? '' : 's'}`)
    .replace(/(\d+)\s*Menit/i, '$1 min')
    .replace(/(\d+)\s*Jam\b/i, '$1 h');

/** what was picked within it, without the price: "3 questions", "30 min", or '' */
export const packageOf = (b: Booking) => nameParts(b).slice(1).filter((p) => !isPricePart(p)).map(packageEn).join(' · ');

/** "Chat · 3 questions", "Meetup · 2 h", "Live Session" (the price lives in its own column) */
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
/** a phone number written one way: "6281294058561" and "081294058561" both → "0812 9405 8561";
    a number with another country code ("+81 90…") is left as it was typed */
export const fmtPhone = (raw: string) => {
    const t = (raw || '').trim();
    let d = t.replace(/\D/g, '');
    if (!d) return t;
    if (t.startsWith('+') && !d.startsWith('62')) return t;
    if (d.startsWith('62')) d = '0' + d.slice(2);
    else if (d.startsWith('8')) d = '0' + d;
    if (!d.startsWith('0') || d.length < 9) return t;
    return [d.slice(0, 4), d.slice(4, 8), d.slice(8)].filter(Boolean).join(' ');
};

export const phoneOf = (contact?: string) => {
    const c = contact || '';
    const wa = (c.match(/WA:\s*([^·]+)/i) || [])[1];
    if (wa) return wa.trim();
    const rest = c.replace(/[^\s:·]+@[^\s·]+/, '').replace(/Email:/i, '').replace(/·/g, ' ').trim();
    return /\d{6,}/.test(rest.replace(/[\s-]/g, '')) ? rest : '';
};

// ---- how long an order (no fixed time) has waited, against what the site promises ----
// 3-Card / 5-Card: "within 24 hours" (Services, FAQ); Edisi Spesial: "2 hari kerja".
// Chat has no stated deadline. The clock starts when it's paid (paidAt, or the order
// time for one paid in the form).
const PROMISE: Record<string, { hours?: number; workDays?: number }> = {
    '3card': { hours: 24 },
    '5card': { hours: 24 },
    special: { workDays: 2 },
};
const HOUR = 3_600_000;
// Jakarta weekday (0 Sun … 6 Sat) of an instant
const jktDay = (ms: number) => new Date(ms + 7 * HOUR).getUTCDay();
const addWorkDays = (from: number, n: number) => {
    let t = from;
    while (n > 0) { t += 24 * HOUR; const d = jktDay(t); if (d !== 0 && d !== 6) n--; }
    return t;
};
export type OrderClock =
    | { kind: 'unpaid' }
    | { kind: 'waiting'; since: number }
    | { kind: 'due'; since: number; due: number };
export const orderClock = (b: Booking): OrderClock => {
    if (b.paymentStatus !== 'paid') return { kind: 'unpaid' };
    const since = Date.parse(b.paidAt || b.createdAt || '') || Date.now();
    const p = PROMISE[b.serviceId];
    if (!p) return { kind: 'waiting', since };
    return { kind: 'due', since, due: p.workDays ? addWorkDays(since, p.workDays) : since + (p.hours || 24) * HOUR };
};
/** '45 min', '5 h', '2 d 3 h' */
export const spanLabel = (ms: number) => {
    const min = Math.max(0, Math.round(ms / 60_000));
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 48) return `${h} h`;
    const d = Math.floor(h / 24), rest = h % 24;
    return rest ? `${d} d ${rest} h` : `${d} d`;
};
