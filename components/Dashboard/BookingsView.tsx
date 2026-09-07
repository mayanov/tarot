import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Calendar as CalIcon, User, MessageSquare, ShoppingBag, Cake, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { getAllBookings, Booking } from '../../services/booking';

const STATUSES: Booking['status'][] = ['pending', 'confirmed', 'done', 'cancelled'];

// Status pills — mapped to the brand jewel palette (coral / sage / blue / mauve).
const STATUS_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-coral/20 text-[#f4c79c] border-coral/40',
    confirmed: 'bg-sage/25 text-[#a9d6b5] border-sage/55',
    done: 'bg-blue/30 text-[#a9caea] border-blue/55',
    cancelled: 'bg-mauve/20 text-[#ddb8d6] border-mauve/50',
};

// Calendar block colours per status (same palette, a touch stronger).
const BLOCK_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-coral/25 border-coral/55 text-[#fbe1c8] hover:bg-coral/35',
    confirmed: 'bg-sage/25 border-sage/55 text-[#c6e7cf] hover:bg-sage/35',
    done: 'bg-blue/30 border-blue/55 text-[#c4ddf3] hover:bg-blue/40',
    cancelled: 'bg-mauve/20 border-mauve/50 text-[#e6cbe1] line-through opacity-70 hover:opacity-90',
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

    const StatusControl: React.FC<{ b: Booking }> = ({ b }) => (
        <div className="shrink-0 flex items-center gap-2">
            <span className={`text-[0.65rem] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[b.status]}`}>{b.status}</span>
            <select
                value={b.status}
                onChange={(e) => changeStatus(b.id, e.target.value as Booking['status'])}
                className="bg-bg-dark border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-lilac/50"
            >
                {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
        </div>
    );

    const TabButton: React.FC<{ id: 'calendar' | 'orders'; icon: React.ReactNode; label: string; count: number }> = ({ id, icon, label, count }) => (
        <button
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === id ? 'bg-lilac text-bg-dark' : 'bg-white/5 text-text-subtle hover:text-white hover:bg-white/10'
            }`}
        >
            {icon} {label}
            <span className={`text-[0.7rem] px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-black/15' : 'bg-white/10'}`}>{count}</span>
        </button>
    );

    const navBtn = 'grid place-items-center w-9 h-9 rounded-lg bg-white/5 text-text-subtle hover:text-white hover:bg-white/10 transition-colors';

    return (
        <div className="space-y-6 pt-24 md:pt-12 p-6 md:p-12 max-w-6xl mx-auto">
            <div className="pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Bookings</h1>
                    <p className="text-text-subtle text-sm">{scheduled.length} scheduled · {orders.length} orders</p>
                </div>
                <button
                    onClick={load}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all text-sm flex items-center gap-2"
                >
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/25 rounded-xl px-4 py-3">{error}</div>}

            <div className="flex gap-2">
                <TabButton id="calendar" icon={<CalIcon size={15} />} label="Calendar" count={calendarSessions.length} />
                <TabButton id="orders" icon={<ShoppingBag size={15} />} label="Orders" count={orders.length} />
            </div>

            {/* ---------------- CALENDAR — weekly time grid ---------------- */}
            {tab === 'calendar' && (
                <div className="space-y-5">
                    <div className="rounded-2xl bg-surface-1 border border-white/5 overflow-hidden">
                        {/* week nav */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <button aria-label="Previous week" className={navBtn} onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={16} /></button>
                                <button className="px-3 h-9 rounded-lg bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</button>
                                <button aria-label="Next week" className={navBtn} onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={16} /></button>
                            </div>
                            <h2 className="text-white font-serif font-semibold text-sm">{weekLabel}</h2>
                        </div>

                        {/* grid */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[760px]">
                                {/* day headers */}
                                <div className="grid border-b border-white/5" style={{ gridTemplateColumns: '3.5rem repeat(7, minmax(0,1fr))' }}>
                                    <div />
                                    {weekDays.map((d, i) => {
                                        const isToday = toISO(d) === todayISO;
                                        return (
                                            <div key={i} className={`py-2 text-center border-l border-white/5 ${isToday ? 'bg-lilac/10' : ''}`}>
                                                <div className="text-[0.65rem] uppercase tracking-wider text-text-subtle">{WEEKDAYS[i]}</div>
                                                <div className={`text-lg font-serif font-bold ${isToday ? 'text-lilac' : 'text-white'}`}>{d.getDate()}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* body: time gutter + 7 day columns */}
                                <div className="grid" style={{ gridTemplateColumns: '3.5rem repeat(7, minmax(0,1fr))' }}>
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
                                            <div key={di} className={`relative border-l border-white/5 ${isToday ? 'bg-lilac/[0.04]' : ''}`} style={{ height: GRID_H }}>
                                                {/* hour lines */}
                                                {HOURS.map((h) => (
                                                    <div key={h} className="absolute left-0 right-0 border-t border-white/5" style={{ top: (h - 11) * HOUR_H }} />
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
                                                        <button
                                                            key={b.id}
                                                            onClick={() => setSelectedId(b.id)}
                                                            title={`${b.time}–${endStr} · ${b.serviceName} · ${b.name}`}
                                                            className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 text-left overflow-hidden transition-colors ${BLOCK_STYLE[b.status]} ${selectedId === b.id ? 'ring-2 ring-white/60' : ''}`}
                                                            style={{ top, height }}
                                                        >
                                                            <div className="text-[9px] font-semibold leading-none tabular-nums opacity-90">{b.time}–{endStr}</div>
                                                            <div className="text-[11px] font-semibold leading-tight truncate mt-0.5">{b.serviceName.split(' · ')[0]}</div>
                                                            {height > 40 && <div className="text-[10px] leading-tight truncate opacity-90">{b.name}</div>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

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
                        <div className={`text-sm text-white break-words ${italic ? 'italic text-text-light' : ''}`}>{value}</div>
                    </div>
                );
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
                        <div className="relative w-full max-w-md bg-surface-1 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                            {/* header — date & time first */}
                            <div className="p-5 border-b border-white/5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-text-light">
                                        <Clock size={15} className="text-lilac" />
                                        <span className="font-semibold tabular-nums">{b.date} · {b.time}{endStr && `–${endStr}`}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[0.6rem] uppercase tracking-wider text-text-subtle">{b.market}</span>
                                    </div>
                                    <button aria-label="Close" onClick={() => setSelectedId(null)} className="shrink-0 grid place-items-center w-8 h-8 rounded-lg text-text-subtle hover:text-white hover:bg-white/10 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                <h3 className="mt-3 text-lg font-serif font-bold text-white leading-snug">{svcBase}</h3>
                                {svcRest && <div className="text-sm text-lilac mt-0.5">{svcRest}</div>}
                            </div>

                            {/* details */}
                            <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-4">
                                <Field label="Name" value={b.name} />
                                {b.dob && <Field label="Date of Birth" value={b.dob} />}
                                <div className="col-span-2"><Field label="Contact" value={b.contact} /></div>
                                {b.question && <div className="col-span-2"><Field label="Question" value={b.question} italic /></div>}
                            </div>

                            {/* status footer */}
                            <div className="px-5 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between gap-3">
                                <span className="text-xs uppercase tracking-wider text-text-subtle">Status</span>
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
                    <div className="inline-flex rounded-xl bg-white/5 p-1">
                        {([['active', 'Active', activeOrders.length], ['done', 'Done', doneOrders.length]] as const).map(([id, label, count]) => (
                            <button
                                key={id}
                                onClick={() => setOrderView(id)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${orderView === id ? 'bg-lilac text-bg-dark' : 'text-text-subtle hover:text-white'}`}
                            >
                                {label}
                                <span className={`text-[0.7rem] px-1.5 py-0.5 rounded-full ${orderView === id ? 'bg-black/15' : 'bg-white/10'}`}>{count}</span>
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
                                    const title = parts.length > 1 ? parts[1] : parts[0]; // chat → "3 Pertanyaan"
                                    const price = parts.length > 2 ? parts.slice(2).join(' · ') : '';
                                    return (
                                        <div key={b.id} className="bg-surface-1 border border-white/5 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                                            <div className="lg:w-44 shrink-0">
                                                <div className="text-white font-medium truncate">{title}</div>
                                                <div className="text-text-subtle text-xs mt-0.5">
                                                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · <span className="uppercase">{b.market}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {price && <div className="text-sm text-lilac mb-1">{price}</div>}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-subtle">
                                                    <span className="flex items-center gap-1.5"><User size={13} /> {b.name}</span>
                                                    {b.dob && <span className="flex items-center gap-1.5"><Cake size={13} /> {b.dob}</span>}
                                                    <span className="truncate">{b.contact}</span>
                                                </div>
                                                {b.question && (
                                                    <div className="mt-2 flex items-start gap-1.5 text-sm text-text-subtle/80">
                                                        <MessageSquare size={13} className="mt-0.5 shrink-0" />
                                                        <span className="italic">{b.question}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <StatusControl b={b} />
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
