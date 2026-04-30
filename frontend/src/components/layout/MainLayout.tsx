import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { MobileNav } from './MobileNav';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6">
                    {children}
                </main>
            </div>
            {user?.role === 'cleaner' && <MobileNav />}
        </div>
    );
}
