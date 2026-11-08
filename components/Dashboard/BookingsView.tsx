import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, X, Plus, ArrowRight } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Card from './ui/Card';
import Segmented from './ui/Segmented';
import { getAllBookings, rescheduleBooking, getCalendarEvents, createManualBooking, updatePaymentStatus, addExtraTime, Booking, CalEvent, SLOT_TIMES, CLOSING_TIME, slotNeed } from '../../services/booking';
import { LoaderCard } from './ui/InlineLoader';
import WaConfirmButton from './WaConfirmButton';
import { fmtDate, serviceTitle, packageOf, serviceLabel, amountLabel, paymentMethodOf, phoneOf, emailOf, orderClock, spanLabel } from './lib/format';
import { StatusSelect, PaymentPill } from './lib/status';
import { isSessionTitle, nameFromTitle, entryMinutes, serviceFromTitle } from './lib/calendarEntry';

// Services offered — id drives revenue colour/stacking; name is the display label.
const MANUAL_SERVICES: { id: string; name: string }[] = [
    { id: 'chat', name: 'Konsultasi via Chat' },
    { id: 'call', name: 'Panggilan Suara & Video' },
    { id: 'meetup', name: 'Sesi Tatap Muka' },
    { id: 'special', name: 'Edisi Spesial' },
    { id: '3card', name: '3-Card Spread' },
    { id: '5card', name: '5-Card Deep' },
    { id: 'live', name: 'Live Session' },
];

// Packages per service (from the public pricelist) — picking one prefills the price.
type SvcOpt = { label: string; amount: number; currency: 'IDR' | 'USD'; durationMin?: number };
const SERVICE_OPTIONS: Record<string, SvcOpt[]> = {
    chat: [
        { label: '1 Pertanyaan', amount: 140000, currency: 'IDR' },
        { label: '3 Pertanyaan', amount: 315000, currency: 'IDR' },
        { label: 'Beli 3 Dapat 5 Pertanyaan', amount: 315000, currency: 'IDR' },
    ],
    call: [
        { label: '30-Min Call', amount: 220000, currency: 'IDR', durationMin: 30 },
        { label: '60-Min Call', amount: 360000, currency: 'IDR', durationMin: 60 },
        // Admin-only add-on — intentionally NOT on the public pricelist.
        { label: 'Tambahan 15 Menit', amount: 110000, currency: 'IDR', durationMin: 15 },
    ],
    meetup: [
        { label: 'Jam Pertama', amount: 450000, currency: 'IDR', durationMin: 60 },
        { label: 'Jam Berikutnya (per jam)', amount: 360000, currency: 'IDR', durationMin: 60 },
    ],
    special: [{ label: 'New Year Reading 2026', amount: 250000, currency: 'IDR' }],
    '3card': [{ label: '3-Card Spread', amount: 12, currency: 'USD' }],
    '5card': [{ label: '5-Card Deep', amount: 20, currency: 'USD' }],
    live: [{ label: 'Live Session (30 min)', amount: 45, currency: 'USD', durationMin: 30 }],
};

// Pull a display phone / a canonical key out of a free-text contact field
// (matches how CustomersView groups clients, so the two stay in sync).
const extractPhone = (contact?: string) => {
    if (!contact) return '';
    const m = contact.match(/WA:\s*([+\d][\d\s-]*)/i);
    return (m ? m[1] : (contact.match(/[+]?\d[\d\s-]{6,}/)?.[0] || '')).trim();
};
const normPhone = (p: string) => p.replace(/\D/g, '');
const fmtAmt = (n: number, c: 'IDR' | 'USD') => c === 'USD' ? `$${n}` : `Rp ${n.toLocaleString('id-ID')}`;
const fmtOptPrice = (o: SvcOpt) => fmtAmt(o.amount, o.currency);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Calendar block colours per status.
const BLOCK_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-coral/20 border-coral/45 text-coral-deep hover:bg-coral/30',
    confirmed: 'bg-sage/20 border-sage/45 text-sage hover:bg-sage/30',
    done: 'bg-blue/20 border-blue/45 text-blue hover:bg-blue/30',
    cancelled: 'bg-mauve/15 border-mauve/40 text-mauve line-through opacity-70 hover:opacity-90',
};

