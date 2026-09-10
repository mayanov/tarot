import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, TrendingUp, Wallet, ShoppingBag, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllBookings, Booking } from '../../services/booking';

type Currency = 'IDR' | 'USD';
type Gran = 'day' | 'week' | 'month';
type Preset = '7d' | '30d' | '90d' | 'thisMonth' | 'year' | 'all' | 'custom';

// Services that store only a base serviceName (no price token) — supply a fallback price.
const SERVICE_PRICE_FALLBACK: Record<string, string> = {
    special: 'Rp 250K', '3card': '$12', '5card': '$20', live: '$45',
};
const SERVICE_LABEL: Record<string, string> = {
    chat: 'Chat', call: 'Call / Video', meetup: 'Meetup', special: 'New Year Reading',
    '3card': '3-Card Spread', '5card': '5-Card Deep', live: 'Live Session',
};

const priceToken = (s?: string | null): string | null => {
    if (!s) return null;
    const m = s.match(/Rp\s?[\d.,]+\s?(?:K|JT|jt|rb|RB)?|\$\s?[\d.,]+/);
    return m ? m[0] : null;
};
const parseAmount = (token: string | null): { amount: number; currency: Currency } | null => {
    if (!token) return null;
    if (token.includes('$')) {
        const n = parseFloat(token.replace(/[^\d.]/g, ''));
        return Number.isFinite(n) ? { amount: n, currency: 'USD' } : null;
    }
    const m = token.match(/Rp\s?([\d.,]+)\s?(K|JT|jt|rb|RB)?/);
    if (!m) return null;
    const num = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(num)) return null;
    const suffix = (m[2] || '').toLowerCase();
    const mult = suffix === 'jt' ? 1_000_000 : (suffix === 'k' || suffix === 'rb') ? 1_000 : 1;
    return { amount: num * mult, currency: 'IDR' };
};
const amountForBooking = (b: Booking) =>
    parseAmount(priceToken(b.serviceName) || SERVICE_PRICE_FALLBACK[b.serviceId] || null);

const fmtIDR = (v: number, compact = false) =>
    compact
        ? (v >= 1_000_000 ? `Rp ${(v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0)}jt` : `Rp ${Math.round(v / 1000)}rb`)
        : `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(v))}`;
const fmtUSD = (v: number, compact = false) => compact ? `$${v}` : `$${new Intl.NumberFormat('en-US').format(Math.round(v))}`;
const fmtMoney = (v: number, c: Currency, compact = false) => (c === 'IDR' ? fmtIDR(v, compact) : fmtUSD(v, compact));

