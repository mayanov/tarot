import React, { useMemo, useState } from 'react';
import { BellOff, Check, CheckCheck, Sparkles, Wallet, XCircle, RefreshCcw, X, PartyPopper } from 'lucide-react';
import BookingsView from './BookingsView';
import { BOOKINGS_CHANGED, type Booking } from '../../services/booking';
import { dayHeading, todosFrom, type Note, type NoteKind, type Todo } from './lib/notifications';

// The bell's panel. On top, the to do list: every reading or chat still to send and
// every session in the next day, as cards, soonest deadline first; a reading is ticked
// off right here (marked done). Below, what happened lately: new bookings, ones waiting
// for payment, ones let go unpaid. Clicking anything opens that booking's details.
const FEED: NoteKind[] = ['new', 'awaiting', 'cancelled'];
const FEED_ICON: Partial<Record<NoteKind, React.ComponentType<{ size?: number; className?: string }>>> = {
    new: Sparkles, awaiting: Wallet, cancelled: XCircle,
};
const FEED_TONE: Partial<Record<NoteKind, string>> = {
    new: 'text-lilac bg-lilac/12', awaiting: 'text-text-subtle bg-adm-hover', cancelled: 'text-text-subtle bg-adm-hover',
};
const PILL: Record<Todo['tone'], string> = {
    late: 'bg-red-500/12 due-late-text',
    soon: 'bg-amber-400/15 due-soon-text',
    calm: 'bg-adm-hover text-text-subtle',
};
const EDGE: Record<Todo['tone'], string> = { late: 'bg-red-400', soon: 'bg-amber-400', calm: 'bg-transparent' };
const clock = (t: number) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
const dayWord = (t: number, now: number) => {
    const k = (x: number) => new Date(x).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    return k(t) === k(now) ? 'Today' : 'Tmrw';
};
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
    const freshIds = useMemo(() => new Set(notes.filter((n) => !FEED.includes(n.kind) && n.at > seenAt).map((n) => n.bookingId)), [notes, seenAt]);
    const unread = notes.filter((n) => n.at > seenAt).length;
    const days = useMemo(() => {
        const out: { heading: string; items: Note[] }[] = [];
        for (const n of notes.filter((x) => FEED.includes(x.kind))) {
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

    const card = (t: Todo) => {
        const done = ticked.has(t.b.id);
        const fresh = freshIds.has(t.b.id);
        return (
            <li key={t.b.id}>
                <div role="button" tabIndex={0} onClick={() => setOpenId(t.b.id)} onKeyDown={(e) => { if (e.key === 'Enter') setOpenId(t.b.id); }}
                    className={`group relative flex items-start gap-3 pl-3.5 pr-3 py-3 rounded-xl bg-surface-1 border border-adm-line shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer transition-all hover:border-adm-line-2 hover:shadow-md ${done ? 'opacity-50' : ''}`}>
                    <span aria-hidden className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${EDGE[t.tone]}`} />
                    {t.kind === 'reading' ? (
                        <button onClick={(e) => { e.stopPropagation(); if (!done) tick(t); }} aria-label={`Mark ${t.b.name || 'it'} done`} title="Mark done"
                            className={`mt-0.5 shrink-0 h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center transition-colors ${done ? 'bg-sage border-sage text-white' : 'border-adm-line-2 text-transparent hover:border-sage hover:text-sage'}`}>
                            <Check size={13} strokeWidth={3} />
                        </button>
                    ) : (
                        <span className="shrink-0 w-[46px] -my-0.5 rounded-lg bg-lilac/10 text-lilac text-center py-1">
                            <span className="block text-[9.5px] font-semibold uppercase tracking-wider leading-none">{dayWord(t.at, now)}</span>
                            <span className="block text-[13px] font-semibold leading-tight mt-0.5">{clock(t.at)}</span>
                        </span>
                    )}
                    <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                            <span className={`text-[13.5px] leading-snug font-semibold text-text-light ${done ? 'line-through' : ''}`}>{t.title}</span>
                            <span className={`shrink-0 mt-px px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${PILL[t.tone]}`}>{done ? 'Done' : t.pill}</span>
                        </span>
                        <span className="block text-[12.5px] text-text-subtle mt-1 leading-snug">{t.detail}</span>
                    </span>
                    {fresh && !done && <span aria-label="new" className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-coral-deep ring-2 ring-surface-1" />}
                </div>
            </li>
        );
    };

    const feedItem = (n: Note) => {
        const Icon = FEED_ICON[n.kind]!;
        const fresh = n.at > seenAt;
        return (
            <li key={n.id}>
                <button onClick={() => setOpenId(n.bookingId)} className="w-full text-left flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-adm-hover">
                    <span className={`mt-0.5 shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${FEED_TONE[n.kind]}`}><Icon size={14} /></span>
                    <span className="min-w-0 flex-1">
                        <span className={`block text-[13px] leading-snug ${fresh ? 'font-semibold text-text-light' : 'text-text-light/85'}`}>{n.title}</span>
                        <span className="block text-[12px] text-text-subtle mt-0.5">{n.detail}</span>
                    </span>
                    <span className="shrink-0 flex items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] text-text-subtle whitespace-nowrap">{ago(n.at, now)}</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${fresh ? 'bg-lilac' : 'bg-transparent'}`} />
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
                                <p className="text-[13px]">No new bookings in the last two weeks.</p>
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
