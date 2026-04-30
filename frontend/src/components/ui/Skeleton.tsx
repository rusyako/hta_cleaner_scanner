// src/components/ui/Skeleton.tsx
import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant = 'text', width, height, animation = 'pulse', ...props }, ref) => {
        const variantClasses = {
            text: 'rounded-md',
            circular: 'rounded-full',
            rectangular: 'rounded-lg',
        };

        const animationClasses = {
            pulse: 'animate-pulse',
            wave: 'animate-pulse',
            none: '',
        };

        const style = {
            width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
            height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-gray-200 dark:bg-gray-700',
                    variantClasses[variant],
                    animationClasses[animation],
                    className
                )}
                style={style}
                {...props}
            />
        );
    }
);

Skeleton.displayName = 'Skeleton';

export const SkeletonText = forwardRef<HTMLDivElement, { lines?: number; className?: string }>(
    ({ lines = 3, className }, ref) => {
        return (
            <div ref={ref} className={cn('space-y-2', className)}>
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton key={i} variant="text" className="h-4" />
                ))}
            </div>
        );
    }
);

SkeletonText.displayName = 'SkeletonText';