// src/components/layout/Sidebar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    HomeIcon,
    DocumentTextIcon,
    FolderIcon,
    QrCodeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

const adminNavigation = [
    { name: 'Дашборд', href: '/admin', icon: HomeIcon },
    { name: 'Кабинеты', href: '/cabinets', icon: FolderIcon },
    { name: 'Отчеты', href: '/reports', icon: DocumentTextIcon },
    { name: 'QR-коды', href: '/qr-generator', icon: QrCodeIcon },
];

const cleanerNavigation = [
    { name: 'Мои отчеты', href: '/cleaner', icon: HomeIcon },
    { name: 'Скан QR', href: '/scan', icon: QrCodeIcon },
];

export default function Sidebar() {
    const router = useRouter();
    const { user } = useAuth();
    const navigation = user?.role === 'cleaner' ? cleanerNavigation : adminNavigation;

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
            <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        {user?.role === 'cleaner' ? 'Cleaner Panel' : 'Admin Panel'}
                    </h1>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = router.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                    ${isActive
                                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }
                                `}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
