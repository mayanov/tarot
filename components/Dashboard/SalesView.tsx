import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { getAllBookings, updatePaymentStatus, Booking, BOOKINGS_CHANGED } from '../../services/booking';
import { InlineLoader } from './ui/InlineLoader';
import { amountForBooking as amountOf, matchesSearch, fmtMoney, serviceLabel, serviceTitle, nameOf, serviceGroup, subServiceOf } from './lib/format';
import BookingsView, { AskToPay } from './BookingsView';
import WaConfirmButton from './WaConfirmButton';
import EmailConfirmButton from './EmailConfirmButton';
import { PaymentPill } from './lib/status';
import Button, { IconButton, SOFT_BTN } from './ui/Button';
import { colorFor } from './lib/serviceColor';
import { SearchInput, Select } from './ui/Field';
import { FilterBar, FilterMenu, MenuHead, MenuDivider, MenuOption, MenuDate, ClearFilters, useCloseMenu } from './ui/Filters';

type Market = 'ID' | 'Global';
type Cur = 'IDR' | 'USD';
const marketOf = (b: Booking): Market => (b.market === 'ID' ? 'ID' : 'Global');

const PAY = { all: 'All payments', paid: 'Paid', unpaid: 'Not paid' } as const;
const WHERE = { all: 'Anywhere', ID: 'Indonesia', Global: 'Abroad' } as const;
const SOURCE = { all: 'Any way', booking: 'Booked on the site', manual: 'Added by hand' } as const;
// "Any date": clears both dates and closes the menu
const AnyDate: React.FC<{ onClear: () => void }> = ({ onClear }) => {
    const close = useCloseMenu();
    return <button type="button" onClick={() => { onClear(); close(); }} className="w-full text-center text-xs text-text-subtle hover:text-text-light transition-colors py-1">Any date</button>;
};

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
    // the booking whose details are open (the same popup as Orders and Schedule)
    const [openId, setOpenId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    // every order in one list; narrowed to one market by its filter. Rupiah and dollars
    // are still never added together: each total has a line per currency
    const [market, setMarket] = useState<Market | 'all'>('all');

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
        const service = serviceGroup(b);
        const detail = subServiceOf(b);
        return (
            <div key={b.id} onClick={() => setOpenId(b.id)}
                className={`grid grid-cols-[minmax(0,1fr)_auto] ${COLS} gap-x-4 gap-y-1 items-center px-4 sm:px-5 py-3.5 border-b border-adm-line last:border-0 cursor-pointer transition-colors ${paid ? 'hover:bg-adm-hover' : 'bg-amber-400/[0.07] hover:bg-amber-400/[0.12]'}`}>
                <span className="hidden sm:block text-[14px] text-text-light tabular-nums">{dayOf(b.createdAt)}</span>
                <span className="min-w-0 truncate text-[14px] text-text-light">{nameOf(b)}</span>
                {/* (on a phone the amount sits beside the name) */}
                <span className="sm:hidden text-[14px] text-right tabular-nums text-text-light whitespace-nowrap">{a ? fmtMoney(a.amount, a.currency) : '—'}</span>
                <span className="hidden sm:flex min-w-0 items-center gap-2 text-[14px] text-text-light">
                    <span aria-hidden className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ background: colorFor(b.serviceId) }} />
                    <span className="truncate">{service}</span>
                </span>
                <span className="hidden sm:block min-w-0 truncate text-[14px] text-text-light">{detail || '—'}</span>
                <span className="sm:hidden col-span-2 flex items-center gap-2 text-[13px] text-text-subtle min-w-0">
                    <span aria-hidden className="w-2 h-2 shrink-0 rounded-full" style={{ background: colorFor(b.serviceId) }} />
                    <span className="truncate">{[service, detail, dayOf(b.createdAt)].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="hidden sm:block text-[14px] text-right tabular-nums text-text-light whitespace-nowrap">{a ? fmtMoney(a.amount, a.currency) : '—'}</span>
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
            <FilterBar>
                {/* paid or not is a filter like the rest, not a tab */}
                <FilterMenu active={payFilter !== 'all'} label={PAY[payFilter]}>
                    <MenuHead>Payment</MenuHead>
                    {(Object.keys(PAY) as (keyof typeof PAY)[]).map((id) => (
                        <MenuOption key={id} on={payFilter === id} onPick={() => setPayFilter(id)}>
                            <span className="flex-1">{PAY[id]}</span>
                            <span className="font-normal text-text-subtle tabular-nums">{id === 'all' ? orders.length : id === 'paid' ? orders.length - unpaidAll : unpaidAll}</span>
                        </MenuOption>
                    ))}
                </FilterMenu>
                <FilterMenu active={market !== 'all' || sourceFilter !== 'all'}
                    label={market === 'all' && sourceFilter === 'all' ? 'Anywhere'
                        : [market !== 'all' ? WHERE[market] : '', sourceFilter !== 'all' ? SOURCE[sourceFilter] : ''].filter(Boolean).join(' · ')}>
                    <MenuHead>Where they live</MenuHead>
                    {(Object.keys(WHERE) as (keyof typeof WHERE)[]).map((id) => (
                        <MenuOption key={id} on={market === id} onPick={() => { setMarket(id); setServiceFilter('all'); }}>{WHERE[id]}</MenuOption>
                    ))}
                    <MenuDivider />
                    <MenuHead>How the order came in</MenuHead>
                    {(Object.keys(SOURCE) as (keyof typeof SOURCE)[]).map((id) => (
                        <MenuOption key={id} on={sourceFilter === id} onPick={() => setSourceFilter(id)}>{SOURCE[id]}</MenuOption>
                    ))}
                </FilterMenu>
                <FilterMenu active={serviceFilter !== 'all'} label={serviceFilter === 'all' ? 'All services' : serviceFilter}>
                    <MenuOption on={serviceFilter === 'all'} onPick={() => setServiceFilter('all')}>All services</MenuOption>
                    {serviceOptions.map((x) => <MenuOption key={x} on={serviceFilter === x} onPick={() => setServiceFilter(x)}>{x}</MenuOption>)}
                </FilterMenu>
                <FilterMenu active={dateActive} label={dateLabel} align="end">
                    <div className="p-1.5 space-y-3">
                        <MenuDate label="Booked from" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} />
                        <MenuDate label="Until" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
                        {dateActive && <AnyDate onClear={() => { setDateFrom(''); setDateTo(''); }} />}
                    </div>
                </FilterMenu>
                <ClearFilters show={payFilter !== 'all' || market !== 'all' || sourceFilter !== 'all' || serviceFilter !== 'all' || dateActive}
                    onClear={() => { setPayFilter('all'); setMarket('all'); setServiceFilter('all'); setSourceFilter('all'); setDateFrom(''); setDateTo(''); }} />
            </FilterBar>

            {/* one list: not paid first, then month by month */}
            <div className="rounded-2xl bg-surface-1 overflow-hidden">
                <div className={`hidden sm:grid ${COLS} gap-x-4 px-5 py-3 text-[13px] font-semibold text-text-subtle border-b border-adm-line`}>
                    <span>Date</span><span>Customer</span><span>Service</span><span>Sub-service</span><span className="text-right">Amount</span><span>Status</span><span className="text-right">Action</span>
                </div>
                {loading && filtered.length === 0 && <InlineLoader />}
                {!loading && filtered.length === 0 && <p className="text-center text-sm text-text-subtle py-12">No orders found{q.trim() ? ` for “${q.trim()}”` : ''}.</p>}
                {unpaidRows.length > 0 && <>{groupHead(`Not paid yet · ${unpaidRows.length}`)}{unpaidRows.map(row)}</>}
                {paidRows.map((b, i) => (
                    <React.Fragment key={b.id}>
                        {(i === 0 || monthOf(paidRows[i - 1]) !== monthOf(b)) && groupHead(monthName(monthOf(b)))}
                        {row(b)}
                    </React.Fragment>
                ))}
            </div>

            {openId && <BookingsView view="detail" openId={openId} onClosed={() => { setOpenId(null); load(); }} />}
        </div>
    );
};

export default SalesView;