const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseISO = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
};
const startOfWeek = (d: Date) => {
    const x = new Date(d);
    const dow = (x.getDay() + 6) % 7; // Monday = 0
    x.setDate(x.getDate() - dow);
    x.setHours(0, 0, 0, 0);
    return x;
};
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`;
// 'YYYY-MM-DD' → 'dd Mon YYYY' (e.g. 08 Sep 2026)

// Grid window: covers all bookable starts (11:00–19:30) and their durations (sessions end by 20:00).
const DAY_START = 10 * 60; // 10:00 AM
const DAY_END = 21 * 60;   // 9:00 PM
const HOUR_H = 56; // px per hour
const GRID_H = ((DAY_END - DAY_START) / 60) * HOUR_H;
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i);
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FLD = "w-full rounded-lg border border-adm-line-2 bg-bg-dark px-3 py-2 text-sm text-text-light focus:border-lilac focus:outline-none";
const LBL = "block text-xs font-medium text-text-subtle mb-1.5";

// Modal to record a booking taken manually (e.g. over WhatsApp). With `fromEntry`, it turns
// a session Mayanov put in her Google Calendar herself into a booking: its time comes from
// the entry, and the entry itself becomes the booking's (nothing new on her calendar).
export const AddBookingModal: React.FC<{ bookings: Booking[]; fromEntry?: CalEvent; onClose: () => void; onCreated: (msg: string) => void }> = ({ bookings, fromEntry, onClose, onCreated }) => {
    const today = toISO(new Date());
    const entrySvc = fromEntry ? serviceFromTitle(fromEntry.title) : null;
    const entryMin = fromEntry ? entryMinutes(fromEntry) : 0;
    // the package closest to the entry's length (a 60-min call, not a 30-min one)
    const entryIdx = entrySvc
        ? Math.max(0, (SERVICE_OPTIONS[entrySvc] || []).reduce((best, o, i, arr) =>
            Math.abs((o.durationMin || 0) - entryMin) < Math.abs((arr[best].durationMin || 0) - entryMin) ? i : best, 0))
        : 0;
    const [serviceId, setServiceId] = useState<string>(entrySvc || MANUAL_SERVICES[0].id);
    const [detailIdx, setDetailIdx] = useState(entryIdx);
    // (a name only from an entry that looks like a session: "Finalize Website" isn't anyone)
    const [name, setName] = useState(fromEntry && isSessionTitle(fromEntry.title) ? nameFromTitle(fromEntry.title) : '');
    const [contact, setContact] = useState('');
    const autoContact = useRef(''); // the contact filled in from a known customer
    const [tip, setTip] = useState('');
    const [showTip, setShowTip] = useState(false);
    const [orderDate, setOrderDate] = useState(fromEntry?.date || today);
    const [status, setStatus] = useState<'confirmed' | 'done' | 'pending'>(fromEntry?.date && fromEntry.date < today ? 'done' : 'confirmed');
    const [payment, setPayment] = useState<'paid' | 'unpaid'>('paid');
    const [question, setQuestion] = useState('');
    const [schedule, setSchedule] = useState(Boolean(fromEntry));
    const [date, setDate] = useState(fromEntry?.date || today);
    const [time, setTime] = useState(fromEntry?.time || '11:00');
    const [durationMin, setDurationMin] = useState(fromEntry ? String(entryMin) : '60');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    // Existing clients, deduped by phone (newest name wins — bookings arrive newest-first).
    const clients = useMemo(() => {
        const map = new Map<string, { key: string; name: string; contact: string; phone: string }>();
        bookings.forEach((b) => {
            const phone = extractPhone(b.contact);
            const key = normPhone(phone) || (b.contact || '').trim().toLowerCase();
            if (!key) return;
            if (!map.has(key)) map.set(key, { key, name: b.name || '', contact: b.contact || '', phone });
        });
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [bookings]);

    // Price/currency come straight from the chosen package (not editable).
    const opts = SERVICE_OPTIONS[serviceId] || [];
    const opt = opts[detailIdx] || opts[0];
    const baseAmount = opt?.amount || 0;
    const currency: 'IDR' | 'USD' = opt?.currency || 'IDR';
    const tipNum = Math.max(0, Number(tip) || 0);
    const total = baseAmount + tipNum;

    // Picking a timed session prefills its duration for calendar scheduling (a calendar
    // entry keeps its own length: that's when the session really is).
    useEffect(() => {
        if (!fromEntry && opt?.durationMin) setDurationMin(String(opt.durationMin));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceId, detailIdx]);

    // One field for the customer: typing suggests the people already in the dashboard;
    // picking one fills in their WhatsApp (unless one was typed by hand).
    const typeName = (v: string) => {
        setName(v);
        const c = clients.find((c) => c.name.trim().toLowerCase() === v.trim().toLowerCase());
        if (contact && contact !== autoContact.current) return;
        autoContact.current = c ? c.contact : '';
        setContact(c ? c.contact : '');
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr('');
        if (!name.trim()) { setErr('Customer name is required.'); return; }
        if (!opt || baseAmount <= 0) { setErr('Pick a package.'); return; }
        setBusy(true);
        try {
            const token = localStorage.getItem('authToken') || undefined;
            const svc = MANUAL_SERVICES.find((s) => s.id === serviceId) || MANUAL_SERVICES[0];
            const detailLabel = opt?.label || '';
            const serviceName = detailLabel && detailLabel !== svc.name ? `${svc.name} · ${detailLabel}` : svc.name;
            // Tip is folded into the recorded amount so the revenue report reflects
            // what the client actually paid; it's also noted for reference.
            const tipNote = tipNum > 0 ? `Tip ${fmtAmt(tipNum, currency)}` : '';
            const notes = [question.trim(), tipNote].filter(Boolean).join(' · ');
            await createManualBooking({
                serviceId, serviceName,
                name: name.trim(), contact: contact.trim(), question: notes,
                amount: total, currency, orderDate, status, paymentStatus: payment,
                ...(fromEntry
                    ? { date: fromEntry.date, time: fromEntry.time, durationMin: entryMin, linkEventId: fromEntry.id }
                    : schedule ? { date, time, durationMin: Number(durationMin) || 60 } : {}),
            }, token);
            onCreated(fromEntry ? 'Booking added, linked to your calendar entry' : 'Booking added');
        } catch (e2) {
            const m = e2 instanceof Error ? e2.message : '';
            setErr(m === 'LINKED' ? 'That calendar entry is already a booking.'
                : m === 'SLOT_TAKEN' ? 'Another booking is already at that time.' : 'Failed to add booking.');
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-1 border border-adm-line-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-adm-line sticky top-0 bg-surface-1">
                    <h3 className="text-lg font-serif font-bold text-text-light">{fromEntry ? 'Turn into a booking' : 'Add booking'}</h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-full text-text-subtle hover:text-text-light hover:bg-white/5"><X size={18} /></button>
                </div>
                <form onSubmit={submit} className="px-6 py-5 space-y-4">
                    {fromEntry ? (
                        <div className="rounded-lg bg-adm-hover border border-adm-line-2 px-3 py-2.5 text-xs text-text-subtle leading-relaxed">
                            <div className="text-sm text-text-light font-medium">“{fromEntry.title}”</div>
                            <div className="mt-0.5">{fmtDate(fromEntry.date)} · {fromEntry.time}–{fromEntry.endTime || toHHMM(toMin(fromEntry.time || '00:00') + entryMin)} ({entryMin} min)</div>
                            <div className="mt-1.5">Your calendar entry stays as it is; it becomes this booking's entry, so nothing new is added to your calendar. It then counts in Sales, Revenue and Customers.</div>
                        </div>
                    ) : (
                        <p className="text-xs text-text-subtle leading-relaxed">For orders taken manually (e.g. over WhatsApp) — they'll appear in Orders, Customers and the Revenue report.</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={LBL}>Service</label>
                            <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setDetailIdx(0); }} className={FLD}>
                                {MANUAL_SERVICES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LBL}>Package / detail</label>
                            <select value={detailIdx} onChange={(e) => setDetailIdx(Number(e.target.value))} className={FLD}>
                                {opts.map((o, i) => <option key={i} value={i}>{o.label} — {fmtOptPrice(o)}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={LBL}>Customer</label>
                            <input value={name} onChange={(e) => typeName(e.target.value)} list="mt-known-customers" autoComplete="off" placeholder="Name (new or existing)" className={FLD} />
                            <datalist id="mt-known-customers">
                                {clients.filter((c) => c.name).map((c) => <option key={c.key} value={c.name}>{c.phone}</option>)}
                            </datalist>
                        </div>
                        <div>
                            <label className={LBL}>WhatsApp</label>
                            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="0812…" className={FLD} />
                        </div>
                    </div>

                    {/* the price is the package's (shown in its menu too); a tip only when there is one */}
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-lilac/10 border border-lilac/30 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-text-subtle">Total</span>
                            {showTip ? (
                                <span className="flex items-center gap-1.5 text-sm text-text-subtle">
                                    incl. tip
                                    <input type="number" min="0" step="any" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="0" autoFocus
                                        className="w-28 rounded-md border border-adm-line-2 bg-bg-dark px-2 py-1 text-sm text-text-light focus:border-lilac focus:outline-none" aria-label="Tip" />
                                </span>
                            ) : (
                                <button type="button" onClick={() => setShowTip(true)} className="text-xs text-lilac hover:underline">+ tip</button>
                            )}
                        </div>
                        <span className="text-base font-bold text-text-light tabular-nums whitespace-nowrap">{fmtAmt(total, currency)}</span>
                    </div>

                    <div>
                        <label className={LBL}>Booking date</label>
                        <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={FLD} />
                        <p className="mt-1 text-[0.7rem] text-text-subtle">Date the client booked — revenue is reported on this date.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={LBL}>Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as 'confirmed' | 'done' | 'pending')} className={FLD}>
                                <option value="confirmed">Confirmed</option>
                                <option value="done">Done</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                        <div>
                            <label className={LBL}>Payment</label>
                            <select value={payment} onChange={(e) => setPayment(e.target.value as 'paid' | 'unpaid')} className={FLD}>
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={LBL}>Notes (optional)</label>
                        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} placeholder="Pertanyaan / catatan…" className={FLD} />
                    </div>

                    {!fromEntry && <label className="flex items-center gap-2.5 text-sm text-text-light cursor-pointer select-none">
                        <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} className="accent-lilac w-4 h-4" />
                        Also schedule a session on the calendar
                    </label>}
                    {schedule && !fromEntry && (
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className={LBL}>Date</label>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FLD} />
                            </div>
                            <div>
                                <label className={LBL}>Time</label>
                                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={FLD} />
                            </div>
                            <div>
                                <label className={LBL}>Minutes</label>
                                <input type="number" min="15" step="15" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} className={FLD} />
                            </div>
                        </div>
                    )}

                    {err && <div className="text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-lg px-3 py-2">{err}</div>}

                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm text-text-subtle hover:text-text-light transition-colors">Cancel</button>
                        <button type="submit" disabled={busy} className="px-5 py-2 rounded-full bg-lilac text-white text-sm font-semibold hover:bg-lilac-dark hover:text-white transition-colors disabled:opacity-60">
                            {busy ? 'Adding…' : fromEntry ? 'Turn into booking' : 'Add booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// One view behind two menu items: Schedule (sessions with a time, on the week grid)
// and Orders (readings and chats with no fixed time). Kept as one component so the
// bookings load once and switching between the two is instant.
// Under an order's date: how long it has waited for its reading, against what the site
// promises (lib/format orderClock). Overdue is the one in colour.
const ClockNote: React.FC<{ b: Booking; now: number }> = ({ b, now }) => {
    const c = orderClock(b);
    const cls = 'text-[0.7rem] leading-tight mt-0.5';
    if (c.kind === 'unpaid') return <div className={`${cls} text-text-subtle`}>Not paid yet</div>;
    if (c.kind === 'waiting') return <div className={`${cls} text-text-subtle`}>Waiting {spanLabel(now - c.since)}</div>;
    // a countdown to when the reading is promised: hours and minutes, the due time under
    // it, and in colour as it gets close (under 6 h) or once it's late
    const left = c.due - now;
    const due = new Date(c.due).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    const late = left < 0;
    const soon = !late && left < 6 * 3_600_000;
    const pill = late ? 'due-late' : soon ? 'due-soon' : 'bg-lilac/10 text-lilac';
    return (
        <div className="mt-1">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums whitespace-nowrap ${pill}`}>
                {late ? `Overdue ${leftLabel(-left)}` : `${leftLabel(left)} left`}
            </span>
            <div className="text-[0.7rem] text-text-subtle tabular-nums mt-0.5 whitespace-nowrap">{late ? 'was due' : 'due'} {due}</div>
        </div>
    );
};
// '45 min', '5 h 20 min' (under a day, to the minute), then '2 d 3 h'
const leftLabel = (ms: number) => {
    const min = Math.max(0, Math.round(ms / 60_000));
    if (min < 60 || min >= 24 * 60) return spanLabel(ms);
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
};
// most urgent first: due soonest, then the longest waiting, then the unpaid (newest first)
const urgency = (b: Booking) => {
    const c = orderClock(b);
    return c.kind === 'due' ? c.due : c.kind === 'waiting' ? c.since + 24 * 3_600_000 : Number.MAX_SAFE_INTEGER;
};

