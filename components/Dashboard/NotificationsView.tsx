import React, { useMemo, useState } from 'react';
import { BellOff, CalendarClock, CheckCheck, Clock, AlertCircle, Sparkles, Wallet, XCircle } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import Segmented from './ui/Segmented';
import { LoaderCard } from './ui/InlineLoader';
import BookingsView from './BookingsView';
import { dayHeading, type Note, type NoteKind } from './lib/notifications';

// Everything worth knowing about the bookings, newest first: new bookings, ones waiting
// for payment, readings and chats due soon or overdue, sessions in the next day, and
// bookings let go unpaid. Clicking one opens that booking's details.
const ICON: Record<NoteKind, React.ComponentType<{ size?: number; className?: string }>> = {
    new: Sparkles, awaiting: Wallet, dueSoon: Clock, overdue: AlertCircle, session: CalendarClock, cancelled: XCircle,
};
const TONE: Record<Note['tone'], { icon: string; title: string }> = {
    accent: { icon: 'bg-lilac/12 text-lilac', title: 'text-text-light' },
    soon: { icon: 'bg-amber-400/15 due-soon-text', title: 'due-soon-text' },
    late: { icon: 'bg-red-500/12 due-late-text', title: 'due-late-text' },
    quiet: { icon: 'bg-adm-hover text-text-subtle', title: 'text-text-light' },
};
type Filter = 'all' | 'todo' | 'bookings';
const TODO: NoteKind[] = ['dueSoon', 'overdue', 'session', 'awaiting'];
const BOOKINGS: NoteKind[] = ['new', 'awaiting', 'cancelled'];
const ago = (t: number, now: number) => {
    const min = Math.round((now - t) / 60_000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min ago`;
    const h = Math.round(min / 60);
    if (h < 24) return `${h} h ago`;
    return new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
};

const NotificationsView: React.FC<{
    notes: Note[]; now: number; seenAt: number; loading: boolean; refreshing: boolean;
    onRefresh: () => void; onMarkAll: () => void;
}> = ({ notes, now, seenAt, loading, refreshing, onRefresh, onMarkAll }) => {
    const [filter, setFilter] = useState<Filter>('all');
    const [openId, setOpenId] = useState<string | null>(null);
    const todo = notes.filter((n) => TODO.includes(n.kind)).length;
    const shown = notes.filter((n) => filter === 'all' || (filter === 'todo' ? TODO : BOOKINGS).includes(n.kind));
    const unread = notes.filter((n) => n.at > seenAt).length;
    const days = useMemo(() => {
        const out: { heading: string; items: Note[] }[] = [];
        for (const n of shown) {
            const h = dayHeading(n.at, now);
            if (out[out.length - 1]?.heading === h) out[out.length - 1].items.push(n);
            else out.push({ heading: h, items: [n] });
        }
        return out;
    }, [shown, now]);

    return (
        <div className="space-y-5 pt-20 lg:pt-8 p-4 md:px-8 max-w-3xl">
            <PageHeader title="Notifications" onRefresh={onRefresh} refreshing={refreshing}
                subtitle={unread ? `${unread} new since you last looked` : 'New bookings, what’s due and who’s coming'}>
                {unread > 0 && (
                    <button onClick={onMarkAll} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-text-subtle hover:text-text-light hover:bg-adm-hover transition-colors">
                        <CheckCheck size={16} /> Mark all read
                    </button>
                )}
            </PageHeader>

            <Segmented value={filter} onChange={setFilter} options={[
                { id: 'all', label: 'All', count: notes.length },
                { id: 'todo', label: 'To do', count: todo },
                { id: 'bookings', label: 'Bookings' },
            ]} />

            {loading ? <LoaderCard /> : days.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-text-subtle">
                    <BellOff size={28} className="opacity-50" />
                    <p className="text-sm">{filter === 'todo' ? 'Nothing waiting on you right now.' : 'Nothing in the last two weeks.'}</p>
                </div>
            ) : days.map((d) => (
                <section key={d.heading}>
                    <h2 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle/70">{d.heading}</h2>
                    <ul className="divide-y divide-adm-line border-y border-adm-line">
                        {d.items.map((n) => {
                            const Icon = ICON[n.kind];
                            const tone = TONE[n.tone];
                            const fresh = n.at > seenAt;
                            return (
                                <li key={n.id}>
                                    <button onClick={() => setOpenId(n.bookingId)}
                                        className={`w-full text-left flex items-start gap-3 px-2 sm:px-3 py-3.5 transition-colors hover:bg-adm-hover ${fresh ? 'bg-lilac/[0.04]' : ''}`}>
                                        <span className={`mt-0.5 shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${tone.icon}`}>
                                            <Icon size={17} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={`block text-sm ${fresh ? 'font-semibold' : 'font-medium'} ${tone.title}`}>{n.title}</span>
                                            <span className="block text-[13px] text-text-subtle mt-0.5">{n.detail}</span>
                                        </span>
                                        <span className="shrink-0 flex items-center gap-2 pt-0.5">
                                            <span className="text-xs text-text-subtle whitespace-nowrap">{ago(n.at, now)}</span>
                                            <span aria-label={fresh ? 'new' : undefined} className={`h-2 w-2 rounded-full ${fresh ? 'bg-lilac' : 'bg-transparent'}`} />
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}

            {openId && <BookingsView view="detail" openId={openId} onClosed={() => { setOpenId(null); onRefresh(); }} />}
        </div>
    );
};

export default NotificationsView;
