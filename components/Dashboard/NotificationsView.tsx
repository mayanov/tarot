import React, { useMemo, useState } from 'react';
import { BellOff, CheckCheck, Sparkles, Wallet, XCircle, RefreshCcw, X, PartyPopper, Clock, AlertCircle, CalendarClock, CheckCircle2 } from 'lucide-react';
import BookingsView from './BookingsView';
import TodoCard from './TodoCard';
import { BOOKINGS_CHANGED, type Booking } from '../../services/booking';
import { dayHeading, todosFrom, type Note, type NoteKind, type NoteStep, type Todo } from './lib/notifications';

// The bell's panel. On top, the to do list: every reading or chat still to send and
// every session in the next day, as cards, soonest deadline first; a reading is ticked
// off right here (marked done). Below, the latest: one line per booking, its status
// changing in place (waiting for payment, paid, due soon, overdue, cancelled) with its
// stages under it, so a booking never piles up several notifications. Clicking anything
// opens that booking's details.
const REMINDER: NoteKind[] = ['dueSoon', 'overdue', 'session'];
const ICON: Record<NoteKind, React.ComponentType<{ size?: number; className?: string }>> = {
    new: Sparkles, awaiting: Wallet, cancelled: XCircle, dueSoon: Clock, overdue: AlertCircle, session: CalendarClock, done: CheckCircle2,
};
const TONE: Record<Note['tone'], { icon: string; pill: string }> = {
    accent: { icon: 'text-lilac bg-lilac/12', pill: 'text-lilac bg-lilac/12' },
    soon: { icon: 'due-soon-text bg-gold-accent/12', pill: 'due-soon-text bg-gold-accent/12' },
    late: { icon: 'due-late-text bg-coral-deep/10', pill: 'due-late-text bg-coral-deep/10' },
    quiet: { icon: 'text-text-subtle bg-adm-hover', pill: 'text-text-subtle bg-adm-hover' },
    ok: { icon: 'text-sage bg-sage/12', pill: 'text-sage bg-sage/12' },
};
const STEP_DOT: Record<NoteStep['state'], string> = {
    done: 'bg-sage', now: 'bg-lilac ring-2 ring-lilac/25', next: 'border border-adm-line-3 bg-transparent', late: 'bg-current',
};
const clock = (t: number) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
const ago = (t: number, now: number) => {
    const min = Math.round((now - t) / 60_000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min ago`;
    const h = Math.round(min / 60);
    if (h < 24) return `${h} h ago`;
    return clock(t);
};

const NotificationsView: React.FC<{
    bookings: Booking[]; notes: Note[]; now: number; seenAt: number; loading: boolean; refreshing: boolean;
    onRefresh: () => void; onMarkAll: () => void; onClose: () => void;
}> = ({ bookings, notes, now, seenAt, loading, refreshing, onRefresh, onMarkAll, onClose }) => {
    const [openId, setOpenId] = useState<string | null>(null);
    const [ticked, setTicked] = useState<Set<string>>(new Set()); // marked done, on its way out
    const [err, setErr] = useState('');
    const todos = useMemo(() => todosFrom(bookings, now), [bookings, now]);
    // a to do card is new when the reminder for it hasn't been seen yet
    const freshIds = useMemo(() => new Set(notes.filter((n) => REMINDER.includes(n.kind) && n.at > seenAt).map((n) => n.bookingId)), [notes, seenAt]);
    const unread = notes.filter((n) => n.at > seenAt).length;
    const days = useMemo(() => {
        const out: { heading: string; items: Note[] }[] = [];
        for (const n of notes) {
            const h = dayHeading(n.at, now);
            if (out[out.length - 1]?.heading === h) out[out.length - 1].items.push(n);
            else out.push({ heading: h, items: [n] });
        }
        return out;
    }, [notes, now]);

    const tick = async (t: Todo) => {
        setErr('');
        setTicked((s) => new Set(s).add(t.b.id));
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/admin/bookings/${t.b.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ status: 'done' }),
            });
            if (!res.ok) throw new Error();
            window.setTimeout(() => window.dispatchEvent(new Event(BOOKINGS_CHANGED)), 600); // let the tick show first
        } catch {
            setTicked((s) => { const n = new Set(s); n.delete(t.b.id); return n; });
            setErr(`Couldn’t mark ${t.b.name || 'it'} done. Try again.`);
        }
    };

    const card = (t: Todo) => (
        <li key={t.b.id}>
            <TodoCard t={t} now={now} done={ticked.has(t.b.id)} fresh={freshIds.has(t.b.id)} onOpen={() => setOpenId(t.b.id)} onTick={() => tick(t)} />
        </li>
    );

    const stepTime = (t: number) => (dayHeading(t, now) === 'Today' ? clock(t) : new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }));
    const feedItem = (n: Note) => {
        const Icon = ICON[n.kind];
        const fresh = n.at > seenAt;
        return (
            <li key={n.id}>
                <button onClick={() => setOpenId(n.bookingId)} className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-adm-hover">
                    <span className={`mt-0.5 shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${TONE[n.tone].icon}`}><Icon size={14} /></span>
                    <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                            <span className={`min-w-0 text-[13px] leading-snug ${fresh ? 'font-semibold text-text-light' : 'text-text-light/85'}`}>{n.title}</span>
                            <span className="shrink-0 flex items-center gap-1.5 pt-0.5">
                                <span className="text-[11px] text-text-subtle whitespace-nowrap">{ago(n.at, now)}</span>
                                <span className={`h-1.5 w-1.5 rounded-full ${fresh ? 'bg-lilac' : 'bg-transparent'}`} />
                            </span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={`px-1.5 py-px rounded-md text-[11px] font-semibold whitespace-nowrap ${TONE[n.tone].pill}`}>{n.status}</span>
                            <span className="text-[12px] text-text-subtle min-w-0">{n.detail}</span>
                        </span>
                        {/* its stages: Booked, Paid, then Due / Session / Sent */}
                        <span className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-text-subtle">
                            {n.steps.map((st, i) => (
                                <React.Fragment key={st.label + i}>
                                    {i > 0 && <span className={`h-px w-3 ${st.state === 'next' ? 'bg-adm-line-2' : 'bg-adm-line-3'}`} />}
                                    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${st.state === 'next' ? 'opacity-60' : st.state === 'late' ? 'due-late-text' : st.state === 'now' ? 'text-text-light' : ''}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${STEP_DOT[st.state]}`} />
                                        {st.label}{st.at ? <span className="opacity-70">{stepTime(st.at)}</span> : null}
                                    </span>
                                </React.Fragment>
                            ))}
                        </span>
                    </span>
                </button>
            </li>
        );
    };

    const left = todos.filter((t) => !ticked.has(t.b.id)).length;
    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="shrink-0 flex items-center gap-1 pl-4 pr-2 h-14 border-b border-adm-line bg-surface-1">
                <h2 className="font-serif font-bold text-lg text-text-light">Notifications</h2>
                {unread > 0 && <span className="ml-1.5 px-1.5 py-px rounded-full bg-coral-deep/12 text-coral-deep text-[11px] font-semibold">{unread} new</span>}
                <span className="flex-1" />
                {unread > 0 && (
                    <button onClick={onMarkAll} title="Mark all read" aria-label="Mark all read" className="p-2 rounded-lg text-text-subtle hover:text-text-light hover:bg-adm-hover transition-colors">
                        <CheckCheck size={17} />
                    </button>
                )}
                <button onClick={onRefresh} title="Refresh" aria-label="Refresh" className="p-2 rounded-lg text-text-subtle hover:text-text-light hover:bg-adm-hover transition-colors">
                    <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
                </button>
                <button onClick={onClose} title="Close" aria-label="Close" className="p-2 rounded-lg text-text-subtle hover:text-text-light hover:bg-adm-hover transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto bg-bg-deep/60" data-lenis-prevent>
                {loading ? <p className="px-4 py-10 text-center text-sm text-text-subtle">Loading…</p> : <>
                    <section className="px-3 pt-4 pb-4">
                        <div className="px-1 pb-2.5 flex items-baseline justify-between">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">To do</h3>
                            {left > 0 && <span className="text-[11px] text-text-subtle">{left} left</span>}
                        </div>
                        {err && <p className="mb-2 px-1 text-[12px] due-late-text">{err}</p>}
                        {todos.length ? <ul className="space-y-2">{todos.map(card)}</ul> : (
                            <div className="flex items-center gap-3 px-3.5 py-3.5 rounded-xl border border-dashed border-adm-line-2 text-text-subtle">
                                <PartyPopper size={18} className="text-sage shrink-0" />
                                <span className="text-[13px]">All caught up. Nothing to send, and no session in the next day.</span>
                            </div>
                        )}
                    </section>

                    <section className="bg-surface-1 border-t border-adm-line pb-3 min-h-[40%]">
                        <h3 className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">Latest</h3>
                        {days.length === 0 ? (
                            <div className="py-8 flex flex-col items-center gap-2 text-text-subtle">
                                <BellOff size={20} className="opacity-50" />
                                <p className="text-[13px]">No bookings in the last two weeks.</p>
                            </div>
                        ) : days.map((d) => (
                            <div key={d.heading}>
                                <p className="px-4 pt-3 pb-1 text-[11px] font-medium text-text-subtle/70">{d.heading}</p>
                                <ul>{d.items.map(feedItem)}</ul>
                            </div>
                        ))}
                    </section>
                </>}
            </div>

            {openId && <BookingsView view="detail" openId={openId} onClosed={() => { setOpenId(null); onRefresh(); }} />}
        </div>
    );
};

export default NotificationsView;
