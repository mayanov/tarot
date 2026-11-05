import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Wallet, AlertCircle, CheckCircle2, ChevronDown, CalendarDays } from 'lucide-react';
import { getAllBookings, updatePaymentStatus, Booking } from '../../services/booking';
import { InlineLoader } from './ui/InlineLoader';
import { amountForBooking as amountOf, fmtMoney, fmtDate, serviceLabel, serviceTitle, sessionWhen, paymentMethodOf, phoneOf, emailOf } from './lib/format';
import WaConfirmButton from './WaConfirmButton';
import { StatusPill, PaymentPill } from './lib/status';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Segmented from './ui/Segmented';
import Button from './ui/Button';
import { SearchInput, Select } from './ui/Field';

type Market = 'ID' | 'Global';

const SalesView: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [payFilter, setPayFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [serviceFilter, setServiceFilter] = useState<string>('all');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'booking'>('all');
    const [customerFilter, setCustomerFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [dateOpen, setDateOpen] = useState(false);
    const dateRef = useRef<HTMLDivElement>(null);
    const [custOpen, setCustOpen] = useState(false);
    const [custQuery, setCustQuery] = useState('');
    const custRef = useRef<HTMLDivElement>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    // one market at a time, so rupiah and dollars never share a list or a total
    const [market, setMarket] = useState<Market>('ID');

    // close the date popover on outside click / Escape
    useEffect(() => {
        if (!dateOpen) return;
        const onDown = (e: MouseEvent) => { if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDateOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [dateOpen]);

    // close the customer popover on outside click / Escape
    useEffect(() => {
        if (!custOpen) return;
        const onDown = (e: MouseEvent) => { if (custRef.current && !custRef.current.contains(e.target as Node)) setCustOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCustOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [custOpen]);

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

    // This market's orders except cancelled — newest booking date first (API already sorts desc).
    const live = useMemo(() => bookings.filter((b) => b.status !== 'cancelled'), [bookings]);
    const countBy = useMemo(() => ({ ID: live.filter((b) => b.market === 'ID').length, Global: live.filter((b) => b.market !== 'ID').length }), [live]);
    const orders = useMemo(() => live.filter((b) => (b.market === 'ID' ? 'ID' : 'Global') === market), [live, market]);
    const cur = market === 'ID' ? 'IDR' : 'USD';

    // Collected vs still owed, in this market's currency.
    const totals = useMemo(() => {
        const t = { paid: 0, unpaid: 0, paidCount: 0, unpaidCount: 0 };
        orders.forEach((b) => {
            const paid = b.paymentStatus === 'paid';
            paid ? t.paidCount++ : t.unpaidCount++;
            const a = amountOf(b);
            if (!a) return;
            paid ? (t.paid += a.amount) : (t.unpaid += a.amount);
        });
        return t;
    }, [orders]);

    // Distinct services present in the data, for the Service dropdown.
    const serviceOptions = useMemo(() => {
        const set = new Set<string>();
        orders.forEach((b) => { const s = serviceTitle(b); if (s) set.add(s); });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [orders]);

    // Distinct customers present in the data, for the Customer dropdown.
    const customerOptions = useMemo(() => {
        const set = new Set<string>();
        orders.forEach((b) => { const n = (b.name || '').trim(); if (n) set.add(n); });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [orders]);

    // Customer options narrowed by the dropdown's own search box.
    const custMatches = useMemo(() => {
        const n = custQuery.trim().toLowerCase();
        return n ? customerOptions.filter((c) => c.toLowerCase().includes(n)) : customerOptions;
    }, [customerOptions, custQuery]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const fromTs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
        const toTs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;
        return orders.filter((b) => {
            if (payFilter !== 'all' && (b.paymentStatus || 'unpaid') !== payFilter) return false;
            if (serviceFilter !== 'all' && serviceTitle(b) !== serviceFilter) return false;
            if (sourceFilter !== 'all' && (b.source === 'manual' ? 'manual' : 'booking') !== sourceFilter) return false;
            if (customerFilter !== 'all' && (b.name || '').trim() !== customerFilter) return false;
            if (fromTs || toTs) {
                const ts = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
                if (!Number.isFinite(ts)) return false;
                if (fromTs && ts < fromTs) return false;
                if (toTs && ts > toTs) return false;
            }
            if (!needle) return true;
            return (b.name || '').toLowerCase().includes(needle)
                || (b.serviceName || '').toLowerCase().includes(needle)
                || (b.contact || '').toLowerCase().includes(needle)
                || (b.ref || '').toLowerCase().includes(needle);
        });
    }, [orders, q, payFilter, serviceFilter, sourceFilter, customerFilter, dateFrom, dateTo]);

    const activeFilters = (payFilter !== 'all' ? 1 : 0) + (serviceFilter !== 'all' ? 1 : 0)
        + (sourceFilter !== 'all' ? 1 : 0) + (customerFilter !== 'all' ? 1 : 0)
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
            await updatePaymentStatus(b.id, next, token);
        } catch (e) {
            setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paymentStatus: b.paymentStatus } : x))); // revert
            setError('Could not update payment. Try again.');
        } finally {
            setSavingId(null);
        }
    };

    const outstanding = totals.unpaidCount > 0;

    return (
        <div className="space-y-5 pt-20 md:pt-8 p-4 md:px-8">
            <PageHeader title="Sales" subtitle={`${orders.length} ${market === 'ID' ? 'Indonesia' : 'Global'} orders · mark payments as they come in`} onRefresh={load} refreshing={loading}>
                {/* market: rupiah and dollars are kept apart */}
                <Segmented value={market} onChange={(m) => { setMarket(m); setServiceFilter('all'); setCustomerFilter('all'); }}
                    options={[{ id: 'ID', label: 'Indonesia · IDR', count: countBy.ID }, { id: 'Global', label: 'Global · USD', count: countBy.Global }]} />
            </PageHeader>

            {error && <div className="text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-xl px-3 py-2.5">{error}</div>}

            {/* summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-4">
                    <div className="flex items-center gap-2 text-text-subtle text-xs uppercase tracking-wider mb-2"><CheckCircle2 size={14} className="text-sage" /> Collected</div>
                    <div className="text-xl font-bold text-text-light tabular-nums">{fmtMoney(totals.paid, cur)}</div>
                    <div className="text-xs text-text-subtle mt-0.5">{totals.paidCount} paid {totals.paidCount === 1 ? 'order' : 'orders'}</div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-2 text-text-subtle text-xs uppercase tracking-wider mb-2"><AlertCircle size={14} className="text-coral-deep" /> Outstanding</div>
                    <div className="text-xl font-bold text-text-light tabular-nums">{fmtMoney(totals.unpaid, cur)}</div>
                    <div className="text-xs text-text-subtle mt-0.5">{totals.unpaidCount} unpaid {totals.unpaidCount === 1 ? 'order' : 'orders'}</div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-2 text-text-subtle text-xs uppercase tracking-wider mb-2"><Wallet size={14} className="text-blue" /> Total booked</div>
                    <div className="text-xl font-bold text-text-light tabular-nums">{fmtMoney(totals.paid + totals.unpaid, cur)}</div>
                    <div className="text-xs text-text-subtle mt-0.5">{orders.length} {orders.length === 1 ? 'order' : 'orders'}, cancelled left out</div>
                </Card>
            </div>

            {/* toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, service, contact, or ref" />
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={payFilter} active={payFilter !== 'all'} onChange={(e) => setPayFilter(e.target.value as 'all' | 'paid' | 'unpaid')}>
                        <option value="all">All payments</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </Select>
                    <Select value={serviceFilter} active={serviceFilter !== 'all'} onChange={(e) => setServiceFilter(e.target.value)} className="max-w-[14rem]">
                        <option value="all">All services</option>
                        {serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Select value={sourceFilter} active={sourceFilter !== 'all'} onChange={(e) => setSourceFilter(e.target.value as 'all' | 'manual' | 'booking')}>
                        <option value="all">All sources</option>
                        <option value="booking">From booking</option>
                        <option value="manual">Manual</option>
                    </Select>
                    {/* customer searchable dropdown */}
                    <div className="relative" ref={custRef}>
                        <button type="button" onClick={() => { setCustOpen((o) => !o); setCustQuery(''); }}
                            className={`inline-flex items-center gap-2 pl-3 pr-8 py-2 rounded-lg border bg-bg-dark text-sm focus:border-lilac focus:outline-none cursor-pointer relative max-w-[14rem] ${customerFilter !== 'all' ? 'border-lilac text-text-light' : 'border-adm-line-2 text-text-subtle hover:text-text-light'}`}>
                            <span className="truncate">{customerFilter === 'all' ? 'All customers' : customerFilter}</span>
                            <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" />
                        </button>
                        {custOpen && (
                            <div className="absolute z-20 mt-2 right-0 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-adm-line-2 bg-surface-1 shadow-lg overflow-hidden">
                                <div className="relative p-2 border-b border-adm-line">
                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle" />
                                    <input autoFocus value={custQuery} onChange={(e) => setCustQuery(e.target.value)} placeholder="Search customer…"
                                        className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-adm-line-2 bg-bg-dark text-sm text-text-light focus:border-lilac focus:outline-none" />
                                </div>
                                <div className="max-h-56 overflow-y-auto py-1">
                                    <button onClick={() => { setCustomerFilter('all'); setCustOpen(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-adm-hover ${customerFilter === 'all' ? 'text-lilac font-semibold' : 'text-text-subtle'}`}>
                                        All customers
                                    </button>
                                    {custMatches.map((c) => (
                                        <button key={c} onClick={() => { setCustomerFilter(c); setCustOpen(false); }}
                                            className={`w-full text-left px-3 py-1.5 text-sm truncate transition-colors hover:bg-adm-hover ${customerFilter === c ? 'text-lilac font-semibold' : 'text-text-light'}`}>
                                            {c}
                                        </button>
                                    ))}
                                    {custMatches.length === 0 && (
                                        <p className="px-3 py-3 text-sm text-text-subtle text-center">No match</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
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
                    {activeFilters > 0 && (
                        <Button variant="ghost" onClick={() => { setPayFilter('all'); setServiceFilter('all'); setSourceFilter('all'); setCustomerFilter('all'); setDateFrom(''); setDateTo(''); }}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[940px]">
                        <thead>
                            <tr className="text-left text-text-subtle text-xs uppercase tracking-wider border-b border-adm-line">
                                <th className="font-semibold px-4 py-3">Booked</th>
                                <th className="font-semibold px-4 py-3">Customer</th>
                                <th className="font-semibold px-4 py-3">Service</th>
                                <th className="font-semibold px-4 py-3 text-right">Amount</th>
                                <th className="font-semibold px-4 py-3">Status</th>
                                <th className="font-semibold px-4 py-3">Payment</th>
                                <th className="font-semibold px-4 py-3 text-right">WhatsApp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && filtered.length === 0 && (
                                <tr><td colSpan={7}><InlineLoader /></td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={7} className="text-center text-text-subtle py-16">No orders found.</td></tr>
                            )}
                            {filtered.map((b) => {
                                const a = amountOf(b);
                                const paid = b.paymentStatus === 'paid';
                                const phone = phoneOf(b.contact);
                                const email = emailOf(b.contact);
                                const when = sessionWhen(b);
                                const method = paymentMethodOf(b);
                                return (
                                    <tr key={b.id} className="border-b border-adm-line last:border-0 hover:bg-adm-hover/50 align-top">
                                        <td className="px-4 py-3 whitespace-nowrap text-text-subtle tabular-nums">{fmtDate(b.createdAt)}</td>
                                        <td className="px-4 py-3 min-w-[12rem]">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-text-light">{b.name || '—'}</span>
                                                {b.source === 'manual' && <span className="text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded bg-adm-hover text-text-subtle">Manual</span>}
                                            </div>
                                            {phone && <div className="text-xs text-text-subtle tabular-nums mt-0.5">{phone}</div>}
                                            {email && <div className="text-xs text-text-subtle truncate max-w-[16rem]">{email}</div>}
                                        </td>
                                        <td className="px-4 py-3 min-w-[12rem]">
                                            <div className="text-text-light">{serviceLabel(b)}</div>
                                            {when && <div className="text-xs text-text-subtle tabular-nums mt-0.5">Session {when}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="tabular-nums text-text-light font-medium">{a ? fmtMoney(a.amount, a.currency) : '—'}</div>
                                            {method && <div className="text-xs text-text-subtle mt-0.5">{method}</div>}
                                        </td>
                                        <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                                        <td className="px-4 py-3"><PaymentPill paid={paid} onToggle={() => togglePaid(b)} busy={savingId === b.id} /></td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <WaConfirmButton compact b={b} onSent={(at) => setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, waConfirmSentAt: at } : x)))} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {outstanding && (
                <p className="text-xs text-text-subtle">Tip: click a Payment pill to mark an order paid — Revenue counts only paid orders.</p>
            )}
        </div>
    );
};

export default SalesView;
