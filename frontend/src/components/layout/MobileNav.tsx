import Link from 'next/link';
import { useRouter } from 'next/router';
import { HomeIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';

const iconMap: Record<string, React.ComponentType<any>> = {
    scan: QrCodeIcon,
    'my-reports': HomeIcon,
};

const labelMap: Record<string, string> = {
    scan: 'Скан QR',
    'my-reports': 'Мои отчеты',
};

const hrefMap: Record<string, string> = {
    scan: '/scan',
    'my-reports': '/cleaner',
};

export function MobileNav() {
    const router = useRouter();
    const { user } = useAuth();

    if (!user || (user.role !== 'cleaner' && user.role !== 'manager')) {
        return null;
    }

    const cleanerTabs = ['my-reports', 'scan'];

    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 lg:hidden">
            <div className="grid grid-cols-2 gap-1 px-3 py-2">
                {cleanerTabs.map((tab) => {
                    const Icon = iconMap[tab] ?? HomeIcon;
                    const label = labelMap[tab] ?? tab;
                    const href = hrefMap[tab] ?? `/${tab}`;
                    const isActive = router.pathname === href;

                    return (
                        <Link
                            key={tab}
                            href={href}
                            className={cn(
                                'flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                                isActive
                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                            )}
                        >
                            <Icon className="mb-1 h-5 w-5" />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
