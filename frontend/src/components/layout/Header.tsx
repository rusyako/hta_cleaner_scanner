import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

export default function Header() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    // Получаем первую букву имени для аватара
    const avatarLetter = user?.full_name?.charAt(0).toUpperCase() || 'U';

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {user?.full_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.role === 'cleaner' ? 'Клинер' : 'Администратор'}
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="hidden sm:flex items-center space-x-3">
                        <div className="h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {avatarLetter}
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user?.full_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user?.role === 'cleaner' ? 'Клинер' : 'Администратор'}
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="flex items-center gap-2 shrink-0"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Выход</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
