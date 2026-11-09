import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, X, Plus, ArrowRight, Pencil, Check, CalendarDays, MapPin, Clock, Mail, Cake, StickyNote } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Card from './ui/Card';
import Segmented from './ui/Segmented';
import { getAllBookings, rescheduleBooking, getCalendarEvents, createManualBooking, updatePaymentStatus, addExtraTime, updateBookingDetails, BOOKINGS_CHANGED, Booking, CalEvent, SLOT_TIMES, CLOSING_TIME, slotNeed } from '../../services/booking';
import { LoaderCard } from './ui/InlineLoader';
import WaConfirmButton, { waNumberOf } from './WaConfirmButton';
import EmailConfirmButton from './EmailConfirmButton';
import { amountForBooking, refInWords, packageEn, SERVICE_NAME, fmtDate, serviceTitle, packageOf, serviceLabel, amountLabel, paymentMethodOf, phoneOf, emailOf, orderClock, spanLabel, fmtPhone } from './lib/format';
import { StatusSelect, PaymentPill } from './lib/status';
import { sameCustomer, normPhone as waNumber, moneyLabel, type Money } from './lib/customers';
import { openCustomerOf } from './lib/nav';
import { isSessionTitle, nameFromTitle, entryMinutes, serviceFromTitle, matchCustomers } from './lib/calendarEntry';