// A cancelled session brought back at another date/time (its own may be booked since):
// pick a free time, then it's moved there and restored, back on the calendar.
const RestoreAt: React.FC<{ b: Booking; bookings: Booking[]; onDone: (msg: string) => void }> = ({ b, bookings, onDone }) => {
    const [date, setDate] = useState(b.date >= toISO(new Date()) ? b.date : toISO(new Date()));
    const [time, setTime] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const dur = b.durationMin || 30;
    // times on that day other bookings already hold (with their rest / travel time)
    const held = useMemo(() => new Set(bookings
        .filter((x) => x.id !== b.id && x.date === date && x.time && x.status !== 'cancelled')
        .flatMap((x) => slotNeed(x.serviceId, x.time, x.durationMin || 30))), [bookings, date, b.id]);
    const free = (t: string) => toMin(t) + dur <= toMin(CLOSING_TIME) && !slotNeed(b.serviceId, t, dur).some((s) => held.has(s));
    const restore = async () => {
        if (!date || !time) return;
        setBusy(true); setErr('');
        try {
            const token = localStorage.getItem('authToken') || undefined;
            const moved = await rescheduleBooking(b.id, date, time, dur, token);
            const status = b.paymentStatus === 'paid' ? 'confirmed' : 'pending';
            const res = await fetch(`/api/admin/bookings/${encodeURIComponent(moved.id)}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ status }),
            });
            if (res.status === 409) throw new Error('SLOT_TAKEN');
            if (!res.ok) throw new Error('FAILED');
            onDone(`Moved to ${fmtDate(date)} · ${time} and restored (${status}).`);
        } catch (e) {
            setErr(e instanceof Error && e.message === 'SLOT_TAKEN' ? 'That time was just taken. Pick another.' : 'Could not restore it. Try again.');
        } finally { setBusy(false); }
    };
    return (
        <div className="space-y-2 pt-1">
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-text-subtle">Bring it back at another time</div>
            <div className="grid grid-cols-2 gap-2">
                <input type="date" value={date} min={toISO(new Date())} onChange={(e) => { setDate(e.target.value); setTime(''); }} className={FLD} aria-label="New date" />
                <select value={time} onChange={(e) => setTime(e.target.value)} className={FLD} aria-label="New time">
                    <option value="">Time…</option>
                    {SLOT_TIMES.map((t) => <option key={t} value={t} disabled={!free(t)}>{t}{free(t) ? '' : ' · booked'}</option>)}
                </select>
            </div>
            {err && <p className="text-xs text-coral">{err}</p>}
            <Button onClick={restore} disabled={!date || !time || busy}>{busy ? 'Restoring…' : 'Move & restore'}</Button>
        </div>
    );
};

// Entries the site puts on her calendar itself around a session (the rest after it, the
// travel to a meetup): part of a booking, never one of their own.
const isHelperEntry = (e: CalEvent) => /^\s*(☕|🚗)/u.test(e.title || '');
// her own timed, busy entries that aren't already a booking's: drawn grey
const ownEntries = (events: CalEvent[], bookings: Booking[]) => {
    const linked = new Set(bookings.filter((b) => b.status !== 'cancelled').map((b) => b.gcalEventId).filter(Boolean));
    return events.filter((e) => !e.allDay && e.busy && e.time && !linked.has(e.id));
};
const dayLabel = (iso: string, todayISO: string) => {
    const d = parseISO(iso);
    const rel = iso === todayISO ? 'Today' : iso === toISO(addDays(parseISO(todayISO), 1)) ? 'Tomorrow' : '';
    const date = d.toLocaleDateString('en-GB', { weekday: rel ? 'short' : 'long', day: 'numeric', month: 'short' });
    return rel ? `${rel} · ${date}` : date;
};
const STATUS_DOT: Record<Booking['status'], string> = { pending: 'bg-coral', confirmed: 'bg-sage', done: 'bg-blue', cancelled: 'bg-mauve' };

// Days as a list, one line per session or calendar entry, in time order: the Today screen,
// and the Schedule on a phone (where seven columns don't fit).
const Agenda: React.FC<{
    days: string[]; todayISO: string; bookings: Booking[]; entries: CalEvent[];
    onBooking: (id: string) => void; onEntry: (e: CalEvent) => void;
    hideEmptyAfter?: number; // days past this index show only when something's on them
}> = ({ days, todayISO, bookings, entries, onBooking, onEntry, hideEmptyAfter }) => (
    <div className="divide-y divide-adm-line">
        {days.map((iso, i) => {
            type Row = { t: string; k: 'b'; b: Booking } | { t: string; k: 'e'; e: CalEvent };
            const rows: Row[] = [
                ...bookings.filter((b) => b.date === iso && b.time && b.status !== 'cancelled').map((b): Row => ({ t: b.time, k: 'b', b })),
                ...entries.filter((e) => e.date === iso && !isHelperEntry(e)).map((e): Row => ({ t: e.time!, k: 'e', e })),
            ].sort((a, b) => a.t.localeCompare(b.t));
            if (!rows.length && hideEmptyAfter !== undefined && i > hideEmptyAfter) return null;
            return (
                <div key={iso} className="px-4 py-3">
                    <div className={`text-[0.7rem] uppercase tracking-[0.14em] mb-1.5 ${iso === todayISO ? 'text-lilac font-semibold' : 'text-text-subtle'}`}>{dayLabel(iso, todayISO)}</div>
                    {!rows.length && <div className="text-sm text-text-subtle py-1">Nothing booked.</div>}
                    <div className="space-y-1">
                        {rows.map((r) => {
                            if (r.k === 'b') {
                                const b = r.b;
                                const end = b.durationMin ? toHHMM(toMin(b.time) + b.durationMin) : '';
                                return (
                                    <button key={b.id} type="button" onClick={() => onBooking(b.id)}
                                        className="w-full flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 text-left hover:bg-adm-hover transition-colors">
                                        <span className="w-[5.5rem] shrink-0 text-xs tabular-nums text-text-light">{b.time}{end && `–${end}`}</span>
                                        <span className={`w-2 h-2 shrink-0 rounded-full ${STATUS_DOT[b.status]}`} title={b.status} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-text-light truncate">{b.name || '—'}</span>
                                            <span className="block text-xs text-text-subtle truncate">{serviceLabel(b)}</span>
                                        </span>
                                        {b.paymentStatus !== 'paid' && <span className="shrink-0 text-[0.7rem] font-semibold text-coral-deep">Unpaid</span>}
                                    </button>
                                );
                            }
                            const e = r.e;
                            const session = isSessionTitle(e.title);
                            return (
                                <button key={e.id} type="button" onClick={() => onEntry(e)}
                                    title="From your Google Calendar. Click to turn it into a booking."
                                    className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 text-left hover:bg-adm-hover transition-colors ${session ? '' : 'opacity-55 hover:opacity-100'}`}>
                                    <span className="w-[5.5rem] shrink-0 text-xs tabular-nums text-text-subtle">{e.time}{e.endTime && e.endDate === e.date ? `–${e.endTime}` : ''}</span>
                                    <span className={`w-2 h-2 shrink-0 rounded-full border ${session ? 'border-lilac' : 'border-text-subtle/50'}`} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm text-text-light truncate">{e.title}</span>
                                        <span className="block text-xs text-text-subtle truncate">{session ? 'On your calendar, not a booking yet' : 'Your calendar'}</span>
                                    </span>
                                    {session && <span className="shrink-0 inline-flex items-center gap-1 text-[0.7rem] font-semibold text-lilac">Add <ArrowRight size={12} /></span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        })}
    </div>
);

