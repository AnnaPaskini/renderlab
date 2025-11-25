"use client";

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
    variant?: 'primary' | 'secondary' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
    ({
        className,
        children,
        isLoading = false,
        loadingText = 'Loading...',
        variant = 'primary',
        size = 'md',
        disabled,
        ...props
    }, ref) => {

        const sizeClasses = {
            sm: 'py-2 px-4 text-sm',
            md: 'py-3 px-6 text-[15px]',
            lg: 'py-4 px-8 text-lg',
        };

        const variantClasses = {
            primary: 'premium-generate-button',
            secondary: 'premium-secondary-button',
            destructive: 'premium-destructive-button',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'w-full font-semibold rounded-xl transition-all',
                    sizeClasses[size],
                    variantClasses[variant],
                    isLoading && 'loading',
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {loadingText}
                    </span>
                ) : (
                    children
                )}
            </button>
        );
    }
);

PremiumButton.displayName = 'PremiumButton';

export { PremiumButton };
export type { PremiumButtonProps };

