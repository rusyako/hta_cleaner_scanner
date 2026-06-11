import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    HomeIcon,
    DocumentTextIcon,
    FolderIcon,
    QrCodeIcon,
    UsersIcon,
    Cog6ToothIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

const iconMap: Record<string, React.ComponentType<any>> = {
    dashboard: HomeIcon,
    cabinets: FolderIcon,
    reports: DocumentTextIcon,
    'qr-generator': QrCodeIcon,
    managers: UserGroupIcon,
    users: UsersIcon,
    settings: Cog6ToothIcon,
    scan: QrCodeIcon,
    'my-reports': HomeIcon,
};

const labelMap: Record<string, string> = {
    dashboard: 'Дашборд',
    cabinets: 'Кабинеты',
    reports: 'Отчеты',
    'qr-generator': 'QR-коды',
    managers: 'Руководители',
    users: 'Пользователи',
    settings: 'Настройки',
    scan: 'Скан QR',
    'my-reports': 'Мои отчеты',
};

const hrefMap: Record<string, string> = {
    dashboard: '/admin',
    cabinets: '/cabinets',
    reports: '/reports',
    'qr-generator': '/qr-generator',
    managers: '/admin/managers',
    users: '/admin/users',
    settings: '/admin/settings',
    scan: '/scan',
    'my-reports': '/cleaner',
};

const roleTitle: Record<string, string> = {
    admin: 'Admin Panel',
    manager: 'Manager Panel',
    cleaner: 'Cleaner Panel',
};

export default function Sidebar() {
    const router = useRouter();
    const { user } = useAuth();
    const tabs = user?.tabs ?? [];

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
            <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        {user ? roleTitle[user.role] ?? 'Panel' : 'Panel'}
                    </h1>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = iconMap[tab] ?? HomeIcon;
                        const label = labelMap[tab] ?? tab;
                        const href = hrefMap[tab] ?? `/${tab}`;
                        const isActive = router.pathname === href;
                        return (
                            <Link
                                key={tab}
                                href={href}
                                className={`
                                    flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                    ${isActive
                                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
