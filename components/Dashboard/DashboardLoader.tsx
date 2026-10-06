import React from 'react';

// Shared skeleton loading state for CMS pages — mimics the generic dashboard layout
// (header → KPI row → chart/table blocks) with a subtle pulse while data loads.
const DashboardLoader: React.FC = () => (
    <div className="space-y-5 pt-20 md:pt-8 p-4 md:px-8 animate-pulse" aria-busy="true" aria-label="Loading">
        {/* header */}
        <div className="pb-4 border-b border-adm-line">
            <div className="h-7 w-44 rounded-lg bg-adm-hover" />
            <div className="mt-2.5 h-3.5 w-64 max-w-[70%] rounded bg-adm-hover/70" />
        </div>
        {/* controls row */}
        <div className="flex flex-wrap gap-2">
            <div className="h-9 w-56 rounded-full bg-surface-1 border border-adm-line" />
            <div className="h-9 w-24 rounded-full bg-surface-1 border border-adm-line ml-auto" />
        </div>
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-surface-1 border border-adm-line" />
            ))}
        </div>
        {/* big blocks */}
        <div className="h-64 rounded-2xl bg-surface-1 border border-adm-line" />
        <div className="h-48 rounded-2xl bg-surface-1 border border-adm-line" />
    </div>
);

export default DashboardLoader;
