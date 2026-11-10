// The admin's notifications, worked out from the bookings themselves (nothing extra is
// stored): what came in, what's due, who's coming. Each has the moment it happened, so
// the list reads newest first and "unread" is simply anything after the last look.
import type { Booking } from '../../../services/booking';
import { orderClock, serviceLabel, serviceTitle, packageOf, amountLabel, paymentMethodOf, spanLabel, soonMs } from './format';

export type NoteKind = 'new' | 'awaiting' | 'dueSoon' | 'overdue' | 'session' | 'cancelled';
export interface Note {
    id: string;          // stable per booking and kind, so read/unread holds across reloads
    kind: NoteKind;
    at: number;          // when it happened (ms)
    title: string;
    detail: string;
    bookingId: string;
    tone: 'accent' | 'soon' | 'late' | 'quiet';
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const KEEP = 14 * DAY; // how far back the list goes
// how long before it's due a reading or chat counts as "due soon" (as the server warns)
const warnMs = (serviceId: string) => (serviceId === 'chat' ? 2 : 5) * HOUR;

const who = (b: Booking) => `${b.name || 'Someone'} · ${serviceLabel(b)}`;
const startOf = (b: Booking) => Date.parse(`${b.date}T${b.time}:00+07:00`);
const clock = (t: number) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
const dayKey = (t: number) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
// "today 15:00", "tomorrow 15:00", "Wed 15:00"
export const whenLabel = (t: number, now: number) => {
    const d = dayKey(t);
    if (d === dayKey(now)) return `today ${clock(t)}`;
    if (d === dayKey(now + DAY)) return `tomorrow ${clock(t)}`;
    return `${new Date(t).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Asia/Jakarta' })} ${clock(t)}`;
};
// rounded the way you'd say it: '45 min', '3 h', '2 d'
const span = (ms: number) => {
    const min = Math.max(1, Math.round(ms / 60_000));
    if (min < 60) return `${min} min`;
    const h = Math.round(min / 60);
    return h < 48 ? `${h} h` : `${Math.round(h / 24)} d`;
};

export function notesFrom(bookings: Booking[], now: number): Note[] {
    const out: Note[] = [];
    for (const b of bookings) {
        // extra time on a session isn't a booking of its own
        if (b.extraFor) continue;
        const created = Date.parse(b.createdAt || '') || 0;
        const fromSite = b.source !== 'manual';
        const paid = b.paymentStatus === 'paid';
        const timed = !!(b.date && b.time);
        const live = b.status !== 'cancelled' && b.status !== 'done';

        // a booking that came in from the site, paid
        if (fromSite && paid && b.status !== 'cancelled') {
            const at = Date.parse(b.paidAt || '') || created;
            if (now - at < KEEP) out.push({
                id: `new:${b.id}`, kind: 'new', at, bookingId: b.id, tone: 'accent',
                title: `New booking: ${who(b)}`,
                detail: [amountLabel(b), paymentMethodOf(b), timed ? `session ${whenLabel(startOf(b), now)}` : ''].filter(Boolean).join(' · '),
            });
        }
        // one from the site still waiting for its money
        if (fromSite && !paid && live && now - created < KEEP) out.push({
            id: `awaiting:${b.id}`, kind: 'awaiting', at: created, bookingId: b.id, tone: 'quiet',
            title: `Waiting for payment: ${who(b)}`,
            detail: [amountLabel(b), b.market === 'ID' ? 'Ask to pay on WhatsApp from its details' : 'Not paid yet'].join(' · '),
        });
        // a reading or chat close to (or past) when it's due
        if (!timed && live) {
            const c = orderClock(b);
            if (c.kind === 'due') {
                const soonAt = c.due - warnMs(b.serviceId);
                if (now >= c.due) out.push({
                    id: `overdue:${b.id}`, kind: 'overdue', at: c.due, bookingId: b.id, tone: 'late',
                    title: `Overdue ${span(now - c.due)}: ${who(b)}`,
                    detail: `Was due ${whenLabel(c.due, now)}. Mark it done once it's sent`,
                });
                else if (now >= soonAt) out.push({
                    id: `dueSoon:${b.id}`, kind: 'dueSoon', at: soonAt, bookingId: b.id, tone: 'soon',
                    title: `Due in ${span(c.due - now)}: ${who(b)}`,
                    detail: `Due ${whenLabel(c.due, now)}`,
                });
            }
        }
        // a session in the next day
        if (timed && live) {
            const start = startOf(b);
            if (start > now && start - now <= DAY) out.push({
                id: `session:${b.id}`, kind: 'session', at: Math.max(start - DAY, created), bookingId: b.id,
                tone: start - now <= 2 * HOUR ? 'soon' : 'accent',
                title: `Session ${whenLabel(start, now)}: ${who(b)}`,
                detail: [`in ${span(start - now)}`, paid ? 'paid' : 'not paid yet'].join(' · '),
            });
        }
        // let go because it wasn't paid in time
        if (fromSite && b.status === 'cancelled' && b.cancelReason === 'unpaid') {
            const at = Date.parse(b.holdUntil || '') || created + HOUR;
            if (now - at < KEEP && at <= now) out.push({
                id: `cancelled:${b.id}`, kind: 'cancelled', at, bookingId: b.id, tone: 'quiet',
                title: `Cancelled, not paid in time: ${who(b)}`,
                detail: `${amountLabel(b)} · the slot is free again`,
            });
        }
    }
    return out.filter((n) => n.at <= now).sort((a, b) => b.at - a.at);
}

// ---- the to do list: what's still to be done, soonest deadline first ----
export interface Todo {
    b: Booking;
    kind: 'reading' | 'session';
    at: number;          // its deadline: when the reading is due, or when the session starts
    title: string;       // what to do
    detail: string;
    pill: string;        // '3 h left', 'Overdue 2 d', 'in 5 h'
    tone: 'late' | 'soon' | 'calm';
}
export function todosFrom(bookings: Booking[], now: number): Todo[] {
    const out: Todo[] = [];
    for (const b of bookings) {
        if (b.extraFor || b.holdOnly || b.status === 'cancelled' || b.status === 'done') continue;
        const name = b.name || 'someone';
        const pkg = packageOf(b);
        if (!(b.date && b.time)) {
            // a reading or chat that's paid and not sent yet
            const c = orderClock(b);
            if (c.kind === 'unpaid') continue;
            const chat = b.serviceId === 'chat';
            const title = chat ? `Answer ${name}’s chat` : `Send ${name}’s reading`;
            if (c.kind === 'waiting') {
                out.push({ b, kind: 'reading', at: Infinity, title, detail: [serviceLabel(b), amountLabel(b)].filter(Boolean).join(' · '), pill: `paid ${spanLabel(now - c.since)} ago`, tone: 'calm' });
                continue;
            }
            const left = c.due - now;
            out.push({
                b, kind: 'reading', at: c.due, title,
                detail: [chat ? pkg || 'Chat' : serviceTitle(b) + (pkg ? ` · ${pkg}` : ''), amountLabel(b), `due ${whenLabel(c.due, now)}`].filter(Boolean).join(' · '),
                pill: left <= 0 ? `Overdue ${spanLabel(-left)}` : `${spanLabel(left)} left`,
                tone: left <= 0 ? 'late' : left < soonMs(b.serviceId) ? 'soon' : 'calm',
            });
            continue;
        }
        // a session in the next day
        const start = startOf(b);
        if (start > now && start - now <= DAY) out.push({
            b, kind: 'session', at: start,
            title: `${serviceTitle(b)} with ${name}`,
            detail: [pkg, b.paymentStatus === 'paid' ? '' : 'not paid yet'].filter(Boolean).join(' · ') || amountLabel(b),
            pill: `in ${spanLabel(start - now)}`,
            tone: start - now <= 2 * HOUR ? 'soon' : 'calm',
        });
    }
    return out.sort((x, y) => x.at - y.at);
}

// ---- read / unread: the moment of the last look, kept in this browser ----
const SEEN_KEY = 'mt:notes-seen';
export const NOTES_SEEN = 'mt:notes-seen';
export const lastSeen = (): number => {
    try {
        const v = Number(localStorage.getItem(SEEN_KEY));
        if (v) return v;
    } catch { /* storage blocked: everything from the last day counts as new */ }
    return Date.now() - DAY;
};
export const markSeen = (at = Date.now()) => {
    try { localStorage.setItem(SEEN_KEY, String(at)); } catch { /* ignore */ }
    window.dispatchEvent(new Event(NOTES_SEEN));
};
export const dayHeading = (t: number, now: number) => {
    const d = dayKey(t);
    if (d === dayKey(now)) return 'Today';
    if (d === dayKey(now - DAY)) return 'Yesterday';
    return new Date(t).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' });
};
