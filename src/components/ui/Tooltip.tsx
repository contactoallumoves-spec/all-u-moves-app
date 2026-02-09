import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={cn(
                    "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-black/90 rounded shadow-lg whitespace-nowrap bottom-full left-1/2 -translate-x-1/2 mb-2 animate-in fade-in zoom-in-95 duration-200",
                    className
                )}>
                    {content}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90" />
                </div>
            )}
        </div>
    );
}

// Simple Helper for quick usage
export const WithTooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
    <Tooltip content={text}>{children}</Tooltip>
);