// A call or meetup that ran longer: add its add-on (call +15 min, meetup +1 hour). Each is
// a small record of its own with its own Paid switch (so it counts in Sales and Revenue),
// and the session gets longer here and on the calendar. If the time after it is booked,
// only the money can be recorded.
const EXTRA: Record<string, { label: string; amount: number }> = {
    call: { label: '+15 min', amount: 110000 },
    meetup: { label: '+1 hour', amount: 360000 },
};
const ExtraTime: React.FC<{
    b: Booking; extras: Booking[]; onDone: (msg: string) => void;
    onToggle: (x: Booking) => void; payBusy: string | null;
}> = ({ b, extras, onDone, onToggle, payBusy }) => {
    const x = EXTRA[b.serviceId];
    const [paid, setPaid] = useState(true);
    const [busy, setBusy] = useState(false);
    const [clash, setClash] = useState(false);
    const [err, setErr] = useState('');
    if (!x) return null;
    const add = async (keepTime: boolean) => {
        setBusy(true); setErr('');
        try {
            const { session } = await addExtraTime(b.id, 1, paid, keepTime, localStorage.getItem('authToken') || undefined);
            const end = session.durationMin ? toHHMM(toMin(session.time) + session.durationMin) : '';
            onDone(keepTime ? `${x.label} recorded (the time stays as it was).` : `${x.label} added. The session now ends at ${end}.`);
            setClash(false);
        } catch (e) {
            if (e instanceof Error && e.message === 'SLOT_TAKEN') setClash(true);
            else setErr('Could not add it. Try again.');
        } finally { setBusy(false); }
    };
    return (
        <div className="space-y-2 pt-1">
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-text-subtle">Ran longer?</div>
            {extras.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-text-light">{e.extraMinutes ? (e.extraMinutes >= 60 ? `+${e.extraMinutes / 60} hour${e.extraMinutes > 60 ? 's' : ''}` : `+${e.extraMinutes} min`) : 'Extra time'}
                        <span className="ml-2 text-text-subtle tabular-nums">{amountLabel(e)}</span></span>
                    <PaymentPill paid={e.paymentStatus === 'paid'} onToggle={() => onToggle(e)} busy={payBusy === e.id} />
                </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => add(false)} disabled={busy}>{busy ? 'Adding…' : `${x.label} · ${fmtAmt(x.amount, 'IDR')}`}</Button>
                <label className="flex items-center gap-2 text-sm text-text-light cursor-pointer select-none">
                    <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="accent-lilac w-4 h-4" />
                    Paid already
                </label>
            </div>
            {clash && (
                <div className="text-xs text-text-subtle space-y-1.5">
                    <p>Another booking starts right after this session, so it can't get longer on the calendar.</p>
                    <button type="button" onClick={() => add(true)} disabled={busy} className="text-lilac font-semibold hover:underline">Record the price only</button>
                </div>
            )}
            {err && <p className="text-xs text-coral">{err}</p>}
        </div>
    );
};

// A line on Today's lists: a reading waiting, or something not paid yet.
const TodayLine: React.FC<{ b: Booking; onOpen: () => void; children?: React.ReactNode; note: React.ReactNode }> = ({ b, onOpen, children, note }) => (
    <div onClick={onOpen} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-adm-hover transition-colors">
        <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-text-light truncate">{b.name || '—'} <span className="font-normal text-text-subtle">· {serviceLabel(b)}</span></div>
            {note}
        </div>
        <div className="shrink-0 text-right text-sm font-semibold text-text-light tabular-nums whitespace-nowrap">{amountLabel(b)}</div>
        {children && <div className="shrink-0" onClick={(e) => e.stopPropagation()}>{children}</div>}
    </div>
);

