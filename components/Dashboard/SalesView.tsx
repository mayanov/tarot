import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check, RefreshCcw } from 'lucide-react';
import { getAllBookings, updatePaymentStatus, Booking, BOOKINGS_CHANGED } from '../../services/booking';
import { InlineLoader } from './ui/InlineLoader';
import { amountForBooking as amountOf, matchesSearch, fmtMoney, serviceLabel, serviceTitle, nameOf, detailOf, SERVICE_NAME } from './lib/format';
import BookingsView, { AskToPay } from './BookingsView';
import WaConfirmButton from './WaConfirmButton';
import EmailConfirmButton from './EmailConfirmButton';
import { PaymentPill } from './lib/status';
import Button, { IconButton, SOFT_BTN } from './ui/Button';
import { colorFor } from './lib/serviceColor';
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
    // the one filter menu that's open (where from, service or date), if any
    const [menu, setMenu] = useState<'where' | 'service' | 'date' | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    // the booking whose details are open (the same popup as Orders and Schedule)
    const [openId, setOpenId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    // every order in one list; narrowed to one market by its filter. Rupiah and dollars
    // are still never added together: each total has a line per currency
    const [market, setMarket] = useState<Market | 'all'>('all');

    // close the open filter menu on a click outside it or Escape
    useEffect(() => {
        if (!menu) return;
        const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [menu]);

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
                : 'Any date';
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

    // the not-paid ones first (they're what needs doing), then the rest by month
    const unpaidRows = filtered.filter((b) => b.paymentStatus !== 'paid');
    const paidRows = filtered.filter((b) => b.paymentStatus === 'paid');
    const markWa = (id: string) => (f: string, at: string) => setBookings((prev) => prev.map((x) => (x.id === id ? { ...x, [f]: at } : x)));
    const unpaidAll = orders.filter((b) => b.paymentStatus !== 'paid').length;
    const figure = (label: React.ReactNode, money: Record<Cur, number>, foot: string, cls = '') => {
        const [main, ...rest] = curs.filter((c) => money[c] || curs.length === 1);
        return (
            <div className={`py-4 min-w-0 ${cls}`}>
                <div className="text-[13px] sm:text-sm text-text-subtle">{label}</div>
                <div className="mt-1 text-[16px] sm:text-[30px] font-bold tracking-[-0.02em] leading-tight tabular-nums text-text-light whitespace-nowrap">{fmtMoney(main ? money[main] : 0, main || curs[0])}</div>
                <div className="text-[12.5px] sm:text-[14px] font-semibold text-text-subtle tabular-nums">{rest.map((c) => `+ ${fmtMoney(money[c], c)} · `).join('')}{foot}</div>
            </div>
        );
    };
    // one column per fact on a computer; on a phone, name and amount, then the rest under it
    const COLS = 'sm:grid-cols-[4.5rem_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.8fr)_7.5rem_6rem_14.5rem]';
    const row = (b: Booking) => {
        const a = amountOf(b);
        const paid = b.paymentStatus === 'paid';
        const service = SERVICE_NAME[b.serviceId] || serviceTitle(b);
        const detail = detailOf(b);
        return (
            <div key={b.id} onClick={() => setOpenId(b.id)}
                className={`grid grid-cols-[minmax(0,1fr)_auto] ${COLS} gap-x-4 gap-y-1 items-center px-4 sm:px-5 py-3.5 border-b border-adm-line last:border-0 cursor-pointer transition-colors ${paid ? 'hover:bg-adm-hover' : 'bg-amber-400/[0.07] hover:bg-amber-400/[0.12]'}`}>
                <span className="hidden sm:block text-[14px] text-text-subtle tabular-nums">{dayOf(b.createdAt)}</span>
                <b className="min-w-0 truncate text-[15px] text-text-light">{nameOf(b)}</b>
                {/* (on a phone the amount sits beside the name) */}
                <b className="sm:hidden text-[15px] text-right tabular-nums text-text-light whitespace-nowrap">{a ? fmtMoney(a.amount, a.currency) : '—'}</b>
                <span className="hidden sm:flex min-w-0 items-center gap-2 text-[14px] text-text-light">
                    <span aria-hidden className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ background: colorFor(b.serviceId) }} />
                    <span className="truncate">{service}</span>
                </span>
                <span className="hidden sm:block min-w-0 truncate text-[14px] text-text-subtle">{detail || '—'}</span>
                <span className="sm:hidden col-span-2 flex items-center gap-2 text-[13px] text-text-subtle min-w-0">
                    <span aria-hidden className="w-2 h-2 shrink-0 rounded-full" style={{ background: colorFor(b.serviceId) }} />
                    <span className="truncate">{[service, detail, dayOf(b.createdAt)].filter(Boolean).join(' · ')}</span>
                </span>
                <b className="hidden sm:block text-[15px] text-right tabular-nums text-text-light whitespace-nowrap">{a ? fmtMoney(a.amount, a.currency) : '—'}</b>
                <span className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
                    <PaymentPill paid={paid} onToggle={() => togglePaid(b)} busy={savingId === b.id} />
                </span>
                <span className="col-span-2 sm:col-span-1 mt-1.5 sm:mt-0 flex flex-wrap sm:flex-nowrap items-center sm:justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {paid ? (b.market === 'ID'
                        ? <WaConfirmButton compact b={b} onSent={markWa(b.id)} />
                        : <EmailConfirmButton hideIdle b={b} onSent={(at) => setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paidEmailSentAt: at } : x)))} />
                    ) : <>
                        <AskToPay b={b} onSent={markWa(b.id)} onNote={() => {}} />
                        <button type="button" onClick={() => togglePaid(b)} disabled={savingId === b.id}
                            className={SOFT_BTN}>Mark paid</button>
                    </>}
                </span>
            </div>
        );
    };
    const groupHead = (text: string) => <div className="px-4 sm:px-5 pt-5 pb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-text-subtle border-b border-adm-line">{text}</div>;

    return (
        <div className="space-y-6 pt-20 lg:pt-8 p-4 md:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-sm text-text-subtle">Every order, newest first</div>
                    <h1 className="text-[34px] sm:text-[40px] font-bold tracking-[-0.02em] leading-tight text-text-light">Payments</h1>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:w-72"><SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, ref or note" /></div>
                    <IconButton onClick={load} title="Refresh" aria-label="Refresh"><RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /></IconButton>
                </div>
            </div>

            {error && <div className="text-sm due-late-text bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5">{error}</div>}

            {/* what came in, what's still to come, and both together (rupiah and dollars apart) */}
            <div className="grid grid-cols-3 border-y border-adm-line">
                {figure('Came in', totals.paid, `${totals.paidCount} paid`, 'pr-3')}
                {figure(<span className="due-soon-text font-semibold">Still to come in</span>, totals.unpaid, `${totals.unpaidCount} not paid`, 'px-3 sm:px-6 border-l border-adm-line')}
                {figure('Booked in all', { IDR: totals.paid.IDR + totals.unpaid.IDR, USD: totals.paid.USD + totals.unpaid.USD }, `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`, 'pl-3 sm:pl-6 border-l border-adm-line')}
            </div>

            {/* which orders (tabs, left), then the filters (right) */}
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-adm-line">
                <div role="tablist" aria-label="Which orders" className="flex gap-6">
                    {([['all', 'All', null], ['unpaid', 'Not paid', unpaidAll]] as const).map(([id, label, n]) => {
                        const on = payFilter === id;
                        return (
                            <button key={id} type="button" role="tab" aria-selected={on} onClick={() => setPayFilter(id)}
                                className={`-mb-px border-b-2 py-2.5 text-[15px] whitespace-nowrap transition-colors ${on ? 'border-text-light font-semibold text-text-light' : 'border-transparent font-medium text-text-subtle hover:text-text-light'}`}>
                                {label}{n !== null && n > 0 && <span className="ml-1.5 due-soon-text font-semibold tabular-nums">{n}</span>}
                            </button>
                        );
                    })}
                </div>
            {/* the filters, all alike: a word and a little arrow, grey until one is picked; each opens a short menu */}
            <div ref={menuRef} className="flex flex-wrap items-center gap-x-5 gap-y-1 pb-1.5">
                {(() => {
                    const WHERE = { all: 'Anywhere', ID: 'Indonesia', Global: 'Abroad' } as const;
                    const SOURCE = { all: 'Any way', booking: 'Booked on the site', manual: 'Added by hand' } as const;
                    const trigger = (id: 'where' | 'service' | 'date', label: string, on: boolean) => (
                        <button type="button" aria-expanded={menu === id} onClick={() => setMenu(menu === id ? null : id)}
                            className={`inline-flex items-center gap-1 py-2 text-[14px] whitespace-nowrap transition-colors ${on ? 'font-semibold text-text-light' : 'font-medium text-text-subtle hover:text-text-light'}`}>
                            {label}<ChevronDown size={14} className={`transition-transform ${menu === id ? 'rotate-180' : ''}`} />
                        </button>
                    );
                    // (on a phone the first two open to the right of their word, the date one to its left, so none runs off the screen)
                    const pop = (edge: 'start' | 'end') => `absolute z-20 top-full mt-1 ${edge === 'start' ? 'left-0 sm:left-auto sm:right-0' : 'right-0'} w-56 rounded-xl border border-adm-line-2 bg-surface-1 shadow-lg p-1.5`;
                    const option = (on: boolean, label: string, pick: () => void) => (
                        <button key={label} type="button" onClick={() => { pick(); setMenu(null); }}
                            className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-left text-[14px] hover:bg-adm-hover ${on ? 'font-semibold text-text-light' : 'text-text-light'}`}>
                            {label}{on && <Check size={14} className="text-lilac shrink-0" />}
                        </button>
                    );
                    const head = (t: string) => <div className="px-2.5 pt-2 pb-1 text-[12px] text-text-subtle">{t}</div>;
                    return <>
                        <div className="relative">
                            {trigger('where', market === 'all' && sourceFilter === 'all' ? 'Anywhere'
                                : [market !== 'all' ? WHERE[market] : '', sourceFilter !== 'all' ? SOURCE[sourceFilter] : ''].filter(Boolean).join(' · '),
                                market !== 'all' || sourceFilter !== 'all')}
                            {menu === 'where' && <div className={pop('start')}>
                                {head('Where they live')}
                                {(Object.keys(WHERE) as (keyof typeof WHERE)[]).map((id) => option(market === id, WHERE[id], () => { setMarket(id); setServiceFilter('all'); }))}
                                <div className="my-1 border-t border-adm-line" />
                                {head('How the order came in')}
                                {(Object.keys(SOURCE) as (keyof typeof SOURCE)[]).map((id) => option(sourceFilter === id, SOURCE[id], () => setSourceFilter(id)))}
                            </div>}
                        </div>
                        <div className="relative">
                            {trigger('service', serviceFilter === 'all' ? 'All services' : serviceFilter, serviceFilter !== 'all')}
                            {menu === 'service' && <div className={`${pop('start')} max-h-80 overflow-y-auto`}>
                                {option(serviceFilter === 'all', 'All services', () => setServiceFilter('all'))}
                                {serviceOptions.map((x) => option(serviceFilter === x, x, () => setServiceFilter(x)))}
                            </div>}
                        </div>
                        <div className="relative">
                            {trigger('date', dateLabel, dateActive)}
                            {menu === 'date' && <div className={`${pop('end')} p-3 space-y-3`}>
                                <div>
                                    <label className="block text-xs text-text-subtle mb-1">Booked from</label>
                                    <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full px-2.5 py-2 rounded-lg border border-adm-line-2 bg-bg-dark text-sm text-text-light focus:border-lilac focus:outline-none cursor-pointer" />
                                </div>
                                <div>
                                    <label className="block text-xs text-text-subtle mb-1">Until</label>
                                    <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full px-2.5 py-2 rounded-lg border border-adm-line-2 bg-bg-dark text-sm text-text-light focus:border-lilac focus:outline-none cursor-pointer" />
                                </div>
                                {dateActive && <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); setMenu(null); }}
                                    className="w-full text-center text-xs text-text-subtle hover:text-text-light transition-colors py-1">Any date</button>}
                            </div>}
                        </div>
                        {(market !== 'all' || sourceFilter !== 'all' || serviceFilter !== 'all' || dateActive) && (
                            <button type="button" onClick={() => { setMarket('all'); setServiceFilter('all'); setSourceFilter('all'); setDateFrom(''); setDateTo(''); }}
                                className="py-2 text-[14px] font-medium text-lilac hover:underline">Clear</button>
                        )}
                    </>;
                })()}
            </div>
            </div>

            {/* one list: not paid first, then month by month */}
            <div className="rounded-2xl bg-surface-1 overflow-hidden">
                <div className={`hidden sm:grid ${COLS} gap-x-4 px-5 py-3 text-[13px] font-semibold text-text-subtle border-b border-adm-line`}>
                    <span>Date</span><span>Customer</span><span>Service</span><span>Details</span><span className="text-right">Amount</span><span>Status</span><span className="text-right">Action</span>
                </div>
                {loading && filtered.length === 0 && <InlineLoader />}
                {!loading && filtered.length === 0 && <p className="text-center text-sm text-text-subtle py-12">No orders found{q.trim() ? ` for “${q.trim()}”` : ''}.</p>}
                {unpaidRows.length > 0 && <>{groupHead(`Not paid yet · ${unpaidRows.length}`)}{unpaidRows.map(row)}</>}
                {paidRows.map((b, i) => (
                    <React.Fragment key={b.id}>
                        {(i === 0 || monthOf(paidRows[i - 1]) !== monthOf(b)) && groupHead(`Paid · ${monthName(monthOf(b))}`)}
                        {row(b)}
                    </React.Fragment>
                ))}
            </div>

            {openId && <BookingsView view="detail" openId={openId} onClosed={() => { setOpenId(null); load(); }} />}
        </div>
    );
};

export default SalesView;
