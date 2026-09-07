import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Calendar as CalIcon, User, MessageSquare, ShoppingBag, Cake, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getAllBookings, Booking } from '../../services/booking';

const STATUSES: Booking['status'][] = ['pending', 'confirmed', 'done', 'cancelled'];

const STATUS_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-amber-400/15 text-amber-300 border-amber-400/25',
    confirmed: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/25',
    done: 'bg-sky-400/15 text-sky-300 border-sky-400/25',
    cancelled: 'bg-red-400/15 text-red-300 border-red-400/25',
};

// Calendar block colours per status.
const BLOCK_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-amber-400/20 border-amber-300/50 text-amber-50 hover:bg-amber-400/30',
    confirmed: 'bg-emerald-400/20 border-emerald-300/50 text-emerald-50 hover:bg-emerald-400/30',
    done: 'bg-sky-400/20 border-sky-300/50 text-sky-50 hover:bg-sky-400/30',
    cancelled: 'bg-red-400/15 border-red-300/40 text-red-100 line-through opacity-70 hover:opacity-90',
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
    const orders = useMemo(
        () => bookings.filter((b) => !(b.date && b.time)).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
        [bookings],
    );

    // Jump to the week of the nearest upcoming session once data loads.
    useEffect(() => {
        if (!scheduled.length) return;
        const todayISO = toISO(new Date());
        const upcoming = [...new Set(scheduled.map((b) => b.date))].filter((d) => d >= todayISO).sort();
        if (upcoming.length) setWeekStart(startOfWeek(parseISO(upcoming[0])));
    }, [scheduled.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const byDay = useMemo(() => {
        const map: Record<string, Booking[]> = {};
        scheduled.forEach((b) => { (map[b.date] ||= []).push(b); });
        return map;
    }, [scheduled]);

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
                <TabButton id="calendar" icon={<CalIcon size={15} />} label="Calendar" count={scheduled.length} />
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

                    {scheduled.length === 0 && !loading && !error && (
                        <p className="text-center text-text-subtle text-sm py-4">No scheduled sessions yet.</p>
                    )}

                    {/* selected booking detail */}
                    {selectedBooking && (
                        <div className="bg-surface-1 border border-white/5 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="lg:w-44 shrink-0">
                                <div className="flex items-center gap-2 text-white font-serif font-semibold">
                                    <CalIcon size={15} className="text-lilac shrink-0" /> {selectedBooking.date}
                                </div>
                                <div className="text-text-subtle text-sm mt-0.5 pl-6">{selectedBooking.time} · <span className="uppercase text-[0.65rem] tracking-wider">{selectedBooking.market}</span></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-medium">{selectedBooking.serviceName}</div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-text-subtle">
                                    <span className="flex items-center gap-1.5"><User size={13} /> {selectedBooking.name}</span>
                                    {selectedBooking.dob && <span className="flex items-center gap-1.5"><Cake size={13} /> {selectedBooking.dob}</span>}
                                    <span className="truncate">{selectedBooking.contact}</span>
                                </div>
                                {selectedBooking.question && (
                                    <div className="mt-2 flex items-start gap-1.5 text-sm text-text-subtle/80">
                                        <MessageSquare size={13} className="mt-0.5 shrink-0" />
                                        <span className="italic">{selectedBooking.question}</span>
                                    </div>
                                )}
                            </div>
                            <StatusControl b={selectedBooking} />
                            <button aria-label="Close" onClick={() => setSelectedId(null)} className="shrink-0 grid place-items-center w-8 h-8 rounded-lg text-text-subtle hover:text-white hover:bg-white/10 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ---------------- ORDERS (async services) ---------------- */}
            {tab === 'orders' && (
                <>
                    {!error && !loading && orders.length === 0 && (
                        <div className="text-center py-20 text-text-subtle">
                            <ShoppingBag size={40} className="mx-auto mb-4 opacity-40" />
                            <p>No orders yet.</p>
                        </div>
                    )}
                    <div className="grid gap-3">
                        {orders.map((b) => (
                            <div key={b.id} className="bg-surface-1 border border-white/5 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                                <div className="lg:w-44 shrink-0">
                                    <div className="text-white font-medium truncate">{b.serviceName.split(' · ')[0]}</div>
                                    <div className="text-text-subtle text-xs mt-0.5">
                                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · <span className="uppercase">{b.market}</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    {b.serviceName.includes(' · ') && (
                                        <div className="text-sm text-lilac mb-1">{b.serviceName.split(' · ').slice(1).join(' · ')}</div>
                                    )}
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
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default BookingsView;
