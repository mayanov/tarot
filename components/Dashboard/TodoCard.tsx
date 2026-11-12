import React from 'react';
import { Check, Mail } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import type { Todo } from './lib/notifications';
import { replyLink } from './lib/reply';
import { colorFor } from './lib/serviceColor';

// One thing to do, as a card: a reading or chat to send (ticked off on its circle, with a
// button to where it's answered), or a session coming up (its day and time). Used by the
// bell's To do and Today's Readings to send, so both read the same.
// how close it is, as a coloured word (no pill)
const TONE: Record<Todo['tone'], string> = { late: 'due-late-text font-semibold', soon: 'due-soon-text font-semibold', calm: 'text-text-subtle' };
const clock = (t: number) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
const dayWord = (t: number, now: number) => {
    const k = (x: number) => new Date(x).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    return k(t) === k(now) ? 'Today' : 'Tmrw';
};

// one row: a tick (a reading) or its time (a session), a dot in the service's colour, what
// to do in bold, a line under it (what it is · how close, coloured when close or late), and
// its buttons under that. Rows sit in a list split by hairlines, like Today.
const TodoCard: React.FC<{
    t: Todo; now: number; done?: boolean; fresh?: boolean;
    onOpen: () => void; onTick: () => void;
    footer?: React.ReactNode; // more buttons under it (Orders: the confirmation)
    badge?: React.ReactNode;  // a label after the line (Orders: Paid)
}> = ({ t, now, done, fresh, onOpen, onTick, footer, badge }) => {
    // the reading is sent once it's paid; before that there's nothing to reply with
    const unpaid = t.b.paymentStatus !== 'paid';
    const reply = t.kind === 'reading' && !unpaid ? replyLink(t.b) : null;
    return (
        <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(); }}
            className={`group flex items-start gap-3 px-2 -mx-2 py-3 rounded-lg cursor-pointer transition-colors hover:bg-adm-hover ${done ? 'opacity-50' : ''}`}>
            {t.kind === 'reading' ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); if (!done) onTick(); }} aria-label={`Mark ${t.b.name || 'it'} done`} title="Mark done (sent)"
                    className={`mt-0.5 shrink-0 h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center transition-colors ${done ? 'bg-sage border-sage text-white' : 'border-adm-line-3 text-transparent hover:border-sage hover:text-sage'}`}>
                    <Check size={13} strokeWidth={3} />
                </button>
            ) : (
                <span className="shrink-0 w-[42px] text-right leading-tight">
                    <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-text-subtle">{dayWord(t.at, now)}</span>
                    <span className="block text-[14px] font-bold tabular-nums text-text-light">{clock(t.at)}</span>
                </span>
            )}
            <span aria-hidden className="mt-[7px] shrink-0 w-2.5 h-2.5 rounded-full" style={{ background: colorFor(t.b.serviceId) }} />
            <span className="min-w-0 flex-1">
                <span className={`block text-[15px] leading-snug font-semibold text-text-light ${done ? 'line-through' : ''}`}>
                    {fresh && !done && <span aria-label="new" className="inline-block align-middle mr-1.5 -mt-0.5 h-2 w-2 rounded-full bg-lilac" />}{t.title}
                </span>
                <span className="block text-[13px] leading-snug text-text-subtle mt-0.5">
                    {t.detail} · <span className={unpaid && t.kind === 'reading' ? 'due-soon-text font-semibold' : TONE[t.tone]}>{done ? 'Done' : t.pill}</span>{badge && !done && <> · {badge}</>}
                </span>
                {!done && (footer || reply) && (
                    <span className="mt-2 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {reply && (
                            <a href={reply.href} target="_blank" rel="noopener noreferrer"
                                title={reply.kind === 'email' ? `Open ${reply.to}'s emails in Gmail` : `Open ${t.b.name || 'their'} WhatsApp chat`}
                                className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${t.tone === 'late' ? 'bg-text-light text-bg-deep hover:opacity-90' : 'border border-adm-line-2 bg-surface-1 text-text-light hover:bg-adm-hover'}`}>
                                {reply.kind === 'email' ? <Mail size={13} /> : <FaWhatsapp size={13} />}
                                {reply.kind === 'email' ? 'Send by email' : 'Reply on WhatsApp'}
                            </a>
                        )}
                        {footer}
                    </span>
                )}
            </span>
        </div>
    );
};

export default TodoCard;
