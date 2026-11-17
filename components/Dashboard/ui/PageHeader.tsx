import React from 'react';
import { RefreshCcw, Info } from 'lucide-react';
import { IconButton } from './Button';
import { Tooltip } from './Tooltip';
import { TONE, type Tone } from '../lib/sections';

// Standard page header: the title alone (no line above it), an optional ⓘ beside it with
// the finer print in a tooltip (on hover, focus or a tap), and refresh + extra actions on the right.
interface Props {
    title: string;
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

// (tone is kept for callers; the plum menu already says where a page belongs)
const PageHeader: React.FC<Props> = ({ title, note, onRefresh, refreshing, children }) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                    <h1 className="text-[34px] sm:text-[40px] font-bold tracking-[-0.02em] leading-tight text-text-light">{title}</h1>
                    {note && (
                        <Tooltip text={note} align="start" size="wide" label="More about this page">
                            <span className="p-1 rounded-full text-text-subtle hover:text-text-light transition-colors"><Info size={16} /></span>
                        </Tooltip>
                    )}
                </div>
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
