import PageHeader from './ui/PageHeader';
import Segmented from './ui/Segmented';
import React, { useEffect, useMemo, useState } from 'react';
import { Search, Phone, Mail, X, Repeat } from 'lucide-react';
import { getAllBookings, Booking } from '../../services/booking';
import { InlineLoader } from './ui/InlineLoader';
import { amountForBooking, fmtMoney, fmtDate, serviceLabel, sessionWhen } from './lib/format';
import { StatusPill, PaymentPill } from './lib/status';

// ---- contact parsing ----
const extractPhone = (contact?: string) => {
    if (!contact) return '';
    const m = contact.match(/WA:\s*([+\d][\d\s-]*)/i);
    const raw = m ? m[1] : (contact.match(/[+]?\d[\d\s-]{6,}/)?.[0] || '');
    return raw.trim();
};
// Canonical phone key so 0812…, +62 812…, 62812… all collapse to one client.
const normPhone = (raw: string) => {
    const d = (raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('62')) return d;
    if (d.startsWith('0')) return '62' + d.slice(1);
    if (d.startsWith('8') && d.length >= 9 && d.length <= 13) return '62' + d;
    return d;
};
const extractEmail = (contact?: string) => contact?.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || '';

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

interface Customer {
    key: string;
    clientId: string;
    name: string;
    phone: string;
    email: string;
    bookings: Booking[];
    paid: number;   // what they've actually paid, in their market's currency
    owed: number;   // booked but not paid yet
    lastSeen: string;
    firstSeen: string;
    services: string[];
}

