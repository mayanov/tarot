import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCcw, MessageSquare, ShoppingBag, Cake, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getAllBookings, rescheduleBooking, Booking } from '../../services/booking';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

const STATUSES: Booking['status'][] = ['pending', 'confirmed', 'done', 'cancelled'];

// Orders whose serviceName carries no package/price — supply a display name + price.
const ORDER_OVERRIDE: Record<string, { title?: string; price?: string }> = {
    'Edisi Spesial': { title: 'New Year Reading', price: 'Rp 250K' },
    '3-Card Spread': { price: '$12' },
    '5-Card Deep': { price: '$20' },
};

// Status pills — brand jewel palette, dark text on a light tint (light theme).
const STATUS_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-coral/15 text-coral-deep border-coral/40',
    confirmed: 'bg-sage/15 text-sage border-sage/45',
    done: 'bg-blue/15 text-blue border-blue/45',
    cancelled: 'bg-mauve/15 text-mauve border-mauve/45',
};

// Calendar block colours per status.
const BLOCK_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-coral/20 border-coral/45 text-[#9a531b] hover:bg-coral/30',
    confirmed: 'bg-sage/20 border-sage/45 text-[#356b45] hover:bg-sage/30',
    done: 'bg-blue/20 border-blue/45 text-[#20527b] hover:bg-blue/30',
    cancelled: 'bg-mauve/15 border-mauve/40 text-[#6e4569] line-through opacity-70 hover:opacity-90',
};

const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseISO = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
};
const startOfWeek = (d: Date) => {
    const x = new Date(d);
    const dow = (x.getDay() + 6) % 7; // Monday = 0
    x.setDate(x.getDate() - dow);
    x.setHours(0, 0, 0, 0);
    return x;
};
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`;
// 'YYYY-MM-DD' → 'dd Mon YYYY' (e.g. 08 Sep 2026)
const fmtDate = (iso: string) => {
    const d = parseISO(iso);
    return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear()}`;
};

