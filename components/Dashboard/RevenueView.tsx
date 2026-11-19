import PageHeader from './ui/PageHeader';
import Segmented from './ui/Segmented';
import { FilterBar, FilterMenu, MenuOption, MenuDate, useCloseMenu } from './ui/Filters';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { colorFor } from './lib/serviceColor';
import { CalendarDays, Repeat, UserPlus } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

// the dates of a custom range, inside the range menu: nothing changes until "Show these dates"
const CustomDates: React.FC<{ draft: { start: string; end: string }; setDraft: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>; onShow: () => void }> = ({ draft, setDraft, onShow }) => {
    const close = useCloseMenu();
    return (
        <div className="mt-1 pt-2.5 px-1.5 pb-1.5 border-t border-adm-line space-y-3">
            <MenuDate label="From" value={draft.start} max={draft.end || undefined} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} />
            <MenuDate label="To" value={draft.end} min={draft.start || undefined} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} />
            <button type="button" disabled={!draft.start || !draft.end || draft.end < draft.start} onClick={() => { onShow(); close(); }}
                className="w-full rounded-lg bg-lilac text-white text-[13px] font-semibold py-1.5 disabled:opacity-40 transition-opacity">Show these dates</button>
        </div>
    );
};

// the service a sub-service belongs to, for Most booked (the rest are services of their own)
const SERVICE_OF: Record<string, string> = { '3card': 'email', '5card': 'email', payl: 'special', live: 'call' };
const SERVICE_NAME_OF: Record<string, string> = { email: 'Email', special: 'Special Edition' };

