import PageHeader from './ui/PageHeader';
import Segmented from './ui/Segmented';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Phone, Mail, X, Repeat, CalendarDays, ChevronRight } from 'lucide-react';
import { getAllBookings, Booking, BOOKINGS_CHANGED } from '../../services/booking';
import { InlineLoader } from './ui/InlineLoader';
import { amountForBooking, matchesSearch, fmtMoney, fmtDate, serviceLabel, sessionWhen, fmtPhone } from './lib/format';
import { StatusPill, PaymentPill } from './lib/status';
import { extractPhone, normPhone, extractEmail, contactTokens, groupBookings, moneyLabel, type Money } from './lib/customers';
import { firstNameKey } from './lib/calendarEntry';
import { OPEN_CUSTOMER, takePendingCustomer } from './lib/nav';
import BookingsView from './BookingsView';
import { FaWhatsapp } from 'react-icons/fa';

// Stable, opaque client id derived from the identity key (phone/email) — same client
// always gets the same id, and it never exposes the raw phone number.
const clientIdFor = (key: string) => {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < key.length; i++) {
        const ch = key.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const n = (h2 >>> 0) * 4294967296 + (h1 >>> 0);
    return 'CL-' + n.toString(36).toUpperCase().padStart(9, '0').slice(0, 9);
};

type Market = 'ID' | 'Global';
interface Customer {
    key: string;
    clientId: string;
    name: string;
    phone: string;
    email: string;
    bookings: Booking[];
    paid: Money;    // what they've actually paid, per currency (never converted)
    owed: Money;    // booked but not paid yet
    markets: Market[]; // where they've booked: Indonesia, Global or both
    lastSeen: string;
    firstSeen: string;
    services: string[];
    contacts: string[]; // their phone/email tokens, to find others with the same ones
}
const marketOf = (b: Booking): Market => (b.market === 'ID' ? 'ID' : 'Global');
// only to put customers in order (Top spenders) when rupiah and dollars are both in play:
// a rough rate, never shown or used for any total
const ORDER_RATE = 16_000;

