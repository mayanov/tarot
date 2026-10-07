import React from 'react';
import { RefreshCcw } from 'lucide-react';
import { IconButton } from './Button';

// Standard page header: serif title, subtitle, optional refresh + extra actions,
// with the hairline divider. Codifies the dominant `text-2xl font-serif font-bold` h1.
interface Props {
    title: string;
    subtitle?: React.ReactNode;
    onRefresh?: () => void;
    refreshing?: boolean;
    children?: React.ReactNode; // extra actions on the right (before refresh)
}

const PageHeader: React.FC<Props> = ({ title, subtitle, onRefresh, refreshing, children }) => (
    <div className="pb-4 border-b border-adm-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-serif font-bold text-text-light mb-2">{title}</h1>
            {subtitle && <p className="text-text-subtle text-sm">{subtitle}</p>}
        </div>
        {(children || onRefresh) && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
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

export default PageHeader;
