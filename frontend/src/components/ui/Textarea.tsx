// src/components/ui/Textarea.tsx
import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, id, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={cn(
                        'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2',
                        'text-gray-900 placeholder:text-gray-400',
                        'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                        'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
                        'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400',
                        'dark:focus:border-primary-500 dark:focus:ring-primary-500',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';