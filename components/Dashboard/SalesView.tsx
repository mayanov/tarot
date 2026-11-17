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
    const [subFilter, setSubFilter] = useState<string>('all');
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

    // The services in the data, as the table's Service column names them (3-Card and
    // 5-Card are both Email), each with the sub-services it has, for the service menu.
    const serviceOptions = useMemo(() => {
        const map = new Map<string, Set<string>>();
        orders.forEach((b) => {
            const s = serviceGroup(b);
            if (!map.has(s)) map.set(s, new Set());
            const sub = subServiceOf(b);
            if (sub) map.get(s)!.add(sub);
        });
        const byName = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });
        return Array.from(map, ([name, subs]) => ({ name, subs: Array.from(subs).sort(byName) })).sort((a, b) => byName(a.name, b.name));
    }, [orders]);

    // The orders the filters pick, all but paid-or-not: the money summary splits these into
    // paid and unpaid, so it always speaks for what the filters are set to.
    const scoped = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const fromTs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
        const toTs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;
        return orders.filter((b) => {
            if (serviceFilter !== 'all' && serviceGroup(b) !== serviceFilter) return false;
            if (subFilter !== 'all' && subServiceOf(b) !== subFilter) return false;
            if (sourceFilter !== 'all' && (b.source === 'manual' ? 'manual' : 'booking') !== sourceFilter) return false;
            if (fromTs || toTs) {
                const ts = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
                if (!Number.isFinite(ts)) return false;
                if (fromTs && ts < fromTs) return false;
                if (toTs && ts > toTs) return false;
            }
            return !needle || matchesSearch(needle, b.name, b.serviceName, serviceLabel(b), b.contact, b.ref, b.adminNote);
        }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }, [orders, q, serviceFilter, subFilter, sourceFilter, dateFrom, dateTo]);
    const filtered = useMemo(() => (payFilter === 'all' ? scoped : scoped.filter((b) => (b.paymentStatus || 'unpaid') === payFilter)), [scoped, payFilter]);

    // Paid vs still owed, per currency, for the orders the filters pick.
    const totals = useMemo(() => {
        const t = { paidCount: 0, unpaidCount: 0, paid: { IDR: 0, USD: 0 } as Record<Cur, number>, unpaid: { IDR: 0, USD: 0 } as Record<Cur, number> };
        scoped.forEach((b) => {
            const paid = b.paymentStatus === 'paid';
            paid ? t.paidCount++ : t.unpaidCount++;
            const a = amountOf(b);
            if (!a) return;
            (paid ? t.paid : t.unpaid)[a.currency as Cur] += a.amount;
        });
        return t;
    }, [scoped]);
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
    const unpaidAll = totals.unpaidCount;
    // The money at a glance, as a small table: what's paid, what's unpaid and both together
    // down the side, rupiah and dollars side by side across (never added together; with a
    // market picked, just its own), then how many orders. Amounts sit right-aligned in
    // their columns so they read straight down; a zero stays grey.
    const summary = [
        { id: 'paid', label: 'Paid', money: totals.paid, count: totals.paidCount },
        { id: 'unpaid', label: 'Unpaid', money: totals.unpaid, count: totals.unpaidCount },
        { id: 'all', label: 'Total', money: { IDR: totals.paid.IDR + totals.unpaid.IDR, USD: totals.paid.USD + totals.unpaid.USD } as Record<Cur, number>, count: scoped.length },
    ];
    // what the summary covers, in words: "All time", or "01 Nov – 30 Nov · Email · 3-Card Spread"
    const scopeWords = [
        dateActive ? dateLabel : 'All time',
        market !== 'all' ? WHERE[market] : '',
        sourceFilter !== 'all' ? SOURCE[sourceFilter] : '',
        serviceFilter !== 'all' ? serviceFilter : '',
        subFilter !== 'all' ? subFilter : '',
        q.trim() ? `“${q.trim()}”` : '',
    ].filter(Boolean).join(' · ');
    const SUM_COLS = curs.length > 1
        ? 'grid-cols-[minmax(4.5rem,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.7fr)]'
        : 'grid-cols-[minmax(4.5rem,1fr)_minmax(0,1.4fr)_minmax(0,0.7fr)]';
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
                    <h1 className="text-[34px] sm:text-[40px] font-bold tracking-[-0.02em] leading-tight text-text-light">Sales</h1>
                </div>
                <div className="flex items-center gap-2">
                    <IconButton onClick={load} title="Refresh" aria-label="Refresh"><RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /></IconButton>
                </div>
            </div>

            {error && <div className="text-sm due-late-text bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5">{error}</div>}

            {/* the money at a glance for what the filters pick: paid, unpaid and total, rupiah
                and dollars side by side. A row shows just its orders in the list below
                (the same as the payment filter); picked again, it shows all of them. Solid
                plum with light type (the deep accent: plum in light mode, violet in dark), so it
                stands apart from the list. */}
            <div className="rounded-2xl bg-lilac-dark text-[#E9E3F5] px-4 sm:px-6 pt-4 pb-2">
                {/* its title (what it covers) the largest, then the amounts, then the small column names */}
                <h2 className="text-[20px] sm:text-[24px] font-semibold tracking-[-0.01em] leading-tight text-white truncate" title={scopeWords}>{scopeWords}</h2>
                <div className={`mt-2 grid ${SUM_COLS} gap-x-4 py-2 text-[12.5px] text-white/60 border-b border-white/15`}>
                    <span />
                    {curs.map((c) => <span key={c} className="text-right">{c === 'IDR' ? 'Rupiah' : 'Dollars'}</span>)}
                    <span className="text-right">Orders</span>
                </div>
                {summary.map((r) => {
                    const due = r.id === 'unpaid' && r.count > 0;
                    const on = r.id !== 'all' && payFilter === r.id;
                    return (
                        <button key={r.id} type="button" aria-pressed={on}
                            onClick={() => setPayFilter(r.id === 'all' || on ? 'all' : (r.id as 'paid' | 'unpaid'))}
                            title={r.id === 'all' ? 'Show every order' : on ? 'Show every order' : `Show only ${r.label.toLowerCase()} orders`}
                            className={`text-left grid ${SUM_COLS} gap-x-4 items-baseline -mx-2 px-2 py-2.5 rounded-lg tabular-nums transition-colors ${on ? 'bg-white/15' : 'hover:bg-white/10'} ${r.id === 'all' ? 'border-t border-white/15 rounded-t-none' : ''}`}
                            style={{ width: 'calc(100% + 1rem)' }}>
                            <span className={`text-[14px] ${due ? 'text-amber-300 font-semibold' : r.id === 'all' ? 'font-semibold text-white' : 'text-white/85'}`}>{r.label}</span>
                            {curs.map((c) => (
                                <span key={c} className={`text-right text-[15px] sm:text-[18px] font-semibold tracking-[-0.01em] whitespace-nowrap ${r.money[c] ? 'text-white' : 'text-white/45'}`}>
                                    {fmtMoney(r.money[c], c)}
                                </span>
                            ))}
                            <span className={`text-right text-[14px] ${r.count ? 'text-white' : 'text-white/45'}`}>{r.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* which orders (tabs, left), then the filters (right) */}
            {/* search on the left of the filters' line, the filters on the right */}
            <FilterBar tabs={<div className="w-full sm:w-72 pb-1.5"><SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, ref or note" /></div>}>
                {/* paid or not is a filter like the rest, not a tab */}
                <FilterMenu active={payFilter !== 'all'} label={PAY[payFilter]}>
                    <MenuHead>Payment</MenuHead>
                    {(Object.keys(PAY) as (keyof typeof PAY)[]).map((id) => (
                        <MenuOption key={id} on={payFilter === id} onPick={() => setPayFilter(id)}>
                            <span className="flex-1">{PAY[id]}</span>
                            <span className="font-normal text-text-subtle tabular-nums">{id === 'all' ? scoped.length : id === 'paid' ? totals.paidCount : unpaidAll}</span>
                        </MenuOption>
                    ))}
                </FilterMenu>
                <FilterMenu active={market !== 'all' || sourceFilter !== 'all'}
                    label={market === 'all' && sourceFilter === 'all' ? 'Anywhere'
                        : [market !== 'all' ? WHERE[market] : '', sourceFilter !== 'all' ? SOURCE[sourceFilter] : ''].filter(Boolean).join(' · ')}>
                    <MenuHead>Where they live</MenuHead>
                    {(Object.keys(WHERE) as (keyof typeof WHERE)[]).map((id) => (
                        <MenuOption key={id} on={market === id} onPick={() => { setMarket(id); setServiceFilter('all'); setSubFilter('all'); }}>{WHERE[id]}</MenuOption>
                    ))}
                    <MenuDivider />
                    <MenuHead>How the order came in</MenuHead>
                    {(Object.keys(SOURCE) as (keyof typeof SOURCE)[]).map((id) => (
                        <MenuOption key={id} on={sourceFilter === id} onPick={() => setSourceFilter(id)}>{SOURCE[id]}</MenuOption>
                    ))}
                </FilterMenu>
                {/* one menu for both: each service, with its sub-services tucked in under it */}
                <FilterMenu active={serviceFilter !== 'all'} menuClassName="w-64"
                    label={serviceFilter === 'all' ? 'All services' : [serviceFilter, subFilter !== 'all' ? subFilter : ''].filter(Boolean).join(' · ')}>
                    <MenuOption on={serviceFilter === 'all'} onPick={() => { setServiceFilter('all'); setSubFilter('all'); }}>All services</MenuOption>
                    {serviceOptions.map(({ name, subs }) => (
                        <React.Fragment key={name}>
                            <MenuDivider />
                            <MenuOption on={serviceFilter === name && subFilter === 'all'} onPick={() => { setServiceFilter(name); setSubFilter('all'); }}>{name}</MenuOption>
                            {subs.map((x) => (
                                <MenuOption key={x} sub on={serviceFilter === name && subFilter === x} onPick={() => { setServiceFilter(name); setSubFilter(x); }}>{x}</MenuOption>
                            ))}
                        </React.Fragment>
                    ))}
                </FilterMenu>
                <FilterMenu active={dateActive} label={dateLabel} align="end">
                    <div className="p-1.5 space-y-3">
                        <MenuDate label="Booked from" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} />
                        <MenuDate label="Until" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
                        {dateActive && <AnyDate onClear={() => { setDateFrom(''); setDateTo(''); }} />}
                    </div>
                </FilterMenu>
                <ClearFilters show={payFilter !== 'all' || market !== 'all' || sourceFilter !== 'all' || serviceFilter !== 'all' || subFilter !== 'all' || dateActive}
                    onClear={() => { setPayFilter('all'); setMarket('all'); setServiceFilter('all'); setSubFilter('all'); setSourceFilter('all'); setDateFrom(''); setDateTo(''); }} />
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
