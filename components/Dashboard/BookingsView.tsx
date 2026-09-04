import React, { useEffect, useState } from 'react';
import { RefreshCcw, Calendar, User, MessageSquare } from 'lucide-react';
import { getAllBookings, Booking } from '../../services/booking';

const STATUSES: Booking['status'][] = ['pending', 'confirmed', 'done', 'cancelled'];

const STATUS_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-amber-400/15 text-amber-300 border-amber-400/25',
    confirmed: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/25',
    done: 'bg-sky-400/15 text-sky-300 border-sky-400/25',
    cancelled: 'bg-red-400/15 text-red-300 border-red-400/25',
};

const BookingsView: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken') || undefined;
            setBookings(await getAllBookings(token));
        } catch (e) {
            setError('Could not load bookings. Make sure the backend server is running and you are logged in.');
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

    const upcoming = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length;

    return (
        <div className="space-y-6 pt-24 md:pt-12 p-6 md:p-12 max-w-6xl mx-auto">
            <div className="pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Bookings</h1>
                    <p className="text-text-subtle text-sm">{bookings.length} total · {upcoming} pending / confirmed</p>
                </div>
                <button
                    onClick={load}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all text-sm flex items-center gap-2"
                >
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/25 rounded-xl px-4 py-3">{error}</div>}

            {!error && !loading && bookings.length === 0 && (
                <div className="text-center py-20 text-text-subtle">
                    <Calendar size={40} className="mx-auto mb-4 opacity-40" />
                    <p>No bookings yet.</p>
                </div>
            )}

            <div className="grid gap-3">
                {bookings.map((b) => (
                    <div key={b.id} className="bg-surface-1 border border-white/5 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* when */}
                        <div className="lg:w-40 shrink-0">
                            <div className="flex items-center gap-2 text-white font-serif font-semibold">
                                <Calendar size={15} className="text-lilac shrink-0" /> {b.date}
                            </div>
                            <div className="text-text-subtle text-sm mt-0.5 pl-6">{b.time} · <span className="uppercase text-[0.65rem] tracking-wider">{b.market}</span></div>
                        </div>

                        {/* who + service */}
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

                        {/* status */}
                        <div className="shrink-0 flex items-center gap-2">
                            <span className={`text-[0.65rem] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                            <select
                                value={b.status}
                                onChange={(e) => changeStatus(b.id, e.target.value as Booking['status'])}
                                className="bg-bg-deep border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-lilac/50"
                            >
                                {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookingsView;
