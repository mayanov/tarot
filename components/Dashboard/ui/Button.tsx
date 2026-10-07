import React from 'react';

// Standard admin button. Kills the ~11 ad-hoc bg-lilac variants that had drifted
// across rounded/size/weight/shadow. Use `variant` + `size`; pass className only for layout.
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANT: Record<Variant, string> = {
    primary: 'bg-lilac text-white hover:bg-lilac/90',
    secondary: 'border border-adm-line-2 text-text-light hover:border-adm-line-3 hover:text-text-light',
    ghost: 'text-text-subtle hover:text-text-light',
    danger: 'bg-coral/15 text-coral-deep border border-coral/40 hover:bg-coral/25',
};
const SIZE: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
}

const Button: React.FC<Props> = ({ variant = 'primary', size = 'md', className = '', children, ...rest }) => (
    <button
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${className}`}
        {...rest}
    >
        {children}
    </button>
);

// Circular icon-only button (the refresh control pattern).
export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...rest }) => (
    <button
        className={`p-2.5 rounded-full border border-adm-line-2 text-text-subtle hover:text-text-light hover:border-adm-line-3 transition-colors focus:outline-none disabled:opacity-50 ${className}`}
        {...rest}
    >
        {children}
    </button>
);

export default Button;