const BookingsView: React.FC<{ view: 'today' | 'calendar' | 'orders'; onOpen?: (v: 'calendar' | 'orders') => void }> = ({ view: tab, onOpen }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [orderView, setOrderView] = useState<'active' | 'done' | 'cancelled'>('active');
    const [notice, setNotice] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);
    const [calEvents, setCalEvents] = useState<CalEvent[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    // a session from her own calendar being turned into a booking
    const [fromEntry, setFromEntry] = useState<CalEvent | null>(null);
    // her calendar for Today (today and the six days after it)
    const [soonEvents, setSoonEvents] = useState<CalEvent[]>([]);
    // Drag-to-reschedule state for the weekly grid.
    const [drag, setDrag] = useState<null | { id: string; originDay: number; originStart: number; dur: number; curDay: number; curStart: number; moved: boolean }>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);
    const dragStart = useRef({ x: 0, y: 0, colW: 100 });

    const flash = (text: string, kind: 'ok' | 'err') => { setNotice({ text, kind }); setTimeout(() => setNotice(null), 3000); };

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken') || undefined;
            setBookings(await getAllBookings(token));
        } catch (e) {
            if (e instanceof Error && e.message === 'HTTP_401') {
                try { localStorage.removeItem('admin_session'); localStorage.removeItem('authToken'); } catch { /* ignore */ }
                window.location.reload();
                return;
            }
            setError('Could not load bookings. Make sure you are logged in and the server is reachable.');
        } finally {
            setLoading(false);
            fetchEvents(weekStart);
            if (tab === 'today') fetchSoon();
        }
    };

    useEffect(() => { load(); }, []);

    // Pull the owner's Google Calendar events for the visible week (context around bookings).
    const fetchEvents = async (ws: Date) => {
        try {
            const token = localStorage.getItem('authToken') || undefined;
            setCalEvents(await getCalendarEvents(toISO(ws), toISO(addDays(ws, 6)), token));
        } catch { setCalEvents([]); }
    };
    useEffect(() => { fetchEvents(weekStart); }, [weekStart]);
    const fetchSoon = async () => {
        try {
            const t = new Date();
            setSoonEvents(await getCalendarEvents(toISO(t), toISO(addDays(t, 6)), localStorage.getItem('authToken') || undefined));
        } catch { setSoonEvents([]); }
    };
    useEffect(() => { if (tab === 'today') fetchSoon(); }, [tab]);

    const changeStatus = async (id: string, status: Booking['status']) => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/admin/bookings/${id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ status }),
            });
            // a cancelled session can't come back onto a time that's been booked since
            if (res.status === 409) { flash('That time has been booked since. Pick another time in its details to bring it back.', 'err'); setSelectedId(id); return; }
            if (!res.ok) { flash('Could not change the status.', 'err'); return; }
            setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status, ...(status !== 'cancelled' ? { cancelReason: null } : {}) } : b)));
        } catch { flash('Could not change the status.', 'err'); }
    };

    // mark a booking paid / unpaid (the same switch as on Sales)
    const [payBusy, setPayBusy] = useState<string | null>(null);
    const togglePaid = async (b: Booking) => {
        const next = b.paymentStatus === 'paid' ? 'unpaid' : 'paid';
        setPayBusy(b.id);
        setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paymentStatus: next } : x)));
        try {
            // the server's copy: marking a session paid also confirms it and sends its invite
            const saved = await updatePaymentStatus(b.id, next, localStorage.getItem('authToken') || undefined);
            setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, ...saved } : x)));
            if (saved.inviteOnPay === false && b.inviteOnPay) flash('Paid. Confirmed and the calendar invite is sent.', 'ok');
        } catch {
            setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paymentStatus: b.paymentStatus } : x)));
            flash('Could not update payment. Try again.', 'err');
        } finally { setPayBusy(null); }
    };

    // the confirmation went out from Mayanov's WhatsApp: show it on the booking
    const markWaSent = (id: string, at: string) =>
        setBookings((prev) => prev.map((x) => (x.id === id ? { ...x, waConfirmSentAt: at } : x)));

    // ---- drag-to-reschedule (weekly grid) ----
    const beginDrag = (e: React.PointerEvent, b: Booking, di: number) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const body = gridRef.current;
        const colW = body ? (body.getBoundingClientRect().width - 56) / 7 : 100;
        dragStart.current = { x: e.clientX, y: e.clientY, colW };
        const start = toMin(b.time);
        setDrag({ id: b.id, originDay: di, originStart: start, dur: b.durationMin && b.durationMin > 0 ? b.durationMin : 30, curDay: di, curStart: start, moved: false });
    };

    useEffect(() => {
        if (!drag) return;
        const onMove = (e: PointerEvent) => {
            const { x, y, colW } = dragStart.current;
            const dMin = Math.round(((e.clientY - y) / HOUR_H) * 60 / 30) * 30;
            const dCol = Math.round((e.clientX - x) / colW);
            const curStart = clamp(drag.originStart + dMin, DAY_START, DAY_END - drag.dur);
            const curDay = clamp(drag.originDay + dCol, 0, 6);
            const moved = curStart !== drag.originStart || curDay !== drag.originDay;
            if (curStart !== drag.curStart || curDay !== drag.curDay || moved !== drag.moved) {
                setDrag((d) => d && ({ ...d, curStart, curDay, moved }));
            }
        };
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            const d = drag;
            if (!d.moved) { setSelectedId(d.id); setDrag(null); return; }
            const newDate = toISO(addDays(weekStart, d.curDay));
            const newTime = toHHMM(d.curStart);
            setBookings((prev) => prev.map((b) => (b.id === d.id ? { ...b, date: newDate, time: newTime } : b)));
            setDrag(null);
            (async () => {
                try {
                    const token = localStorage.getItem('authToken') || undefined;
                    await rescheduleBooking(d.id, newDate, newTime, undefined, token);
                    flash('Booking moved.', 'ok');
                } catch (err) {
                    flash(err instanceof Error && err.message === 'SLOT_TAKEN' ? 'That slot is taken — reverted.' : 'Move failed — reverted.', 'err');
                } finally { load(); }
            })();
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    }, [drag, weekStart]);

    const scheduled = useMemo(() => bookings.filter((b) => b.date && b.time), [bookings]);
    // Cancelled sessions are dropped from the calendar entirely.
    const calendarSessions = useMemo(() => scheduled.filter((b) => b.status !== 'cancelled'), [scheduled]);
    const orders = useMemo(
        () => bookings.filter((b) => !(b.date && b.time) && !b.extraFor).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
        [bookings],
    );
    const activeOrders = useMemo(
        () => orders.filter((b) => b.status !== 'done' && b.status !== 'cancelled').sort((a, b) => urgency(a) - urgency(b)),
        [orders],
    );
    // the clocks on Orders move on by themselves
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (tab === 'calendar') return;
        setNow(Date.now());
        const iv = window.setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(iv);
    }, [tab]);
    const doneOrders = useMemo(() => orders.filter((b) => b.status === 'done'), [orders]);
    // every cancelled booking, sessions and readings alike, newest first: kept, never deleted
    const cancelledBookings = useMemo(
        () => bookings.filter((b) => b.status === 'cancelled').sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
        [bookings],
    );

    // Jump to the week of the nearest upcoming session once data loads.
    useEffect(() => {
        if (!calendarSessions.length) return;
        const todayISO = toISO(new Date());
        const upcoming = [...new Set(calendarSessions.map((b) => b.date))].filter((d) => d >= todayISO).sort();
        if (upcoming.length) setWeekStart(startOfWeek(parseISO(upcoming[0])));
    }, [calendarSessions.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const byDay = useMemo(() => {
        const map: Record<string, Booking[]> = {};
        calendarSessions.forEach((b) => { (map[b.date] ||= []).push(b); });
        return map;
    }, [calendarSessions]);

    // External Google Calendar events (timed, busy) — excluding our own booking events,
    // which are already drawn as session blocks. Grouped by day for the grid.
    const weekEntries = useMemo(() => ownEntries(calEvents, bookings), [calEvents, bookings]);
    const gcalByDay = useMemo(() => {
        const map: Record<string, CalEvent[]> = {};
        weekEntries.forEach((e) => { (map[e.date] ||= []).push(e); });
        return map;
    }, [weekEntries]);
    const soonEntries = useMemo(() => ownEntries(soonEvents, bookings), [soonEvents, bookings]);
    // Today's lists: readings waiting (paid, most urgent first), and what's not paid yet
    // (still to come or still open; the newest first)
    const readingsDue = useMemo(() => activeOrders.filter((b) => orderClock(b).kind !== 'unpaid'), [activeOrders]);
    const unpaid = useMemo(() => {
        const t = toISO(new Date());
        return bookings
            .filter((b) => b.paymentStatus !== 'paid' && b.status !== 'cancelled' && !(b.date && b.time && b.date < t && b.status === 'done'))
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }, [bookings]);

    const selectedBooking = useMemo(() => bookings.find((b) => b.id === selectedId) || null, [bookings, selectedId]);
    const todayISO = toISO(new Date());
    const weekLabel = `${weekDays[0].toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;

    // the status as one pill; pick another from its menu
    const StatusControl: React.FC<{ b: Booking }> = ({ b }) => (
        <StatusSelect status={b.status} onChange={(s) => s !== b.status && changeStatus(b.id, s)} />
    );


    const navBtn = 'grid place-items-center w-9 h-9 rounded-lg bg-adm-hover text-text-subtle hover:text-text-light hover:bg-adm-hover-2 transition-colors';

    const initialLoading = loading && bookings.length === 0;

    return (
        <div className="space-y-5 pt-20 md:pt-8 p-4 md:px-8">
            <PageHeader
                title={tab === 'today' ? 'Today' : tab === 'calendar' ? 'Schedule' : 'Orders'}
                subtitle={tab === 'today'
                    ? new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Jakarta' })
                    : tab === 'calendar' ? 'Sessions with a time. Click one for details, drag it to move it. Grey is your own calendar: click a session there to make it a booking.' : 'Readings and chats with no fixed time. Click a row for details.'}
                onRefresh={load}
                refreshing={loading}
            >
                <Button onClick={() => setShowAdd(true)} title="Add booking">
                    <Plus size={16} /> <span className="hidden sm:inline">Add booking</span>
                </Button>
            </PageHeader>

            {(showAdd || fromEntry) && (
                <AddBookingModal
                    key={fromEntry?.id || 'new'}
                    bookings={bookings}
                    fromEntry={fromEntry || undefined}
                    onClose={() => { setShowAdd(false); setFromEntry(null); }}
                    onCreated={(msg) => { setShowAdd(false); setFromEntry(null); flash(msg, 'ok'); load(); }}
                />
            )}

            {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/25 rounded-xl px-3 py-2.5">{error}</div>}

            {notice && (
                <div className={`fixed bottom-6 right-6 z-[60] px-3 py-2.5 rounded-xl shadow-lg text-sm border ${notice.kind === 'ok' ? 'bg-sage/15 border-sage/40 text-sage' : 'bg-coral/15 border-coral/40 text-coral-deep'}`}>
                    {notice.text}
                </div>
            )}

            {initialLoading && <LoaderCard />}

            {/* ---------------- CALENDAR — weekly time grid ---------------- */}
            {!initialLoading && tab === 'calendar' && (
                <div className="space-y-5">
                    <div className="rounded-2xl bg-surface-1 border border-adm-line overflow-hidden">
                        {/* week nav */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-adm-line">
                            <div className="flex items-center gap-2">
                                <button aria-label="Previous week" className={navBtn} onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={16} /></button>
                                <button className="px-3 h-9 rounded-lg bg-adm-hover text-text-light text-sm font-medium hover:bg-adm-hover-2 transition-colors" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</button>
                                <button aria-label="Next week" className={navBtn} onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={16} /></button>
                            </div>
                            <h2 className="text-text-light font-serif font-semibold text-sm">{weekLabel}</h2>
                        </div>

                        {/* on a phone: the week as a list of days */}
                        <div className="md:hidden">
                            <Agenda days={weekDays.map(toISO)} todayISO={todayISO} bookings={calendarSessions} entries={weekEntries}
                                onBooking={setSelectedId} onEntry={setFromEntry} />
                        </div>

                        {/* grid */}
                        <div className="hidden md:block overflow-x-auto">
                            <div className="min-w-[760px]">
                                {/* day headers */}
                                <div className="grid border-b border-adm-line" style={{ gridTemplateColumns: '3.5rem repeat(7, minmax(0,1fr))' }}>
                                    <div />
                                    {weekDays.map((d, i) => {
                                        const isToday = toISO(d) === todayISO;
                                        return (
                                            <div key={i} className={`py-2 text-center border-l border-adm-line ${isToday ? 'bg-lilac/10' : ''}`}>
                                                <div className="text-[0.65rem] uppercase tracking-wider text-text-subtle">{WEEKDAYS[i]}</div>
                                                <div className={`text-lg font-serif font-bold ${isToday ? 'text-lilac' : 'text-text-light'}`}>{d.getDate()}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* body: time gutter + 7 day columns */}
                                <div ref={gridRef} className="grid relative select-none" style={{ gridTemplateColumns: '3.5rem repeat(7, minmax(0,1fr))' }}>
                                    {/* time gutter */}
                                    <div className="relative" style={{ height: GRID_H }}>
                                        {HOURS.map((h) => (
                                            <div key={h} className="absolute right-2 -translate-y-1/2 text-[0.65rem] text-text-subtle tabular-nums" style={{ top: (h - DAY_START / 60) * HOUR_H }}>{fmtHour(h)}</div>
                                        ))}
                                    </div>

                                    {/* day columns */}
                                    {weekDays.map((day, di) => {
                                        const dayISO = toISO(day);
                                        const isToday = dayISO === todayISO;
                                        const sessions = (byDay[dayISO] || []);
                                        return (
                                            <div key={di} className={`relative border-l border-adm-line ${isToday ? 'bg-lilac/[0.04]' : ''}`} style={{ height: GRID_H }}>
                                                {/* hour lines */}
                                                {HOURS.map((h) => (
                                                    <div key={h} className="absolute left-0 right-0 border-t border-adm-line" style={{ top: (h - DAY_START / 60) * HOUR_H }} />
                                                ))}
                                                {/* Google Calendar events (read-only context, behind sessions) */}
                                                {(gcalByDay[dayISO] || []).map((e) => {
                                                    const s = toMin(e.time!);
                                                    const en = (e.endTime && e.endDate === dayISO) ? toMin(e.endTime) : (e.endTime ? DAY_END : s + 30);
                                                    const top = clamp(((s - DAY_START) / 60) * HOUR_H, 0, GRID_H);
                                                    const bottom = clamp(((en - DAY_START) / 60) * HOUR_H, 0, GRID_H);
                                                    if (bottom <= 0 || top >= GRID_H) return null;
                                                    const height = Math.max(16, bottom - top - 2);
                                                    const span = `${e.time}${e.endTime ? `–${e.endTime}` : ''} · ${e.title}`;
                                                    // the site's own rest / travel entries are part of a booking: not clickable
                                                    if (isHelperEntry(e)) return (
                                                        <div key={e.id} title={span}
                                                            className="absolute left-1 right-1 rounded-md border border-black/10 px-1.5 py-0.5 overflow-hidden pointer-events-none z-0 opacity-60"
                                                            style={{ top, height, backgroundColor: '#D7D6DE' }}>
                                                            {height > 18 && <div className="text-[10px] font-medium truncate leading-tight" style={{ color: '#54515F' }}>{e.title}</div>}
                                                        </div>
                                                    );
                                                    // a session she typed in (looks like one): stronger, with a dashed edge;
                                                    // a personal entry (gym, lunch): faint. Both can be made a booking.
                                                    const session = isSessionTitle(e.title);
                                                    return (
                                                        <button key={e.id} type="button" onClick={() => setFromEntry(e)}
                                                            title={`${span} (your Google Calendar). Click to turn it into a booking.`}
                                                            className={`group absolute left-1 right-1 rounded-md px-1.5 py-0.5 overflow-hidden text-left z-0 transition hover:ring-2 hover:ring-lilac/60 ${session ? 'border border-dashed border-lilac/70' : 'border border-black/10 opacity-55 hover:opacity-100'}`}
                                                            style={{ top, height, backgroundColor: '#D7D6DE' }}>
                                                            <div className="text-[8px] font-bold uppercase tracking-wider leading-none" style={{ color: session ? '#5B3FA8' : '#4A4753' }}>
                                                                {session ? <>Not a booking yet<span className="hidden group-hover:inline"> · add</span></> : 'Busy'}
                                                            </div>
                                                            {height > 22 && <div className="text-[10px] font-medium truncate leading-tight mt-0.5" style={{ color: '#54515F' }}>{e.title}</div>}
                                                        </button>
                                                    );
                                                })}
                                                {/* session blocks */}
                                                {sessions.map((b) => {
                                                    const start = toMin(b.time);
                                                    const dur = b.durationMin && b.durationMin > 0 ? b.durationMin : 30;
                                                    const top = Math.max(0, ((start - DAY_START) / 60) * HOUR_H);
                                                    const height = Math.max(22, (dur / 60) * HOUR_H - 3);
                                                    const endMin = start + dur;
                                                    const endStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
                                                    return (
                                                        <div
                                                            key={b.id}
                                                            onPointerDown={(e) => beginDrag(e, b, di)}
                                                            title={`${b.time}–${endStr} · ${serviceLabel(b)} · ${b.name}${b.paymentStatus === 'paid' ? '' : ' · unpaid'} — click for details, drag to reschedule`}
                                                            className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 text-left overflow-hidden transition-shadow cursor-grab active:cursor-grabbing touch-none ${BLOCK_STYLE[b.status]} ${selectedId === b.id ? 'ring-2 ring-black/60' : ''} ${drag?.id === b.id ? 'opacity-30' : ''}`}
                                                            style={{ top, height }}
                                                        >
                                                            {b.paymentStatus !== 'paid' && <span title="Unpaid" className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-coral-deep" />}
                                                            {height < 34 ? (
                                                                // a 30-minute session: one line, the time and who
                                                                <div className="text-[10px] font-semibold leading-tight truncate pr-2"><span className="tabular-nums opacity-80">{b.time}</span> {b.name}</div>
                                                            ) : (
                                                                <>
                                                                    <div className="text-[9px] font-semibold leading-none tabular-nums opacity-90 pr-2">{b.time}–{endStr}</div>
                                                                    <div className="text-[11px] font-semibold leading-tight truncate mt-0.5">{b.name}</div>
                                                                    {height > 44 && <div className="text-[10px] leading-tight truncate opacity-90">{serviceLabel(b)}</div>}
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                    {drag && drag.moved && (
                                        <div className="absolute z-30 pointer-events-none rounded-md border-2 border-lilac bg-lilac/25 px-1.5 py-1 overflow-hidden shadow-lg"
                                            style={{
                                                left: `calc(3.5rem + (100% - 3.5rem) * ${drag.curDay} / 7 + 2px)`,
                                                width: `calc((100% - 3.5rem) / 7 - 8px)`,
                                                top: ((drag.curStart - DAY_START) / 60) * HOUR_H,
                                                height: Math.max(22, (drag.dur / 60) * HOUR_H - 3),
                                            }}>
                                            <div className="text-[9px] font-bold tabular-nums text-lilac leading-none">{toHHMM(drag.curStart)}–{toHHMM(drag.curStart + drag.dur)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {drag && (
                        <p className="text-center text-lilac text-xs">Drop to move to {WEEKDAYS[drag.curDay]} {toHHMM(drag.curStart)}</p>
                    )}
                    {calendarSessions.length === 0 && !loading && !error && (
                        <p className="text-center text-text-subtle text-sm py-4">No scheduled sessions yet.</p>
                    )}
                    {cancelledBookings.some((b) => b.date && b.time) && (
                        <p className="text-center text-text-subtle text-xs">Cancelled sessions leave the calendar and free their time. They're kept under Orders → Cancelled.</p>
                    )}

                </div>
            )}

            {/* ---------------- TODAY — the day's work, on one screen ---------------- */}
            {!initialLoading && tab === 'today' && (() => {
                const days = Array.from({ length: 7 }, (_, i) => toISO(addDays(parseISO(todayISO), i)));
                const head = (title: string, count: number, go?: () => void, goLabel?: string) => (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-adm-line">
                        <h2 className="text-sm font-serif font-semibold text-text-light">{title}{count > 0 && <span className="ml-1.5 text-text-subtle font-sans font-normal">{count}</span>}</h2>
                        {go && <button type="button" onClick={go} className="inline-flex items-center gap-1 text-xs text-lilac hover:underline">{goLabel} <ArrowRight size={12} /></button>}
                    </div>
                );
                return (
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
                        <Card className="overflow-hidden">
                            {head('Sessions', 0, onOpen && (() => onOpen('calendar')), 'Schedule')}
                            {/* today and tomorrow always; the days after only when something's on */}
                            <Agenda days={days} todayISO={todayISO} bookings={calendarSessions} entries={soonEntries}
                                onBooking={setSelectedId} onEntry={setFromEntry} hideEmptyAfter={1} />
                        </Card>
                        <div className="space-y-5">
                            <Card className="overflow-hidden">
                                {head('Readings to send', readingsDue.length, onOpen && (() => onOpen('orders')), 'Orders')}
                                {readingsDue.length === 0
                                    ? <p className="px-4 py-5 text-sm text-text-subtle">Nothing waiting. All readings are sent.</p>
                                    : <div className="divide-y divide-adm-line">
                                        {readingsDue.map((b) => (
                                            <TodayLine key={b.id} b={b} onOpen={() => setSelectedId(b.id)} note={<ClockNote b={b} now={now} />}>
                                                <StatusControl b={b} />
                                            </TodayLine>
                                        ))}
                                    </div>}
                            </Card>
                            <Card className="overflow-hidden">
                                {head('Not paid yet', unpaid.length)}
                                {unpaid.length === 0
                                    ? <p className="px-4 py-5 text-sm text-text-subtle">Everything is paid.</p>
                                    : <div className="divide-y divide-adm-line">
                                        {unpaid.map((b) => (
                                            <TodayLine key={b.id} b={b} onOpen={() => setSelectedId(b.id)}
                                                note={<div className="text-[0.7rem] text-text-subtle tabular-nums mt-0.5">
                                                    {b.date && b.time ? `Session ${fmtDate(b.date)} · ${b.time}` : b.extraFor ? `Extra time · session ${fmtDate(b.createdAt)}` : `Ordered ${fmtDate(b.createdAt)}`}
                                                </div>}>
                                                <PaymentPill paid={false} onToggle={() => togglePaid(b)} busy={payBusy === b.id} />
                                            </TodayLine>
                                        ))}
                                    </div>}
                            </Card>
                        </div>
                    </div>
                );
            })()}

            {/* selected booking (session or order): the details, in one popup */}
            {selectedBooking && (() => {
                const b = selectedBooking;
                const phone = phoneOf(b.contact);
                const email = emailOf(b.contact);
                const method = paymentMethodOf(b);
                const timed = !!(b.date && b.time);
                const endStr = timed && b.durationMin ? toHHMM(toMin(b.time) + b.durationMin) : '';
                const Field: React.FC<{ label: string; children: React.ReactNode; wide?: boolean }> = ({ label, children, wide }) => (
                    <div className={wide ? 'col-span-2' : ''}>
                        <div className="text-[0.65rem] uppercase tracking-[0.14em] text-text-subtle mb-1">{label}</div>
                        <div className="text-sm text-text-light break-words">{children}</div>
                    </div>
                );
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
                        <div className="relative w-full max-w-md bg-surface-1 border border-adm-line-2 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="px-5 pt-5 pb-4 border-b border-adm-line">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-xs text-text-subtle tabular-nums">
                                            {timed ? `${fmtDate(b.date)} · ${b.time}${endStr ? `–${endStr}` : ''}` : `Ordered ${fmtDate(b.createdAt)}`}
                                            <span className="mx-1.5">·</span>{b.market === 'ID' ? 'Indonesia' : 'Global'}
                                            {b.source === 'manual' && <><span className="mx-1.5">·</span>added by hand</>}
                                        </div>
                                        <h3 className="mt-1.5 text-xl font-serif font-bold text-text-light leading-snug">{b.name || '—'}</h3>
                                        <div className="text-sm text-text-subtle mt-0.5">{serviceLabel(b)}</div>
                                    </div>
                                    <button aria-label="Close" onClick={() => setSelectedId(null)} className="shrink-0 grid place-items-center w-8 h-8 rounded-lg text-text-subtle hover:text-text-light hover:bg-adm-hover-2 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-4">
                                <Field label="WhatsApp">{phone || '—'}</Field>
                                <Field label="Email">{email || '—'}</Field>
                                {b.dob && <Field label="Born">{fmtDate(b.dob)}</Field>}
                                {b.ref && <Field label="Ref"><span className="font-mono text-xs">{b.ref}</span></Field>}
                                {b.question && <Field label="Question" wide><span className="italic">“{b.question}”</span></Field>}
                            </div>

                            <div className="px-5 py-4 border-t border-adm-line bg-adm-hover space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-base font-serif font-bold text-text-light tabular-nums">{amountLabel(b)}</div>
                                        {method && <div className="text-xs text-text-subtle">{method}</div>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <PaymentPill paid={b.paymentStatus === 'paid'} onToggle={() => togglePaid(b)} busy={payBusy === b.id} />
                                        <StatusControl b={b} />
                                    </div>
                                </div>
                                {b.inviteOnPay && b.status !== 'cancelled' && (
                                    <p className="text-xs text-text-subtle">The calendar invite{b.serviceId === 'meetup' ? '' : ' and Meet link'} go out when you mark it paid.</p>
                                )}
                                <WaConfirmButton b={b} onSent={(at) => markWaSent(b.id, at)} />
                                {timed && b.status !== 'cancelled' && EXTRA[b.serviceId] && (
                                    <ExtraTime key={b.id} b={b} extras={bookings.filter((x) => x.extraFor && x.extraFor === (b.ref || b.id))}
                                        onDone={(msg) => { flash(msg, 'ok'); load(); }} onToggle={togglePaid} payBusy={payBusy} />
                                )}
                                {b.status === 'cancelled' && timed && (
                                    <RestoreAt key={b.id} b={b} bookings={bookings}
                                        onDone={(msg) => { setSelectedId(null); flash(msg, 'ok'); load(); }} />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ---------------- ORDERS (no fixed time) — one aligned list ---------------- */}
            {!initialLoading && tab === 'orders' && (() => {
                const list = orderView === 'active' ? activeOrders : orderView === 'done' ? doneOrders : cancelledBookings;
                const COLS = 'md:grid md:grid-cols-[8.5rem_minmax(0,1.2fr)_minmax(0,1.5fr)_7.5rem_6rem_7.5rem_8.5rem] md:items-center md:gap-4';
                return (
                    <Card className="overflow-hidden">
                        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-adm-line">
                            <Segmented size="sm" value={orderView} onChange={setOrderView}
                                options={[{ id: 'active', label: 'To do', count: activeOrders.length }, { id: 'done', label: 'Done', count: doneOrders.length }, { id: 'cancelled', label: 'Cancelled', count: cancelledBookings.length }]} />
                            <span className="text-xs text-text-subtle">{orderView === 'active' ? 'Most urgent first' : orderView === 'cancelled' ? 'Sessions & readings · newest first' : 'Newest first'}</span>
                        </div>

                        {list.length > 0 && (
                            <div className={`hidden ${COLS} px-4 py-2 text-[0.65rem] uppercase tracking-[0.14em] text-text-subtle border-b border-adm-line`}>
                                <div>Ordered</div><div>Customer</div><div>Service</div><div className="text-right">Amount</div><div>Payment</div><div>Status</div><div>WhatsApp</div>
                            </div>
                        )}

                        {!error && !loading && list.length === 0 && (
                            <div className="text-center py-16 text-text-subtle">
                                <ShoppingBag size={32} className="mx-auto mb-3 opacity-40" />
                                <p className="text-sm">{orderView === 'active' ? 'Nothing waiting. All orders are answered.' : orderView === 'cancelled' ? 'Nothing cancelled.' : 'No finished orders yet.'}</p>
                            </div>
                        )}

                        <div className="divide-y divide-adm-line">
                            {list.map((b) => {
                                const contact = phoneOf(b.contact) || emailOf(b.contact) || b.contact;
                                const method = paymentMethodOf(b);
                                return (
                                    <div key={b.id} onClick={() => setSelectedId(b.id)}
                                        className={`${COLS} px-4 py-3 cursor-pointer hover:bg-adm-hover transition-colors grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5`}>
                                        <div className="tabular-nums col-span-2 md:col-span-1">
                                            <div className="text-xs text-text-subtle">{fmtDate(b.createdAt)}</div>
                                            {orderView === 'active' && <ClockNote b={b} now={now} />}
                                            {orderView === 'cancelled' && b.date && b.time && <div className="text-xs text-text-light">Session {fmtDate(b.date)} · {b.time}</div>}
                                            {orderView === 'cancelled' && b.cancelReason === 'unpaid' && <div className="text-[0.7rem] text-mauve">Not paid within 1 hour</div>}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-text-light truncate">
                                                {b.name || '—'}
                                                <span className="ml-1.5 text-[0.65rem] font-normal text-text-subtle">{b.market === 'ID' ? 'ID' : 'Global'}</span>
                                            </div>
                                            <div className="text-xs text-text-subtle truncate tabular-nums">{contact}</div>
                                        </div>
                                        <div className="min-w-0 col-span-2 md:col-span-1 order-1 md:order-none">
                                            <div className="text-sm text-text-light truncate">{serviceLabel(b)}</div>
                                            {b.question
                                                ? <div className="text-xs text-text-subtle italic truncate">“{b.question}”</div>
                                                : b.source === 'manual' && <div className="text-xs text-text-subtle">Added by hand</div>}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-text-light tabular-nums whitespace-nowrap">{amountLabel(b)}</div>
                                            {method && <div className="text-[0.7rem] text-text-subtle truncate">{method}</div>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1 col-span-2 order-2 md:order-none md:contents">
                                            <div><PaymentPill paid={b.paymentStatus === 'paid'} onToggle={() => togglePaid(b)} busy={payBusy === b.id} /></div>
                                            <div><StatusControl b={b} /></div>
                                            <div><WaConfirmButton compact b={b} onSent={(at) => markWaSent(b.id, at)} /></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                );
            })()}
        </div>
    );
};

export default BookingsView;