const CustomersView: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [sort, setSort] = useState<'spent' | 'recent' | 'bookings'>('spent');
    const [selected, setSelected] = useState<Customer | null>(null);
    // one market at a time, so rupiah and dollar customers aren't ranked together
    const [market, setMarket] = useState<'ID' | 'Global'>('ID');
    const cur = market === 'ID' ? 'IDR' : 'USD';

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

    const customers = useMemo<Customer[]>(() => {
        const map = new Map<string, Customer>();
        // Only real clients: build the directory from confirmed/done bookings.
        // Pending & cancelled are excluded (they may not be genuine).
        const realBookings = bookings.filter((b) => (b.status === 'confirmed' || b.status === 'done') && (b.market === 'ID' ? 'ID' : 'Global') === market);
        // Newest first so "name/phone" reflects the latest booking.
        const sorted = [...realBookings].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        for (const b of sorted) {
            const phone = extractPhone(b.contact);
            const email = extractEmail(b.contact);
            const key = normPhone(phone) || email.toLowerCase() || `id:${b.id}`;
            let c = map.get(key);
            if (!c) {
                c = { key, clientId: clientIdFor(key), name: b.name || '—', phone, email, bookings: [], paid: 0, owed: 0, lastSeen: '', firstSeen: '', services: [] };
                map.set(key, c);
            }
            c.bookings.push(b);
            if (!c.phone && phone) c.phone = phone;
            if (!c.email && email) c.email = email;
            // "spent" is money that came in; an unpaid booking only counts as owed
            const amt = amountForBooking(b);
            if (amt) { if (b.paymentStatus === 'paid') c.paid += amt.amount; else c.owed += amt.amount; }
            if (!c.services.includes(b.serviceId)) c.services.push(b.serviceId);
        }
        // derive first/last seen
        for (const c of map.values()) {
            const dates = c.bookings.map((b) => (b.createdAt || '').slice(0, 10)).filter(Boolean).sort();
            c.firstSeen = dates[0] || '';
            c.lastSeen = dates[dates.length - 1] || '';
        }
        return [...map.values()];
    }, [bookings, market]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        let list = customers;
        if (needle) list = list.filter((c) =>
            c.name.toLowerCase().includes(needle) || c.phone.replace(/\s/g, '').includes(needle.replace(/\s/g, '')) || c.email.toLowerCase().includes(needle));
        return [...list].sort((a, b) =>
            sort === 'recent' ? b.lastSeen.localeCompare(a.lastSeen)
                : sort === 'bookings' ? b.bookings.length - a.bookings.length
                    : (b.paid - a.paid) || (b.owed - a.owed));
    }, [customers, q, sort]);

    const repeatCount = useMemo(() => customers.filter((c) => c.bookings.filter((b) => b.status !== 'cancelled').length > 1).length, [customers]);

    const spentLabel = (c: Customer) => (c.paid ? fmtMoney(c.paid, cur) : '—');

    return (
        <div className="space-y-5 pt-20 md:pt-8 p-4 md:px-8">
            <PageHeader
                title="Customers"
                subtitle={`${customers.length} ${market === 'ID' ? 'Indonesia' : 'Global'} clients · ${repeatCount} returning · grouped by phone number (email if none)`}
                onRefresh={load}
                refreshing={loading}
            >
                <Segmented value={market} onChange={setMarket}
                    options={[{ id: 'ID', label: 'Indonesia · IDR' }, { id: 'Global', label: 'Global · USD' }]} />
            </PageHeader>

            {error && <div className="text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-xl px-3 py-2.5">{error}</div>}

            {/* toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, or email"
                        className="w-full rounded-lg border border-adm-line-2 bg-surface-1 pl-9 pr-4 py-2 text-sm text-text-light placeholder-text-subtle focus:border-lilac focus:outline-none" />
                </div>
                <Segmented size="sm" value={sort} onChange={setSort}
                    options={[{ id: 'spent', label: 'Top spenders' }, { id: 'bookings', label: 'Most bookings' }, { id: 'recent', label: 'Recent' }]} />
            </div>

            {/* list */}
            <div className="rounded-2xl bg-surface-1 border border-adm-line overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 text-[0.7rem] uppercase tracking-wider text-text-subtle border-b border-adm-line">
                    <div className="col-span-3">Customer</div>
                    <div className="col-span-2">WhatsApp</div>
                    <div className="col-span-1 text-center">Bookings</div>
                    <div className="col-span-2 text-right">Paid</div>
                    <div className="col-span-2 text-right">Unpaid</div>
                    <div className="col-span-1 text-right">First</div>
                    <div className="col-span-1 text-right">Last</div>
                </div>
                {filtered.length === 0 ? (
                    loading ? <InlineLoader /> : <p className="text-sm text-text-subtle py-12 text-center">No customers found.</p>
                ) : filtered.map((c) => {
                    const count = c.bookings.length;
                    return (
                        <button key={c.key} onClick={() => setSelected(c)}
                            className="w-full grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-3 px-5 py-3.5 text-left border-b border-adm-line last:border-0 hover:bg-adm-hover transition-colors items-center">
                            <div className="col-span-2 md:col-span-3 min-w-0">
                                <div className="font-medium text-text-light truncate">{c.name}</div>
                                {c.email && <div className="text-xs text-text-subtle truncate">{c.email}</div>}
                            </div>
                            <div className="col-span-1 md:col-span-2 text-sm text-text-subtle tabular-nums truncate">{c.phone || '—'}</div>
                            <div className="col-span-1 md:col-span-1 md:text-center text-sm tabular-nums">
                                <span className={`inline-flex items-center gap-1 ${count > 1 ? 'text-lilac font-semibold' : 'text-text-light'}`} title={count > 1 ? 'Returning client' : undefined}>
                                    {count > 1 && <Repeat size={11} />}{count}
                                </span>
                            </div>
                            <div className="col-span-1 md:col-span-2 md:text-right text-sm text-text-light tabular-nums">{spentLabel(c)}</div>
                            <div className={`col-span-1 md:col-span-2 md:text-right text-sm tabular-nums ${c.owed ? 'text-coral-deep' : 'text-text-subtle'}`}>{c.owed ? fmtMoney(c.owed, cur) : '—'}</div>
                            <div className="col-span-1 md:col-span-1 md:text-right text-xs text-text-subtle">{fmtDate(c.firstSeen)}</div>
                            <div className="col-span-1 md:col-span-1 md:text-right text-xs text-text-subtle">{fmtDate(c.lastSeen)}</div>
                        </button>
                    );
                })}
            </div>

            {/* detail modal */}
            {selected && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60" onClick={() => setSelected(null)}>
                    <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface-1 border border-adm-line-2 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} data-lenis-prevent>
                        <div className="sticky top-0 bg-surface-1 border-b border-adm-line px-6 py-4 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-text-light">{selected.name}</h3>
                                <div className="font-mono text-xs text-text-subtle mt-0.5">{selected.clientId}</div>
                                <div className="mt-1 flex flex-col gap-0.5 text-sm text-text-subtle">
                                    {selected.phone && <a href={`https://wa.me/${normPhone(selected.phone)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-lilac"><Phone size={13} />{selected.phone}</a>}
                                    {selected.email && <span className="inline-flex items-center gap-1.5"><Mail size={13} />{selected.email}</span>}
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} className="shrink-0 grid place-items-center w-8 h-8 rounded-full border border-adm-line-2 text-text-subtle hover:text-text-light"><X size={16} /></button>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-adm-line">
                            <div><div className="text-[0.7rem] uppercase tracking-wider text-text-subtle">Bookings</div><div className="text-lg font-bold text-text-light tabular-nums">{selected.bookings.length}</div></div>
                            <div><div className="text-[0.7rem] uppercase tracking-wider text-text-subtle">Paid</div><div className="text-lg font-bold text-text-light tabular-nums">{spentLabel(selected)}</div>{selected.owed > 0 && <div className="text-xs text-coral-deep tabular-nums">{fmtMoney(selected.owed, cur)} unpaid</div>}</div>
                            <div><div className="text-[0.7rem] uppercase tracking-wider text-text-subtle">Client since</div><div className="text-lg font-bold text-text-light">{fmtDate(selected.firstSeen)}</div></div>
                        </div>
                        <div className="px-6 py-4 space-y-2">
                            <div className="text-[0.7rem] uppercase tracking-wider text-text-subtle mb-1">Booking history</div>
                            {[...selected.bookings].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map((b) => {
                                const amt = amountForBooking(b);
                                return (
                                    <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-adm-line px-4 py-2.5">
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-text-light truncate">{serviceLabel(b)}</div>
                                            <div className="text-xs text-text-subtle tabular-nums">{sessionWhen(b) ? `Session ${sessionWhen(b)}` : `Ordered ${fmtDate(b.createdAt)}`}</div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-sm text-text-light tabular-nums">{amt ? fmtMoney(amt.amount, amt.currency) : '—'}</span>
                                            <PaymentPill paid={b.paymentStatus === 'paid'} />
                                            <StatusPill status={b.status} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomersView;
