// src/components/ui/Alert.tsx
import { ComponentType, SVGProps, forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
}

const variantClasses = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200',
};

const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
};

type AlertIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = 'info', title, description, icon, dismissible, onDismiss, children, ...props }, ref) => {
        const IconComponent = icon ? null : (icons[variant] as AlertIconComponent);

        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-lg border p-4',
                    variantClasses[variant],
                    dismissible && 'pr-12',
                    className
                )}
                {...props}
            >
                <div className="flex">
                    {IconComponent && (
                        <div className="flex-shrink-0">
                            <IconComponent className="h-5 w-5" aria-hidden="true" />
                        </div>
                    )}
                    <div className={cn(IconComponent && 'ml-3', 'flex-1')}>
                        {title && (
                            <h3 className="text-sm font-medium">{title}</h3>
                        )}
                        {(description || children) && (
                            <div className={cn(title && 'mt-2', 'text-sm')}>
                                {description || children}
                            </div>
                        )}
                    </div>
                    {dismissible && (
                        <button
                            onClick={onDismiss}
                            className="absolute right-4 top-4 rounded-md p-1 hover:bg-black/10"
                        >
                            <XCircleIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    }
);

Alert.displayName = 'Alert';
