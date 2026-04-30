// src/components/ui/Toast.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import {
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    variant: ToastVariant;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, variant: ToastVariant, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, variant: ToastVariant, duration: number = 5000) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, variant, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((toast) => toast.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
};

const variantClasses = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200',
};

function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => {
                const Icon = icons[toast.variant];
                return (
                    <div
                        key={toast.id}
                        className={cn(
                            'flex items-center gap-3 rounded-lg border p-4 shadow-lg',
                            variantClasses[toast.variant],
                            'animate-in slide-in-from-right-full fade-in duration-300'
                        )}
                    >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-auto rounded-md p-1 hover:bg-black/10"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export const toast = {
    success: (message: string, duration?: number) => {
        const event = new CustomEvent('toast', { detail: { message, variant: 'success', duration } });
        window.dispatchEvent(event);
    },
    error: (message: string, duration?: number) => {
        const event = new CustomEvent('toast', { detail: { message, variant: 'error', duration } });
        window.dispatchEvent(event);
    },
    warning: (message: string, duration?: number) => {
        const event = new CustomEvent('toast', { detail: { message, variant: 'warning', duration } });
        window.dispatchEvent(event);
    },
    info: (message: string, duration?: number) => {
        const event = new CustomEvent('toast', { detail: { message, variant: 'info', duration } });
        window.dispatchEvent(event);
    },
};

// Глобальный обработчик для тостов без контекста
if (typeof window !== 'undefined') {
    let toastListener: ((event: CustomEvent) => void) | null = null;

    window.addEventListener('toast', ((event: CustomEvent) => {
        const { message, variant, duration } = event.detail;
        const toastEvent = new CustomEvent('add-toast', { detail: { message, variant, duration } });
        window.dispatchEvent(toastEvent);
    }) as EventListener);
}