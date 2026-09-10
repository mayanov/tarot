import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, TrendingUp, Wallet, ShoppingBag, CalendarClock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getAllBookings, Booking } from '../../services/booking';

type Currency = 'IDR' | 'USD';

// Services that store only a base serviceName (no price token) — supply a fallback price.
const SERVICE_PRICE_FALLBACK: Record<string, string> = {
    special: 'Rp 250K',
    '3card': '$12',
    '5card': '$20',
    live: '$45',
};

// Nice display names for the by-service breakdown.
const SERVICE_LABEL: Record<string, string> = {
    chat: 'Chat', call: 'Call / Video', meetup: 'Meetup', special: 'New Year Reading',
    '3card': '3-Card Spread', '5card': '5-Card Deep', live: 'Live Session',
};

// Pull "Rp 140K" / "Rp 1,17JT" / "$20" out of a string.
const priceToken = (s?: string | null): string | null => {
    if (!s) return null;
    const m = s.match(/Rp\s?[\d.,]+\s?(?:K|JT|jt|rb|RB)?|\$\s?[\d.,]+/);
    return m ? m[0] : null;
};

// Parse a price token into { amount, currency }.
const parseAmount = (token: string | null): { amount: number; currency: Currency } | null => {
    if (!token) return null;
    if (token.includes('$')) {
        const n = parseFloat(token.replace(/[^\d.]/g, ''));
        return Number.isFinite(n) ? { amount: n, currency: 'USD' } : null;
    }
    const m = token.match(/Rp\s?([\d.,]+)\s?(K|JT|jt|rb|RB)?/);
    if (!m) return null;
    // Indonesian formatting: '.' = thousands, ',' = decimal.
    const num = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(num)) return null;
    const suffix = (m[2] || '').toLowerCase();
    const mult = suffix === 'jt' ? 1_000_000 : (suffix === 'k' || suffix === 'rb') ? 1_000 : 1;
    return { amount: num * mult, currency: 'IDR' };
};

const amountForBooking = (b: Booking): { amount: number; currency: Currency } | null =>
    parseAmount(priceToken(b.serviceName) || SERVICE_PRICE_FALLBACK[b.serviceId] || null);

const fmtIDR = (v: number, compact = false) =>
    compact
        ? (v >= 1_000_000 ? `Rp ${(v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0)}jt` : `Rp ${Math.round(v / 1000)}rb`)
        : `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(v))}`;
const fmtUSD = (v: number, compact = false) =>
    compact ? `$${v}` : `$${new Intl.NumberFormat('en-US').format(Math.round(v))}`;
const fmtMoney = (v: number, c: Currency, compact = false) => (c === 'IDR' ? fmtIDR(v, compact) : fmtUSD(v, compact));