// Grid window: 11:00–20:00 covers all bookable slots (11:00–19:00) and their durations.
const DAY_START = 11 * 60;
const DAY_END = 20 * 60;
const HOUR_H = 56; // px per hour
const GRID_H = ((DAY_END - DAY_START) / 60) * HOUR_H;
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => 11 + i);
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BookingsView: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'calendar' | 'orders'>('calendar');
    const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [orderView, setOrderView] = useState<'active' | 'done'>('active');
    const [notice, setNotice] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);
    // Drag-to-reschedule state for the weekly grid.
    const [drag, setDrag] = useState<null | { id: string; originDay: number; originStart: number; dur: number; curDay: number; curStart: number; moved: boolean }>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);
    const dragStart = useRef({ x: 0, y: 0, colW: 100 });

    const flash = (text: string, kind: 'ok' | 'err') => { setNotice({ text, kind }); setTimeout(() => setNotice(null), 3000); };

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken') || undefined;
            setBookings(await getAllBookings(token));
        } catch (e) {
            if (e instanceof Error && e.message === 'HTTP_401') {
                try { localStorage.removeItem('admin_session'); localStorage.removeItem('authToken'); } catch { /* ignore */ }
                window.location.reload();
                return;
            }
            setError('Could not load bookings. Make sure you are logged in and the server is reachable.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const changeStatus = async (id: string, status: Booking['status']) => {
        try {
            const token = localStorage.getItem('authToken');
            await fetch(`/api/admin/bookings/${id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ status }),
            });
            setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
        } catch { /* ignore */ }
    };

    // ---- drag-to-reschedule (weekly grid) ----
    const beginDrag = (e: React.PointerEvent, b: Booking, di: number) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const body = gridRef.current;
        const colW = body ? (body.getBoundingClientRect().width - 56) / 7 : 100;
        dragStart.current = { x: e.clientX, y: e.clientY, colW };
        const start = toMin(b.time);
        setDrag({ id: b.id, originDay: di, originStart: start, dur: b.durationMin && b.durationMin > 0 ? b.durationMin : 30, curDay: di, curStart: start, moved: false });
    };

    useEffect(() => {
        if (!drag) return;
        const onMove = (e: PointerEvent) => {
            const { x, y, colW } = dragStart.current;
            const dMin = Math.round(((e.clientY - y) / HOUR_H) * 60 / 30) * 30;
            const dCol = Math.round((e.clientX - x) / colW);
            const curStart = clamp(drag.originStart + dMin, DAY_START, DAY_END - drag.dur);
            const curDay = clamp(drag.originDay + dCol, 0, 6);
            const moved = curStart !== drag.originStart || curDay !== drag.originDay;
            if (curStart !== drag.curStart || curDay !== drag.curDay || moved !== drag.moved) {
                setDrag((d) => d && ({ ...d, curStart, curDay, moved }));
            }
        };
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            const d = drag;
            if (!d.moved) { setSelectedId(d.id); setDrag(null); return; }
            const newDate = toISO(addDays(weekStart, d.curDay));
            const newTime = toHHMM(d.curStart);
            setBookings((prev) => prev.map((b) => (b.id === d.id ? { ...b, date: newDate, time: newTime } : b)));
            setDrag(null);
            (async () => {
                try {
                    const token = localStorage.getItem('authToken') || undefined;
                    await rescheduleBooking(d.id, newDate, newTime, undefined, token);
                    flash('Booking moved.', 'ok');
                } catch (err) {
                    flash(err instanceof Error && err.message === 'SLOT_TAKEN' ? 'That slot is taken — reverted.' : 'Move failed — reverted.', 'err');
                } finally { load(); }
            })();
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    }, [drag, weekStart]);

    const scheduled = useMemo(() => bookings.filter((b) => b.date && b.time), [bookings]);
    // Cancelled sessions are dropped from the calendar entirely.
    const calendarSessions = useMemo(() => scheduled.filter((b) => b.status !== 'cancelled'), [scheduled]);
    const orders = useMemo(
        () => bookings.filter((b) => !(b.date && b.time)).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
        [bookings],
    );
    const activeOrders = useMemo(() => orders.filter((b) => b.status !== 'done' && b.status !== 'cancelled'), [orders]);
    const doneOrders = useMemo(() => orders.filter((b) => b.status === 'done' || b.status === 'cancelled'), [orders]);

    // Jump to the week of the nearest upcoming session once data loads.
    useEffect(() => {
        if (!calendarSessions.length) return;
        const todayISO = toISO(new Date());
        const upcoming = [...new Set(calendarSessions.map((b) => b.date))].filter((d) => d >= todayISO).sort();
        if (upcoming.length) setWeekStart(startOfWeek(parseISO(upcoming[0])));
    }, [calendarSessions.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const byDay = useMemo(() => {
        const map: Record<string, Booking[]> = {};
        calendarSessions.forEach((b) => { (map[b.date] ||= []).push(b); });
        return map;
    }, [calendarSessions]);

    const selectedBooking = useMemo(() => bookings.find((b) => b.id === selectedId) || null, [bookings, selectedId]);
    const todayISO = toISO(new Date());
    const weekLabel = `${weekDays[0].toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;

    // Click a status to set it — active chip uses its colour, the rest are muted.
    const StatusControl: React.FC<{ b: Booking }> = ({ b }) => (
        <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => {
                const active = b.status === s;
                return (
                    <button
                        key={s}
                        onClick={() => !active && changeStatus(b.id, s)}
                        className={`px-2.5 py-1 rounded-full text-[0.65rem] uppercase tracking-wider font-semibold border transition-colors ${
                            active ? STATUS_STYLE[s] : 'border-adm-line-2 text-text-subtle hover:text-text-light hover:border-adm-line-3'
                        }`}
                    >
                        {s}
                    </button>
                );
            })}
        </div>
    );

    const TABS: { id: 'calendar' | 'orders'; label: string; count: number }[] = [
        { id: 'calendar', label: 'Schedule', count: calendarSessions.length },
        { id: 'orders', label: 'Orders', count: orders.length },
    ];

    const navBtn = 'grid place-items-center w-9 h-9 rounded-lg bg-adm-hover text-text-subtle hover:text-text-light hover:bg-adm-hover-2 transition-colors';

    return (
        <div className="space-y-6 pt-24 md:pt-12 p-6 md:p-12 max-w-6xl mx-auto">
            <div className="pb-6 border-b border-adm-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-text-light mb-2">Bookings</h1>
                    <p className="text-text-subtle text-sm">{scheduled.length} scheduled · {orders.length} orders</p>
                </div>
                <button
                    onClick={load}
                    className="px-4 py-2 bg-adm-hover hover:bg-adm-hover-2 text-text-light font-medium rounded-xl transition-all text-sm flex items-center gap-2"
                >
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/25 rounded-xl px-4 py-3">{error}</div>}

            {notice && (
                <div className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl shadow-lg text-sm border ${notice.kind === 'ok' ? 'bg-sage/15 border-sage/40 text-sage' : 'bg-coral/15 border-coral/40 text-coral-deep'}`}>
                    {notice.text}
                </div>
            )}

            <div className="inline-flex rounded-full border border-adm-line-2 p-0.5 bg-surface-1">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${tab === t.id ? 'bg-lilac text-[#26242B]' : 'text-text-subtle hover:text-text-light'}`}
                    >
                        {t.label}
                        <span className={`text-[0.7rem] tabular-nums ${tab === t.id ? 'text-[#26242B]/70' : 'text-text-subtle'}`}>{t.count}</span>
                    </button>
                ))}
            </div>

            {/* ---------------- CALENDAR — weekly time grid ---------------- */}
            {tab === 'calendar' && (
                <div className="space-y-5">
                    <div className="rounded-2xl bg-surface-1 border border-adm-line overflow-hidden">
                        {/* week nav */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-adm-line">
                            <div className="flex items-center gap-2">
                                <button aria-label="Previous week" className={navBtn} onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={16} /></button>
                                <button className="px-3 h-9 rounded-lg bg-adm-hover text-text-light text-sm font-medium hover:bg-adm-hover-2 transition-colors" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</button>
                                <button aria-label="Next week" className={navBtn} onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={16} /></button>
                            </div>
                            <h2 className="text-text-light font-serif font-semibold text-sm">{weekLabel}</h2>
                        </div>

                        {/* grid */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[760px]">
                                {/* day headers */}
                                <div className="grid border-b border-adm-line" style={{ gridTemplateColumns: '3.5rem repeat(7, minmax(0,1fr))' }}>
                                    <div />
                                    {weekDays.map((d, i) => {
                                        const isToday = toISO(d) === todayISO;
                                        return (
                                            <div key={i} className={`py-2 text-center border-l border-adm-line ${isToday ? 'bg-lilac/10' : ''}`}>
                                                <div className="text-[0.65rem] uppercase tracking-wider text-text-subtle">{WEEKDAYS[i]}</div>
                                                <div className={`text-lg font-serif font-bold ${isToday ? 'text-lilac' : 'text-text-light'}`}>{d.getDate()}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* body: time gutter + 7 day columns */}
                                <div ref={gridRef} className="grid relative select-none" style={{ gridTemplateColumns: '3.5rem repeat(7, minmax(0,1fr))' }}>
                                    {/* time gutter */}
                                    <div className="relative" style={{ height: GRID_H }}>
                                        {HOURS.map((h) => (
                                            <div key={h} className="absolute right-2 -translate-y-1/2 text-[0.65rem] text-text-subtle tabular-nums" style={{ top: (h - 11) * HOUR_H }}>{fmtHour(h)}</div>
                                        ))}
                                    </div>

                                    {/* day columns */}
                                    {weekDays.map((day, di) => {
                                        const dayISO = toISO(day);
                                        const isToday = dayISO === todayISO;
                                        const sessions = (byDay[dayISO] || []);
                                        return (
                                            <div key={di} className={`relative border-l border-adm-line ${isToday ? 'bg-lilac/[0.04]' : ''}`} style={{ height: GRID_H }}>
                                                {/* hour lines */}
                                                {HOURS.map((h) => (
                                                    <div key={h} className="absolute left-0 right-0 border-t border-adm-line" style={{ top: (h - 11) * HOUR_H }} />
                                                ))}
                                                {/* session blocks */}
                                                {sessions.map((b) => {
                                                    const start = toMin(b.time);
                                                    const dur = b.durationMin && b.durationMin > 0 ? b.durationMin : 30;
                                                    const top = Math.max(0, ((start - DAY_START) / 60) * HOUR_H);
                                                    const height = Math.max(22, (dur / 60) * HOUR_H - 3);
                                                    const endMin = start + dur;
                                                    const endStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
                                                    return (
                                                        <div
                                                            key={b.id}
                                                            onPointerDown={(e) => beginDrag(e, b, di)}
                                                            title={`${b.time}–${endStr} · ${b.serviceName} · ${b.name} — drag to reschedule`}
                                                            className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 text-left overflow-hidden transition-shadow cursor-grab active:cursor-grabbing touch-none ${BLOCK_STYLE[b.status]} ${selectedId === b.id ? 'ring-2 ring-black/60' : ''} ${drag?.id === b.id ? 'opacity-30' : ''}`}
                                                            style={{ top, height }}
                                                        >
                                                            <div className="text-[9px] font-semibold leading-none tabular-nums opacity-90">{b.time}–{endStr}</div>
                                                            <div className="text-[11px] font-semibold leading-tight truncate mt-0.5">{b.serviceName.split(' · ')[0]}</div>
                                                            {height > 40 && <div className="text-[10px] leading-tight truncate opacity-90">{b.name}</div>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                    {drag && drag.moved && (
                                        <div className="absolute z-30 pointer-events-none rounded-md border-2 border-lilac bg-lilac/25 px-1.5 py-1 overflow-hidden shadow-lg"
                                            style={{
                                                left: `calc(3.5rem + (100% - 3.5rem) * ${drag.curDay} / 7 + 2px)`,
                                                width: `calc((100% - 3.5rem) / 7 - 8px)`,
                                                top: ((drag.curStart - DAY_START) / 60) * HOUR_H,
                                                height: Math.max(22, (drag.dur / 60) * HOUR_H - 3),
                                            }}>
                                            <div className="text-[9px] font-bold tabular-nums text-lilac leading-none">{toHHMM(drag.curStart)}–{toHHMM(drag.curStart + drag.dur)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {drag && (
                        <p className="text-center text-lilac text-xs">Drop to move to {WEEKDAYS[drag.curDay]} {toHHMM(drag.curStart)}</p>
                    )}
                    {calendarSessions.length === 0 && !loading && !error && (
                        <p className="text-center text-text-subtle text-sm py-4">No scheduled sessions yet.</p>
                    )}

                </div>
            )}

            {/* selected booking detail — modal popover */}
            {selectedBooking && (() => {
                const b = selectedBooking;
                const parts = b.serviceName.split(' · ');
                const svcBase = parts[0];
                const svcRest = parts.slice(1).join(' · ');
                const endStr = b.durationMin
                    ? (() => { const e = toMin(b.time) + b.durationMin; return `${String(Math.floor(e / 60)).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`; })()
                    : '';
                const Field: React.FC<{ label: string; value: string; italic?: boolean }> = ({ label, value, italic }) => (
                    <div>
                        <div className="text-[0.6rem] uppercase tracking-[0.18em] text-text-subtle mb-1">{label}</div>
                        <div className={`text-sm text-text-light break-words ${italic ? 'italic text-text-light' : ''}`}>{value}</div>
                    </div>
                );
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
                        <div className="relative w-full max-w-md bg-surface-1 border border-adm-line-2 rounded-2xl shadow-2xl overflow-hidden">
                            {/* header — date & time first */}
                            <div className="p-5 border-b border-adm-line">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-text-light">
                                        <span className="font-semibold tabular-nums">{fmtDate(b.date)} · {b.time}{endStr && `–${endStr}`}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-adm-hover-2 text-[0.6rem] uppercase tracking-wider text-text-subtle">{b.market}</span>
                                    </div>
                                    <button aria-label="Close" onClick={() => setSelectedId(null)} className="shrink-0 grid place-items-center w-8 h-8 rounded-lg text-text-subtle hover:text-text-light hover:bg-adm-hover-2 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                <h3 className="mt-3 text-lg font-serif font-bold text-text-light leading-snug">{svcBase}</h3>
                                {svcRest && <div className="text-sm text-lilac mt-0.5">{svcRest}</div>}
                            </div>

                            {/* details */}
                            <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-4">
                                <Field label="Name" value={b.name} />
                                {b.dob && <Field label="Date of Birth" value={fmtDate(b.dob)} />}
                                <div className="col-span-2"><Field label="Contact" value={b.contact} /></div>
                                {b.question && <div className="col-span-2"><Field label="Question" value={b.question} italic /></div>}
                            </div>

                            {/* status footer */}
                            <div className="px-5 py-4 border-t border-adm-line bg-adm-hover">
                                <div className="text-xs uppercase tracking-wider text-text-subtle mb-2">Update status</div>
                                <StatusControl b={b} />
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ---------------- ORDERS (async services) ---------------- */}
            {tab === 'orders' && (
                <>
                    {/* active / done sub-tabs */}
                    <div className="inline-flex rounded-xl bg-adm-hover p-1">
                        {([['active', 'Active', activeOrders.length], ['done', 'Done', doneOrders.length]] as const).map(([id, label, count]) => (
                            <button
                                key={id}
                                onClick={() => setOrderView(id)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${orderView === id ? 'bg-lilac text-[#26242B]' : 'text-text-subtle hover:text-text-light'}`}
                            >
                                {label}
                                <span className={`text-[0.7rem] px-1.5 py-0.5 rounded-full ${orderView === id ? 'bg-adm-hover-3' : 'bg-adm-hover-2'}`}>{count}</span>
                            </button>
                        ))}
                    </div>

                    {(() => {
                        const list = orderView === 'active' ? activeOrders : doneOrders;
                        if (!error && !loading && list.length === 0) {
                            return (
                                <div className="text-center py-20 text-text-subtle">
                                    <ShoppingBag size={40} className="mx-auto mb-4 opacity-40" />
                                    <p>{orderView === 'active' ? 'No active orders.' : 'No completed orders.'}</p>
                                </div>
                            );
                        }
                        return (
                            <div className="grid gap-3">
                                {list.map((b) => {
                                    const parts = b.serviceName.split(' · ');
                                    const override = ORDER_OVERRIDE[parts[0]] || {};
                                    const item = override.title || (parts.length > 1 ? parts[1] : parts[0]); // chat → "3 Pertanyaan"
                                    const price = (parts.length > 2 ? parts.slice(2).join(' · ') : '') || override.price || '';
                                    const created = b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                                    return (
                                        <div key={b.id} className="bg-surface-1 border border-adm-line rounded-2xl p-5 flex flex-col lg:flex-row lg:items-start gap-4">
                                            {/* customer + order */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-text-subtle text-xs mb-1.5">{created} · <span className="uppercase">{b.market}</span></div>
                                                <div className="text-lg font-serif font-bold text-text-light leading-tight">{b.name} - {item}</div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-subtle">
                                                    {b.dob && <span className="flex items-center gap-1.5"><Cake size={13} /> {fmtDate(b.dob)}</span>}
                                                    <span className="truncate">{b.contact}</span>
                                                </div>
                                                {b.question && (
                                                    <div className="mt-2 flex items-start gap-1.5 text-sm text-text-subtle/80">
                                                        <MessageSquare size={13} className="mt-0.5 shrink-0" />
                                                        <span className="italic">{b.question}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* price + status */}
                                            <div className="shrink-0 flex flex-col items-start lg:items-end gap-2.5">
                                                {price && <div className="text-base font-serif font-bold text-coral-deep whitespace-nowrap">{price}</div>}
                                                <StatusControl b={b} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </>
            )}
        </div>
    );
};

export default BookingsView;
