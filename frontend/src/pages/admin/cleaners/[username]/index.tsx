import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent, Badge, Spinner, Alert, Button } from '@/components/ui';
import { apiService, Report } from '@/services/api.service';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function CleanerDetailPage() {
    const router = useRouter();
    const { username } = router.query;
    const { user, isLoading: isAuthLoading } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthLoading || !username) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'admin' && user.role !== 'manager') { router.push('/cleaner'); return; }
        loadReports();
    }, [router, user, isAuthLoading, username]);

    const loadReports = async () => {
        try {
            const data = await apiService.getReports(undefined, undefined, username as string);
            setReports(data);
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
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push('/admin/cleaners')}>
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Отчёты: {username}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Всего: {reports.length}</p>
                    </div>
                </div>
                {reports.length === 0 && <Alert variant="info">Нет отчётов.</Alert>}
                <div className="space-y-3">
                    {reports.map((r) => (
                        <Card key={r.id}>
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Кабинет {r.cabinet_number}</p>
                                        <p className="text-sm text-gray-500">{new Date(r.timestamp).toLocaleString('ru-RU')}</p>
                                    </div>
                                    <Badge variant="success">Выполнен</Badge>
                                </div>
                                <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                                    <span>{r.checklist ? r.checklist.split(',').length : 0} пунктов</span>
                                    {r.photos.length > 0 && (
                                        <button type="button" onClick={() => setSelectedPhoto(r.photos[0])} className="flex items-center gap-1 text-primary-600">
                                            <PhotoIcon className="h-4 w-4" />{r.photos.length}
                                        </button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
