import PageHeader from './ui/PageHeader';
import Segmented from './ui/Segmented';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllBookings, Booking, BOOKINGS_CHANGED } from '../../services/booking';
import { LoaderCard } from './ui/InlineLoader';
import StatStrip from './ui/StatStrip';
import { Cur as Currency, amountForBooking, fmtIDR, fmtUSD, fmtMoney } from './lib/format';

type Gran = 'day' | 'week';
type Preset = '7d' | '30d' | 'thisMonth' | 'lastMonth' | 'year' | 'all' | 'custom';
const PRESETS: { id: Preset; label: string }[] = [
    { id: '7d', label: 'Last 7 days' }, { id: '30d', label: 'Last 30 days' },
    { id: 'thisMonth', label: 'This month' }, { id: 'lastMonth', label: 'Last month' },
    { id: 'year', label: 'This year' }, { id: 'all', label: 'All time' }, { id: 'custom', label: 'Custom' },
];

const SERVICE_LABEL: Record<string, string> = {
    chat: 'Chat', call: 'Call / Video', meetup: 'Meetup', special: 'New Year Reading (PDF)',
    '3card': '3-Card Spread', '5card': '5-Card Deep', live: 'Live Session',
    payl: 'Pay as you like',
};
const SERVICE_COLOR: Record<string, string> = {
    chat: '#6B3FA0', call: '#3D4A94', meetup: '#2EA866', special: '#A98BDB',
    '3card': '#7A7FD1', '5card': '#8C8499', live: '#C9B4EC', payl: '#C99A4B',
};
const colorFor = (id: string) => SERVICE_COLOR[id] || '#B5AEC4';

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d: Date) => { const x = new Date(d); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x; };
const dayLabel = (iso: string) => { const d = parseISO(iso); return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('en-US', { month: 'short' })}`; };
const daysBetween = (a: string, b: string) => Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
// '12 Oct – 10 Nov', with the year when it isn't this one
const rangeLabel = (a: string, b: string) => {
    const y = new Date().getFullYear();
    const one = (iso: string, withYear: boolean) => { const d = parseISO(iso); return `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}${withYear ? ` ${d.getFullYear()}` : ''}`; };
    const showYear = parseISO(a).getFullYear() !== y || parseISO(b).getFullYear() !== y;
    return a === b ? one(a, showYear) : `${one(a, showYear)} – ${one(b, showYear)}`;
};
const monthLabel = (key: string) => { const [y, m] = key.split('-').map(Number); return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); };

type Row = { b: Booking; day: string; serviceId: string; amount: number };
type Bucket = { key: string; label: string };
type StackRow = { key: string; label: string; total: number;[svc: string]: number | string };

// Build stacked rows: each bucket gets a per-service revenue sum (missing = 0).
const buildStacked = (rows: Row[], buckets: Bucket[], bucketOf: (day: string) => string, services: string[]): StackRow[] => {
    const map = new Map<string, Record<string, number>>();
    rows.forEach((r) => {
        const k = bucketOf(r.day);
        const rec = map.get(k) || {};
        rec[r.serviceId] = (rec[r.serviceId] || 0) + r.amount;
        map.set(k, rec);
    });
    return buckets.map((bk) => {
        const rec = map.get(bk.key) || {};
        const out: StackRow = { key: bk.key, label: bk.label, total: 0 };
        services.forEach((s) => { out[s] = rec[s] || 0; out.total = (out.total as number) + (rec[s] || 0); });
        return out;
    });
};

const RevenueView: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [preset, setPreset] = useState<Preset>('30d');
    // by day or by week: picked from the range's length unless chosen on the chart
    const [granPick, setGranPick] = useState<Gran | null>(null);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [menuOpen, setMenuOpenRaw] = useState(false);
    const [customOpen, setCustomOpen] = useState(false); // picking dates; the page changes only on Show
    const setMenuOpen = (v: boolean | ((o: boolean) => boolean)) => { setMenuOpenRaw(v); setCustomOpen(false); };
    const [draft, setDraft] = useState({ start: '', end: '' }); // the custom dates while being picked
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!menuOpen) return;
        const away = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
        document.addEventListener('mousedown', away);
        document.addEventListener('keydown', esc);
        return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
    }, [menuOpen]);
    const pickPreset = (id: Preset) => {
        if (id === 'custom') { setDraft({ start: startISO, end: endISO }); setCustomOpen(true); return; }
        setPreset(id); setGranPick(null); setMenuOpen(false);
    };

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

    // Paid bookings (cancelled left out), each in its own currency: rupiah and dollars are
    // never added together or converted, so the page shows both side by side.
    const paidRows = useMemo(() => bookings
        .filter((b) => b.paymentStatus === 'paid' && b.status !== 'cancelled')
        .map((b) => ({ b, day: (b.createdAt || '').slice(0, 10), amt: amountForBooking(b) }))
        .filter((r) => r.amt && r.day), [bookings]);

    // The range (real dates, so the chip can say them) and the one before it to compare with
    // (the same days a month or a year back for month and year, otherwise as many days before).
    const firstDay = useMemo(() => paidRows.map((r) => r.day).sort()[0] || toISO(new Date()), [paidRows]);
    const { startISO, endISO, prevStart, prevEnd } = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const end = toISO(today);
        const y = today.getFullYear(), m = today.getMonth();
        const back = (a: string, b: string) => { const n = daysBetween(a, b) + 1; return { prevStart: toISO(addDays(parseISO(a), -n)), prevEnd: toISO(addDays(parseISO(a), -1)) }; };
        const monthBack = (iso: string, k: number) => { const d = parseISO(iso); const t = new Date(d.getFullYear(), d.getMonth() - k, 1); const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); return toISO(new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last))); };
        switch (preset) {
            case '7d': { const s0 = toISO(addDays(today, -6)); return { startISO: s0, endISO: end, ...back(s0, end) }; }
            case '30d': { const s0 = toISO(addDays(today, -29)); return { startISO: s0, endISO: end, ...back(s0, end) }; }
            case 'thisMonth': { const s0 = toISO(new Date(y, m, 1)); return { startISO: s0, endISO: end, prevStart: monthBack(s0, 1), prevEnd: monthBack(end, 1) }; }
            case 'lastMonth': { const s0 = toISO(new Date(y, m - 1, 1)), e0 = toISO(new Date(y, m, 0)); return { startISO: s0, endISO: e0, prevStart: toISO(new Date(y, m - 2, 1)), prevEnd: toISO(new Date(y, m - 1, 0)) }; }
            case 'year': { const s0 = toISO(new Date(y, 0, 1)); return { startISO: s0, endISO: end, prevStart: toISO(new Date(y - 1, 0, 1)), prevEnd: monthBack(end, 12) }; }
            case 'custom': { const s0 = customStart || firstDay, e0 = customEnd || end; return { startISO: s0, endISO: e0, ...back(s0, e0) }; }
            default: return { startISO: firstDay, endISO: end, prevStart: '', prevEnd: '' };
        }
    }, [preset, customStart, customEnd, firstDay]);
    const gran: Gran = granPick || (daysBetween(startISO, endISO) > 62 ? 'week' : 'day');

    // everything for one currency: totals, the day/week chart and the monthly chart
    const report = (currency: Currency) => {
        const allRows: Row[] = paidRows.filter((r) => r.amt!.currency === currency)
            .map((r) => ({ b: r.b, day: r.day, serviceId: r.b.serviceId, amount: r.amt!.amount }));
        // services present, ordered by total revenue (stack order + legend)
        const tot = new Map<string, number>();
        allRows.forEach((r) => tot.set(r.serviceId, (tot.get(r.serviceId) || 0) + r.amount));
        const services = [...tot.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);

        const rangeRows = allRows.filter((r) => r.day >= startISO && r.day <= endISO);
        const total = rangeRows.reduce((sum, r) => sum + r.amount, 0);
        const avg = rangeRows.length ? total / rangeRows.length : 0;
        const prevRows = prevStart ? allRows.filter((r) => r.day >= prevStart && r.day <= prevEnd) : [];
        const prevTotal = prevRows.reduce((sum, r) => sum + r.amount, 0);
        const prev = prevStart ? { total: prevTotal, count: prevRows.length, avg: prevRows.length ? prevTotal / prevRows.length : 0 } : null;

        // daily / weekly stacked series across the range (continuous buckets)
        let series: StackRow[] = [];
        if (rangeRows.length) {
            const sISO = startISO, eISO = endISO;
            if (eISO >= sISO) {
                const buckets: Bucket[] = [];
                const step = gran === 'week' ? 7 : 1;
                let d = gran === 'week' ? startOfWeek(parseISO(sISO)) : parseISO(sISO);
                const end = parseISO(eISO);
                let guard = 0;
                while (d <= end && guard++ < 800) { buckets.push({ key: toISO(d), label: dayLabel(toISO(d)) }); d = addDays(d, step); }
                const bucketOf = (day: string) => gran === 'week' ? toISO(startOfWeek(parseISO(day))) : day;
                series = buildStacked(rangeRows, buckets, bucketOf, services);
            }
        }

        // monthly stacked series, always the full history (last 18 months)
        let monthlySeries: StackRow[] = [];
        if (allRows.length) {
            const first = parseISO(allRows.map((r) => r.day).sort()[0]);
            const now = new Date();
            const buckets: Bucket[] = [];
            let d = new Date(first.getFullYear(), first.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 1);
            let guard = 0;
            while (d <= end && guard++ < 60) {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                buckets.push({ key, label: monthLabel(key) });
                d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            }
            monthlySeries = buildStacked(allRows, buckets.slice(-18), (day) => day.slice(0, 7), services);
        }

        const best = series.reduce((m, x) => ((x.total as number) > m.value ? { label: x.label, value: x.total as number } : m), { label: '—', value: 0 });
        return { currency, services, count: rangeRows.length, total, avg, prev, series, monthlySeries, best };
    };
    const reports = useMemo(() => (['IDR', 'USD'] as Currency[]).map(report),
        [paidRows, startISO, endISO, prevStart, prevEnd, gran]); // eslint-disable-line react-hooks/exhaustive-deps
    type Report = ReturnType<typeof report>;

    const StackTooltip = ({ active, payload, label, currency }: any) => {
        if (!active || !payload || !payload.length) return null;
        const rows = payload.filter((p: any) => p.value > 0);
        const tot = rows.reduce((s: number, p: any) => s + p.value, 0);
        return (
            <div className="rounded-xl bg-surface-1 border border-adm-line-2 shadow-lg px-3 py-2 text-xs">
                <div className="font-semibold text-text-light mb-1">{label}</div>
                {rows.map((p: any) => (
                    <div key={p.dataKey} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{SERVICE_LABEL[p.dataKey] || p.dataKey}</span>
                        <span className="tabular-nums text-text-light">{fmtMoney(p.value, currency)}</span>
                    </div>
                ))}
                {rows.length > 1 && <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-adm-line-2 font-semibold"><span>Total</span><span className="tabular-nums">{fmtMoney(tot, currency)}</span></div>}
            </div>
        );
    };

    const Chart = ({ data, currency, services }: { data: StackRow[]; currency: Currency; services: string[] }) => {
        const tick = data.length > 14 ? Math.ceil(data.length / 12) : 0;
        return (
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.18)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--adm-axis)' }} axisLine={false} tickLine={false} interval={tick} />
                    <YAxis tickFormatter={(v) => fmtMoney(v, currency, true)} tick={{ fontSize: 11, fill: 'var(--adm-axis)' }} axisLine={false} tickLine={false} width={64} />
                    <Tooltip cursor={{ fill: 'rgba(128,128,128,0.08)' }} content={<StackTooltip currency={currency} />} />
                    {services.map((id, i) => (
                        <Bar key={id} dataKey={id} stackId="rev" fill={colorFor(id)} name={SERVICE_LABEL[id] || id}
                            radius={i === services.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const Legend = ({ services }: { services: string[] }) => (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
            {services.map((id) => (
                <span key={id} className="inline-flex items-center gap-1.5 text-xs text-text-subtle">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorFor(id) }} />
                    {SERVICE_LABEL[id] || id}
                </span>
            ))}
        </div>
    );

    // one figure, rupiah and dollars on a line each (never added together)
    const CUR_TAG: Record<Currency, string> = { IDR: 'IDR', USD: 'USD' };
    // up or down against the range before ('new' when there was nothing then)
    const Delta: React.FC<{ now: number; before?: number }> = ({ now, before }) => {
        if (before === undefined || (now === 0 && before === 0)) return null;
        if (before === 0) return <span className="text-[11px] font-semibold text-sage">new</span>;
        const pct = Math.round(((now - before) / before) * 100);
        if (pct === 0) return <span className="text-[11px] text-text-subtle">same</span>;
        const up = pct > 0;
        return (
            <span className={`inline-flex items-center text-[11px] font-semibold tabular-nums ${up ? 'text-sage' : 'text-coral-deep'}`}>
                {up ? <ArrowUp size={11} strokeWidth={2.5} /> : <ArrowDown size={11} strokeWidth={2.5} />}{Math.abs(pct)}%
            </span>
        );
    };
    const chartCard = (title: string, r: Report, data: StackRow[], empty: string, extra?: React.ReactNode) => (
        <div key={r.currency} className="rounded-2xl bg-surface-1 border border-adm-line p-4 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-semibold text-text-light">{title} <span className="text-text-subtle font-normal">· {r.currency}</span></h2>
                {extra}
            </div>
            {data.length === 0 ? (
                <p className="text-sm text-text-subtle py-12 text-center">{empty}</p>
            ) : (<><Legend services={r.services} /><Chart data={data} currency={r.currency} services={r.services} /></>)}
        </div>
    );

    const Seg = <T extends string>(p: { value: T; options: { id: T; label: string }[]; onChange: (v: NoInfer<T>) => void }) => <Segmented size="sm" {...p} />;

    const granLabel = gran === 'day' ? 'Daily' : 'Weekly';

    const initialLoading = loading && bookings.length === 0;

    return (
        <div className="space-y-5 pt-20 lg:pt-8 p-4 md:px-8">
            <PageHeader
                title="Report"
                subtitle="Money that came in: bookings marked paid (cancelled left out), by order date. Rupiah and dollars are kept apart, never added together. Who your customers are is under Customers."
                onRefresh={load}
                refreshing={loading}
            />

            {error && <div className="text-sm text-red-600 bg-red-500/10 border border-red-400/25 rounded-xl px-3 py-2.5">{error}</div>}

            {initialLoading && <LoaderCard />}

            {!initialLoading && (<>
            {/* the range: one chip that stays under the top bar while scrolling, with a short menu */}
            <div className="sticky top-14 lg:top-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-2.5 bg-bg-deep/85 backdrop-blur-md flex flex-wrap items-center gap-x-3 gap-y-1">
                <div ref={menuRef} className="relative">
                    <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}
                        className={`inline-flex items-center gap-2 rounded-full bg-surface-1 border pl-3 pr-2.5 py-1.5 text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors ${menuOpen ? 'border-lilac/50' : 'border-adm-line hover:border-adm-line-2'}`}>
                        <CalendarDays size={15} className="text-lilac" />
                        <span className="font-semibold text-text-light">{PRESETS.find((x) => x.id === preset)!.label}</span>
                        <span className="text-text-subtle">· {rangeLabel(startISO, endISO)}</span>
                        <ChevronDown size={15} className={`text-text-subtle transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {menuOpen && (
                        <div role="menu" className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl bg-surface-1 border border-adm-line-2 shadow-xl p-1.5 z-30">
                            {PRESETS.map((x) => (
                                <button key={x.id} type="button" role="menuitemradio" aria-checked={preset === x.id} onClick={() => pickPreset(x.id)}
                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-[13px] text-left transition-colors hover:bg-adm-hover ${preset === x.id ? 'text-lilac font-semibold' : 'text-text-light'}`}>
                                    {x.label}
                                    {preset === x.id && <Check size={15} />}
                                </button>
                            ))}
                            {(customOpen || preset === 'custom') && (
                                <div className="mt-1 pt-2.5 px-2 pb-1.5 border-t border-adm-line space-y-2">
                                    <label className="flex items-center justify-between gap-2 text-[12px] text-text-subtle">From
                                        <input type="date" value={draft.start} max={draft.end || undefined} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
                                            className="w-[9.5rem] rounded-lg border border-adm-line-2 bg-bg-dark px-2 py-1 text-xs text-text-light focus:border-lilac focus:outline-none" />
                                    </label>
                                    <label className="flex items-center justify-between gap-2 text-[12px] text-text-subtle">To
                                        <input type="date" value={draft.end} min={draft.start || undefined} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
                                            className="w-[9.5rem] rounded-lg border border-adm-line-2 bg-bg-dark px-2 py-1 text-xs text-text-light focus:border-lilac focus:outline-none" />
                                    </label>
                                    <button type="button" disabled={!draft.start || !draft.end || draft.end < draft.start}
                                        onClick={() => { setCustomStart(draft.start); setCustomEnd(draft.end); setPreset('custom'); setGranPick(null); setMenuOpen(false); }}
                                        className="w-full rounded-lg bg-lilac text-white text-[13px] font-semibold py-1.5 disabled:opacity-40 transition-opacity">Show these dates</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {prevStart && <span className="text-[12px] text-text-subtle">Compared with {rangeLabel(prevStart, prevEnd)}</span>}
            </div>

            {/* a line per currency, with the change against the range before beside it */}
            <StatStrip layout="four" stats={[
                { label: 'Total revenue', lines: reports.map((r) => ({ key: r.currency, value: fmtMoney(r.total, r.currency), note: <Delta now={r.total} before={r.prev?.total} /> })) },
                { label: 'Paid bookings', lines: reports.map((r) => ({ key: r.currency, value: String(r.count), note: <span className="inline-flex items-baseline gap-2">{r.currency === 'IDR' ? 'in Rp' : 'in $'}<Delta now={r.count} before={r.prev?.count} /></span> })) },
                { label: 'Avg order', lines: reports.map((r) => ({ key: r.currency, value: fmtMoney(r.avg, r.currency), note: <Delta now={r.avg} before={r.prev ? (r.prev.count ? r.prev.avg : 0) : undefined} /> })) },
                { label: `Best ${gran}`, lines: reports.map((r) => ({ key: r.currency, value: fmtMoney(r.best.value, r.currency), note: r.best.value > 0 ? r.best.label : undefined })) },
            ]} />

            {/* Daily / weekly stacked charts, one per currency */}
            <div className="grid gap-4 xl:grid-cols-2">
                {reports.map((r) => chartCard(`${granLabel} revenue by source`, r, r.series, `No ${r.currency} revenue in this range.`,
                    <Seg value={gran} options={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }]} onChange={setGranPick} />))}
            </div>

            {/* Monthly stacked charts, always shown */}
            <div className="grid gap-4 xl:grid-cols-2">
                {reports.map((r) => chartCard('Monthly revenue by source', r, r.monthlySeries, `No ${r.currency} revenue yet.`))}
            </div>
            </>)}

            {loading && <p className="text-center text-sm text-text-subtle">Loading…</p>}
        </div>
    );
};

export default RevenueView;
