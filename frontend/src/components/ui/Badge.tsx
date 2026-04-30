// src/components/ui/Badge.tsx
import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    rounded?: boolean;
    dot?: boolean;
}

const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
};

const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', rounded = false, dot = false, children, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center font-medium',
                    variantClasses[variant],
                    sizeClasses[size],
                    rounded ? 'rounded-full' : 'rounded-md',
                    className
                )}
                {...props}
            >
        {dot && (
            <span
                className={cn(
                    'mr-1.5 h-2 w-2 rounded-full',
                    variant === 'default' && 'bg-gray-400',
                    variant === 'primary' && 'bg-primary-400',
                    variant === 'success' && 'bg-green-400',
                    variant === 'warning' && 'bg-yellow-400',
                    variant === 'danger' && 'bg-red-400',
                    variant === 'info' && 'bg-blue-400'
                )}
            />
        )}
                {children}
      </span>
        );
    }
);

Badge.displayName = 'Badge';