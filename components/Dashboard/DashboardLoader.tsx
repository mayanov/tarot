import React from 'react';

// Simple animated loading state for CMS pages — a centered spinner while data loads.
// Layout-agnostic (each page has its own UI), so it just fills the content area.
const DashboardLoader: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
    <div
        className="flex flex-col items-center justify-center gap-4 min-h-[70vh] pt-20 md:pt-8 p-4 text-text-subtle"
        aria-busy="true"
        aria-label={label}
    >
        <span className="w-9 h-9 rounded-full border-[3px] border-adm-line-2 border-t-lilac animate-spin" />
        <p className="text-sm tracking-wide">{label}</p>
    </div>
);

export default DashboardLoader;
