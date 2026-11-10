import React, { useState } from 'react';
import { RefreshCcw, Info } from 'lucide-react';
import { IconButton } from './Button';
import { TONE, type Tone } from '../lib/sections';

// Standard page header: serif title over a soft wash in its menu group's colour, a one-line
// purpose, an optional ⓘ with the finer print, refresh + extra actions, and the hairline.
interface Props {
    title: string;
    subtitle?: React.ReactNode; // what the page is for, in one line
    note?: React.ReactNode;     // the finer print, behind the ⓘ
    tone?: Tone;
    onRefresh?: () => void;
    refreshing?: boolean;
    children?: React.ReactNode; // extra actions on the right (before refresh)
}

// two loose, blurred blots of colour behind the title, like a watercolour wash
export const TitleWash: React.FC<{ tone: Tone }> = ({ tone }) => (
    <span aria-hidden className="pointer-events-none absolute -z-10 -top-5 left-0 h-24 w-60 sm:w-72">
        <span className={`absolute inset-0 rounded-[60%_40%_55%_45%] blur-2xl ${TONE[tone].wash}`} />
        <span className={`absolute left-1/3 top-6 h-16 w-36 sm:w-48 rounded-[45%_55%_40%_60%] blur-2xl ${TONE[tone].wash2}`} />
    </span>
);

const PageHeader: React.FC<Props> = ({ title, subtitle, note, tone, onRefresh, refreshing, children }) => {
    const [showNote, setShowNote] = useState(false);
    return (
        <div className="relative isolate pb-4 border-b border-adm-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {tone && <TitleWash tone={tone} />}
            <div className="min-w-0">
                <h1 className="text-2xl font-serif font-bold text-text-light mb-1.5">{title}</h1>
                {subtitle && (
                    <p className="text-text-subtle text-sm flex items-center gap-1.5 flex-wrap">
                        <span>{subtitle}</span>
                        {note && (
                            <button type="button" onClick={() => setShowNote((v) => !v)} aria-expanded={showNote} aria-label="More about this page" title="More about this page"
                                className={`p-0.5 -m-0.5 rounded-full transition-colors ${showNote ? 'text-text-light' : 'text-text-subtle/70 hover:text-text-light'}`}>
                                <Info size={14} />
                            </button>
                        )}
                    </p>
                )}
                {note && showNote && <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-text-subtle">{note}</p>}
            </div>
            {(children || onRefresh) && (
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 whitespace-nowrap">
                    {children}
                    {onRefresh && (
                        <IconButton onClick={onRefresh} title="Refresh" aria-label="Refresh">
                            <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
                        </IconButton>
                    )}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