const monthKey = (iso: string) => (iso || '').slice(0, 7); // YYYY-MM
const monthLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const RevenueView: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currency, setCurrency] = useState<Currency>('IDR');

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

    // Only confirmed + done bookings count as realized revenue.
    const paid = useMemo(
        () => bookings.filter((b) => b.status === 'confirmed' || b.status === 'done'),
        [bookings],
    );

    // Enrich with parsed amount, keep only those matching the selected currency.
    const rows = useMemo(() => paid
        .map((b) => ({ b, amt: amountForBooking(b) }))
        .filter((r): r is { b: Booking; amt: { amount: number; currency: Currency } } => !!r.amt && r.amt.currency === currency),
        [paid, currency]);

    const total = useMemo(() => rows.reduce((s, r) => s + r.amt.amount, 0), [rows]);
    const thisMonthKey = monthKey(new Date().toISOString());
    const thisMonth = useMemo(
        () => rows.filter((r) => monthKey(r.b.createdAt) === thisMonthKey).reduce((s, r) => s + r.amt.amount, 0),
        [rows, thisMonthKey],
    );
    const avg = rows.length ? total / rows.length : 0;

    // Totals for the OTHER currency (shown as a small secondary stat).
    const otherCurrency: Currency = currency === 'IDR' ? 'USD' : 'IDR';
    const otherTotal = useMemo(() => paid
        .map((b) => amountForBooking(b))
        .filter((a): a is { amount: number; currency: Currency } => !!a && a.currency === otherCurrency)
        .reduce((s, a) => s + a.amount, 0), [paid, otherCurrency]);

    // Revenue by month (chronological, last 8 months present in data).
    const byMonth = useMemo(() => {
        const map = new Map<string, number>();
        rows.forEach((r) => map.set(monthKey(r.b.createdAt), (map.get(monthKey(r.b.createdAt)) || 0) + r.amt.amount));
        return [...map.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-8)
            .map(([k, v]) => ({ key: k, label: monthLabel(k), value: v }));
    }, [rows]);

    // Revenue by service.
    const byService = useMemo(() => {
        const map = new Map<string, { revenue: number; count: number }>();
        rows.forEach((r) => {
            const cur = map.get(r.b.serviceId) || { revenue: 0, count: 0 };
            cur.revenue += r.amt.amount; cur.count += 1;
            map.set(r.b.serviceId, cur);
        });
        return [...map.entries()]
            .map(([id, v]) => ({ id, label: SERVICE_LABEL[id] || id, ...v }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [rows]);
    const maxService = Math.max(1, ...byService.map((s) => s.revenue));

    // Status counts across ALL bookings (context).
    const statusCounts = useMemo(() => {
        const c = { pending: 0, confirmed: 0, done: 0, cancelled: 0 } as Record<Booking['status'], number>;
        bookings.forEach((b) => { c[b.status] = (c[b.status] || 0) + 1; });
        return c;
    }, [bookings]);

    const KPI: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({ icon, label, value, sub }) => (
        <div className="rounded-2xl bg-surface-1 border border-black/5 p-5">
            <div className="flex items-center gap-2 text-text-subtle text-xs uppercase tracking-wider">{icon}<span>{label}</span></div>
            <div className="mt-2 text-2xl font-serif font-bold text-ink tabular-nums">{value}</div>
            {sub && <div className="mt-1 text-xs text-text-subtle">{sub}</div>}
        </div>
    );

    return (
        <div className="space-y-6 pt-24 md:pt-12 p-6 md:p-12 max-w-6xl mx-auto">
            {/* Header */}
            <div className="pb-6 border-b border-black/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-ink mb-2">Revenue</h1>
                    <p className="text-text-subtle text-sm">Realized revenue from confirmed &amp; completed bookings.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-full border border-black/10 p-0.5 bg-surface-1">
                        {(['IDR', 'USD'] as Currency[]).map((c) => (
                            <button key={c} onClick={() => setCurrency(c)}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${currency === c ? 'bg-lilac text-ink' : 'text-text-subtle hover:text-ink'}`}>
                                {c}
                            </button>
                        ))}
                    </div>
                    <button onClick={load} className="p-2.5 rounded-full border border-black/10 text-text-subtle hover:text-ink hover:border-black/25 transition-colors" title="Refresh">
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-500/10 border border-red-400/25 rounded-xl px-4 py-3">{error}</div>}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI icon={<Wallet size={14} />} label="Total revenue" value={fmtMoney(total, currency)}
                    sub={otherTotal > 0 ? `+ ${fmtMoney(otherTotal, otherCurrency)} in ${otherCurrency}` : undefined} />
                <KPI icon={<CalendarClock size={14} />} label="This month" value={fmtMoney(thisMonth, currency)} sub={monthLabel(thisMonthKey)} />
                <KPI icon={<ShoppingBag size={14} />} label="Paid bookings" value={String(rows.length)} sub={`${currency}`} />
                <KPI icon={<TrendingUp size={14} />} label="Avg order value" value={fmtMoney(avg, currency)} />
            </div>

            {/* Monthly revenue chart */}
            <div className="rounded-2xl bg-surface-1 border border-black/5 p-5">
                <h2 className="text-sm font-semibold text-ink mb-4">Revenue by month · {currency}</h2>
                {byMonth.length === 0 ? (
                    <p className="text-sm text-text-subtle py-12 text-center">No {currency} revenue yet.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={byMonth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6E6B77' }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={(v) => fmtMoney(v, currency, true)} tick={{ fontSize: 11, fill: '#6E6B77' }} axisLine={false} tickLine={false} width={64} />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                contentStyle={{ background: '#fff', border: '1px solid #E7E5E1', borderRadius: 12, fontSize: 13 }}
                                formatter={(v: number) => [fmtMoney(v, currency), 'Revenue']} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#DA8636" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* By service + status */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-surface-1 border border-black/5 p-5">
                    <h2 className="text-sm font-semibold text-ink mb-4">Revenue by service · {currency}</h2>
                    {byService.length === 0 ? (
                        <p className="text-sm text-text-subtle py-8 text-center">No data yet.</p>
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
                </div>

                <div className="rounded-2xl bg-surface-1 border border-black/5 p-5">
                    <h2 className="text-sm font-semibold text-ink mb-4">Bookings by status</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {([
                            ['confirmed', 'Confirmed', '#4F8E62'],
                            ['done', 'Done', '#29527B'],
                            ['pending', 'Pending', '#DA8636'],
                            ['cancelled', 'Cancelled', '#8E5C86'],
                        ] as const).map(([key, label, color]) => (
                            <div key={key} className="rounded-xl border border-black/5 p-4">
                                <div className="text-2xl font-serif font-bold tabular-nums" style={{ color }}>{statusCounts[key] || 0}</div>
                                <div className="text-xs text-text-subtle mt-0.5">{label}</div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-4 text-xs text-text-subtle">Revenue counts <span className="text-ink font-medium">Confirmed</span> + <span className="text-ink font-medium">Done</span> only. Pending and cancelled are excluded.</p>
                </div>
            </div>

            {loading && <p className="text-center text-sm text-text-subtle">Loading…</p>}
        </div>
    );
};

export default RevenueView;
