import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, CalendarDays, SlidersHorizontal } from 'lucide-react';
import { getAllBookings, updatePaymentStatus, Booking, BOOKINGS_CHANGED } from '../../services/booking';
import { InlineLoader } from './ui/InlineLoader';
import { amountForBooking as amountOf, matchesSearch, fmtMoney, serviceLabel, serviceTitle } from './lib/format';
import BookingsView from './BookingsView';
import WaConfirmButton from './WaConfirmButton';
import EmailConfirmButton from './EmailConfirmButton';
import { StatusPill, PaymentPill } from './lib/status';
import Card from './ui/Card';
import StatStrip from './ui/StatStrip';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import { SearchInput, Select } from './ui/Field';

type Market = 'ID' | 'Global';
type Cur = 'IDR' | 'USD';
const marketOf = (b: Booking): Market => (b.market === 'ID' ? 'ID' : 'Global');

const SalesView: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [payFilter, setPayFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [serviceFilter, setServiceFilter] = useState<string>('all');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'booking'>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [dateOpen, setDateOpen] = useState(false);
    const dateRef = useRef<HTMLDivElement>(null);
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);
    // the booking whose details are open (the same popup as Orders and Schedule)
    const [openId, setOpenId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    // every order in one list; narrowed to one market by its filter. Rupiah and dollars
    // are still never added together: each total has a line per currency
    const [market, setMarket] = useState<Market | 'all'>('all');

    // close the date popover on outside click / Escape
    useEffect(() => {
        if (!dateOpen) return;
        const onDown = (e: MouseEvent) => { if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDateOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [dateOpen]);

    // close the More filters popover on outside click / Escape
    useEffect(() => {
        if (!moreOpen) return;
        const onDown = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [moreOpen]);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken') || undefined;
            setBookings(await getAllBookings(token));
        } catch (e) {
            setError('Failed to load orders.');
        } finally {
            setLoading(false);
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

    // This market's orders except cancelled — newest booking date first (API already sorts desc).
    const live = useMemo(() => bookings.filter((b) => b.status !== 'cancelled'), [bookings]);
    const orders = useMemo(() => (market === 'all' ? live : live.filter((b) => marketOf(b) === market)), [live, market]);
    // the currencies on show: both for all markets
    const curs: Cur[] = market === 'ID' ? ['IDR'] : market === 'Global' ? ['USD'] : ['IDR', 'USD'];

    // Collected vs still owed, per currency.
    const totals = useMemo(() => {
        const t = { paidCount: 0, unpaidCount: 0, paid: { IDR: 0, USD: 0 } as Record<Cur, number>, unpaid: { IDR: 0, USD: 0 } as Record<Cur, number> };
        orders.forEach((b) => {
            const paid = b.paymentStatus === 'paid';
            paid ? t.paidCount++ : t.unpaidCount++;
            const a = amountOf(b);
            if (!a) return;
            (paid ? t.paid : t.unpaid)[a.currency as Cur] += a.amount;
        });
        return t;
    }, [orders]);

    // Distinct services present in the data, for the Service dropdown.
    const serviceOptions = useMemo(() => {
        const set = new Set<string>();
        orders.forEach((b) => { const s = serviceTitle(b); if (s) set.add(s); });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [orders]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const fromTs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
        const toTs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;
        return orders.filter((b) => {
            if (payFilter !== 'all' && (b.paymentStatus || 'unpaid') !== payFilter) return false;
            if (serviceFilter !== 'all' && serviceTitle(b) !== serviceFilter) return false;
            if (sourceFilter !== 'all' && (b.source === 'manual' ? 'manual' : 'booking') !== sourceFilter) return false;
            if (fromTs || toTs) {
                const ts = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
                if (!Number.isFinite(ts)) return false;
                if (fromTs && ts < fromTs) return false;
                if (toTs && ts > toTs) return false;
            }
            return !needle || matchesSearch(needle, b.name, b.serviceName, serviceLabel(b), b.contact, b.ref, b.adminNote);
        }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }, [orders, q, payFilter, serviceFilter, sourceFilter, dateFrom, dateTo]);
    const activeFilters = (market !== 'all' ? 1 : 0) + (payFilter !== 'all' ? 1 : 0) + (serviceFilter !== 'all' ? 1 : 0)
        + (sourceFilter !== 'all' ? 1 : 0)
        + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

    // Short label for the collapsed booking-date button.
    const shortDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    const dateLabel = dateFrom && dateTo ? `${shortDate(dateFrom)} – ${shortDate(dateTo)}`
        : dateFrom ? `From ${shortDate(dateFrom)}`
            : dateTo ? `Until ${shortDate(dateTo)}`
                : 'Booking date';
    const dateActive = Boolean(dateFrom || dateTo);

    const togglePaid = async (b: Booking) => {
        const next = b.paymentStatus === 'paid' ? 'unpaid' : 'paid';
        setSavingId(b.id);
        setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paymentStatus: next } : x))); // optimistic
        try {
            const token = localStorage.getItem('authToken') || undefined;
            // the server's copy: marking a session paid also confirms it and sends its invite
            const saved = await updatePaymentStatus(b.id, next, token);
            setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, ...saved } : x)));
        } catch (e) {
            setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paymentStatus: b.paymentStatus } : x))); // revert
            setError('Could not update payment. Try again.');
        } finally {
            setSavingId(null);
        }
    };

    // newest first, under a heading per month; the day alone in the row ("6 Nov")
    const monthOf = (b: Booking) => (b.createdAt || '').slice(0, 7);
    const monthName = (ym: string) => (ym ? new Date(`${ym}-15T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'No date');
    const dayOf = (iso?: string) => {
        if (!iso) return '—';
        const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="space-y-5 pt-20 lg:pt-8 p-4 md:px-8">
            <PageHeader title="Payments" tone="money" subtitle="Mark payments as they come in"
                note="Every order, newest first; cancelled ones are left out. Rupiah and dollars are never added together. How the money is trending is under Money report."
                onRefresh={load} refreshing={loading} />

            {error && <div className="text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-xl px-3 py-2.5">{error}</div>}

            {/* what came in, what's still owed, and both together; a line per currency */}
            <StatStrip layout="three" stats={[
                { label: 'Collected', lines: curs.map((c) => ({ key: c, value: fmtMoney(totals.paid[c], c) })), foot: `${totals.paidCount} paid` },
                { label: 'Outstanding', lines: curs.map((c) => ({ key: c, value: fmtMoney(totals.unpaid[c], c) })), foot: `${totals.unpaidCount} unpaid` },
                { label: 'Total booked', lines: curs.map((c) => ({ key: c, value: fmtMoney(totals.paid[c] + totals.unpaid[c], c) })), foot: `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}` },
            ]} />

            {/* toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, service, ref or note" />
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={market} active={market !== 'all'} onChange={(e) => { setMarket(e.target.value as Market | 'all'); setServiceFilter('all'); }}>
                        <option value="all">All markets</option>
                        <option value="ID">Indonesia · IDR</option>
                        <option value="Global">Global · USD</option>
                    </Select>
                    <Select value={payFilter} active={payFilter !== 'all'} onChange={(e) => setPayFilter(e.target.value as 'all' | 'paid' | 'unpaid')}>
                        <option value="all">All payments</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </Select>
                    <Select value={serviceFilter} active={serviceFilter !== 'all'} onChange={(e) => setServiceFilter(e.target.value)} className="max-w-[14rem]">
                        <option value="all">All services</option>
                        {serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    {/* booking-date range — collapsed to a single button, opens a range panel */}
                    <div className="relative" ref={dateRef}>
                        <button type="button" onClick={() => setDateOpen((o) => !o)}
                            className={`inline-flex items-center gap-2 pl-3 pr-8 py-2 rounded-lg border bg-bg-dark text-sm focus:border-lilac focus:outline-none cursor-pointer relative ${dateActive ? 'border-lilac text-text-light' : 'border-adm-line-2 text-text-subtle hover:text-text-light'}`}>
                            <CalendarDays size={15} />
                            {dateLabel}
                            <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" />
                        </button>
                        {dateOpen && (
                            <div className="absolute z-20 mt-2 right-0 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-adm-line-2 bg-surface-1 shadow-lg p-3 space-y-3">
                                <div>
                                    <label className="block text-xs text-text-subtle mb-1">From</label>
                                    <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full px-2.5 py-2 rounded-lg border border-adm-line-2 bg-bg-dark text-sm text-text-light focus:border-lilac focus:outline-none cursor-pointer [color-scheme:dark]" />
                                </div>
                                <div>
                                    <label className="block text-xs text-text-subtle mb-1">To</label>
                                    <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full px-2.5 py-2 rounded-lg border border-adm-line-2 bg-bg-dark text-sm text-text-light focus:border-lilac focus:outline-none cursor-pointer [color-scheme:dark]" />
                                </div>
                                {dateActive && (
                                    <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                                        className="w-full text-center text-xs text-text-subtle hover:text-text-light transition-colors py-1">
                                        Clear dates
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    {/* rarely needed: where the order came from */}
                    <div className="relative" ref={moreRef}>
                        <button type="button" onClick={() => setMoreOpen((o) => !o)} title="More filters"
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-bg-dark text-sm focus:border-lilac focus:outline-none ${sourceFilter !== 'all' ? 'border-lilac text-text-light' : 'border-adm-line-2 text-text-subtle hover:text-text-light'}`}>
                            <SlidersHorizontal size={15} />
                            <span className="hidden sm:inline">{sourceFilter === 'all' ? 'More' : sourceFilter === 'manual' ? 'Added by hand' : 'From the site'}</span>
                        </button>
                        {moreOpen && (
                            <div className="absolute z-20 mt-2 right-0 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-adm-line-2 bg-surface-1 shadow-lg p-3">
                                <div className="text-xs text-text-subtle mb-1.5">Where the order came from</div>
                                {([['all', 'Anywhere'], ['booking', 'Booked on the site'], ['manual', 'Added by hand']] as const).map(([id, label]) => (
                                    <button key={id} type="button" onClick={() => { setSourceFilter(id); setMoreOpen(false); }}
                                        className={`w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-adm-hover ${sourceFilter === id ? 'text-lilac font-semibold' : 'text-text-light'}`}>{label}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    {activeFilters > 0 && (
                        <Button variant="ghost" onClick={() => { setMarket('all'); setPayFilter('all'); setServiceFilter('all'); setSourceFilter('all'); setDateFrom(''); setDateTo(''); }}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* phones, tablets and small laptops: one card per sale, tap for the details */}
            <Card className="overflow-hidden xl:hidden">
                {loading && filtered.length === 0 && <InlineLoader />}
                {!loading && filtered.length === 0 && <p className="text-center text-sm text-text-subtle py-12">No orders found{q.trim() ? ` for “${q.trim()}”` : ''}.</p>}
                {filtered.map((b, i) => {
                    const a = amountOf(b);
                    const newMonth = i === 0 || monthOf(filtered[i - 1]) !== monthOf(b);
                    return (
                        <React.Fragment key={b.id}>
                            {newMonth && <div className="px-4 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-subtle border-b border-adm-line">{monthName(monthOf(b))}</div>}
                            <div onClick={() => setOpenId(b.id)} className="px-4 py-3 border-b border-adm-line last:border-0 hover:bg-adm-hover/50 cursor-pointer">
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="font-semibold text-text-light truncate">{b.name || '—'}</span>
                                    <span className="tabular-nums text-text-light font-medium whitespace-nowrap">{a ? fmtMoney(a.amount, a.currency) : '—'}</span>
                                </div>
                                <div className="text-xs text-text-subtle mt-0.5 truncate">{serviceLabel(b)} · {dayOf(b.createdAt)}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <PaymentPill paid={b.paymentStatus === 'paid'} onToggle={() => togglePaid(b)} busy={savingId === b.id} />
                                    <StatusPill status={b.status} />
                                    <span className="ml-auto">
                                        {b.market === 'ID'
                                            ? <WaConfirmButton compact b={b} onSent={(f, at) => setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, [f]: at } : x)))} />
                                            : <EmailConfirmButton hideIdle b={b} onSent={(at) => setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paidEmailSentAt: at } : x)))} />}
                                    </span>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </Card>

            {/* wide screens: the table */}
            <Card className="overflow-hidden hidden xl:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead>
                            <tr className="text-left text-text-subtle text-xs uppercase tracking-wider border-b border-adm-line">
                                <th className="font-semibold px-4 py-3">Booked</th>
                                <th className="font-semibold px-4 py-3">Customer</th>
                                <th className="font-semibold px-4 py-3">Service</th>
                                <th className="font-semibold px-4 py-3 text-right">Amount</th>
                                <th className="font-semibold px-4 py-3">Status</th>
                                <th className="font-semibold px-4 py-3">Payment</th>
                                <th className="font-semibold px-4 py-3 text-right">{market === 'ID' ? 'WhatsApp' : market === 'Global' ? 'Email' : 'Confirm'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && filtered.length === 0 && (
                                <tr><td colSpan={7}><InlineLoader /></td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={7} className="text-center text-text-subtle py-16">No orders found{q.trim() ? ` for “${q.trim()}”` : ''}.</td></tr>
                            )}
                            {filtered.map((b, i) => {
                                const a = amountOf(b);
                                const newMonth = i === 0 || monthOf(filtered[i - 1]) !== monthOf(b);
                                return (
                                    <React.Fragment key={b.id}>
                                    {newMonth && (
                                        <tr className="border-b border-adm-line">
                                            <td colSpan={7} className="px-4 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-subtle">{monthName(monthOf(b))}</td>
                                        </tr>
                                    )}
                                    <tr onClick={() => setOpenId(b.id)} className="border-b border-adm-line last:border-0 hover:bg-adm-hover/50 cursor-pointer">
                                        <td className="px-4 py-3 whitespace-nowrap text-text-subtle tabular-nums">{dayOf(b.createdAt)}</td>
                                        {/* one line per sale: contact, session time and payment method are in its details */}
                                        <td className="px-4 py-3 min-w-[10rem] font-semibold text-text-light">{b.name || '—'}</td>
                                        <td className="px-4 py-3 min-w-[12rem] text-text-light">{serviceLabel(b)}</td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-text-light font-medium">{a ? fmtMoney(a.amount, a.currency) : '—'}</td>
                                        <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                                        <td className="px-4 py-3"><PaymentPill paid={b.paymentStatus === 'paid'} onToggle={() => togglePaid(b)} busy={savingId === b.id} /></td>
                                        <td className="px-4 py-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            {/* Indonesia is confirmed on WhatsApp, Global by email */}
                                            {b.market === 'ID'
                                                ? <WaConfirmButton compact b={b} onSent={(f, at) => setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, [f]: at } : x)))} />
                                                : <EmailConfirmButton hideIdle b={b} onSent={(at) => setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paidEmailSentAt: at } : x)))} />}
                                        </td>
                                    </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {openId && <BookingsView view="detail" openId={openId} onClosed={() => { setOpenId(null); load(); }} />}
        </div>
    );
};

export default SalesView;
