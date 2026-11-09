import PageHeader from './ui/PageHeader';
import Segmented from './ui/Segmented';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TrendingUp, Wallet, ShoppingBag, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllBookings, Booking, BOOKINGS_CHANGED } from '../../services/booking';
import { LoaderCard } from './ui/InlineLoader';
import { Cur as Currency, amountForBooking, fmtIDR, fmtUSD, fmtMoney } from './lib/format';

type Gran = 'day' | 'week';
type Preset = '7d' | '30d' | '90d' | 'thisMonth' | 'year' | 'all' | 'custom';

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
    const [currency, setCurrency] = useState<Currency>('IDR');
    const [preset, setPreset] = useState<Preset>('30d');
    const [gran, setGran] = useState<Gran>('day');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

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

    // All confirmed/done bookings with a parseable amount in the selected currency (full history).
    const allRows = useMemo<Row[]>(() => bookings
        .filter((b) => b.paymentStatus === 'paid' && b.status !== 'cancelled')
        .map((b) => ({ b, day: (b.createdAt || '').slice(0, 10), amt: amountForBooking(b) }))
        .filter((r) => r.amt && r.amt.currency === currency && r.day)
        .map((r) => ({ b: r.b, day: r.day, serviceId: r.b.serviceId, amount: r.amt!.amount })),
        [bookings, currency]);

    // Services present, ordered by total revenue (stack order + legend).
    const services = useMemo(() => {
        const tot = new Map<string, number>();
        allRows.forEach((r) => tot.set(r.serviceId, (tot.get(r.serviceId) || 0) + r.amount));
        return [...tot.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    }, [allRows]);

    // Active window for the daily/weekly chart + KPIs.
    const { startISO, endISO } = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const end = toISO(today);
        switch (preset) {
            case '7d': return { startISO: toISO(addDays(today, -6)), endISO: end };
            case '30d': return { startISO: toISO(addDays(today, -29)), endISO: end };
            case '90d': return { startISO: toISO(addDays(today, -89)), endISO: end };
            case 'thisMonth': return { startISO: toISO(new Date(today.getFullYear(), today.getMonth(), 1)), endISO: end };
            case 'year': return { startISO: toISO(new Date(today.getFullYear(), 0, 1)), endISO: end };
            case 'custom': return { startISO: customStart || '0000-01-01', endISO: customEnd || end };
            default: return { startISO: '0000-01-01', endISO: '9999-12-31' };
        }
    }, [preset, customStart, customEnd]);

    const rangeRows = useMemo(() => allRows.filter((r) => r.day >= startISO && r.day <= endISO), [allRows, startISO, endISO]);

    const total = useMemo(() => rangeRows.reduce((s, r) => s + r.amount, 0), [rangeRows]);
    const avg = rangeRows.length ? total / rangeRows.length : 0;

    // Daily / weekly stacked series across the range (continuous buckets).
    const series = useMemo(() => {
        if (rangeRows.length === 0) return [];
        const daysSorted = rangeRows.map((r) => r.day).sort();
        const todayISO = toISO(new Date());
        const sISO = startISO === '0000-01-01' ? daysSorted[0] : startISO;
        const eISO = endISO === '9999-12-31' ? todayISO : endISO;
        if (!sISO || eISO < sISO) return [];
        const buckets: Bucket[] = [];
        const step = gran === 'week' ? 7 : 1;
        let d = gran === 'week' ? startOfWeek(parseISO(sISO)) : parseISO(sISO);
        const end = parseISO(eISO);
        let guard = 0;
        while (d <= end && guard++ < 800) { buckets.push({ key: toISO(d), label: dayLabel(toISO(d)) }); d = addDays(d, step); }
        const bucketOf = (day: string) => gran === 'week' ? toISO(startOfWeek(parseISO(day))) : day;
        return buildStacked(rangeRows, buckets, bucketOf, services);
    }, [rangeRows, gran, startISO, endISO, services]);

    // Monthly stacked series — ALWAYS shown, full history (last 18 months).
    const monthlySeries = useMemo(() => {
        if (allRows.length === 0) return [];
        const daysSorted = allRows.map((r) => r.day).sort();
        const first = parseISO(daysSorted[0]);
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
        const trimmed = buckets.slice(-18);
        return buildStacked(allRows, trimmed, (day) => day.slice(0, 7), services);
    }, [allRows, services]);

    const best = useMemo(() => series.reduce((m, s) => ((s.total as number) > m.value ? { label: s.label, value: s.total as number } : m), { label: '—', value: 0 }), [series]);

    const otherCurrency: Currency = currency === 'IDR' ? 'USD' : 'IDR';
    const otherTotal = useMemo(() => bookings
        .filter((b) => b.paymentStatus === 'paid' && b.status !== 'cancelled')
        .map((b) => ({ day: (b.createdAt || '').slice(0, 10), amt: amountForBooking(b) }))
        .filter((r) => r.amt && r.amt.currency === otherCurrency && r.day >= startISO && r.day <= endISO)
        .reduce((s, r) => s + r.amt!.amount, 0), [bookings, otherCurrency, startISO, endISO]);

    const StackTooltip = ({ active, payload, label }: any) => {
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

    const Chart = ({ data }: { data: StackRow[] }) => {
        const tick = data.length > 14 ? Math.ceil(data.length / 12) : 0;
        return (
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.18)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--adm-axis)' }} axisLine={false} tickLine={false} interval={tick} />
                    <YAxis tickFormatter={(v) => fmtMoney(v, currency, true)} tick={{ fontSize: 11, fill: 'var(--adm-axis)' }} axisLine={false} tickLine={false} width={64} />
                    <Tooltip cursor={{ fill: 'rgba(128,128,128,0.08)' }} content={<StackTooltip />} />
                    {services.map((id, i) => (
                        <Bar key={id} dataKey={id} stackId="rev" fill={colorFor(id)} name={SERVICE_LABEL[id] || id}
                            radius={i === services.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const Legend = () => (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
            {services.map((id) => (
                <span key={id} className="inline-flex items-center gap-1.5 text-xs text-text-subtle">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorFor(id) }} />
                    {SERVICE_LABEL[id] || id}
                </span>
            ))}
        </div>
    );

    const KPI: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({ icon, label, value, sub }) => (
        <div className="rounded-2xl bg-surface-1 border border-adm-line p-4">
            <div className="flex items-center gap-2 text-text-subtle text-xs uppercase tracking-wider">{icon}<span>{label}</span></div>
            <div className="mt-2 text-xl font-serif font-bold text-text-light tabular-nums">{value}</div>
            {sub && <div className="mt-1 text-xs text-text-subtle">{sub}</div>}
        </div>
    );

    const Seg = <T extends string>(p: { value: T; options: { id: T; label: string }[]; onChange: (v: NoInfer<T>) => void }) => <Segmented size="sm" {...p} />;

    const granLabel = gran === 'day' ? 'Daily' : 'Weekly';

    const initialLoading = loading && bookings.length === 0;

    return (
        <div className="space-y-5 pt-20 md:pt-8 p-4 md:px-8">
            <PageHeader
                title="Revenue"
                subtitle="Money that came in: bookings marked paid (cancelled left out), by order date. Who your customers are is under Customers."
                onRefresh={load}
                refreshing={loading}
            >
                <Segmented value={currency} options={[{ id: 'IDR', label: 'IDR' }, { id: 'USD', label: 'USD' }]} onChange={setCurrency} />
            </PageHeader>

            {error && <div className="text-sm text-red-600 bg-red-500/10 border border-red-400/25 rounded-xl px-3 py-2.5">{error}</div>}

            {initialLoading && <LoaderCard />}

            {!initialLoading && (<>
            <div className="rounded-2xl bg-surface-1 border border-adm-line px-3 py-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
                <Seg value={preset} options={[
                    { id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '90d', label: '90D' },
                    { id: 'thisMonth', label: 'Month' }, { id: 'year', label: 'Year' },
                    { id: 'all', label: 'All' }, { id: 'custom', label: 'Custom' },
                ]} onChange={setPreset} />
                {preset === 'custom' && (
                    <div className="flex items-center gap-1.5">
                        <input type="date" value={customStart} max={customEnd || undefined}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="rounded-lg border border-adm-line-2 bg-bg-dark px-2 py-1 text-xs text-text-light focus:border-lilac focus:outline-none" />
                        <span className="text-xs text-text-subtle">–</span>
                        <input type="date" value={customEnd} min={customStart || undefined}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="rounded-lg border border-adm-line-2 bg-bg-dark px-2 py-1 text-xs text-text-light focus:border-lilac focus:outline-none" />
                    </div>
                )}
                <div className="ml-auto">
                    <Seg value={gran} options={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }]} onChange={setGran} />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI icon={<Wallet size={14} />} label="Total revenue" value={fmtMoney(total, currency)}
                    sub={otherTotal > 0 ? `+ ${fmtMoney(otherTotal, otherCurrency)} in ${otherCurrency}` : undefined} />
                <KPI icon={<ShoppingBag size={14} />} label="Paid bookings" value={String(rangeRows.length)} sub={currency} />
                <KPI icon={<TrendingUp size={14} />} label="Avg order value" value={fmtMoney(avg, currency)} />
                <KPI icon={<Award size={14} />} label={`Best ${gran}`} value={fmtMoney(best.value, currency)} sub={best.value > 0 ? best.label : undefined} />
            </div>

            {/* Daily / weekly stacked chart */}
            <div className="rounded-2xl bg-surface-1 border border-adm-line p-4">
                <h2 className="text-sm font-semibold text-text-light mb-3">{granLabel} revenue by source · {currency}</h2>
                {series.length === 0 ? (
                    <p className="text-sm text-text-subtle py-12 text-center">No {currency} revenue in this range.</p>
                ) : (<><Legend /><Chart data={series} /></>)}
            </div>

            {/* Monthly stacked chart — always shown */}
            <div className="rounded-2xl bg-surface-1 border border-adm-line p-4">
                <h2 className="text-sm font-semibold text-text-light mb-3">Monthly revenue by source · {currency}</h2>
                {monthlySeries.length === 0 ? (
                    <p className="text-sm text-text-subtle py-12 text-center">No {currency} revenue yet.</p>
                ) : (<><Legend /><Chart data={monthlySeries} /></>)}
            </div>
            </>)}

            {loading && <p className="text-center text-sm text-text-subtle">Loading…</p>}
        </div>
    );
};

export default RevenueView;