// Services offered — id drives revenue colour/stacking; name is the display label.
const MANUAL_SERVICES: { id: string; name: string }[] = [
    { id: 'chat', name: 'Konsultasi via Chat' },
    { id: 'call', name: 'Panggilan Suara & Video' },
    { id: 'meetup', name: 'Sesi Tatap Muka' },
    { id: 'special', name: 'Edisi Spesial' },
    { id: '3card', name: '3-Card Spread' },
    { id: '5card', name: '5-Card Deep' },
    { id: 'live', name: 'Live Session' },
    // any amount, typed in by hand (no packages)
    { id: 'payl', name: 'Pay as you like' },
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

// Sessions with a time of their own (they go on the calendar); readings and chats don't.
const TIMED = new Set(['call', 'meetup', 'live']);
const CHIP_NAME: Record<string, string> = {
    chat: 'Chat', call: 'Call', meetup: 'Meetup', special: 'Special', '3card': '3-Card', '5card': '5-Card', live: 'Live', payl: 'Pay as you like',
};
const chipCls = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm transition-colors ${on ? 'border-lilac bg-lilac text-white' : 'border-adm-line-2 text-text-light hover:border-lilac/60'}`;
const SECTION = 'text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-2';
type Client = { key: string; name: string; contact: string; phone: string; email: string; count: number };
// a phone written any way (0812…, 62812…, +62 812…) → the same digits
const phoneTail = (p: string) => normPhone(p).replace(/^(62|0)/, '');
const dayShort = (iso: string) => parseISO(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const bookingsWord = (n: number) => `${n} booking${n === 1 ? '' : 's'}`;

// Who it may be: name words that start with what's typed first, then a name containing it,
// a phone with those digits, an email; then the calendar-style guess ("ika" → "Ika Putri").
const searchClients = (q: string, clients: Client[], max = 6): Client[] => {
    const t = q.trim().toLowerCase();
    if (!t) return clients.slice(0, 5); // the most recent
    const digits = phoneTail(t);
    const scored = clients.map((c) => {
        const n = c.name.toLowerCase();
        let s = 0;
        if (n.split(/\s+/).some((w) => w.startsWith(t)) || n.startsWith(t)) s = 3;
        else if (n.includes(t)) s = 2;
        else if (digits.length >= 3 && phoneTail(c.phone).includes(digits)) s = 2;
        else if (c.email.toLowerCase().includes(t) || c.contact.toLowerCase().includes(t)) s = 1;
        return { c, s };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || b.c.count - a.c.count).map((x) => x.c);
    matchCustomers(q, clients.filter((c) => c.name)).forEach((c) => { if (!scored.includes(c)) scored.push(c); });
    return scored.slice(0, max);
};

// Modal to record a booking taken manually (e.g. over WhatsApp). With `fromEntry`, it turns
// a session Mayanov put in her Google Calendar herself into a booking: its time comes from
// the entry, and the entry itself becomes the booking's (nothing new on her calendar).
// Laid out in the order she thinks of it: who, what, when, paid, then anything unusual
// tucked under "More options".
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
    const [customAmount, setCustomAmount] = useState('');
    const [customCur, setCustomCur] = useState<'IDR' | 'USD'>('IDR');
    const [tip, setTip] = useState('');
    const [showTip, setShowTip] = useState(false);
    const [orderDate, setOrderDate] = useState(fromEntry?.date || today);
    const [statusSet, setStatusSet] = useState<'confirmed' | 'done' | 'pending' | null>(null);
    const [payment, setPayment] = useState<'paid' | 'unpaid'>('paid');
    const [question, setQuestion] = useState('');
    const [more, setMore] = useState(false);
    const [schedule, setSchedule] = useState(Boolean(fromEntry) || TIMED.has(serviceId));
    const [date, setDate] = useState(fromEntry?.date || today);
    const [time, setTime] = useState(fromEntry?.time || '11:00');
    const [durationMin, setDurationMin] = useState(fromEntry ? String(entryMin) : '60');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    // Everyone already in the dashboard, one per phone (or contact), newest first.
    const clients = useMemo(() => {
        const map = new Map<string, Client>();
        bookings.forEach((b) => {
            if (b.extraFor) return; // extra time is part of a session, not another booking
            const phone = extractPhone(b.contact);
            const key = normPhone(phone) || (b.contact || '').trim().toLowerCase();
            if (!key) return;
            const c = map.get(key);
            if (c) c.count++;
            else map.set(key, { key, name: b.name || '', contact: b.contact || '', phone, email: emailOf(b.contact), count: 1 });
        });
        return [...map.values()].filter((c) => c.name);
    }, [bookings]);

    // ── Customer: one search box. Pick someone, or "+ New customer" to type their details.
    // (a name only from an entry that looks like a session: "Finalize Website" isn't anyone)
    const guess = fromEntry && isSessionTitle(fromEntry.title) ? nameFromTitle(fromEntry.title) : '';
    const guessExact = guess ? clients.find((c) => c.name.trim().toLowerCase() === guess.toLowerCase()) : undefined;
    const [picked, setPicked] = useState<Client | null>(guessExact || null);
    const [creating, setCreating] = useState(false);
    const [query, setQuery] = useState(guessExact ? '' : guess);
    const [guessed, setGuessed] = useState(Boolean(guess) && !guessExact);
    const [open, setOpen] = useState(false);
    const [hi, setHi] = useState(0);
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const results = useMemo(() => searchClients(query, clients), [query, clients]);
    const choose = (c: Client | null) => {
        setOpen(false);
        setGuessed(false);
        if (c) { setPicked(c); setCreating(false); return; }
        setCreating(true); setName(query.trim()); setContact('');
    };
    const change = () => { setPicked(null); setCreating(false); setQuery(''); setOpen(true); setHi(0); };
    const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const n = results.length + 1; // + New customer
        if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((hi + 1) % n); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setHi((hi - 1 + n) % n); }
        else if (e.key === 'Enter') { e.preventDefault(); choose(hi < results.length ? results[hi] : null); }
        else if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); }
    };
    const customerName = picked ? picked.name : creating ? name.trim() : '';
    const customerContact = picked ? picked.contact : creating ? contact.trim() : '';

    // ── Service and package: the price comes from the package; Pay as you like is typed in.
    const opts = SERVICE_OPTIONS[serviceId] || [];
    const payl = serviceId === 'payl';
    const opt: SvcOpt | undefined = payl
        ? { label: '', amount: Math.max(0, Number(customAmount) || 0), currency: customCur }
        : opts[detailIdx] || opts[0];
    const baseAmount = opt?.amount || 0;
    const currency: 'IDR' | 'USD' = opt?.currency || 'IDR';
    const tipNum = Math.max(0, Number(tip) || 0);
    const total = baseAmount + tipNum;
    const pickService = (id: string) => {
        if (id === serviceId) return;
        setServiceId(id);
        setDetailIdx(0);
        if (!fromEntry) setSchedule(TIMED.has(id));
    };

    // Picking a timed session prefills its duration for calendar scheduling (a calendar
    // entry keeps its own length: that's when the session really is).
    useEffect(() => {
        if (!fromEntry && opt?.durationMin) setDurationMin(String(opt.durationMin));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceId, detailIdx]);

    // ── When: for sessions; Pay as you like may have one too (off unless switched on).
    const showWhen = !fromEntry && (TIMED.has(serviceId) || payl);
    const sessionDate = fromEntry ? fromEntry.date : schedule ? date : '';
    // a session already over is Done unless she says otherwise
    const status = statusSet || (sessionDate && sessionDate < today ? 'done' : 'confirmed');
    const STATUS_LABEL = { confirmed: 'Confirmed', done: 'Done', pending: 'Pending' } as const;

    const svcName = SERVICE_NAME[serviceId] || serviceId;
    const pkg = !payl && opt && opts.length > 1 ? packageEn(opt.label) : '';
    const when = fromEntry ? `${dayShort(fromEntry.date)} ${fromEntry.time}` : schedule && showWhen ? `${dayShort(date)} ${time}` : '';
    const ready = Boolean(customerName) && baseAmount > 0;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr('');
        if (!customerName) { setErr(creating ? 'Type the customer’s name.' : 'Pick a customer, or add a new one.'); return; }
        if (baseAmount <= 0) { setErr(payl ? 'Type in the amount they pay.' : 'Pick a package.'); return; }
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
                name: customerName, contact: customerContact, question: notes,
                amount: total, currency, orderDate, status, paymentStatus: payment,
                ...(fromEntry
                    ? { date: fromEntry.date, time: fromEntry.time, durationMin: entryMin, linkEventId: fromEntry.id }
                    : schedule && showWhen ? { date, time, durationMin: Number(durationMin) || 60 } : {}),
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
                <div className="flex items-center justify-between px-6 py-4 border-b border-adm-line sticky top-0 z-10 bg-surface-1">
                    <h3 className="text-lg font-serif font-bold text-text-light">{fromEntry ? 'Turn into a booking' : 'Add booking'}</h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-full text-text-subtle hover:text-text-light hover:bg-white/5"><X size={18} /></button>
                </div>
                <form onSubmit={submit} className="px-6 py-5 space-y-5">
                    {fromEntry && (
                        <div className="rounded-lg bg-adm-hover border border-adm-line-2 px-3 py-2.5 text-xs text-text-subtle leading-relaxed">
                            <div className="text-sm text-text-light font-medium">“{fromEntry.title}”</div>
                            <div className="mt-0.5">{fmtDate(fromEntry.date)} · {fromEntry.time}–{fromEntry.endTime || toHHMM(toMin(fromEntry.time || '00:00') + entryMin)} ({entryMin} min)</div>
                            <div className="mt-1.5">Your calendar entry stays as it is; it becomes this booking's entry, so nothing new is added to your calendar. It then counts in Sales, Revenue and Customers.</div>
                        </div>
                    )}

                    {/* Customer */}
                    <section>
                        <div className={SECTION}>Customer</div>
                        {picked ? (
                            <div className="flex items-center gap-3 rounded-lg border border-adm-line-2 bg-adm-hover px-3 py-2.5">
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-text-light truncate">{picked.name}</div>
                                    <div className="text-xs text-text-subtle truncate">{[picked.phone ? fmtPhone(picked.phone) : picked.email, bookingsWord(picked.count)].filter(Boolean).join(' · ')}</div>
                                </div>
                                <button type="button" onClick={change} className="text-xs text-lilac hover:underline shrink-0">Change</button>
                            </div>
                        ) : creating ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name" autoFocus={!name} className={FLD} />
                                    <input value={contact} onChange={(e) => setContact(e.target.value)} autoFocus={Boolean(name)}
                                        placeholder={currency === 'USD' ? 'Email' : 'WhatsApp, 0812…'} aria-label={currency === 'USD' ? 'Email' : 'WhatsApp'} className={FLD} />
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-text-subtle">New customer</span>
                                    <button type="button" onClick={change} className="text-lilac hover:underline">Find an existing one</button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                {guessed && <div className="mb-1.5 text-xs text-text-subtle">From your calendar: <span className="text-text-light">“{guess}”</span>. Pick who it is, or add them.</div>}
                                <input value={query} autoFocus autoComplete="off" placeholder="Search name or number, or add a new one" aria-label="Search or add customer"
                                    onChange={(e) => { setQuery(e.target.value); setGuessed(false); setOpen(true); setHi(0); }}
                                    onFocus={(e) => { setOpen(true); if (guessed) e.currentTarget.select(); }}
                                    onBlur={() => setOpen(false)} onKeyDown={onSearchKey}
                                    role="combobox" aria-expanded={open} aria-controls="mt-customer-list" className={FLD} />
                                {open && (
                                    <ul id="mt-customer-list" role="listbox" className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-lg border border-adm-line-2 bg-surface-1 shadow-xl py-1">
                                        {!query.trim() && results.length > 0 && <li className="px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-text-subtle">Recent</li>}
                                        {results.map((c, i) => (
                                            <li key={c.key} role="option" aria-selected={hi === i}
                                                onMouseDown={(e) => { e.preventDefault(); choose(c); }} onMouseEnter={() => setHi(i)}
                                                className={`px-3 py-2 cursor-pointer flex items-baseline justify-between gap-3 ${hi === i ? 'bg-adm-hover' : ''}`}>
                                                <span className="text-sm text-text-light truncate">{c.name}</span>
                                                <span className="text-xs text-text-subtle whitespace-nowrap">{[c.phone ? fmtPhone(c.phone) : c.email, bookingsWord(c.count)].filter(Boolean).join(' · ')}</span>
                                            </li>
                                        ))}
                                        <li role="option" aria-selected={hi === results.length}
                                            onMouseDown={(e) => { e.preventDefault(); choose(null); }} onMouseEnter={() => setHi(results.length)}
                                            className={`px-3 py-2 cursor-pointer text-sm text-lilac flex items-center gap-1.5 ${results.length ? 'border-t border-adm-line' : ''} ${hi === results.length ? 'bg-adm-hover' : ''}`}>
                                            <Plus size={14} className="shrink-0" /><span className="truncate">New customer{query.trim() ? <> “<span className="font-medium">{query.trim()}</span>”</> : ''}</span>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Service, then its package (or the amount, for Pay as you like) */}
                    <section>
                        <div className={SECTION}>Service</div>
                        <div className="flex flex-wrap gap-1.5">
                            {MANUAL_SERVICES.map((s) => (
                                <button key={s.id} type="button" onClick={() => pickService(s.id)} aria-pressed={serviceId === s.id} className={chipCls(serviceId === s.id)}>
                                    {CHIP_NAME[s.id] || s.name}
                                </button>
                            ))}
                        </div>
                        {payl ? (
                            <div className="mt-3 flex items-center gap-2">
                                <div className="inline-flex rounded-lg border border-adm-line-2 overflow-hidden shrink-0" role="group" aria-label="Currency">
                                    {(['IDR', 'USD'] as const).map((c) => (
                                        <button key={c} type="button" onClick={() => setCustomCur(c)} aria-pressed={customCur === c}
                                            className={`px-3 py-2 text-sm ${customCur === c ? 'bg-lilac text-white' : 'text-text-subtle hover:text-text-light'}`}>{c === 'IDR' ? 'Rp' : '$'}</button>
                                    ))}
                                </div>
                                <input type="number" min="0" step={customCur === 'USD' ? '0.01' : '1000'} inputMode="decimal" value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)} placeholder={customCur === 'USD' ? 'Amount they pay, e.g. 30' : 'Amount they pay, e.g. 200000'}
                                    aria-label="Amount they pay" className={FLD} />
                            </div>
                        ) : opts.length > 1 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {opts.map((o, i) => (
                                    <button key={i} type="button" onClick={() => setDetailIdx(i)} aria-pressed={detailIdx === i}
                                        className={`rounded-lg border px-3 py-1.5 text-left transition-colors ${detailIdx === i ? 'border-lilac bg-lilac/10' : 'border-adm-line-2 hover:border-lilac/60'}`}>
                                        <div className="text-sm text-text-light">{packageEn(o.label)}</div>
                                        <div className="text-xs text-text-subtle tabular-nums">{fmtOptPrice(o)}</div>
                                    </button>
                                ))}
                            </div>
                        ) : opt ? (
                            <div className="mt-2 text-xs text-text-subtle">{packageEn(opt.label)} · {fmtOptPrice(opt)}</div>
                        ) : null}
                    </section>

                    {/* When: sessions only (a calendar entry already has its time, shown above) */}
                    {showWhen && (
                        <section>
                            <div className="flex items-center justify-between mb-2">
                                <div className={SECTION.replace(' mb-2', '')}>When</div>
                                <label className="flex items-center gap-1.5 text-xs text-text-subtle cursor-pointer select-none">
                                    <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} className="accent-lilac w-3.5 h-3.5" />
                                    Put on the calendar
                                </label>
                            </div>
                            {schedule ? (
                                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" className={FLD} />
                                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" className={`${FLD} w-28`} />
                                    <div className="relative">
                                        <input type="number" min="15" step="15" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} aria-label="Minutes" className={`${FLD} w-24 pr-10`} />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-subtle pointer-events-none">min</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-text-subtle">{payl ? 'No session time.' : 'Not on the calendar (e.g. a session already held).'}</div>
                            )}
                        </section>
                    )}

                    {/* Payment */}
                    <section>
                        <div className={SECTION}>Payment</div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex rounded-full border border-adm-line-2 p-0.5" role="group" aria-label="Payment">
                                {(['paid', 'unpaid'] as const).map((p) => (
                                    <button key={p} type="button" onClick={() => setPayment(p)} aria-pressed={payment === p}
                                        className={`px-3.5 py-1 rounded-full text-sm transition-colors ${payment === p ? (p === 'paid' ? 'bg-lilac text-white' : 'bg-adm-hover text-text-light') : 'text-text-subtle hover:text-text-light'}`}>
                                        {p === 'paid' ? 'Paid' : 'Not paid yet'}
                                    </button>
                                ))}
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                {showTip ? (
                                    <span className="flex items-center gap-1.5 text-xs text-text-subtle">
                                        tip
                                        <input type="number" min="0" step="any" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="0" autoFocus
                                            className="w-24 rounded-md border border-adm-line-2 bg-bg-dark px-2 py-1 text-sm text-text-light focus:border-lilac focus:outline-none" aria-label="Tip" />
                                    </span>
                                ) : (
                                    <button type="button" onClick={() => setShowTip(true)} className="text-xs text-lilac hover:underline">+ tip</button>
                                )}
                                <span className="text-base font-bold text-text-light tabular-nums whitespace-nowrap">{fmtAmt(total, currency)}</span>
                            </div>
                        </div>
                    </section>

                    {/* The rest is the same nearly every time: folded away, its values shown */}
                    <section>
                        <button type="button" onClick={() => setMore(!more)} className="w-full flex items-center justify-between gap-3 text-left">
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">More options</span>
                            <span className="text-xs text-text-subtle truncate flex items-center gap-1">
                                {!more && <>Booked {orderDate === today ? 'today' : dayShort(orderDate)} · {STATUS_LABEL[status]}{question.trim() ? ' · note' : ''}</>}
                                <ChevronRight size={14} className={`transition-transform ${more ? 'rotate-90' : ''}`} />
                            </span>
                        </button>
                        {more && (
                            <div className="mt-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LBL}>Booking date</label>
                                        <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={FLD} />
                                    </div>
                                    <div>
                                        <label className={LBL}>Status</label>
                                        <select value={status} onChange={(e) => setStatusSet(e.target.value as 'confirmed' | 'done' | 'pending')} className={FLD}>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="done">Done</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="-mt-1 text-[0.7rem] text-text-subtle">The day they booked: revenue is counted on it.</p>
                                <div>
                                    <label className={LBL}>Notes</label>
                                    <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} placeholder="Their question, or notes…" className={FLD} />
                                </div>
                            </div>
                        )}
                    </section>

                    {err && <div className="text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-lg px-3 py-2">{err}</div>}

                    <div className="border-t border-adm-line pt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0 text-xs text-text-subtle leading-relaxed" aria-live="polite">
                            <span className={customerName ? 'text-text-light font-medium' : ''}>{customerName || 'No customer yet'}</span>
                            {' · '}{svcName}{pkg ? ` ${pkg}` : ''}
                            {when ? ` · ${when}` : ''}
                            {' · '}{baseAmount > 0 ? fmtAmt(total, currency) : payl ? 'no amount yet' : '—'}
                            {' · '}{payment === 'paid' ? 'Paid' : 'Not paid'}
                        </div>
                        <div className="flex justify-end gap-2 shrink-0">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm text-text-subtle hover:text-text-light transition-colors">Cancel</button>
                            <button type="submit" disabled={busy || !ready} className="px-5 py-2 rounded-full bg-lilac text-white text-sm font-semibold hover:bg-lilac-dark hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {busy ? 'Adding…' : fromEntry ? 'Turn into booking' : 'Add booking'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// One view behind two menu items: Schedule (sessions with a time, on the week grid)
// and Orders (readings and chats with no fixed time). Kept as one component so the
// bookings load once and switching between the two is instant.
// The Due column: one short line, the same as Today's "Readings to send" (dueText):
// "21 h left · Tue 14:41", "Waiting 3 d", grey until it matters (amber under 6 h or a chat
// waiting over a day, red once late). The exact date is in the details.
const ClockNote: React.FC<{ b: Booking; now: number }> = ({ b, now }) => {
    const d = dueText(b, now);
    return <div className={`text-sm tabular-nums whitespace-nowrap ${d.cls}`}>{d.text}</div>;
};
// rounded, the way you'd say it: '45 min', '21 h' (under two days), then '3 d'
const leftLabel = (ms: number) => {
    const min = Math.max(0, Math.round(ms / 60_000));
    if (min < 60) return `${min} min`;
    const h = Math.round(min / 60);
    return h < 48 ? `${h} h` : `${Math.round(h / 24)} d`;
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
// The Schedule's colours (index.css): the colour is the service, the style is the status
// (solid confirmed, striped pending, faded done, dashed: on her calendar, not booked yet).
// a Live Session is a call too, so it shares the call's colour
type SvcKey = 'call' | 'meetup' | 'other';
const svcKey = (serviceId?: string): SvcKey => (serviceId === 'call' || serviceId === 'live' ? 'call' : serviceId === 'meetup' ? 'meetup' : 'other');
const blockClass = (b: Booking) => `svc-${svcKey(b.serviceId)} blk blk-${b.status === 'pending' ? 'pending' : b.status === 'done' ? 'done' : 'confirmed'}`;
const STATUS_WORD: Partial<Record<Booking['status'], string>> = { pending: 'Pending', done: 'Done ✓' };

// What the colours and styles mean, under the grid.
const ScheduleKey: React.FC = () => (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.7rem] text-text-subtle">
        {([['call', 'Call & Live'], ['meetup', 'Meetup'], ['other', 'Readings & other']] as const).map(([k, label]) => (
            <span key={k} className={`svc-${k} inline-flex items-center gap-1.5`}><span className="svc-dot w-2.5 h-2.5 rounded-sm" />{label}</span>
        ))}
        <span className="text-text-subtle/40">|</span>
        <span className="svc-call inline-flex items-center gap-1.5"><span className="blk blk-confirmed w-4 h-3 rounded-sm" />Confirmed</span>
        <span className="svc-call inline-flex items-center gap-1.5"><span className="blk blk-pending w-4 h-3 rounded-sm" />Pending</span>
        <span className="svc-call inline-flex items-center gap-1.5"><span className="blk blk-done w-4 h-3 rounded-sm" />Done</span>
        <span className="svc-call inline-flex items-center gap-1.5"><span className="blk-entry w-4 h-3 rounded-sm" />Not booked yet</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 h-3 rounded-sm blk-personal" />Personal</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-coral-deep" />Unpaid</span>
    </div>
);

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
                                        <span className={`svc-${svcKey(b.serviceId)} svc-dot w-2.5 h-2.5 shrink-0 rounded-full ${b.status === 'done' ? 'opacity-50' : ''}`} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-text-light truncate">{b.name || '—'}</span>
                                            <span className="block text-xs text-text-subtle truncate">{serviceLabel(b)}{STATUS_WORD[b.status] && <> · <span className="font-medium">{STATUS_WORD[b.status]}</span></>}</span>
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
                                    <span className={`w-2.5 h-2.5 shrink-0 rounded-full ${session ? `svc-${serviceFromTitle(e.title)} dot-entry` : 'border border-text-subtle/50'}`} />
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

// Today's sessions as one day of the calendar: hours down the side, each session a block
// as tall as it lasts (the Schedule's colours: colour = service, style = status), her own
// calendar entries next to them, and a line at the time it is now.
const DAY_HOUR_H = 64; // px per hour
const DayTimeline: React.FC<{
    iso: string; bookings: Booking[]; entries: CalEvent[]; now: number;
    onBooking: (id: string) => void; onEntry: (e: CalEvent) => void;
}> = ({ iso, bookings, entries, now, onBooking, onEntry }) => {
    type Item = { id: string; start: number; end: number; k: 'b'; b: Booking } | { id: string; start: number; end: number; k: 'e'; e: CalEvent };
    const items: Item[] = [
        ...bookings.filter((b) => b.date === iso && b.time && b.status !== 'cancelled')
            .map((b): Item => ({ id: b.id, start: toMin(b.time), end: toMin(b.time) + (b.durationMin > 0 ? b.durationMin : 60), k: 'b', b })),
        ...entries.filter((e) => e.date === iso && e.time)
            .map((e): Item => ({ id: e.id, start: toMin(e.time!), end: e.endTime && (!e.endDate || e.endDate === e.date) ? Math.max(toMin(e.endTime), toMin(e.time!) + 15) : toMin(e.time!) + 60, k: 'e', e })),
    ].sort((a, b) => a.start - b.start || b.end - a.end);
    // side by side where they overlap: each item a lane, each group of overlapping items
    // shares the width
    const lane = new Map<string, number>(), lanesOf = new Map<string, number>();
    let group: Item[] = [], groupEnd = -1, ends: number[] = [];
    const close = () => { const n = Math.max(1, ends.length); group.forEach((it) => lanesOf.set(it.id, n)); group = []; ends = []; };
    for (const it of items) {
        if (it.start >= groupEnd) { close(); groupEnd = -1; }
        let l = ends.findIndex((e) => e <= it.start);
        if (l < 0) { l = ends.length; ends.push(it.end); } else ends[l] = it.end;
        lane.set(it.id, l); group.push(it); groupEnd = Math.max(groupEnd, it.end);
    }
    close();
    // the hours shown: 10:00–20:00, wider when something's earlier or later
    const from = Math.min(10 * 60, ...items.map((i) => Math.floor(i.start / 60) * 60));
    const to = Math.max(20 * 60, ...items.map((i) => Math.ceil(i.end / 60) * 60));
    const y = (min: number) => ((min - from) / 60) * DAY_HOUR_H;
    const hours = Array.from({ length: (to - from) / 60 + 1 }, (_, i) => from + i * 60);
    // now, in Jakarta
    const jkt = new Date(now + 7 * 3_600_000);
    const nowMin = jkt.getUTCHours() * 60 + jkt.getUTCMinutes();
    const showNow = jkt.toISOString().slice(0, 10) === iso && nowMin >= from && nowMin <= to;
    const sessions = items.filter((i) => i.k === 'b').length;
    return (
        <div className="px-3 pt-3 pb-4">
            {!sessions && <p className="px-1 pb-2 text-sm text-text-subtle">No sessions today.</p>}
            <div className="relative" style={{ height: y(to) + 8 }}>
                {hours.map((h) => (
                    <div key={h} className="absolute left-0 right-0 flex items-start" style={{ top: y(h) }}>
                        <span className="w-11 shrink-0 -mt-[7px] pr-2 text-right text-[0.65rem] tabular-nums text-text-subtle">{toHHMM(h)}</span>
                        <span className="flex-1 border-t border-adm-line" />
                    </div>
                ))}
                <div className="absolute top-0 bottom-0 left-12 right-1">
                    {items.map((it) => {
                        const top = y(it.start), height = Math.max(26, y(it.end) - y(it.start) - 2);
                        const n = lanesOf.get(it.id) || 1, l = lane.get(it.id) || 0;
                        const pos = { top: top + 1, height, left: `calc(${(l / n) * 100}% + 2px)`, width: `calc(${100 / n}% - 4px)` };
                        const span = `${toHHMM(it.start)}–${toHHMM(it.end)}`;
                        const roomy = height >= 44, tight = height < 40;
                        if (it.k === 'b') {
                            const b = it.b;
                            return (
                                <button key={it.id} type="button" onClick={() => onBooking(b.id)} style={pos}
                                    className={`absolute rounded-md px-2 py-1 text-left overflow-hidden hover:ring-2 hover:ring-lilac/50 transition ${blockClass(b)} text-text-light`}>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-xs font-semibold truncate">{b.status === 'done' ? '✓ ' : ''}{b.name || '—'}</span>
                                        {/* a short session: everything on one line */}
                                        {tight && <span className="text-[0.7rem] text-text-subtle truncate tabular-nums">{span} · {serviceTitle(b)}</span>}
                                        {b.paymentStatus !== 'paid' && <span className="shrink-0 ml-auto text-[0.65rem] font-semibold text-coral-deep">Unpaid</span>}
                                    </div>
                                    {!tight && <div className="text-[0.7rem] text-text-subtle truncate tabular-nums">{span}{roomy ? '' : ` · ${serviceTitle(b)}`}</div>}
                                    {roomy && <div className="text-[0.7rem] text-text-subtle truncate">{serviceLabel(b)}{STATUS_WORD[b.status] ? ` · ${STATUS_WORD[b.status]}` : ''}</div>}
                                </button>
                            );
                        }
                        const e = it.e;
                        // the site's own rest / travel around a session: shown, faint, not clickable
                        if (isHelperEntry(e)) return (
                            <div key={it.id} style={pos} title={`${span} · ${e.title}`}
                                className="absolute rounded-md px-2 py-0.5 overflow-hidden pointer-events-none opacity-50 blk-personal">
                                <div className="text-[0.65rem] truncate personal-text">{e.title}</div>
                            </div>
                        );
                        const session = isSessionTitle(e.title);
                        return (
                            <button key={it.id} type="button" onClick={() => onEntry(e)} style={pos}
                                title={`${span} · ${e.title} (your Google Calendar). Click to turn it into a booking.`}
                                className={`absolute rounded-md px-2 py-1 text-left overflow-hidden transition ${session ? `svc-${serviceFromTitle(e.title)} blk-entry bg-surface-1 hover:ring-2 hover:ring-lilac/50` : 'blk-personal border border-black/10 opacity-60 hover:opacity-100'}`}>
                                <div className="text-xs font-medium truncate text-text-light">{e.title}</div>
                                <div className="text-[0.7rem] truncate tabular-nums" style={session ? { color: 'rgb(var(--svc))' } : undefined}>
                                    {span}{session ? ' · not booked yet' : ''}
                                </div>
                            </button>
                        );
                    })}
                    {showNow && (
                        <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: y(nowMin) }}>
                            <div className="relative border-t-2" style={{ borderColor: '#e5484d' }}>
                                <span className="absolute -left-1 -top-[5px] w-2 h-2 rounded-full" style={{ background: '#e5484d' }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

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

// Fix a booking after it's saved: the customer's name, their WhatsApp / email, the price.
const EditDetails: React.FC<{ b: Booking; onSaved: (b: Booking) => void; onCancel: () => void }> = ({ b, onSaved, onCancel }) => {
    const [name, setName] = useState(b.name || '');
    const [contact, setContact] = useState(b.contact || '');
    const cur = amountForBooking(b);
    const [amount, setAmount] = useState(cur ? String(cur.amount) : '');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setErr('The name is needed.'); return; }
        const fields: { name?: string; contact?: string; amount?: number } = {};
        if (name.trim() !== (b.name || '')) fields.name = name.trim();
        if (contact.trim() !== (b.contact || '')) fields.contact = contact.trim();
        const amt = Number(amount);
        if (amount !== '' && Number.isFinite(amt) && amt >= 0 && amt !== cur?.amount) fields.amount = amt;
        if (!Object.keys(fields).length) { onCancel(); return; }
        setBusy(true); setErr('');
        try { onSaved(await updateBookingDetails(b.id, fields, localStorage.getItem('authToken') || undefined)); }
        catch { setErr('Could not save. Try again.'); setBusy(false); }
    };
    return (
        <form onSubmit={save} className="px-5 py-4 space-y-3">
            <div>
                <label className={LBL}>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={FLD} autoFocus />
            </div>
            <div>
                <label className={LBL}>WhatsApp / email</label>
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="WA: 0812… · Email: …" className={FLD} />
            </div>
            <div>
                <label className={LBL}>Price ({b.market === 'ID' ? 'Rp' : '$'})</label>
                <input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={FLD} />
            </div>
            {err && <p className="text-xs text-coral">{err}</p>}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full text-sm text-text-subtle hover:text-text-light transition-colors">Cancel</button>
                <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
            </div>
        </form>
    );
};

// A private note on a booking, only shown here ("prefers English", "follow up in March").
const PrivateNote: React.FC<{ b: Booking; onSaved: (b: Booking) => void }> = ({ b, onSaved }) => {
    const [note, setNote] = useState(b.adminNote || '');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const dirty = note.trim() !== (b.adminNote || '');
    const [open, setOpen] = useState(!!b.adminNote);
    if (!open) return (
        <div className="px-5 pb-4">
            <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs text-text-subtle hover:text-lilac transition-colors"><StickyNote size={13} />Add a private note</button>
        </div>
    );
    const save = async () => {
        setBusy(true); setErr('');
        try { onSaved(await updateBookingDetails(b.id, { adminNote: note.trim() }, localStorage.getItem('authToken') || undefined)); }
        catch { setErr('Could not save the note.'); }
        finally { setBusy(false); }
    };
    return (
        <div className="px-5 pb-4">
            <label className="flex items-center gap-1.5 text-xs text-text-subtle mb-1.5"><StickyNote size={13} />Private note <span className="opacity-70">· only you see this</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Only you see this" className={FLD} autoFocus={!b.adminNote} />
            {(dirty || err) && (
                <div className="mt-1.5 flex items-center justify-end gap-3">
                    {err && <span className="text-xs text-coral">{err}</span>}
                    {dirty && <button type="button" onClick={() => { setNote(b.adminNote || ''); if (!b.adminNote) setOpen(false); }} className="text-xs text-text-subtle hover:text-text-light">Undo</button>}
                    {dirty && <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save note'}</Button>}
                </div>
            )}
        </div>
    );
};

// A reading waiting on Today: who and what on the left (the price small under it), when
// it's due on the right in one line, coloured only when it's close or late, and a Done
// button (everything here is confirmed already, so a status menu would only repeat it).
const dueText = (b: Booking, now: number): { text: string; cls: string } => {
    const c = orderClock(b);
    if (c.kind === 'unpaid') return { text: 'Not paid yet', cls: 'text-text-subtle' };
    // a chat has no promised time: it turns amber after a day, since nothing else warns
    if (c.kind === 'waiting') return { text: `Waiting ${leftLabel(now - c.since)}`, cls: now - c.since > 24 * 3_600_000 ? 'due-soon-text' : 'text-text-subtle' };
    const left = c.due - now;
    const at = new Date(c.due);
    const sameDay = (x: Date, y: Date) => x.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) === y.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const time = at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    const when = sameDay(at, new Date(now)) ? `today ${time}` : `${at.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Asia/Jakarta' })} ${time}`;
    if (left < 0) return { text: `Overdue ${leftLabel(-left)}`, cls: 'due-late-text font-semibold' };
    return { text: `${leftLabel(left)} left · ${when}`, cls: left < 6 * 3_600_000 ? 'due-soon-text font-semibold' : 'text-text-subtle' };
};
// The details' top line for a reading or chat still to send: the exact time it's due and
// how long is left ("Due Tue 10 Nov, 14:41 · 21 h left"), or how long a chat has waited.
const detailDue = (b: Booking, now: number): { text: string; cls: string } | null => {
    if ((b.date && b.time) || b.extraFor || b.status === 'done' || b.status === 'cancelled') return null;
    const c = orderClock(b);
    if (c.kind === 'unpaid') return null;
    const fmt = (t: number) => new Date(t).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(/,(?= \d{2}:)/, ',');
    if (c.kind === 'waiting') {
        const late = now - c.since > 24 * 3_600_000;
        return { text: `Waiting ${leftLabel(now - c.since)} · paid ${fmt(c.since)}`, cls: late ? 'due-soon-text' : 'text-text-subtle' };
    }
    const left = c.due - now;
    if (left < 0) return { text: `Overdue ${leftLabel(-left)} · was due ${fmt(c.due)}`, cls: 'due-late-text font-semibold' };
    return { text: `Due ${fmt(c.due)} · ${leftLabel(left)} left`, cls: left < 6 * 3_600_000 ? 'due-soon-text font-semibold' : 'text-text-subtle' };
};
// "Chat · 1 question" for "sasa chat" is just "1 question": the name already says it
const serviceAfterName = (b: Booking) => {
    const title = serviceTitle(b), pkg = packageOf(b);
    return (b.name || '').toLowerCase().includes(title.toLowerCase().split(/[\s/-]/)[0]) && pkg ? pkg : serviceLabel(b);
};
const ReadingLine: React.FC<{ b: Booking; now: number; onOpen: () => void; onDone: () => void }> = ({ b, now, onOpen, onDone }) => {
    const d = dueText(b, now);
    return (
        <div onClick={onOpen} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-adm-hover transition-colors">
            <div className="min-w-0 flex-1">
                <div className="text-sm truncate"><span className="font-medium text-text-light">{b.name || '—'}</span> <span className="text-text-subtle">· {serviceAfterName(b)}</span></div>
                <div className="text-[0.7rem] text-text-subtle tabular-nums mt-0.5">
                    {amountLabel(b)}
                    {/* on a phone the time sits here, under the name */}
                    <span className={`sm:hidden ${d.cls}`}> · {d.text}</span>
                </div>
            </div>
            <div className={`hidden sm:block shrink-0 text-xs tabular-nums whitespace-nowrap ${d.cls}`}>{d.text}</div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDone(); }} title="Mark this reading done (sent)"
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-adm-line-2 text-xs font-medium text-text-light hover:bg-adm-hover-2 transition-colors">
                <Check size={13} className="text-sage" />Done
            </button>
        </div>
    );
};

