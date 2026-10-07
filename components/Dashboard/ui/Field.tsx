import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

// Shared form-control styling for the admin dashboard. One focus treatment
// (border-lilac, no ring) so inputs/selects stop drifting between files.
const CONTROL = 'rounded-lg border border-adm-line-2 bg-bg-dark text-sm text-text-light focus:border-lilac focus:outline-none';

// Text input with a leading search icon.
export const SearchInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...rest }) => (
    <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
        <input className={`w-full pl-9 pr-3 py-2 ${CONTROL} ${className}`} {...rest} />
    </div>
);

// Styled native select with a chevron. `active` highlights it when a filter is applied.
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    active?: boolean;
}
export const Select: React.FC<SelectProps> = ({ className = '', active = false, children, ...rest }) => (
    <div className="relative">
        <select
            className={`appearance-none pl-3 pr-8 py-2 cursor-pointer ${CONTROL} ${active ? 'border-lilac text-text-light' : ''} ${className}`}
            {...rest}
        >
            {children}
        </select>
        <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" />
    </div>
);

export { CONTROL };
