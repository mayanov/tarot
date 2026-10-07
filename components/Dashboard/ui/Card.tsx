import React from 'react';

// Standard admin surface — rounded-2xl, hairline border, surface-1 fill.
// Replaces the mix of rounded-xl/2xl + adm-line/adm-line-2 that had crept in.
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...rest }) => (
    <div className={`rounded-2xl border border-adm-line bg-surface-1 ${className}`} {...rest}>
        {children}
    </div>
);

export default Card;
