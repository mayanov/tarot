import React from 'react';
import { Check, Mail } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import type { Todo } from './lib/notifications';
import { replyLink } from './lib/reply';

// One thing to do, as a card: a reading or chat to send (ticked off on its circle, with a
// button to where it's answered), or a session coming up (its day and time). Used by the
// bell's To do and Today's Readings to send, so both read the same.
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

const TodoCard: React.FC<{
    t: Todo; now: number; done?: boolean; fresh?: boolean;
    onOpen: () => void; onTick: () => void;
}> = ({ t, now, done, fresh, onOpen, onTick }) => {
    const reply = t.kind === 'reading' ? replyLink(t.b) : null;
    return (
        <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(); }}
            className={`group relative flex items-start gap-3 pl-3.5 pr-3 py-3 rounded-xl bg-surface-1 border border-adm-line shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer transition-all hover:border-adm-line-2 hover:shadow-md ${done ? 'opacity-50' : ''}`}>
            <span aria-hidden className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${EDGE[t.tone]}`} />
            {t.kind === 'reading' ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); if (!done) onTick(); }} aria-label={`Mark ${t.b.name || 'it'} done`} title="Mark done (sent)"
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
                <span className="flex items-end justify-between gap-2 mt-1">
                    <span className="text-[12.5px] text-text-subtle leading-snug">{t.detail}</span>
                    {reply && !done && (
                        <a href={reply.href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            title={reply.kind === 'email' ? `Open ${reply.to}'s emails in Gmail` : `Open ${t.b.name || 'their'} WhatsApp chat`}
                            className="shrink-0 -mb-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-adm-line-2 text-[11.5px] font-medium text-text-light hover:bg-adm-hover-2 transition-colors">
                            {reply.kind === 'email' ? <Mail size={12} className="text-lilac" /> : <FaWhatsapp size={12} className="text-[#25D366]" />}
                            {reply.kind === 'email' ? 'Email' : 'WhatsApp'}
                        </a>
                    )}
                </span>
            </span>
            {fresh && !done && <span aria-label="new" className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-coral-deep ring-2 ring-surface-1" />}
        </div>
    );
};

export default TodoCard;
