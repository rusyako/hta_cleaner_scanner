import { useEffect, useState, useCallback } from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { Button } from '@/components/ui';
import { DevicePhoneMobileIcon, XMarkIcon } from '@heroicons/react/24/outline';
import '@/styles/globals.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
        },
    },
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function registerServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register(`${basePath}/sw.js`, { scope: `${basePath || '/'}` })
                .then((registration) => {
                    console.log('SW registered:', registration.scope);
                })
                .catch((err) => {
                    console.log('SW registration failed:', err);
                });
        });
    }
}

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function PwaInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        const installedHandler = () => {
            setShowBanner(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', installedHandler);

        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowBanner(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            toast.success('Приложение устанавливается...');
        }
        setDeferredPrompt(null);
        setShowBanner(false);
    }, [deferredPrompt]);

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl bg-white p-4 shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 max-w-md mx-auto">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
                    <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">Установить приложение</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Добавьте на главный экран для быстрого доступа</p>
                    <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={handleInstall}>
                            Установить
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowBanner(false)}
                            leftIcon={<XMarkIcon className="h-4 w-4" />}
                        >
                            Закрыть
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function App({ Component, pageProps }: AppProps) {
    useEffect(() => {
        registerServiceWorker();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <ToastProvider>
                        <Component {...pageProps} />
                        <Toaster position="top-right" richColors />
                        <PwaInstallBanner />
                    </ToastProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
