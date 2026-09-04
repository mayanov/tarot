import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Calendar as CalIcon, User, MessageSquare, Clock, ShoppingBag } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { getAllBookings, Booking } from '../../services/booking';

const STATUSES: Booking['status'][] = ['pending', 'confirmed', 'done', 'cancelled'];

const STATUS_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-amber-400/15 text-amber-300 border-amber-400/25',
    confirmed: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/25',
    done: 'bg-sky-400/15 text-sky-300 border-sky-400/25',
    cancelled: 'bg-red-400/15 text-red-300 border-red-400/25',
};

const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseISO = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
};
const prettyDay = (s: string) =>
    parseISO(s).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const BookingsView: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'calendar' | 'orders'>('calendar');
    const [selected, setSelected] = useState<Date>(new Date());

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken') || undefined;
            setBookings(await getAllBookings(token));
        } catch (e) {
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

    // Scheduled = has a real date + time slot (Call, Meetup, Live). Orders = async (Chat, Special, card spreads).
    const scheduled = useMemo(() => bookings.filter((b) => b.date && b.time), [bookings]);
    const orders = useMemo(
        () => bookings.filter((b) => !(b.date && b.time)).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
        [bookings],
    );

    const bookedDates = useMemo(() => scheduled.map((b) => parseISO(b.date)), [scheduled]);

    // When data loads, jump to the nearest upcoming day that has a session (nicer default than "today").
    useEffect(() => {
        if (!scheduled.length) return;
        const todayISO = toISO(new Date());
        const upcoming = [...new Set(scheduled.map((b) => b.date))].filter((d) => d >= todayISO).sort();
        if (upcoming.length) setSelected(parseISO(upcoming[0]));
    }, [scheduled.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedISO = toISO(selected);
    const daySessions = useMemo(
        () => scheduled.filter((b) => b.date === selectedISO).sort((a, b) => a.time.localeCompare(b.time)),
        [scheduled, selectedISO],
    );

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

            {/* ---------------- CALENDAR (scheduled sessions) ---------------- */}
            {tab === 'calendar' && (
                <div className="grid lg:grid-cols-[auto,1fr] gap-6 items-start">
                    <div className="rounded-2xl bg-cream text-ink p-3 flex justify-center [--rdp-accent-color:#DA8636] [--rdp-accent-background-color:#F1E6D8]">
                        <DayPicker
                            mode="single"
                            selected={selected}
                            onSelect={(d) => d && setSelected(d)}
                            weekStartsOn={1}
                            modifiers={{ booked: bookedDates }}
                            modifiersClassNames={{ booked: 'day-booked' }}
                        />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-4">
                            <CalIcon size={16} className="text-lilac" />
                            <h2 className="text-white font-serif font-semibold">{prettyDay(selectedISO)}</h2>
                        </div>

                        {daySessions.length === 0 ? (
                            <div className="text-center py-16 text-text-subtle bg-surface-1 border border-white/5 rounded-2xl">
                                <Clock size={32} className="mx-auto mb-3 opacity-40" />
                                <p className="text-sm">No sessions scheduled this day.</p>
                                <p className="text-xs opacity-60 mt-1">Days with a dot on the calendar have sessions.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {daySessions.map((b) => (
                                    <div key={b.id} className="bg-surface-1 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="sm:w-20 shrink-0 flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0">
                                            <div className="text-2xl font-serif font-bold text-white leading-none">{b.time}</div>
                                            <div className="text-[0.6rem] uppercase tracking-wider text-text-subtle">{b.market}</div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white font-medium">{b.serviceName}</div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-text-subtle">
                                                <span className="flex items-center gap-1.5"><User size={13} /> {b.name}</span>
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
                        )}
                    </div>
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
