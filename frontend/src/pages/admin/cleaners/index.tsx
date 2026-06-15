import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent, Badge, Spinner, Alert, Button } from '@/components/ui';
import { apiService } from '@/services/api.service';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface CleanerSummary {
    username: string;
    full_name: string;
    total_reports: number;
    today_reports: number;
}

export default function CleanersPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [cleaners, setCleaners] = useState<CleanerSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'admin' && user.role !== 'manager') { router.push('/cleaner'); return; }
        loadCleaners();
    }, [router, user, isAuthLoading]);

    const loadCleaners = async () => {
        try {
            const data = await apiService.getCleaners?.() || [];
            setCleaners(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || isAuthLoading) {
        return <MainLayout><div className="flex items-center justify-center h-96"><Spinner size="lg" /></div></MainLayout>;
    }
    if (error) return <MainLayout><Alert variant="error">{error}</Alert></MainLayout>;

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Клинеры</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Список клинеров и статистика</p>
                </div>
                {cleaners.length === 0 && <Alert variant="info">Нет зарегистрированных клинеров.</Alert>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cleaners.map((c) => (
                        <Link key={c.username} href={`/admin/cleaners/${c.username}`}>
                            <Card className="hover:border-primary-500 cursor-pointer transition-colors">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                                <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <CardTitle>{c.full_name}</CardTitle>
                                                <p className="text-sm text-gray-500">@{c.username}</p>
                                            </div>
                                        </div>
                                        <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-center">
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.today_reports}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Сегодня</p>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-center">
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.total_reports}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Всего</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
