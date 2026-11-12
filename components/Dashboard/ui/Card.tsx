import React from 'react';

// Standard admin surface — rounded-2xl, hairline border, surface-1 fill.
// Replaces the mix of rounded-xl/2xl + adm-line/adm-line-2 that had crept in.
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...rest }) => (
    <div className={`rounded-2xl bg-surface-1 shadow-[0_1px_2px_rgba(37,27,58,0.04)] ${className}`} {...rest}>
        {children}
    </div>
);

export default Card;