const CustomersView: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [sort, setSort] = useState<'spent' | 'recent' | 'bookings'>('spent');
    // the open customer, by key so it stays open when the bookings load again
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const setSelected = (c: Customer | null) => setSelectedKey(c ? c.key : null);
    // a booking opened from their history, in the same details as Orders and Schedule
    const [openBooking, setOpenBooking] = useState<string | null>(null);
    // a booking's details asked for its customer ("Rina · 2 bookings →"): the booking id
    const pendingRef = useRef<string | null>(takePendingCustomer());
    useEffect(() => {
        const on = () => { pendingRef.current = takePendingCustomer(); setTick((t) => t + 1); };
        window.addEventListener(OPEN_CUSTOMER, on);
        return () => window.removeEventListener(OPEN_CUSTOMER, on);
    }, []);
    const [tick, setTick] = useState(0);
    // everyone, or those who've booked in one market (a customer of both is in both)
    const [market, setMarket] = useState<'all' | Market>('all');

    const load = async () => {
        setLoading(true); setError('');
        try {
            const token = localStorage.getItem('authToken') || undefined;
            setBookings(await getAllBookings(token));
        } catch (e) {
            if (e instanceof Error && e.message === 'HTTP_401') {
                try { localStorage.removeItem('admin_session'); localStorage.removeItem('authToken'); } catch { /* ignore */ }
                window.location.reload(); return;
            }
            setError('Could not load data. Make sure you are logged in and the server is reachable.');
        } finally { setLoading(false); }
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

    // a client's bookings that weren't cancelled
    const liveCount = (c: Customer) => c.bookings.filter((b) => b.status !== 'cancelled').length;

    const customers = useMemo<Customer[]>(() => {
        const out: Customer[] = [];
        // Every booking, cancelled ones too, so a client's history is whole; only people
        // with a real booking (paid, or confirmed/done) are listed.
        for (const group of groupBookings(bookings)) {
            // newest first, so the name and number are the latest ones
            const list = [...group].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            const real = list.some((b) => b.status !== 'cancelled' && (b.paymentStatus === 'paid' || b.status === 'confirmed' || b.status === 'done'));
            if (!real) continue;
            const phone = list.map((b) => extractPhone(b.contact)).find(Boolean) || '';
            const email = list.map((b) => extractEmail(b.contact)).find(Boolean) || '';
            const key = normPhone(phone) || email.toLowerCase() || `id:${list[0].id}`;
            const contacts = [...new Set(list.flatMap(contactTokens))];
            const c: Customer = { key, clientId: '', name: list.find((b) => b.name)?.name || '—', phone, email, bookings: list,
                paid: { IDR: 0, USD: 0 }, owed: { IDR: 0, USD: 0 }, markets: [], lastSeen: '', firstSeen: '', services: [], contacts };
            for (const b of list) {
                if (b.status === 'cancelled') continue; // in their history, not in the money or services
                if (!c.markets.includes(marketOf(b))) c.markets.push(marketOf(b));
                // "paid" is money that came in; an unpaid booking only counts as owed
                const amt = amountForBooking(b);
                if (amt) (b.paymentStatus === 'paid' ? c.paid : c.owed)[amt.currency] += amt.amount;
                if (!c.services.includes(b.serviceId)) c.services.push(b.serviceId);
            }
            c.markets.sort(); // 'Global' before 'ID' alphabetically; shown as ID first below
            const dates = list.map((b) => (b.createdAt || '').slice(0, 10)).filter(Boolean).sort();
            c.firstSeen = dates[0] || '';
            c.lastSeen = dates[dates.length - 1] || '';
            out.push(c);
        }
        // two people on one number get keys of their own (with the first name); someone alone
        // on theirs keeps the same client id as before
        const perKey = new Map<string, number>();
        out.forEach((c) => perKey.set(c.key, (perKey.get(c.key) || 0) + 1));
        out.forEach((c) => {
            if ((perKey.get(c.key) || 0) > 1) c.key = `${c.key}|${firstNameKey(c.name) || c.bookings[0].id}`;
            c.clientId = clientIdFor(c.key);
        });
        return out;
    }, [bookings]);
    const selected = useMemo(() => customers.find((c) => c.key === selectedKey) || null, [customers, selectedKey]);
    useEffect(() => {
        const id = pendingRef.current;
        if (!id || !customers.length) return;
        const c = customers.find((x) => x.bookings.some((b) => b.id === id));
        if (c) { pendingRef.current = null; setSelectedKey(c.key); }
    }, [customers, tick]);
    // their nearest session still to come (a call, meetup or live)
    const nextOf = (c: Customer) => {
        const now = Date.now();
        return c.bookings
            .filter((b) => b.date && b.time && b.status !== 'cancelled' && b.status !== 'done' && Date.parse(`${b.date}T${b.time}:00+07:00`) > now)
            .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
    };
    // the other people who share a phone number or email with this one
    const sharing = (c: Customer) => customers.filter((o) => o !== c && o.contacts.some((t) => c.contacts.includes(t)));
    const inMarket = useMemo(() => (market === 'all' ? customers : customers.filter((c) => c.markets.includes(market))), [customers, market]);
    const countIn = (m: Market) => customers.filter((c) => c.markets.includes(m)).length;
    // what Top spenders orders by: the tab's own currency, or both (roughly) under All
    const rank = (m: Money) => (market === 'ID' ? m.IDR : market === 'Global' ? m.USD : m.IDR + m.USD * ORDER_RATE);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        let list = inMarket;
        if (needle) list = list.filter((c) =>
            matchesSearch(needle, c.name, c.phone, c.email, ...c.bookings.map((b) => b.contact), ...c.bookings.map((b) => b.adminNote)));
        return [...list].sort((a, b) =>
            sort === 'recent' ? b.lastSeen.localeCompare(a.lastSeen)
                : sort === 'bookings' ? liveCount(b) - liveCount(a)
                    : (rank(b.paid) - rank(a.paid)) || (rank(b.owed) - rank(a.owed)));
    }, [inMarket, q, sort, market]); // eslint-disable-line react-hooks/exhaustive-deps

    const repeatCount = useMemo(() => inMarket.filter((c) => liveCount(c) > 1).length, [inMarket]);

    const spentLabel = (c: Customer) => moneyLabel(c.paid) || '—';
    const owedLabel = (c: Customer) => moneyLabel(c.owed);
    // where they booked, in their details only (the list has the Indonesia / Global switch)
    const MarketTag: React.FC<{ c: Customer }> = ({ c }) => (
        <span className={`ml-1.5 text-[0.65rem] font-normal ${c.markets.length > 1 ? 'text-lilac' : 'text-text-subtle'}`}>
            {[...c.markets].sort((a) => (a === 'ID' ? -1 : 1)).map((m) => (m === 'ID' ? 'ID' : 'Global')).join(' · ')}
        </span>
    );

    return (
        <div className="space-y-5 pt-20 lg:pt-8 p-4 md:px-8">
            <PageHeader
                title="Customers"
                subtitle={`${inMarket.length} ${inMarket.length === 1 ? 'client' : 'clients'}${market === 'ID' ? ' in Indonesia' : market === 'Global' ? ' abroad' : ''} · ${repeatCount} came back${inMarket.length ? ` (${Math.round((repeatCount / inMarket.length) * 100)}%)` : ''}`}
                onRefresh={load}
                refreshing={loading}
            >
                <Segmented value={market} onChange={setMarket}
                    options={[{ id: 'all', label: 'All', count: customers.length }, { id: 'ID', label: 'Indonesia', count: countIn('ID') }, { id: 'Global', label: 'Global', count: countIn('Global') }]} />
            </PageHeader>

            {error && <div className="text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-xl px-3 py-2.5">{error}</div>}

            {/* toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email or note"
                        className="w-full rounded-lg border border-adm-line-2 bg-surface-1 pl-9 pr-4 py-2 text-sm text-text-light placeholder-text-subtle focus:border-lilac focus:outline-none" />
                </div>
                <Segmented size="sm" value={sort} onChange={setSort}
                    options={[{ id: 'spent', label: 'Top spenders' }, { id: 'bookings', label: 'Most bookings' }, { id: 'recent', label: 'Recent' }]} />
            </div>

            {/* list */}
            <div className="rounded-2xl bg-surface-1 border border-adm-line overflow-hidden">
                {/* one line per person: email, first booking and their history are in their details */}
                <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 text-[0.7rem] uppercase tracking-wider text-text-subtle border-b border-adm-line">
                    <div className="col-span-4">Customer</div>
                    <div className="col-span-3">Contact</div>
                    <div className="col-span-1 text-center">Bookings</div>
                    <div className="col-span-2 text-right">Paid</div>
                    <div className="col-span-2 text-right">Last booking</div>
                </div>
                {filtered.length === 0 ? (
                    loading ? <InlineLoader /> : <p className="text-sm text-text-subtle py-12 text-center">No customers found{q.trim() ? ` for “${q.trim()}”` : ''}.</p>
                ) : filtered.map((c) => {
                    const count = liveCount(c);
                    return (
                        <button key={c.key} onClick={() => setSelected(c)}
                            className="w-full block lg:grid lg:grid-cols-12 lg:gap-3 px-4 lg:px-5 py-3 lg:py-3.5 text-left border-b border-adm-line last:border-0 hover:bg-adm-hover transition-colors items-center">
                            {/* narrow screens: name and what they paid, then one grey line with the rest */}
                            <div className="lg:hidden">
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="font-medium text-text-light truncate">{c.name}</span>
                                    <span className="text-sm text-text-light tabular-nums whitespace-nowrap">{spentLabel(c)}</span>
                                </div>
                                <div className="mt-0.5 flex items-baseline justify-between gap-3 text-xs text-text-subtle">
                                    <span className="truncate tabular-nums">{[c.phone ? fmtPhone(c.phone) : c.email, `${count} booking${count === 1 ? '' : 's'}`, `last ${fmtDate(c.lastSeen)}`].filter(Boolean).join(' · ')}</span>
                                    {owedLabel(c) && <span className="text-coral-deep whitespace-nowrap">{owedLabel(c)} unpaid</span>}
                                </div>
                            </div>
                            <div className="hidden lg:block lg:col-span-4 min-w-0">
                                <div className="font-medium text-text-light truncate">{c.name}</div>
                            </div>
                            {/* their WhatsApp; for someone with only an email (abroad), the email */}
                            <div className="hidden lg:block lg:col-span-3 text-sm text-text-subtle tabular-nums truncate">{c.phone ? fmtPhone(c.phone) : c.email || '—'}</div>
                            <div className="hidden lg:block lg:col-span-1 lg:text-center text-sm tabular-nums">
                                <span className={`inline-flex items-center gap-1 ${count > 1 ? 'text-lilac font-semibold' : 'text-text-light'}`} title={count > 1 ? 'Returning client' : undefined}>
                                    {count > 1 && <Repeat size={11} />}{count}
                                </span>
                            </div>
                            <div className="hidden lg:block lg:col-span-2 lg:text-right text-sm text-text-light tabular-nums">
                                {spentLabel(c)}
                                {/* what they still owe, only when they do */}
                                {owedLabel(c) && <div className="text-xs text-coral-deep">{owedLabel(c)} unpaid</div>}
                            </div>
                            <div className="hidden lg:block lg:col-span-2 lg:text-right text-xs text-text-subtle">{fmtDate(c.lastSeen)}</div>
                        </button>
                    );
                })}
            </div>

            {/* detail modal */}
            {selected && (() => {
                const next = nextOf(selected);
                const shared = sharing(selected);
                const initials = selected.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
                const Stat: React.FC<{ label: string; children: React.ReactNode; sub?: React.ReactNode }> = ({ label, children, sub }) => (
                    <div className="rounded-xl bg-adm-hover px-3 py-2.5 min-w-0">
                        <div className="text-xs text-text-subtle">{label}</div>
                        <div className="text-base sm:text-lg font-serif font-bold text-text-light tabular-nums leading-snug truncate">{children}</div>
                        {sub && <div className="text-[0.7rem] leading-snug tabular-nums mt-0.5">{sub}</div>}
                    </div>
                );
                // a dot on the history line, coloured by how the booking stands
                const dot = (s: Booking['status']) => (s === 'done' ? 'bg-blue' : s === 'confirmed' ? 'bg-sage' : s === 'cancelled' ? 'bg-mauve' : 'bg-coral');
                return (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
                    <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto bg-surface-1 border border-adm-line-2 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} data-lenis-prevent>
                        {/* who they are and how to reach them */}
                        <div className="px-5 sm:px-6 pt-5 pb-5 border-b border-adm-line bg-gradient-to-b from-lilac/[0.08] to-transparent">
                            <div className="flex items-start gap-3.5">
                                <span className="grid place-items-center w-12 h-12 shrink-0 rounded-full bg-lilac/15 text-lilac font-serif font-bold text-lg">{initials}</span>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-2xl font-serif font-bold text-text-light leading-tight">{selected.name}<MarketTag c={selected} /></h3>
                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-text-subtle">
                                        {selected.phone && <a href={`https://wa.me/${normPhone(selected.phone)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-lilac tabular-nums"><Phone size={13} />{fmtPhone(selected.phone)}</a>}
                                        {selected.email && <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 hover:text-lilac break-all"><Mail size={13} className="shrink-0" />{selected.email}</a>}
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)} aria-label="Close" className="shrink-0 grid place-items-center w-8 h-8 -mr-1.5 -mt-1 rounded-lg text-text-subtle hover:text-text-light hover:bg-adm-hover-2 transition-colors"><X size={16} /></button>
                            </div>
                            {selected.phone && (
                                <a href={`https://wa.me/${normPhone(selected.phone)}`} target="_blank" rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-[#25D366] text-[#0b2e17] hover:bg-[#1fbe5b] transition-colors">
                                    <FaWhatsapp size={14} />Message on WhatsApp
                                </a>
                            )}
                            {/* different names on the same number or email: kept apart, shown here */}
                            {shared.length > 0 && (
                                <div className="mt-3 text-xs text-text-subtle">
                                    Same {shared.some((o) => o.contacts.some((t) => t.startsWith('p:') && selected.contacts.includes(t))) ? 'number' : 'email'} as{' '}
                                    {shared.map((o, i) => (
                                        <React.Fragment key={o.key}>{i > 0 && ', '}
                                            <button type="button" onClick={() => setSelected(o)} className="text-lilac hover:underline">{o.name}</button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-5 sm:px-6 py-5 space-y-5">
                            {/* their next session, the thing to know first */}
                            {next && (
                                <button type="button" onClick={() => setOpenBooking(next.id)}
                                    className="group w-full flex items-center gap-3 rounded-xl border border-lilac/30 bg-lilac/[0.06] px-3.5 py-3 text-left hover:bg-lilac/10 transition-colors">
                                    <span className="grid place-items-center w-9 h-9 shrink-0 rounded-lg bg-lilac/15 text-lilac"><CalendarDays size={16} /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs text-lilac font-medium">Next session</span>
                                        <span className="block text-sm text-text-light tabular-nums">{sessionWhen(next)}</span>
                                        <span className="block text-xs text-text-subtle truncate">{serviceLabel(next)}</span>
                                    </span>
                                    <ChevronRight size={16} className="shrink-0 text-text-subtle group-hover:text-lilac transition-colors" />
                                </button>
                            )}

                            <div className="grid grid-cols-3 gap-2">
                                <Stat label="Bookings" sub={selected.bookings.length > liveCount(selected) ? <span className="text-text-subtle">+{selected.bookings.length - liveCount(selected)} cancelled</span> : undefined}>{liveCount(selected)}</Stat>
                                <Stat label="Paid" sub={owedLabel(selected) ? <span className="text-coral-deep">{owedLabel(selected)} unpaid</span> : undefined}>{spentLabel(selected)}</Stat>
                                <Stat label="Client since">{fmtDate(selected.firstSeen)}</Stat>
                            </div>

                            {/* everything they've booked, newest first, on one line down the side */}
                            <div>
                                <div className="text-xs text-text-subtle mb-2">Booking history</div>
                                <ol className="relative">
                                    {[...selected.bookings].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map((b, i, arr) => {
                                        const amt = amountForBooking(b);
                                        const note = b.question || b.adminNote;
                                        return (
                                            <li key={b.id} className="relative pl-6">
                                                {i < arr.length - 1 && <span className="absolute left-[5px] top-5 bottom-0 w-px bg-adm-line-2" aria-hidden />}
                                                <span className={`absolute left-0 top-[1.15rem] w-[11px] h-[11px] rounded-full ring-[3px] ring-surface-1 ${dot(b.status)}`} aria-hidden />
                                                <button type="button" onClick={() => setOpenBooking(b.id)}
                                                    className={`w-full text-left rounded-xl px-3 py-2.5 -mx-1 hover:bg-adm-hover transition-colors ${b.status === 'cancelled' ? 'opacity-60' : ''}`}>
                                                    <div className="flex items-baseline justify-between gap-3">
                                                        <span className="text-sm font-medium text-text-light truncate">{serviceLabel(b)}</span>
                                                        <span className="text-sm font-semibold text-text-light tabular-nums whitespace-nowrap">{amt ? fmtMoney(amt.amount, amt.currency) : '—'}</span>
                                                    </div>
                                                    <div className="mt-0.5 flex items-center justify-between gap-3">
                                                        <span className="text-xs text-text-subtle tabular-nums truncate">{sessionWhen(b) ? sessionWhen(b) : `Ordered ${fmtDate(b.createdAt)}`}</span>
                                                        <span className="flex items-center gap-2 shrink-0">
                                                            <PaymentPill paid={b.paymentStatus === 'paid'} />
                                                            <StatusPill status={b.status} />
                                                        </span>
                                                    </div>
                                                    {note && <div className={`mt-1.5 text-xs text-text-subtle line-clamp-2 ${b.question ? 'font-serif italic' : ''}`}>{b.question ? `“${b.question}”` : b.adminNote}</div>}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                            <div className="font-mono text-[0.65rem] text-text-subtle" title="Client id">{selected.clientId}</div>
                        </div>
                    </div>
                </div>
                );
            })()}
            {openBooking && (
                <BookingsView view="detail" openId={openBooking}
                    onClosed={() => { setOpenBooking(null); load(); }}
                    onCustomer={() => setOpenBooking(null)} />
            )}
        </div>
    );
};

export default CustomersView;
