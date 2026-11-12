// The admin's notifications, worked out from the bookings themselves (nothing extra is
// stored): what came in, what's due, who's coming. Each has the moment it happened, so
// the list reads newest first and "unread" is simply anything after the last look.
import type { Booking } from '../../../services/booking';
import { orderClock, serviceLabel, serviceTitle, packageOf, amountLabel, paymentMethodOf, spanLabel, soonMs, nameOf, sessionTitle } from './format';

export type NoteKind = 'new' | 'awaiting' | 'dueSoon' | 'overdue' | 'session' | 'cancelled' | 'done';
/** one stage of a booking: Booked, Paid, then Due / Session / Sent; `at` once it's happened */
export interface NoteStep { label: string; at?: number; state: 'done' | 'now' | 'next' | 'late' }
/** One notification per booking. Its status changes in place (waiting for payment → paid →
 *  due soon → overdue, or cancelled), and it moves back to the top, unread, when it does. */
export interface Note {
    id: string;          // the booking's id
    kind: NoteKind;      // where it is now
    at: number;          // when that last changed (ms)
    name: string;        // who
    service: string;     // what they booked
    amount: string;      // '$12', 'Rp 450.000'
    title: string;       // who, and what they booked
    status: string;      // 'Waiting for payment', 'Paid', 'Due in 3 h', '2 d late', …
    detail: string;      // a few words more: how it was paid, when it's due
    steps: NoteStep[];
    bookingId: string;
    tone: 'accent' | 'soon' | 'late' | 'quiet' | 'ok';
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
        if (b.extraFor || b.holdOnly) continue;
        const created = Date.parse(b.createdAt || '') || 0;
        const fromSite = b.source !== 'manual';
        const paid = b.paymentStatus === 'paid';
        const paidAt = paid ? Date.parse(b.paidAt || '') || created : 0;
        const timed = !!(b.date && b.time);
        const live = b.status !== 'cancelled' && b.status !== 'done';

        // where it is now: the latest thing that happened to it
        let kind: NoteKind = paid ? 'new' : 'awaiting';
        let at = paid ? paidAt : created;
        let status = paid ? 'Paid' : 'Waiting for payment';
        let tone: Note['tone'] = paid ? 'accent' : 'quiet';
        let detail = paid ? paymentMethodOf(b) || '' : '';
        let reminder = false;
        // the last stage: when the reading is due, or the session
        let last: NoteStep;

        if (timed) {
            const start = startOf(b);
            last = { label: `Session ${whenLabel(start, now)}`, state: b.status === 'done' || start <= now ? 'done' : 'next' };
            if (live && start > now && start - now <= DAY) {
                reminder = true;
                kind = 'session'; at = Math.max(at, start - DAY);
                status = `Session in ${span(start - now)}`;
                tone = start - now <= 2 * HOUR ? 'soon' : 'accent';
                detail = whenLabel(start, now);
                if (paid) last.state = 'now'; // (unpaid: getting paid is still the step at hand)
            }
        } else {
            const c = orderClock(b);
            last = { label: b.serviceId === 'chat' ? 'Answered' : 'Sent', state: b.status === 'done' ? 'done' : 'next' };
            if (c.kind === 'due') {
                last.label = b.status === 'done' ? last.label : `Due ${whenLabel(c.due, now)}`;
                const soonAt = c.due - warnMs(b.serviceId);
                if (live && now >= c.due) {
                    reminder = true;
                    kind = 'overdue'; at = c.due; tone = 'late';
                    status = `${span(now - c.due)} late`;
                    detail = `was due ${whenLabel(c.due, now)}`;
                    last.state = 'late';
                } else if (live && now >= soonAt) {
                    reminder = true;
                    kind = 'dueSoon'; at = soonAt; tone = 'soon';
                    status = `Due in ${span(c.due - now)}`;
                    detail = `due ${whenLabel(c.due, now)}`;
                    last.state = 'now';
                }
            }
        }
        // let go because it wasn't paid in time
        if (b.status === 'cancelled') {
            if (!(fromSite && b.cancelReason === 'unpaid')) continue; // cancelled by hand: nothing to tell
            kind = 'cancelled'; tone = 'quiet'; status = 'Cancelled, not paid in time';
            at = Math.min(now, Date.parse(b.holdUntil || '') || created + HOUR);
            detail = 'the slot is free again';
        } else if (b.status === 'done') {
            kind = 'done'; tone = 'ok'; status = timed ? 'Done' : b.serviceId === 'chat' ? 'Answered' : 'Sent'; detail = '';
        }
        // a booking typed in by hand only shows up for its reminders
        if (!fromSite && !reminder) continue;
        if (now - at >= KEEP || at > now) continue;

