import React from 'react';
import { RefreshCcw } from 'lucide-react';

// In-content loading state (matches the Manage Users table loader): a spinner that
// sits inside the page's content area while the page chrome stays visible, instead
// of replacing the whole page with a centered loader.
export const InlineLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`p-8 flex justify-center ${className}`}>
        <RefreshCcw className="animate-spin text-lilac" size={24} />
    </div>
);

// Card-wrapped variant for views whose content isn't already inside a card.
export const LoaderCard: React.FC = () => (
    <div className="rounded-2xl bg-surface-1 border border-adm-line">
        <InlineLoader />
    </div>
);

export default InlineLoader;
