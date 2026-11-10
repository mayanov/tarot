import React, { useMemo, useState } from 'react';
import { BellOff, CalendarClock, CheckCheck, Clock, AlertCircle, Sparkles, Wallet, XCircle, RefreshCcw, X } from 'lucide-react';
import BookingsView from './BookingsView';
import { dayHeading, type Note, type NoteKind } from './lib/notifications';

// The bell's panel: what needs doing first (overdue, due soon, sessions coming up,
// bookings waiting for payment), most urgent on top; then what happened lately (new
// bookings, ones let go unpaid), newest first. Clicking one opens that booking's details.
const ICON: Record<NoteKind, React.ComponentType<{ size?: number; className?: string }>> = {
    new: Sparkles, awaiting: Wallet, dueSoon: Clock, overdue: AlertCircle, session: CalendarClock, cancelled: XCircle,
};
const TONE: Record<Note['tone'], { icon: string; title: string }> = {
    accent: { icon: 'bg-lilac/12 text-lilac', title: 'text-text-light' },
    soon: { icon: 'bg-amber-400/15 due-soon-text', title: 'due-soon-text' },
    late: { icon: 'bg-red-500/12 due-late-text', title: 'due-late-text' },
    quiet: { icon: 'bg-adm-hover text-text-subtle', title: 'text-text-light' },
};
// to do, most urgent first: overdue (longest overdue first), due soon (soonest first),
// sessions coming up (soonest first), then waiting for payment (newest first)
const RANK: Partial<Record<NoteKind, number>> = { overdue: 0, dueSoon: 1, session: 2, awaiting: 3 };
const isTodo = (n: Note) => RANK[n.kind] !== undefined;
const ago = (t: number, now: number) => {
    const min = Math.round((now - t) / 60_000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min ago`;
    const h = Math.round(min / 60);
    if (h < 24) return `${h} h ago`;
    return new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
};

const Heading: React.FC<{ children: React.ReactNode; count?: number }> = ({ children, count }) => (
    <h3 className="px-4 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle/70">
        {children}{count ? <span className="ml-1.5 text-text-subtle/50">{count}</span> : null}
    </h3>
);

const NotificationsView: React.FC<{
    notes: Note[]; now: number; seenAt: number; loading: boolean; refreshing: boolean;
    onRefresh: () => void; onMarkAll: () => void; onClose: () => void;
}> = ({ notes, now, seenAt, loading, refreshing, onRefresh, onMarkAll, onClose }) => {
    const [openId, setOpenId] = useState<string | null>(null);
    const unread = notes.filter((n) => n.at > seenAt).length;
    const todo = useMemo(() => notes.filter(isTodo).sort((a, b) =>
        RANK[a.kind]! - RANK[b.kind]! || (a.kind === 'awaiting' ? b.at - a.at : a.at - b.at)), [notes]);
    const days = useMemo(() => {
        const out: { heading: string; items: Note[] }[] = [];
        for (const n of notes.filter((x) => !isTodo(x))) {
            const h = dayHeading(n.at, now);
            if (out[out.length - 1]?.heading === h) out[out.length - 1].items.push(n);
            else out.push({ heading: h, items: [n] });
        }
        return out;
    }, [notes, now]);

    const item = (n: Note) => {
        const Icon = ICON[n.kind];
        const tone = TONE[n.tone];
        const fresh = n.at > seenAt;
        return (
            <li key={n.id}>
                <button onClick={() => setOpenId(n.bookingId)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-adm-hover ${fresh ? 'bg-lilac/[0.05]' : ''}`}>
                    <span className={`mt-0.5 shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${tone.icon}`}>
                        <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className={`block text-[13.5px] leading-snug ${fresh ? 'font-semibold' : 'font-medium'} ${tone.title}`}>{n.title}</span>
                        <span className="block text-[12.5px] text-text-subtle mt-0.5">{n.detail}</span>
                    </span>
                    <span className="shrink-0 flex items-center gap-2 pt-0.5">
                        {!isTodo(n) && <span className="text-[11px] text-text-subtle whitespace-nowrap">{ago(n.at, now)}</span>}
                        <span aria-label={fresh ? 'new' : undefined} className={`h-2 w-2 rounded-full ${fresh ? 'bg-lilac' : 'bg-transparent'}`} />
                    </span>
                </button>
            </li>
        );
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="shrink-0 flex items-center gap-1 pl-4 pr-2 h-14 border-b border-adm-line">
                <h2 className="font-serif font-bold text-lg text-text-light">Notifications</h2>
                {unread > 0 && <span className="ml-1 text-xs text-text-subtle">{unread} new</span>}
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

            <div className="flex-1 min-h-0 overflow-y-auto pb-3" data-lenis-prevent>
                {loading ? <p className="px-4 py-10 text-center text-sm text-text-subtle">Loading…</p> : <>
                    <Heading count={todo.length}>To do</Heading>
                    {todo.length
                        ? <ul className="divide-y divide-adm-line">{todo.map(item)}</ul>
                        : <p className="px-4 py-3 text-[13px] text-text-subtle">Nothing waiting on you right now.</p>}

                    {days.length === 0 ? (
                        <div className="py-10 flex flex-col items-center gap-2 text-text-subtle">
                            <BellOff size={22} className="opacity-50" />
                            <p className="text-[13px]">No new bookings in the last two weeks.</p>
                        </div>
                    ) : days.map((d) => (
                        <section key={d.heading} className="border-t border-adm-line mt-2">
                            <Heading>{d.heading}</Heading>
                            <ul className="divide-y divide-adm-line">{d.items.map(item)}</ul>
                        </section>
                    ))}
                </>}
            </div>

            {openId && <BookingsView view="detail" openId={openId} onClosed={() => { setOpenId(null); onRefresh(); }} />}
        </div>
    );
};

export default NotificationsView;