        const steps: NoteStep[] = kind === 'cancelled'
            ? [{ label: 'Booked', at: created, state: 'done' }, { label: 'Not paid', state: 'late' }, { label: 'Cancelled', at, state: 'late' }]
            : [
                { label: fromSite ? 'Booked' : 'Added', at: created || undefined, state: 'done' },
                paid ? { label: 'Paid', at: paidAt, state: 'done' } : { label: 'Paid', state: 'now' },
                last,
            ];
        out.push({ id: b.id, kind, at, bookingId: b.id, tone, title: who(b), name: b.name || 'Someone', service: serviceLabel(b), amount: amountLabel(b) || '', status, detail, steps });
    }
    return out.sort((a, b) => b.at - a.at);
}

// ---- the to do list: what's still to be done, soonest deadline first ----
export interface Todo {
    b: Booking;
    kind: 'reading' | 'session';
    at: number;          // its deadline: when the reading is due, or when the session starts
    title: string;       // what to do
    detail: string;
    pill: string;        // '3 h left', '2 d late', 'in 5 h'
    tone: 'late' | 'soon' | 'calm';
}
// a paid reading or chat not sent yet, as a to do (null for anything else)
export function readingTodo(b: Booking, now: number): Todo | null {
    if (b.extraFor || b.holdOnly || b.status === 'cancelled' || b.status === 'done' || (b.date && b.time)) return null;
    const c = orderClock(b);
    if (c.kind === 'unpaid') return null;
    const name = nameOf(b, 'someone');
    const pkg = packageOf(b);
    const chat = b.serviceId === 'chat';
    const title = chat ? `Answer ${name}’s chat` : `Send ${name}’s reading`;
    if (c.kind === 'waiting') {
        return { b, kind: 'reading', at: Infinity, title, detail: [serviceLabel(b), amountLabel(b)].filter(Boolean).join(' · '), pill: `paid ${spanLabel(now - c.since)} ago`, tone: 'calm' };
    }
    const left = c.due - now;
    return {
        b, kind: 'reading', at: c.due, title,
        detail: [chat ? pkg || 'Chat' : serviceTitle(b) + (pkg ? ` · ${pkg}` : ''), amountLabel(b), `due ${whenLabel(c.due, now)}`].filter(Boolean).join(' · '),
        pill: left <= 0 ? `${spanLabel(-left)} late` : `${spanLabel(left)} left`,
        tone: left <= 0 ? 'late' : left < soonMs(b.serviceId) ? 'soon' : 'calm',
    };
}
// any open order (a reading or chat), paid or not: Orders' To do. Named like an order
// (the service, then who), with the same clock as the to do list
export function orderTodo(b: Booking, now: number): Todo {
    const r = readingTodo(b, now);
    const c = orderClock(b);
    const when = c.kind === 'due' ? `due ${whenLabel(c.due, now)}`
        : `ordered ${new Date(Date.parse(b.createdAt || '') || now).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })}`;
    return {
        ...(r || { b, kind: 'reading' as const, at: Infinity, pill: 'Not paid yet', tone: 'calm' as const }),
        title: serviceLabel(b),
        // (how long is left is on the pill; an unpaid one says when it was ordered)
        detail: [nameOf(b), r ? '' : when].filter(Boolean).join(' · '),
    };
}
export function todosFrom(bookings: Booking[], now: number): Todo[] {
    const out: Todo[] = [];
    for (const b of bookings) {
        const r = readingTodo(b, now);
        if (r) { out.push(r); continue; }
        if (b.extraFor || b.holdOnly || b.status === 'cancelled' || b.status === 'done' || !(b.date && b.time)) continue;
        // a session in the next day
        const start = startOf(b);
        if (start > now && start - now <= DAY) out.push({
            b, kind: 'session', at: start,
            title: sessionTitle(b),
            detail: [packageOf(b), b.paymentStatus === 'paid' ? '' : 'not paid yet'].filter(Boolean).join(' · ') || amountLabel(b),
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
