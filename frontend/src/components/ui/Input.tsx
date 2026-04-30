// src/components/ui/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helper?: string;
    icon?: React.ReactNode;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helper, icon, leftIcon, rightIcon, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
        const resolvedLeftIcon = leftIcon ?? icon;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {resolvedLeftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{resolvedLeftIcon}</span>
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2',
                            'text-gray-900 placeholder:text-gray-400',
                            'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                            'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
                            'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400',
                            'dark:focus:border-primary-500 dark:focus:ring-primary-500',
                            resolvedLeftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                            className
                        )}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{rightIcon}</span>
                        </div>
                    )}
                </div>
                {error && (
                    <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}
                {helper && !error && (
                    <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {helper}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