// ---- date helpers (local time) ----
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d: Date) => { const x = new Date(d); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x; };
const dayLabel = (iso: string) => { const d = parseISO(iso); return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('en-US', { month: 'short' })}`; };
const monthLabel = (key: string) => { const [y, m] = key.split('-').map(Number); return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); };

const defaultGran = (p: Preset): Gran =>
    (p === '7d' || p === '30d' || p === 'thisMonth') ? 'day' : (p === '90d') ? 'week' : 'month';

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

    const pickPreset = (p: Preset) => { setPreset(p); setGran(defaultGran(p)); };

    // Resolve the active [start, end] ISO window.
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
            case 'all':
            default: return { startISO: '0000-01-01', endISO: '9999-12-31' };
        }
    }, [preset, customStart, customEnd]);

    // Confirmed + done, matching currency, with a parseable amount, within the date window (by order date).
    const rows = useMemo(() => bookings
        .filter((b) => b.status === 'confirmed' || b.status === 'done')
        .map((b) => ({ b, day: (b.createdAt || '').slice(0, 10), amt: amountForBooking(b) }))
        .filter((r) => r.amt && r.amt.currency === currency && r.day >= startISO && r.day <= endISO)
        .map((r) => ({ ...r, amount: r.amt!.amount })),
        [bookings, currency, startISO, endISO]);

    const total = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);
    const avg = rows.length ? total / rows.length : 0;

    // Time series bucketed by the selected granularity.
    const series = useMemo(() => {
        if (rows.length === 0) return [];
        const bucketOf = (iso: string) =>
            gran === 'month' ? iso.slice(0, 7)
                : gran === 'week' ? toISO(startOfWeek(parseISO(iso)))
                    : iso;
        const labelOf = (key: string) => gran === 'month' ? monthLabel(key) : dayLabel(key);
        const map = new Map<string, number>();
        rows.forEach((r) => map.set(bucketOf(r.day), (map.get(bucketOf(r.day)) || 0) + r.amount));
        return [...map.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, value]) => ({ key, label: labelOf(key), value }));
    }, [rows, gran]);

    const best = useMemo(() => series.reduce((m, s) => (s.value > m.value ? s : m), { label: '—', value: 0 }), [series]);

    const byService = useMemo(() => {
        const map = new Map<string, { revenue: number; count: number }>();
        rows.forEach((r) => {
            const cur = map.get(r.b.serviceId) || { revenue: 0, count: 0 };
            cur.revenue += r.amount; cur.count += 1; map.set(r.b.serviceId, cur);
        });
        return [...map.entries()].map(([id, v]) => ({ id, label: SERVICE_LABEL[id] || id, ...v }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [rows]);
    const maxService = Math.max(1, ...byService.map((s) => s.revenue));

    // Secondary-currency total in the same window.
    const otherCurrency: Currency = currency === 'IDR' ? 'USD' : 'IDR';
    const otherTotal = useMemo(() => bookings
        .filter((b) => b.status === 'confirmed' || b.status === 'done')
        .map((b) => ({ day: (b.createdAt || '').slice(0, 10), amt: amountForBooking(b) }))
        .filter((r) => r.amt && r.amt.currency === otherCurrency && r.day >= startISO && r.day <= endISO)
        .reduce((s, r) => s + r.amt!.amount, 0), [bookings, otherCurrency, startISO, endISO]);

    const tickInterval = series.length > 14 ? Math.ceil(series.length / 12) : 0;
    const granLabel = gran === 'day' ? 'Daily' : gran === 'week' ? 'Weekly' : 'Monthly';

    const KPI: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({ icon, label, value, sub }) => (
        <div className="rounded-2xl bg-surface-1 border border-black/5 p-5">
            <div className="flex items-center gap-2 text-text-subtle text-xs uppercase tracking-wider">{icon}<span>{label}</span></div>
            <div className="mt-2 text-2xl font-serif font-bold text-ink tabular-nums">{value}</div>
            {sub && <div className="mt-1 text-xs text-text-subtle">{sub}</div>}
        </div>
    );

    const Seg = <T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) => (
        <div className="inline-flex rounded-full border border-black/10 p-0.5 bg-surface-1 flex-wrap">
            {options.map((o) => (
                <button key={o.id} onClick={() => onChange(o.id)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${value === o.id ? 'bg-lilac text-ink' : 'text-text-subtle hover:text-ink'}`}>
                    {o.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="space-y-6 pt-24 md:pt-12 p-6 md:p-12 max-w-6xl mx-auto">
            {/* Header */}
            <div className="pb-6 border-b border-black/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-ink mb-2">Revenue</h1>
                    <p className="text-text-subtle text-sm">Realized revenue from confirmed &amp; completed bookings, by order date.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Seg value={currency} options={[{ id: 'IDR', label: 'IDR' }, { id: 'USD', label: 'USD' }]} onChange={setCurrency} />
                    <button onClick={load} className="p-2.5 rounded-full border border-black/10 text-text-subtle hover:text-ink hover:border-black/25 transition-colors" title="Refresh">
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Seg value={preset} options={[
                    { id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '90d', label: '90D' },
                    { id: 'thisMonth', label: 'This month' }, { id: 'year', label: 'This year' }, { id: 'all', label: 'All' },
                ]} onChange={pickPreset} />
                <div className="flex items-center gap-2 flex-wrap">
                    <input type="date" value={customStart} onChange={(e) => { setCustomStart(e.target.value); setPreset('custom'); }}
                        className="rounded-lg border border-black/10 bg-surface-1 px-3 py-1.5 text-sm text-ink" />
                    <span className="text-text-subtle text-sm">→</span>
                    <input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); setPreset('custom'); }}
                        className="rounded-lg border border-black/10 bg-surface-1 px-3 py-1.5 text-sm text-ink" />
                    <Seg value={gran} options={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }]} onChange={setGran} />
                </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-500/10 border border-red-400/25 rounded-xl px-4 py-3">{error}</div>}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI icon={<Wallet size={14} />} label="Total revenue" value={fmtMoney(total, currency)}
                    sub={otherTotal > 0 ? `+ ${fmtMoney(otherTotal, otherCurrency)} in ${otherCurrency}` : undefined} />
                <KPI icon={<ShoppingBag size={14} />} label="Paid bookings" value={String(rows.length)} sub={currency} />
                <KPI icon={<TrendingUp size={14} />} label="Avg order value" value={fmtMoney(avg, currency)} />
                <KPI icon={<Award size={14} />} label={`Best ${gran}`} value={fmtMoney(best.value, currency)} sub={best.value > 0 ? best.label : undefined} />
            </div>

            {/* Time series */}
            <div className="rounded-2xl bg-surface-1 border border-black/5 p-5">
                <h2 className="text-sm font-semibold text-ink mb-4">{granLabel} revenue · {currency}</h2>
                {series.length === 0 ? (
                    <p className="text-sm text-text-subtle py-12 text-center">No {currency} revenue in this range.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6E6B77' }} axisLine={false} tickLine={false} interval={tickInterval} />
                            <YAxis tickFormatter={(v) => fmtMoney(v, currency, true)} tick={{ fontSize: 11, fill: '#6E6B77' }} axisLine={false} tickLine={false} width={64} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                contentStyle={{ background: '#fff', border: '1px solid #E7E5E1', borderRadius: 12, fontSize: 13 }}
                                formatter={(v: number) => [fmtMoney(v, currency), 'Revenue']} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#DA8636" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* By service */}
            <div className="rounded-2xl bg-surface-1 border border-black/5 p-5">
                <h2 className="text-sm font-semibold text-ink mb-4">Revenue by service · {currency}</h2>
                {byService.length === 0 ? (
                    <p className="text-sm text-text-subtle py-8 text-center">No data in this range.</p>
                ) : (
                    <div className="space-y-3">
                        {byService.map((s) => (
                            <div key={s.id}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-ink font-medium">{s.label} <span className="text-text-subtle font-normal">· {s.count}</span></span>
                                    <span className="text-ink tabular-nums">{fmtMoney(s.revenue, currency)}</span>
                                </div>
                                <div className="h-2 rounded-full bg-black/[0.05] overflow-hidden">
                                    <div className="h-full rounded-full bg-coral" style={{ width: `${(s.revenue / maxService) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <p className="mt-4 text-xs text-text-subtle">Counts <span className="text-ink font-medium">Confirmed</span> + <span className="text-ink font-medium">Done</span> only, by order date. Range: {startISO === '0000-01-01' ? 'all time' : `${startISO} → ${endISO}`}.</p>
            </div>

            {loading && <p className="text-center text-sm text-text-subtle">Loading…</p>}
        </div>
    );
};

export default RevenueView;