const SERVICE_LABEL: Record<string, string> = {
    chat: 'Chat', call: 'Call', meetup: 'Meetup', special: 'New Year Reading (PDF)',
    '3card': '3-Card Spread', '5card': '5-Card Deep', live: 'Call',
    payl: 'Pay as you like',
};

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
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [customOpen, setCustomOpen] = useState(false); // picking dates; the page changes only on Show
    const [draft, setDraft] = useState({ start: '', end: '' }); // the custom dates while being picked
    const pickPreset = (id: Preset) => {
        if (id === 'custom') { setDraft({ start: startISO, end: endISO }); setCustomOpen(true); return; }
        setPreset(id); setGranPick(null); setCustomOpen(false);
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

    // The range, in real dates (so the chip can say them).
    const firstDay = useMemo(() => paidRows.map((r) => r.day).sort()[0] || toISO(new Date()), [paidRows]);
    const { startISO, endISO } = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const end = toISO(today);
        const y = today.getFullYear(), m = today.getMonth();
        switch (preset) {
            case '7d': return { startISO: toISO(addDays(today, -6)), endISO: end };
            case '30d': return { startISO: toISO(addDays(today, -29)), endISO: end };
            case 'thisMonth': return { startISO: toISO(new Date(y, m, 1)), endISO: end };
            case 'lastMonth': return { startISO: toISO(new Date(y, m - 1, 1)), endISO: toISO(new Date(y, m, 0)) };
            case 'year': return { startISO: toISO(new Date(y, 0, 1)), endISO: end };
            case 'custom': return { startISO: customStart || firstDay, endISO: customEnd || end };
            default: return { startISO: firstDay, endISO: end };
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

    // everything for one currency: totals, the charts, each service's bookings, what wasn't
    // collected, and new against returning customers
    const report = (currency: Currency) => {
        const allRows: Row[] = paidRows.filter((r) => r.amt!.currency === currency)
            .map((r) => ({ b: r.b, day: r.day, serviceId: r.b.serviceId === 'live' ? 'call' : r.b.serviceId, amount: r.amt!.amount }));
        // services present, ordered by total revenue (stack order + legend)
        const tot = new Map<string, number>();
        allRows.forEach((r) => tot.set(r.serviceId, (tot.get(r.serviceId) || 0) + r.amount));
        const services = [...tot.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);

        const inRange = (day: string) => day >= startISO && day <= endISO;
        const rangeRows = allRows.filter((r) => inRange(r.day));
        const total = rangeRows.reduce((sum, r) => sum + r.amount, 0);
        const avg = rangeRows.length ? total / rangeRows.length : 0;

        // each service's money, bookings and share in the range (Most booked counts the bookings)
        const bySvc = new Map<string, { amount: number; count: number }>();
        rangeRows.forEach((r) => { const x = bySvc.get(r.serviceId) || { amount: 0, count: 0 }; x.amount += r.amount; x.count++; bySvc.set(r.serviceId, x); });
        const earners = [...bySvc.entries()].map(([id, x]) => ({ id, ...x, share: total ? x.amount / total : 0 })).sort((a, b) => b.amount - a.amount);

        // daily / weekly stacked series across the range (continuous buckets)
        let series: StackRow[] = [];
        if (endISO >= startISO) {
            const buckets: Bucket[] = [];
            const step = gran === 'week' ? 7 : 1;
            let d = gran === 'week' ? startOfWeek(parseISO(startISO)) : parseISO(startISO);
            const end = parseISO(endISO);
            let guard = 0;
            while (d <= end && guard++ < 800) { buckets.push({ key: toISO(d), label: dayLabel(toISO(d)) }); d = addDays(d, step); }
            const bucketOf = (day: string) => gran === 'week' ? toISO(startOfWeek(parseISO(day))) : day;
            if (rangeRows.length) series = buildStacked(rangeRows, buckets, bucketOf, services);
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
        const yearTotal = monthlySeries.reduce((sum, m) => sum + (m.total as number), 0);
        const monthSvc = new Map<string, number>();
        allRows.filter((r) => r.day.slice(0, 7) >= months[0].key).forEach((r) => monthSvc.set(r.serviceId, (monthSvc.get(r.serviceId) || 0) + r.amount));


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
            currency, services, count: rangeRows.length, total, avg, series, monthlySeries, monthSvc, thisMonth, yearTotal, best,
            earners, fresh: { amount: fresh.amount, people: fresh.who.size }, back: { amount: back.amount, people: back.who.size }, top,
        };
    };
    const reports = useMemo(() => (['IDR', 'USD'] as Currency[]).map(report),
        [paidRows, bookings, people, startISO, endISO, gran]); // eslint-disable-line react-hooks/exhaustive-deps
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

    const axis = { tick: { fontSize: 11, fill: 'var(--adm-axis)' }, axisLine: false, tickLine: false } as const;
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
    // under a chart: which colour is which service (biggest first), in a tidy row that wraps
    const Legend = ({ items }: { items: { id: string; amount: number }[] }) => {
        const shown = items.filter((x) => x.amount > 0).sort((a, b) => b.amount - a.amount);
        if (!shown.length) return null;
        return (
            <ul className="mt-4 pt-3 border-t border-adm-line flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-text-subtle">
                {shown.map((x) => (
                    <li key={x.id} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colorFor(x.id) }} />
                        {SERVICE_LABEL[x.id] || x.id}
                    </li>
                ))}
            </ul>
        );
    };

    const curName = (c: Currency) => (c === 'IDR' ? 'Rupiah' : 'Dollars');
    // a card: what it shows, then the answer (the figure) before the chart or list
    const Card: React.FC<{ title: string; currency?: Currency; figure?: string; note?: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode }> = ({ title, currency, figure, note, extra, children }) => (
        <div className="rounded-2xl bg-surface-1 p-4 sm:p-5 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 mb-3">
                <div className="min-w-0">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle">{title}{currency && <span className="font-normal normal-case tracking-normal"> · {curName(currency)}</span>}</h2>
                    {figure !== undefined && (
                        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                            <span className="text-[24px] sm:text-[30px] font-bold tracking-[-0.02em] text-text-light tabular-nums">{figure}</span>
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
    // a ring split into each service's share (a small gap between slices), the total in the middle
    const Donut = ({ slices, center, sub = 'came in', label }: { slices: { share: number; color: string }[]; center: string; sub?: string; label: string }) => {
        const size = 148, r = 58, sw = 20, c = 2 * Math.PI * r;
        const gap = slices.length > 1 ? 3 : 0;
        let at = 0;
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} className="stroke-adm-hover" />
                <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                    {slices.map((s, i) => {
                        const len = Math.max(0, s.share * c - gap);
                        const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={`${len} ${c}`} strokeDashoffset={-at} />;
                        at += s.share * c;
                        return el;
                    })}
                </g>
                <text x={size / 2} y={size / 2 + 1} textAnchor="middle" className="fill-text-light" style={{ fontSize: 15, fontWeight: 700 }}>{center}</text>
                <text x={size / 2} y={size / 2 + 18} textAnchor="middle" className="fill-text-subtle" style={{ fontSize: 11 }}>{sub}</text>
            </svg>
        );
    };
    // a currency's heading inside a card that shows both
    const CurHead = ({ c }: { c: Currency }) => <h3 className="text-[11px] font-semibold text-text-subtle mb-2">{curName(c)}</h3>;
    const Seg = <T extends string>(p: { value: T; options: { id: T; label: string }[]; onChange: (v: NoInfer<T>) => void }) => <Segmented size="sm" {...p} />;

    // Most booked: each service by how many paid bookings it had in the range, both markets
    // together (a booking counts the same whatever it was paid in)
    // by service, not sub-service (as Sales names them): 3-Card and 5-Card are both Email,
    // Pay as you like and the New Year Reading both Special Edition, a Live Session a Call.
    // One per market: Indonesia (paid in rupiah) and Global (paid in dollars)
    const booked = reports.map((r) => {
        const by = new Map<string, number>();
        r.earners.forEach((x) => { const g = SERVICE_OF[x.id] || x.id; by.set(g, (by.get(g) || 0) + x.count); });
        const total = [...by.values()].reduce((a, b) => a + b, 0);
        return {
            market: r.currency === 'IDR' ? 'Indonesia' : 'Global',
            total,
            rows: [...by].map(([id, count]) => ({ id, name: SERVICE_NAME_OF[id] || SERVICE_LABEL[id] || id, color: colorFor(id === 'email' ? '3card' : id), count, share: total ? count / total : 0 }))
                .sort((a, b) => b.count - a.count),
        };
    });

    const initialLoading = loading && bookings.length === 0;

    return (
        <div className="space-y-5 pt-20 lg:pt-8 p-4 md:px-8">
            <PageHeader
                title="Money report"
                tone="money"
                note="Bookings marked paid (cancelled left out), counted on the day they were ordered. Rupiah and dollars are kept apart, never added together. Marking payments is under Sales; who your customers are is under Customers."
                onRefresh={load}
                refreshing={loading}
            />

            {error && <div className="text-sm text-red-600 bg-red-500/10 border border-red-400/25 rounded-xl px-3 py-2.5">{error}</div>}

            {initialLoading && <LoaderCard />}

            {!initialLoading && (<>
            {/* the range, as the filters on Sales: a word and an arrow with a short menu,
                on a line that stays under the top bar while scrolling */}
            <div className="sticky top-14 lg:top-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 bg-bg-deep/85 backdrop-blur-md">
                <FilterBar tabs={<span className="py-2.5 text-[13px] text-text-subtle">{rangeLabel(startISO, endISO)}</span>}>
                    <FilterMenu active={preset !== '30d'} label={PRESETS.find((x) => x.id === preset)!.label} align="end" menuClassName="w-64"
                        icon={<CalendarDays size={15} className="mr-0.5" />}>
                        {PRESETS.map((x) => (
                            <MenuOption key={x.id} on={preset === x.id} keepOpen={x.id === 'custom'} onPick={() => pickPreset(x.id)}>{x.label}</MenuOption>
                        ))}
                        {(customOpen || preset === 'custom') && (
                            <CustomDates draft={draft} setDraft={setDraft}
                                onShow={() => { setCustomStart(draft.start); setCustomEnd(draft.end); setPreset('custom'); setGranPick(null); setCustomOpen(false); }} />
                        )}
                    </FilterMenu>
                </FilterBar>
            </div>

            {/* a line per currency */}
            <StatStrip layout="four" stats={[
                { label: 'Total revenue', lines: reports.map((r) => ({ key: r.currency, value: fmtMoney(r.total, r.currency), })) },
                { label: 'Paid bookings', lines: reports.map((r) => ({ key: r.currency, value: String(r.count), note: r.currency === 'IDR' ? 'in Rp' : 'in $' })) },
                { label: 'Avg order', lines: reports.map((r) => ({ key: r.currency, value: fmtMoney(r.avg, r.currency), })) },
                { label: `Best ${gran}`, lines: reports.map((r) => ({ key: r.currency, value: fmtMoney(r.best.value, r.currency), note: r.best.value > 0 ? r.best.label : undefined })) },
            ]} />

            {/* the money in the range, by day or week, stacked by service */}
            <div className="grid gap-4 xl:grid-cols-2">
                {reports.map((r) => (
                    <Card key={r.currency} title="Money over time" currency={r.currency} figure={fmtMoney(r.total, r.currency)}
                        note={<span>in this range</span>}
                        extra={<Seg value={gran} options={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }]} onChange={setGranPick} />}>
                        {r.total === 0 ? <Empty text={`No ${curName(r.currency).toLowerCase()} came in in this range.`} />
                            : <>
                                <Bars data={r.series} currency={r.currency} services={r.services} />
                                <Legend items={r.earners} />
                            </>}
                    </Card>
                ))}
            </div>

            {/* the last 12 months, this month lighter (still going) */}
            <div className="grid gap-4 xl:grid-cols-2">
                {reports.map((r) => (
                    <Card key={r.currency} title="Last 12 months" currency={r.currency} figure={fmtMoney(r.thisMonth, r.currency)}
                        note={<span>this month so far</span>}>
                        {r.yearTotal === 0 ? <Empty text={`No ${curName(r.currency).toLowerCase()} in the last 12 months.`} /> : <>
                            <Bars data={r.monthlySeries} currency={r.currency} services={r.services} soFar />
                            <Legend items={r.services.map((id) => ({ id, amount: r.monthSvc.get(id) || 0 }))} />
                        </>}
                    </Card>
                ))}
            </div>

            <div className="grid gap-4">
                {/* A. most booked in the range: the services by their number of bookings (not
                    money), Indonesia and Global side by side, each a donut and its ranking */}
                <Card title="Most booked">
                    {booked.every((m) => !m.total) ? <Empty text="Nothing paid in this range." /> : (
                        <div className="grid gap-x-10 gap-y-8 xl:grid-cols-2">
                            {booked.filter((m) => m.total).map((m) => (
                                <div key={m.market} className="min-w-0">
                                    <h3 className="text-[11px] font-semibold text-text-subtle mb-2">{m.market}</h3>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
                                        <div className="shrink-0 self-center">
                                            <Donut slices={m.rows.map((x) => ({ share: x.share, color: x.color }))}
                                                label={`${m.market}: ${m.rows.map((x) => `${x.name} ${x.count} ${x.count === 1 ? 'booking' : 'bookings'}`).join(', ')}`}
                                                center={String(m.total)} sub={m.total === 1 ? 'booking' : 'bookings'} />
                                        </div>
                                        <table className="min-w-0 flex-1 text-[13px]">
                                            <tbody>
                                                {m.rows.map((x, i) => (
                                                    <tr key={x.id} className="border-b border-adm-line last:border-0">
                                                        <td className="py-2 pr-3 w-6 text-text-subtle tabular-nums">{i + 1}</td>
                                                        <td className="py-2 pr-3">
                                                            <span className="flex items-center gap-2 min-w-0">
                                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.color }} />
                                                                <span className="truncate text-text-light font-medium">{x.name}</span>
                                                            </span>
                                                        </td>
                                                        <td className="py-2 pr-3 text-right text-text-light font-semibold tabular-nums whitespace-nowrap">{x.count} {x.count === 1 ? 'booking' : 'bookings'}</td>
                                                        <td className="py-2 text-right text-text-subtle tabular-nums whitespace-nowrap">{Math.round(x.share * 100)}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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
