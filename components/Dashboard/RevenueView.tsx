import PageHeader from './ui/PageHeader';
import Segmented from './ui/Segmented';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Check, ArrowUp, ArrowDown, Repeat, UserPlus } from 'lucide-react';
import { BarChart, Bar, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllBookings, Booking, BOOKINGS_CHANGED } from '../../services/booking';
import { LoaderCard } from './ui/InlineLoader';
import StatStrip from './ui/StatStrip';
import { Cur as Currency, amountForBooking, fmtMoney } from './lib/format';
import { groupBookings } from './lib/customers';

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
// a clearly different colour per service (muted, so they sit well together in both themes)
const SERVICE_COLOR: Record<string, string> = {
    chat: '#7C5CC4', call: '#3E7CC9', meetup: '#2E9E6A', special: '#D98E2B',
    '3card': '#C8578F', '5card': '#2A9DA6', live: '#E0A93B', payl: '#9A93A8',
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
// an axis label: '360rb', '1.2jt', '$45' (the currency is in the chart's title)
const axisMoney = (v: number, c: Currency) => (v === 0 ? '0' : fmtMoney(v, c, true).replace('Rp ', ''));
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

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
    // the range chart: the running total against the range before, or bars by day / week
    const [mode, setMode] = useState<'total' | 'bars'>('total');
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

    // each person (the same grouping as Customers) and when they first paid, so a booking can
    // be told apart as someone's first or someone coming back
    const people = useMemo(() => {
        const of = new Map<string, number>();
        const first: string[] = [];
        const name: string[] = [];
        groupBookings(bookings).forEach((g, i) => {
            g.forEach((b) => of.set(b.id, i));
            first[i] = g.filter((b) => b.paymentStatus === 'paid' && b.status !== 'cancelled').map((b) => b.createdAt || '').filter(Boolean).sort()[0] || '';
            name[i] = [...g].sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || '')).find((b) => b.name)?.name || '—';
        });
        return { of, first, name };
    }, [bookings]);

    // everything for one currency: totals, the charts, what earns most, what wasn't
    // collected, and new against returning customers
    const report = (currency: Currency) => {
        const allRows: Row[] = paidRows.filter((r) => r.amt!.currency === currency)
            .map((r) => ({ b: r.b, day: r.day, serviceId: r.b.serviceId, amount: r.amt!.amount }));
        // services present, ordered by total revenue (stack order + legend)
        const tot = new Map<string, number>();
        allRows.forEach((r) => tot.set(r.serviceId, (tot.get(r.serviceId) || 0) + r.amount));
        const services = [...tot.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);

        const inRange = (day: string) => day >= startISO && day <= endISO;
        const rangeRows = allRows.filter((r) => inRange(r.day));
        const total = rangeRows.reduce((sum, r) => sum + r.amount, 0);
        const avg = rangeRows.length ? total / rangeRows.length : 0;
        const prevRows = prevStart ? allRows.filter((r) => r.day >= prevStart && r.day <= prevEnd) : [];
        const prevTotal = prevRows.reduce((sum, r) => sum + r.amount, 0);
        const prev = prevStart ? { total: prevTotal, count: prevRows.length, avg: prevRows.length ? prevTotal / prevRows.length : 0 } : null;

        // what earns most in the range: each service's money, bookings and share
        const bySvc = new Map<string, { amount: number; count: number }>();
        rangeRows.forEach((r) => { const x = bySvc.get(r.serviceId) || { amount: 0, count: 0 }; x.amount += r.amount; x.count++; bySvc.set(r.serviceId, x); });
        const earners = [...bySvc.entries()].map(([id, x]) => ({ id, ...x, share: total ? x.amount / total : 0 })).sort((a, b) => b.amount - a.amount);

        // daily / weekly stacked series across the range (continuous buckets)
        let series: StackRow[] = [];
        // the running total, day by day, with the range before laid over it (same day number)
        const running: { label: string; now?: number; before?: number }[] = [];
        if (endISO >= startISO) {
            const buckets: Bucket[] = [];
            const step = gran === 'week' ? 7 : 1;
            let d = gran === 'week' ? startOfWeek(parseISO(startISO)) : parseISO(startISO);
            const end = parseISO(endISO);
            let guard = 0;
            while (d <= end && guard++ < 800) { buckets.push({ key: toISO(d), label: dayLabel(toISO(d)) }); d = addDays(d, step); }
            const bucketOf = (day: string) => gran === 'week' ? toISO(startOfWeek(parseISO(day))) : day;
            if (rangeRows.length) series = buildStacked(rangeRows, buckets, bucketOf, services);

            const perDay = (rows: Row[]) => { const m = new Map<string, number>(); rows.forEach((r) => m.set(r.day, (m.get(r.day) || 0) + r.amount)); return m; };
            const nowDays = perDay(rangeRows), prevDays = perDay(prevRows);
            const n = daysBetween(startISO, endISO) + 1;
            const pn = prevStart ? daysBetween(prevStart, prevEnd) + 1 : 0;
            let c1 = 0, c2 = 0;
            for (let i = 0; i < Math.min(Math.max(n, pn), 800); i++) {
                const day = toISO(addDays(parseISO(startISO), i));
                const row: { label: string; now?: number; before?: number } = { label: dayLabel(day) };
                if (i < n) { c1 += nowDays.get(day) || 0; row.now = c1; }
                if (i < pn) { c2 += prevDays.get(toISO(addDays(parseISO(prevStart), i))) || 0; row.before = c2; }
                if (i < n) running.push(row);
            }
        }

        // the last 12 months, always (this month marked as so far)
        const now = new Date();
        const months: Bucket[] = [];
        for (let k = 11; k >= 0; k--) {
            const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
            // 'Dec', 'Jan 26', 'Feb': the year only where it starts (and on the first month)
            const short = d.toLocaleDateString('en-US', { month: 'short' });
            months.push({ key: monthKey(d), label: k === 11 || d.getMonth() === 0 ? `${short} ${String(d.getFullYear()).slice(2)}` : short });
        }
        const monthlySeries = allRows.length ? buildStacked(allRows, months, (day) => day.slice(0, 7), services) : [];
        const thisMonth = (monthlySeries[11]?.total as number) || 0;
        const lastMonth = (monthlySeries[10]?.total as number) || 0;
        const yearTotal = monthlySeries.reduce((sum, m) => sum + (m.total as number), 0);
        const monthSvc = new Map<string, number>();
        allRows.filter((r) => r.day.slice(0, 7) >= months[0].key).forEach((r) => monthSvc.set(r.serviceId, (monthSvc.get(r.serviceId) || 0) + r.amount));

        // money not collected in the range: still waiting, and let go for not paying in time
        const open = { count: 0, amount: 0 }, lost = { count: 0, amount: 0 };
        for (const b of bookings) {
            if (b.extraFor || b.holdOnly || b.paymentStatus === 'paid' || !inRange((b.createdAt || '').slice(0, 10))) continue;
            const a = amountForBooking(b);
            if (!a || a.currency !== currency) continue;
            if (b.status === 'cancelled') { if (b.cancelReason === 'unpaid') { lost.count++; lost.amount += a.amount; } }
            else { open.count++; open.amount += a.amount; }
        }
        const asked = rangeRows.length + open.count + lost.count;

        // new and returning: a booking is someone's first, or they came back (paid before it)
        const fresh = { amount: 0, who: new Set<number>() }, back = { amount: 0, who: new Set<number>() };
        const perPerson = new Map<number, { amount: number; count: number; returning: boolean }>();
        rangeRows.forEach((r) => {
            const p = people.of.get(r.b.id) ?? -1;
            const again = p >= 0 && !!people.first[p] && (r.b.createdAt || '') > people.first[p];
            const side = again ? back : fresh;
            side.amount += r.amount; side.who.add(p);
            const x = perPerson.get(p) || { amount: 0, count: 0, returning: false };
            x.amount += r.amount; x.count++; x.returning ||= again; perPerson.set(p, x);
        });
        const top = [...perPerson.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 5)
            .map(([p, x]) => ({ name: p >= 0 ? people.name[p] : '—', ...x }));

        const best = series.reduce((m, x) => ((x.total as number) > m.value ? { label: x.label, value: x.total as number } : m), { label: '—', value: 0 });
        return {
            currency, services, count: rangeRows.length, total, avg, prev, series, running, monthlySeries, monthSvc, thisMonth, lastMonth, yearTotal, best,
            earners, open, lost, asked, fresh: { amount: fresh.amount, people: fresh.who.size }, back: { amount: back.amount, people: back.who.size }, top,
        };
    };
    const reports = useMemo(() => (['IDR', 'USD'] as Currency[]).map(report),
        [paidRows, bookings, people, startISO, endISO, prevStart, prevEnd, gran]); // eslint-disable-line react-hooks/exhaustive-deps
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

    const RunTooltip = ({ active, payload, label, currency }: any) => {
        if (!active || !payload || !payload.length) return null;
        const v = (k: string) => payload.find((p: any) => p.dataKey === k)?.value;
        return (
            <div className="rounded-xl bg-surface-1 border border-adm-line-2 shadow-lg px-3 py-2 text-xs space-y-0.5">
                <div className="font-semibold text-text-light mb-1">By {label}</div>
                {v('now') !== undefined && <div className="flex justify-between gap-4"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2E9E6A]" />This period</span><span className="tabular-nums text-text-light font-semibold">{fmtMoney(v('now'), currency)}</span></div>}
                {v('before') !== undefined && <div className="flex justify-between gap-4 text-text-subtle"><span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-[#9A93A8]" />Period before</span><span className="tabular-nums">{fmtMoney(v('before'), currency)}</span></div>}
            </div>
        );
    };
    const axis = { tick: { fontSize: 11, fill: 'var(--adm-axis)' }, axisLine: false, tickLine: false } as const;
    // the running total: how the money built up through the range, the range before dashed behind
    const RunningChart = ({ data, currency }: { data: Report['running']; currency: Currency }) => (
        <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={`run-${currency}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2E9E6A" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#2E9E6A" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(128,128,128,0.14)" vertical={false} />
                <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={28} />
                <YAxis {...axis} tickFormatter={(v) => axisMoney(v, currency)} width={44} tickCount={4} />
                <Tooltip content={<RunTooltip currency={currency} />} cursor={{ stroke: 'rgba(128,128,128,0.35)', strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="before" stroke="#9A93A8" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} activeDot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="now" stroke="#2E9E6A" strokeWidth={2.25} fill={`url(#run-${currency})`} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
        </ResponsiveContainer>
    );
    // stacked bars by service; `soFar` lightens the last bar (a month still going)
    const Bars = ({ data, currency, services, soFar }: { data: StackRow[]; currency: Currency; services: string[]; soFar?: boolean }) => {
        const tick = data.length > 14 ? Math.ceil(data.length / 12) : 0;
        return (
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(128,128,128,0.14)" vertical={false} />
                    <XAxis dataKey="label" {...axis} interval={tick} />
                    <YAxis {...axis} tickFormatter={(v) => axisMoney(v, currency)} width={44} tickCount={4} />
                    <Tooltip cursor={{ fill: 'rgba(128,128,128,0.08)' }} content={<StackTooltip currency={currency} />} />
                    {services.map((id, i) => (
                        <Bar key={id} dataKey={id} stackId="rev" fill={colorFor(id)} name={SERVICE_LABEL[id] || id} maxBarSize={32}
                            radius={i === services.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}>
                            {soFar && data.map((_, k) => <Cell key={k} fillOpacity={k === data.length - 1 ? 0.45 : 1} />)}
                        </Bar>
                    ))}
                </BarChart>
            </ResponsiveContainer>
        );
    };

    // the legend says how much each service brought in
    const Legend = ({ items, currency }: { items: { id: string; amount: number }[]; currency: Currency }) => (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
            {items.filter((x) => x.amount > 0).map((x) => (
                <span key={x.id} className="inline-flex items-center gap-1.5 text-xs text-text-subtle">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorFor(x.id) }} />
                    {SERVICE_LABEL[x.id] || x.id}
                    <span className="text-text-light tabular-nums">{fmtMoney(x.amount, currency)}</span>
                </span>
            ))}
        </div>
    );

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
    const curName = (c: Currency) => (c === 'IDR' ? 'Rupiah' : 'Dollars');
    // a card: what it shows, then the answer (the figure) before the chart or list
    const Card: React.FC<{ title: string; currency?: Currency; figure?: string; note?: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode }> = ({ title, currency, figure, note, extra, children }) => (
        <div className="rounded-2xl bg-surface-1 border border-adm-line p-4 sm:p-5 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 mb-3">
                <div className="min-w-0">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle">{title}{currency && <span className="font-normal normal-case tracking-normal"> · {curName(currency)}</span>}</h2>
                    {figure !== undefined && (
                        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                            <span className="text-xl sm:text-2xl font-serif font-bold text-text-light tabular-nums">{figure}</span>
                            {note && <span className="text-[12px] text-text-subtle inline-flex items-baseline gap-1.5">{note}</span>}
                        </div>
                    )}
                </div>
                {extra && <div className="flex items-center gap-2">{extra}</div>}
            </div>
            {children}
        </div>
    );
    const Empty = ({ text }: { text: string }) => <p className="text-sm text-text-subtle py-10 text-center">{text}</p>;
    // a thin bar showing a share
    const ShareBar = ({ share, color }: { share: number; color: string }) => (
        <span className="block h-1.5 rounded-full bg-adm-hover overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${Math.max(2, Math.round(share * 100))}%`, background: color }} /></span>
    );
    // a currency's heading inside a card that shows both
    const CurHead = ({ c }: { c: Currency }) => <h3 className="text-[11px] font-semibold text-text-subtle mb-2">{curName(c)}</h3>;
    const Seg = <T extends string>(p: { value: T; options: { id: T; label: string }[]; onChange: (v: NoInfer<T>) => void }) => <Segmented size="sm" {...p} />;

    const initialLoading = loading && bookings.length === 0;

    return (
        <div className="space-y-5 pt-20 lg:pt-8 p-4 md:px-8">
            <PageHeader
                title="Money report"
                tone="money"
                subtitle="How much came in, and is it growing?"
                note="Bookings marked paid (cancelled left out), counted on the day they were ordered. Rupiah and dollars are kept apart, never added together. Marking payments is under Payments; who your customers are is under Customers."
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

            {/* how the money built up through the range (the range before dashed behind), or bars */}
            <div className="grid gap-4 xl:grid-cols-2">
                {reports.map((r) => (
                    <Card key={r.currency} title="Money over time" currency={r.currency} figure={fmtMoney(r.total, r.currency)}
                        note={r.prev ? <><Delta now={r.total} before={r.prev.total} />{r.prev.total > 0 && <span>vs {fmtMoney(r.prev.total, r.currency)} before</span>}</> : <span>in this range</span>}
                        extra={<>
                            {mode === 'bars' && <Seg value={gran} options={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }]} onChange={setGranPick} />}
                            <Seg value={mode} options={[{ id: 'total', label: 'Running total' }, { id: 'bars', label: 'Bars' }]} onChange={setMode} />
                        </>}>
                        {r.total === 0 && !r.prev?.total ? <Empty text={`No ${curName(r.currency).toLowerCase()} came in in this range.`} />
                            : mode === 'total' ? <>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-text-subtle">
                                    <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-[#2E9E6A]" />This period</span>
                                    {r.prev && <span className="inline-flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-[#9A93A8]" />{rangeLabel(prevStart, prevEnd)}</span>}
                                </div>
                                <RunningChart data={r.running} currency={r.currency} />
                            </> : <>
                                <Legend items={r.earners} currency={r.currency} />
                                <Bars data={r.series} currency={r.currency} services={r.services} />
                            </>}
                    </Card>
                ))}
            </div>

            {/* the last 12 months, this month lighter (still going) */}
            <div className="grid gap-4 xl:grid-cols-2">
                {reports.map((r) => (
                    <Card key={r.currency} title="Last 12 months" currency={r.currency} figure={fmtMoney(r.thisMonth, r.currency)}
                        note={<><span>this month so far</span><span>· last month {fmtMoney(r.lastMonth, r.currency)}</span></>}>
                        {r.yearTotal === 0 ? <Empty text={`No ${curName(r.currency).toLowerCase()} in the last 12 months.`} /> : <>
                            <Legend items={r.services.map((id) => ({ id, amount: r.monthSvc.get(id) || 0 }))} currency={r.currency} />
                            <Bars data={r.monthlySeries} currency={r.currency} services={r.services} soFar />
                        </>}
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* A. what earns most in the range */}
                <Card title="What earns most">
                    {reports.every((r) => !r.earners.length) ? <Empty text="Nothing paid in this range." /> : (
                        <div className="space-y-5">
                            {reports.filter((r) => r.earners.length).map((r) => (
                                <div key={r.currency}>
                                    <CurHead c={r.currency} />
                                    <ul className="space-y-3">
                                        {r.earners.map((x) => (
                                            <li key={x.id}>
                                                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                                                    <span className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colorFor(x.id) }} /><span className="truncate text-text-light font-medium">{SERVICE_LABEL[x.id] || x.id}</span><span className="text-text-subtle text-[12px] whitespace-nowrap">{x.count} {x.count === 1 ? 'booking' : 'bookings'}</span></span>
                                                    <span className="whitespace-nowrap tabular-nums"><span className="text-text-light font-semibold">{fmtMoney(x.amount, r.currency)}</span><span className="text-text-subtle text-[12px] ml-2">{Math.round(x.share * 100)}%</span></span>
                                                </div>
                                                <div className="mt-1.5"><ShareBar share={x.share} color={colorFor(x.id)} /></div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* B. money not collected in the range */}
                <Card title="Money not collected">
                    {reports.every((r) => !r.open.count && !r.lost.count) ? <Empty text="Everything ordered in this range was paid." /> : (
                        <div className="space-y-5">
                            {reports.filter((r) => r.open.count || r.lost.count).map((r) => (
                                <div key={r.currency}>
                                    <CurHead c={r.currency} />
                                    <div className="grid grid-cols-2 gap-px rounded-xl overflow-hidden border border-adm-line bg-adm-line">
                                        <div className="bg-surface-1 px-3 py-2.5">
                                            <div className="text-[12px] text-text-subtle">Still waiting</div>
                                            <div className="mt-0.5 font-serif font-bold text-lg text-text-light tabular-nums">{fmtMoney(r.open.amount, r.currency)}</div>
                                            <div className="text-[11px] text-text-subtle">{r.open.count} unpaid {r.open.count === 1 ? 'order' : 'orders'}</div>
                                        </div>
                                        <div className="bg-surface-1 px-3 py-2.5">
                                            <div className="text-[12px] text-text-subtle">Lost, not paid in time</div>
                                            <div className={`mt-0.5 font-serif font-bold text-lg tabular-nums ${r.lost.amount ? 'due-late-text' : 'text-text-light'}`}>{fmtMoney(r.lost.amount, r.currency)}</div>
                                            <div className="text-[11px] text-text-subtle">{r.lost.count} cancelled</div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-[12px] text-text-subtle">{r.count} of {r.asked} orders paid ({r.asked ? Math.round((r.count / r.asked) * 100) : 0}%)</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* C. new and returning customers, and who spent most */}
            <Card title="New and returning customers">
                {reports.every((r) => !r.count) ? <Empty text="Nothing paid in this range." /> : (
                    <div className="grid gap-6 xl:grid-cols-2">
                        {reports.filter((r) => r.count).map((r) => {
                            const all = r.fresh.amount + r.back.amount || 1;
                            return (
                                <div key={r.currency} className="min-w-0">
                                    <CurHead c={r.currency} />
                                    <div className="flex h-2.5 rounded-full overflow-hidden bg-adm-hover">
                                        <span style={{ width: `${(r.fresh.amount / all) * 100}%` }} className="bg-sec-people" />
                                        <span style={{ width: `${(r.back.amount / all) * 100}%` }} className="bg-sec-money" />
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-3 text-[12px]">
                                        <div><span className="inline-flex items-center gap-1.5 text-text-subtle"><UserPlus size={13} className="text-sec-people" />New</span>
                                            <div className="font-semibold text-text-light tabular-nums text-[14px]">{fmtMoney(r.fresh.amount, r.currency)}</div>
                                            <div className="text-text-subtle">{r.fresh.people} first {r.fresh.people === 1 ? 'booking' : 'bookings'}</div></div>
                                        <div><span className="inline-flex items-center gap-1.5 text-text-subtle"><Repeat size={13} className="text-sec-money" />Came back</span>
                                            <div className="font-semibold text-text-light tabular-nums text-[14px]">{fmtMoney(r.back.amount, r.currency)}</div>
                                            <div className="text-text-subtle">{r.back.people} {r.back.people === 1 ? 'person' : 'people'} booked again</div></div>
                                    </div>
                                    <h4 className="mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle">Top customers</h4>
                                    <ol className="divide-y divide-adm-line">
                                        {r.top.map((t, i) => (
                                            <li key={i} className="flex items-baseline justify-between gap-3 py-1.5 text-[13px]">
                                                <span className="flex items-baseline gap-2 min-w-0"><span className="text-text-subtle tabular-nums w-3">{i + 1}</span><span className="truncate text-text-light">{t.name}</span>
                                                    <span className="text-[11px] text-text-subtle whitespace-nowrap">{t.count} {t.count === 1 ? 'booking' : 'bookings'}{t.returning ? ' · came back' : ''}</span></span>
                                                <span className="tabular-nums font-semibold text-text-light whitespace-nowrap">{fmtMoney(t.amount, r.currency)}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
            </>)}

            {loading && <p className="text-center text-sm text-text-subtle">Loading…</p>}
        </div>
    );
};

export default RevenueView;