// A line on Today's lists: something not paid yet.
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

// view 'detail': only one booking's details popup (openId), for another screen (Sales) to
// open the same details as Orders and Schedule; onClosed when it's closed.
const BookingsView: React.FC<{ view: 'today' | 'calendar' | 'orders' | 'detail'; onOpen?: (v: 'calendar' | 'orders') => void; openId?: string; onClosed?: () => void; onCustomer?: () => void }> = ({ view: tab, onOpen, openId, onClosed, onCustomer }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
    const [selectedId, setSelectedId] = useState<string | null>(openId || null);
    const detailOnly = tab === 'detail';
    useEffect(() => { if (detailOnly && !selectedId) onClosed?.(); }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps
    const [editing, setEditing] = useState(false);
    useEffect(() => setEditing(false), [selectedId]);
    // a booking saved on the server: its new copy replaces the old one here
    const replaceBooking = (u: Booking) => setBookings((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...u } : x)));
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

    const loadedOnce = useRef(false);
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
            // (on opening, the effects below already ask for the calendar: only a reload asks again)
            if (loadedOnce.current && !detailOnly) {
                fetchEvents(weekStart);
                if (tab === 'today') fetchSoon();
            }
            loadedOnce.current = true;
        }
    };

    useEffect(() => { load(); }, []);
    // the background sync changed something (a move in Google Calendar, an unpaid booking
    // cancelled): load again, quietly
    const loadRef = useRef(load);
    loadRef.current = load;
    useEffect(() => {
        const again = () => { loadRef.current(); };
        window.addEventListener(BOOKINGS_CHANGED, again);
        return () => window.removeEventListener(BOOKINGS_CHANGED, again);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Pull the owner's Google Calendar events for the visible week (context around bookings).
    const fetchEvents = async (ws: Date) => {
        try {
            const token = localStorage.getItem('authToken') || undefined;
            setCalEvents(await getCalendarEvents(toISO(ws), toISO(addDays(ws, 6)), token));
        } catch { setCalEvents([]); }
    };
    useEffect(() => { if (!detailOnly) fetchEvents(weekStart); }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps
    const fetchSoon = async () => {
        try {
            const t = new Date();
            setSoonEvents(await getCalendarEvents(toISO(t), toISO(addDays(t, 6)), localStorage.getItem('authToken') || undefined));
        } catch { setSoonEvents([]); }
    };
    useEffect(() => { if (tab === 'today') fetchSoon(); }, [tab]);

    const changeStatus = async (id: string, status: Booking['status']): Promise<boolean> => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/admin/bookings/${id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ status }),
            });
            // a cancelled session can't come back onto a time that's been booked since
            if (res.status === 409) { flash('That time has been booked since. Pick another time in its details to bring it back.', 'err'); setSelectedId(id); return false; }
            if (!res.ok) { flash('Could not change the status.', 'err'); return false; }
            setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status, ...(status !== 'cancelled' ? { cancelReason: null } : {}) } : b)));
            return true;
        } catch { flash('Could not change the status.', 'err'); return false; }
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
    const markEmailSent = (id: string, at: string) =>
        setBookings((prev) => prev.map((x) => (x.id === id ? { ...x, paidEmailSentAt: at } : x)));

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
        <div className={detailOnly ? '' : 'space-y-5 pt-20 lg:pt-8 p-4 md:px-8'}>
            {!detailOnly && <PageHeader
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
            </PageHeader>}

            {(showAdd || fromEntry) && (
                <AddBookingModal
                    key={fromEntry?.id || 'new'}
                    bookings={bookings}
                    fromEntry={fromEntry || undefined}
                    onClose={() => { setShowAdd(false); setFromEntry(null); }}
                    onCreated={(msg) => { setShowAdd(false); setFromEntry(null); flash(msg, 'ok'); load(); }}
                />
            )}

            {error && !detailOnly && <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/25 rounded-xl px-3 py-2.5">{error}</div>}

            {notice && (
                <div className={`fixed bottom-6 right-6 z-[60] px-3 py-2.5 rounded-xl shadow-lg text-sm border ${notice.kind === 'ok' ? 'bg-sage/15 border-sage/40 text-sage' : 'bg-coral/15 border-coral/40 text-coral-deep'}`}>
                    {notice.text}
                </div>
            )}

            {initialLoading && !detailOnly && <LoaderCard />}

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
                        <div className="xl:hidden">
                            <Agenda days={weekDays.map(toISO)} todayISO={todayISO} bookings={calendarSessions} entries={weekEntries}
                                onBooking={setSelectedId} onEntry={setFromEntry} />
                        </div>

                        {/* grid */}
                        <div className="hidden xl:block overflow-x-auto">
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
                                                            className="absolute left-1 right-1 rounded-md border border-black/10 px-1.5 py-0.5 overflow-hidden pointer-events-none z-0 opacity-60 blk-personal"
                                                            style={{ top, height }}>
                                                            {height > 18 && <div className="text-[10px] font-medium truncate leading-tight personal-text">{e.title}</div>}
                                                        </div>
                                                    );
                                                    // a session she typed in (looks like one): stronger, with a dashed edge;
                                                    // a personal entry (gym, lunch): faint. Both can be made a booking.
                                                    const session = isSessionTitle(e.title);
                                                    return (
                                                        <button key={e.id} type="button" onClick={() => setFromEntry(e)}
                                                            title={`${span} (your Google Calendar). Click to turn it into a booking.`}
                                                            className={`group absolute left-1 right-1 rounded-md px-1.5 py-0.5 overflow-hidden text-left z-0 transition hover:ring-2 hover:ring-lilac/60 ${session ? `svc-${serviceFromTitle(e.title)} blk-entry bg-surface-1` : 'blk-personal border border-black/10 opacity-55 hover:opacity-100'}`}
                                                            style={{ top, height }}>
                                                            <div className="text-[8px] font-bold uppercase tracking-wider leading-none" style={session ? { color: 'rgb(var(--svc))' } : undefined}>
                                                                {session ? <>Not booked yet<span className="hidden group-hover:inline"> · add</span></> : 'Busy'}
                                                            </div>
                                                            {height > 22 && <div className={`text-[10px] font-medium truncate leading-tight mt-0.5 ${session ? 'text-text-light' : 'personal-text'}`}>{e.title}</div>}
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
                                                            className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 text-left overflow-hidden transition-shadow cursor-grab active:cursor-grabbing touch-none ${blockClass(b)} text-text-light ${selectedId === b.id ? 'ring-2 ring-black/60' : ''} ${drag?.id === b.id ? 'opacity-30' : ''}`}
                                                            style={{ top, height }}
                                                        >
                                                            {b.paymentStatus !== 'paid' && <span title="Unpaid" className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-coral-deep" />}
                                                            {height < 34 ? (
                                                                // a 30-minute session: one line, the time and who
                                                                <div className="text-[10px] font-semibold leading-tight truncate pr-2">{b.status === 'done' && '✓ '}<span className="tabular-nums opacity-80">{b.time}</span> {b.name}</div>
                                                            ) : (
                                                                <>
                                                                    <div className="text-[9px] font-semibold leading-none tabular-nums opacity-90 pr-2">{b.status === 'done' && '✓ '}{b.time}–{endStr}{b.status === 'pending' && ' · pending'}</div>
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

                    <ScheduleKey />
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
                const head = (title: string, count: number, go?: () => void, goLabel?: string) => (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-adm-line">
                        <h2 className="text-sm font-serif font-semibold text-text-light">{title}{count > 0 && <span className="ml-1.5 text-text-subtle font-sans font-normal">{count}</span>}</h2>
                        {go && <button type="button" onClick={go} className="inline-flex items-center gap-1 text-xs text-lilac hover:underline">{goLabel} <ArrowRight size={12} /></button>}
                    </div>
                );
                return (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
                        <Card className="overflow-hidden">
                            {head("Today's schedule", 0, onOpen && (() => onOpen('calendar')), 'Week')}
                            {/* only today, drawn as a day of the calendar */}
                            <DayTimeline iso={todayISO} bookings={calendarSessions} entries={soonEntries} now={now}
                                onBooking={setSelectedId} onEntry={setFromEntry} />
                        </Card>
                        <div className="space-y-5">
                            <Card className="overflow-hidden">
                                {head('Readings to send', readingsDue.length, onOpen && (() => onOpen('orders')), 'Orders')}
                                {readingsDue.length === 0
                                    ? <p className="px-4 py-5 text-sm text-text-subtle">Nothing waiting. All readings are sent.</p>
                                    : <div className="divide-y divide-adm-line">
                                        {readingsDue.map((b) => (
                                            <ReadingLine key={b.id} b={b} now={now} onOpen={() => setSelectedId(b.id)}
                                                onDone={async () => { if (await changeStatus(b.id, 'done')) flash(`${b.name || 'Reading'} marked done. It's under Orders → Done.`, 'ok'); }} />
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
                const due = detailDue(b, now);
                // the same person's bookings: a line that opens them on Customers (only when
                // Customers lists them: something paid, confirmed or done)
                const mine = sameCustomer(b, bookings.filter((x) => !x.extraFor));
                const real = mine.some((x) => x.status !== 'cancelled' && (x.paymentStatus === 'paid' || x.status === 'confirmed' || x.status === 'done'));
                const live = mine.filter((x) => x.status !== 'cancelled').length;
                const paidSum: Money = { IDR: 0, USD: 0 };
                mine.forEach((x) => { const a = amountForBooking(x); if (a && x.paymentStatus === 'paid') paidSum[a.currency] += a.amount; });
                const toCustomer = () => { if (onCustomer) onCustomer(); else { openCustomerOf(b.id); setSelectedId(null); } };
                const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
                    <div className="flex items-center justify-between gap-3 min-h-[2.5rem] py-1">
                        <div className="text-xs text-text-subtle shrink-0">{label}</div>
                        <div className="flex items-center justify-end gap-2 min-w-0">{children}</div>
                    </div>
                );
                // one line of the details: a small icon, the value, and what it is on the right
                const Line: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
                    <div className="flex items-center gap-3 text-sm min-w-0">
                        <span className="grid place-items-center w-8 h-8 shrink-0 rounded-lg bg-adm-hover text-text-subtle">{icon}</span>
                        <span className="min-w-0 flex-1 text-text-light break-words">{children}</span>
                        <span className="shrink-0 text-xs text-text-subtle">{label}</span>
                    </div>
                );
                const Chip: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; mono?: boolean; title?: string }> = ({ icon, children, mono, title }) => (
                    <span title={title} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-adm-hover border border-adm-line text-xs text-text-light whitespace-nowrap tabular-nums ${mono ? 'font-mono' : ''}`}>
                        {icon && <span className="text-text-subtle">{icon}</span>}{children}
                    </span>
                );
                const initial = (b.name || '?').trim().charAt(0).toUpperCase();
                return (
                    <div className={`fixed inset-0 ${detailOnly ? 'z-[90]' : 'z-50'} flex items-center justify-center p-4`}>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
                        <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-surface-1 border border-adm-line-2 rounded-2xl shadow-2xl" data-lenis-prevent>
                            {/* who and what, with when and where as chips */}
                            <div className="px-5 pt-5 pb-5 border-b border-adm-line bg-gradient-to-b from-lilac/[0.08] to-transparent">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-2xl font-serif font-bold text-text-light leading-tight">{b.name || '—'}</h3>
                                        <div className="text-sm text-text-subtle mt-1">{serviceLabel(b)}</div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1 -mr-1.5 -mt-1">
                                        {!editing && (
                                            <button aria-label="Edit" title="Edit name, contact or price" onClick={() => setEditing(true)} className="grid place-items-center w-8 h-8 rounded-lg text-text-subtle hover:text-text-light hover:bg-adm-hover-2 transition-colors">
                                                <Pencil size={15} />
                                            </button>
                                        )}
                                        <button aria-label="Close" onClick={() => setSelectedId(null)} className="grid place-items-center w-8 h-8 rounded-lg text-text-subtle hover:text-text-light hover:bg-adm-hover-2 transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    <Chip icon={<CalendarDays size={12} />}>{timed ? `${fmtDate(b.date)} · ${b.time}${endStr ? `–${endStr}` : ''}` : `Ordered ${fmtDate(b.createdAt)}`}</Chip>
                                    <Chip icon={<MapPin size={12} />}>{b.market === 'ID' ? 'Indonesia' : 'Global'}</Chip>
                                    {b.ref && <Chip mono title={refInWords(b.ref) || 'Booking code'}>{b.ref}</Chip>}
                                    {b.source === 'manual' && <Chip>Added by hand</Chip>}
                                </div>
                                {due && (
                                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-1 border border-adm-line px-3 py-2">
                                        <Clock size={15} className={`shrink-0 ${due.cls}`} />
                                        <span className={`text-sm tabular-nums ${due.cls}`}>{due.text}</span>
                                    </div>
                                )}
                            </div>

                            {editing ? (
                                <EditDetails key={b.id} b={b} onCancel={() => setEditing(false)}
                                    onSaved={(u) => { replaceBooking(u); setEditing(false); flash('Saved.', 'ok'); }} />
                            ) : (<>
                            <div className="px-5 py-4 space-y-4">
                                {/* their profile on Customers, with what they've booked and paid */}
                                {real && (
                                    <button type="button" onClick={toCustomer}
                                        className="group w-full flex items-center gap-3 rounded-xl border border-adm-line px-3 py-2.5 text-left hover:bg-adm-hover hover:border-adm-line-2 transition-colors">
                                        <span className="grid place-items-center w-9 h-9 shrink-0 rounded-full bg-lilac/15 text-lilac font-serif font-bold">{initial}</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-text-light truncate">{b.name || 'Customer'}</span>
                                            <span className="block text-xs text-text-subtle tabular-nums">{live} booking{live === 1 ? '' : 's'}{moneyLabel(paidSum) ? ` · ${moneyLabel(paidSum)} paid` : ''}</span>
                                        </span>
                                        <ChevronRight size={16} className="shrink-0 text-text-subtle group-hover:text-lilac transition-colors" />
                                    </button>
                                )}
                                {(phone || email || timed || b.dob) && (
                                    <div className="space-y-2">
                                        {phone && <Line icon={<FaWhatsapp size={14} />} label="WhatsApp"><a href={`https://wa.me/${waNumber(phone)}`} target="_blank" rel="noopener noreferrer" className="text-lilac hover:underline tabular-nums">{fmtPhone(phone)}</a></Line>}
                                        {email && <Line icon={<Mail size={14} />} label="Email"><a href={`mailto:${email}`} className="text-lilac hover:underline break-all">{email}</a></Line>}
                                        {timed && <Line icon={<ShoppingBag size={14} />} label="Ordered">{fmtDate(b.createdAt)}</Line>}
                                        {b.dob && <Line icon={<Cake size={14} />} label="Born">{fmtDate(b.dob)}</Line>}
                                    </div>
                                )}
                                {b.question && (
                                    <figure className="rounded-xl bg-adm-hover border-l-2 border-lilac/60 px-4 py-3">
                                        <figcaption className="text-xs text-text-subtle mb-1">Their question</figcaption>
                                        <blockquote className="font-serif italic text-[0.95rem] leading-relaxed text-text-light">“{b.question}”</blockquote>
                                    </figure>
                                )}
                            </div>
                            <PrivateNote key={b.id} b={b} onSaved={(u) => { replaceBooking(u); flash('Note saved.', 'ok'); }} />
                            </>)}

                            <div className="px-5 py-4 border-t border-adm-line bg-adm-hover space-y-3">
                                {/* the money first, big; then what's left to do with it */}
                                <div className="flex items-end justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-xs text-text-subtle">Total</div>
                                        <div className="text-xl font-serif font-bold text-text-light tabular-nums leading-tight">{amountLabel(b)}</div>
                                        {method && <div className="text-xs text-text-subtle truncate mt-0.5">{method}</div>}
                                    </div>
                                    <PaymentPill paid={b.paymentStatus === 'paid'} onToggle={() => togglePaid(b)} busy={payBusy === b.id} />
                                </div>
                                <div className="border-t border-adm-line divide-y divide-adm-line">
                                    <Row label="Status"><StatusControl b={b} /></Row>
                                    {/* Indonesia is confirmed on WhatsApp, Global by email */}
                                    {b.status !== 'cancelled' && (b.market === 'ID' ? !!waNumberOf(b.contact) : !!email) && (
                                        <Row label="Confirmation">
                                            {b.market === 'ID'
                                                ? <WaConfirmButton b={b} compact onSent={(at) => markWaSent(b.id, at)} />
                                                : <EmailConfirmButton b={b} onSent={(at) => markEmailSent(b.id, at)} />}
                                        </Row>
                                    )}
                                </div>
                                {b.inviteOnPay && b.status !== 'cancelled' && (
                                    <p className="text-xs text-text-subtle">The calendar invite{b.serviceId === 'meetup' ? '' : ' and Meet link'} go out when you mark it paid.</p>
                                )}
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
                // To do leads with when it's due (the order date is in the details); Done and
                // Cancelled with the order date. One line per order: contact, payment method and
                // the question are in the details a click away.
                const showDue = orderView === 'active';
                const COLS = 'xl:grid xl:grid-cols-[9.5rem_minmax(0,1.1fr)_minmax(0,1.4fr)_7rem_6rem_7.5rem_7.5rem] xl:items-center xl:gap-4';
                return (
                    <Card className="overflow-hidden">
                        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-adm-line">
                            <Segmented size="sm" value={orderView} onChange={setOrderView}
                                options={[{ id: 'active', label: 'To do', count: activeOrders.length }, { id: 'done', label: 'Done', count: doneOrders.length }, { id: 'cancelled', label: 'Cancelled', count: cancelledBookings.length }]} />
                            <span className="text-xs text-text-subtle">{orderView === 'active' ? 'Most urgent first' : orderView === 'cancelled' ? 'Sessions & readings · newest first' : 'Newest first'}</span>
                        </div>

                        {list.length > 0 && (
                            <div className={`hidden ${COLS} px-4 py-2 text-[0.65rem] uppercase tracking-[0.14em] text-text-subtle border-b border-adm-line`}>
                                <div>{showDue ? 'Due' : 'Ordered'}</div><div>Customer</div><div>Service</div><div className="text-right">Amount</div><div>Payment</div><div>Status</div><div>Confirmation</div>
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
                                return (
                                    <div key={b.id} onClick={() => setSelectedId(b.id)}
                                        className={`${COLS} px-4 py-3 cursor-pointer hover:bg-adm-hover transition-colors grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5`}>
                                        {showDue ? <div className="col-span-2 xl:col-span-1 xl:[&>*]:mt-0"><ClockNote b={b} now={now} /></div> : <div className="tabular-nums col-span-2 xl:col-span-1">
                                            <div className="text-xs text-text-subtle">{fmtDate(b.createdAt)}</div>
                                            {orderView === 'cancelled' && b.date && b.time && <div className="text-xs text-text-light">Session {fmtDate(b.date)} · {b.time}</div>}
                                            {orderView === 'cancelled' && b.cancelReason === 'unpaid' && <div className="text-[0.7rem] text-mauve">Not paid within 1 hour</div>}
                                        </div>}
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-text-light truncate">
                                                {b.name || '—'}
                                                <span className="ml-1.5 text-[0.65rem] font-normal text-text-subtle">{b.market === 'ID' ? 'ID' : 'Global'}</span>
                                            </div>
                                        </div>
                                        <div className="min-w-0 col-span-2 xl:col-span-1 order-1 xl:order-none">
                                            <div className="text-sm text-text-light truncate">{serviceLabel(b)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-text-light tabular-nums whitespace-nowrap">{amountLabel(b)}</div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1 col-span-2 order-2 xl:order-none xl:contents">
                                            <div><PaymentPill paid={b.paymentStatus === 'paid'} onToggle={() => togglePaid(b)} busy={payBusy === b.id} /></div>
                                            <div><StatusControl b={b} /></div>
                                            <div>{b.market === 'ID'
                                                ? <WaConfirmButton compact b={b} onSent={(at) => markWaSent(b.id, at)} />
                                                : <EmailConfirmButton hideIdle b={b} onSent={(at) => markEmailSent(b.id, at)} />}</div>
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
