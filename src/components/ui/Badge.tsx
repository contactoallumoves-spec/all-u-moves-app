import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant = 'default', ...props }, ref) => {
    const variants = {
        default: "bg-brand-600 text-white hover:bg-brand-700",
        secondary: "bg-brand-100 text-brand-800 hover:bg-brand-200",
        outline: "text-brand-800 border border-brand-200",
        destructive: "bg-red-100 text-red-800 hover:bg-red-200",
        success: "bg-green-100 text-green-800 hover:bg-green-200",
        warning: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    };

    return (
        <div ref={ref} className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)} {...props} />
    );
});
Badge.displayName = "Badge";

export { Badge };
