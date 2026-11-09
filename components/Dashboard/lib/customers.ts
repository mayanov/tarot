// Who is who among the bookings: one customer per phone number or email with the same
// first name (shared by Customers and the booking details).
import type { Booking } from '../../../services/booking';
import { fmtMoney } from './format';
import { firstNameKey } from './calendarEntry';

// ---- contact parsing ----
export const extractPhone = (contact?: string) => {
    if (!contact) return '';
    const m = contact.match(/WA:\s*([+\d][\d\s-]*)/i);
    const raw = m ? m[1] : (contact.match(/[+]?\d[\d\s-]{6,}/)?.[0] || '');
    return raw.trim();
};
// Canonical phone key so 0812…, +62 812…, 62812… all collapse to one client.
export const normPhone = (raw: string) => {
    const d = (raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('62') || raw.trim().startsWith('+')) return d; // already international
    if (d.startsWith('0')) return '62' + d.slice(1);
    if (d.startsWith('8') && d.length >= 9 && d.length <= 13) return '62' + d;
    return d;
};
export const extractEmail = (contact?: string) => contact?.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || '';

export type Money = { IDR: number; USD: number };
// "Rp 500.000 + $20", "$20", or '' when nothing
export const moneyLabel = (m: Money) => [m.IDR ? fmtMoney(m.IDR, 'IDR') : '', m.USD ? fmtMoney(m.USD, 'USD') : ''].filter(Boolean).join(' + ');
// One person, however they booked: bookings that share a phone number or an email AND the
// first name are the same customer, so a WhatsApp booking in Indonesia and a Global one paid
// with the same email (or number) come together. Different names on one number (a family's
// phone, someone booking for a friend, test bookings) stay apart; each one's details say who
// shares it. (Union-find over "p:<phone>|<first name>" / "e:<email>|<first name>".)
// the booking's phone and email, written one way ("p:62812…", "e:dewi@example.com")
export const contactTokens = (b: Booking) => {
    const t: string[] = [];
    const p = normPhone(extractPhone(b.contact)); if (p) t.push(`p:${p}`);
    const e = extractEmail(b.contact).toLowerCase(); if (e) t.push(`e:${e}`);
    return t;
};
export const groupBookings = (list: Booking[]): Booking[][] => {
    const parent = new Map<string, string>();
    const find = (x: string): string => { let r = x; while (parent.get(r) !== r) r = parent.get(r)!; parent.set(x, r); return r; };
    const add = (x: string) => { if (!parent.has(x)) parent.set(x, x); };
    const tokensOf = (b: Booking) => {
        const t = contactTokens(b).map((x) => `${x}|${firstNameKey(b.name)}`);
        return t.length ? t : [`id:${b.id}`];
    };
    const toks = list.map(tokensOf);
    for (const t of toks) { t.forEach(add); for (let i = 1; i < t.length; i++) { const a = find(t[0]), b = find(t[i]); if (a !== b) parent.set(a, b); } }
    const groups = new Map<string, Booking[]>();
    list.forEach((b, i) => { const r = find(toks[i][0]); (groups.get(r) || groups.set(r, []).get(r)!).push(b); });
    return [...groups.values()];
};


/** the bookings of the same customer as this booking (itself included) */
export const sameCustomer = (b: Booking, all: Booking[]): Booking[] =>
    groupBookings(all).find((g) => g.some((x) => x.id === b.id)) || [b];
