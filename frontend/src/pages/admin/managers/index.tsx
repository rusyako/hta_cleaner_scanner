import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent, Badge, Spinner, Alert } from '@/components/ui';
import { apiService, ManagerInfo } from '@/services/api.service';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { UserGroupIcon } from '@heroicons/react/24/outline';

export default function ManagersPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [managers, setManagers] = useState<ManagerInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'admin' && user.role !== 'manager') { router.push('/cleaner'); return; }
        loadManagers();
    }, [router, user, isAuthLoading]);

    const loadManagers = async () => {
        try {
            const data = await apiService.getManagers();
            setManagers(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка загрузки руководителей');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || isAuthLoading) {
        return <MainLayout><div className="flex items-center justify-center h-96"><Spinner size="lg" /></div></MainLayout>;
    }

    if (error) {
        return <MainLayout><Alert variant="error">{error}</Alert></MainLayout>;
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Руководители</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Список руководителей системы</p>
                </div>

                {managers.length === 0 && (
                    <Alert variant="info">Нет зарегистрированных руководителей.</Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {managers.map((m) => (
                        <Card key={m.username}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                                        <UserGroupIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <CardTitle>{m.full_name}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Логин:</span>
                                        <span className="text-gray-900 dark:text-white font-medium">{m.username}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">ID:</span>
                                        <span className="text-gray-900 dark:text-white font-medium">{m.manager_id ?? '-'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
