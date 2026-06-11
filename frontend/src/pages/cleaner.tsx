import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/components/layout/MainLayout';
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Modal, Spinner } from '@/components/ui';
import { apiService, Report } from '@/services/api.service';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarDaysIcon, ClockIcon, PhotoIcon, QrCodeIcon } from '@heroicons/react/24/outline';

type ReportFilter = 'today' | 'all';

export default function CleanerPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<ReportFilter>('today');

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!user) {
            router.push('/login');
            return;
        }

        if (user.role !== 'cleaner') {
            router.push(user.role === 'manager' ? '/manager' : '/admin');
            return;
        }

        loadReports();
    }, [router, user, isAuthLoading]);

    const loadReports = async () => {
        try {
            const data = await apiService.getReports();
            setReports(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка загрузки отчетов');
        } finally {
            setIsLoading(false);
        }
    };

    const todayReports = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return reports.filter((report) => report.timestamp.startsWith(today));
    }, [reports]);

    const visibleReports = useMemo(() => {
        return activeFilter === 'today' ? todayReports : reports;
    }, [activeFilter, todayReports, reports]);

    if (isLoading || isAuthLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-96">
                    <Spinner size="lg" />
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <Alert variant="error">{error}</Alert>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-5 max-w-2xl mx-auto">
                <div className="space-y-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Моя смена</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Сканируйте QR и отправляйте отчеты по уборке</p>
                    </div>
                    <Button size="xl" fullWidth onClick={() => router.push('/scan')} leftIcon={<QrCodeIcon className="h-5 w-5" />}>
                        Сканировать QR код
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Card>
                        <CardContent>
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Сегодня</p>
                            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{todayReports.length}</div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Отчетов</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Всего</p>
                            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{reports.length}</div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Отчетов</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle>История</CardTitle>
                            <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setActiveFilter('today')}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeFilter === 'today' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-300'}`}
                                >
                                    Сегодня
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveFilter('all')}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-300'}`}
                                >
                                    Все
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <CalendarDaysIcon className="h-4 w-4" />
                            {activeFilter === 'today'
                                ? `За сегодня: ${todayReports.length}`
                                : `Всего отчетов: ${reports.length}`}
                        </div>

                        {visibleReports.length === 0 && (
                            <Alert variant="info">Пока нет отчетов. Начните со сканирования QR-кода.</Alert>
                        )}

                        {visibleReports.map((report) => (
                            <div key={report.id} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">Кабинет {report.cabinet_number}</p>
                                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <ClockIcon className="h-4 w-4" />
                                            {new Date(report.timestamp).toLocaleString('ru-RU')}
                                        </div>
                                    </div>
                                    <Badge variant="success">Отправлен</Badge>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/70">
                                        <p className="text-gray-500 dark:text-gray-400">Чек-лист</p>
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{report.checklist ? report.checklist.split(',').length : 0} пунктов</p>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/70">
                                        <p className="text-gray-500 dark:text-gray-400">Фото</p>
                                        {report.photos.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPhoto(report.photos[0])}
                                                className="mt-1 flex items-center gap-2 text-left font-medium text-gray-900 dark:text-white"
                                            >
                                                <img
                                                    src={report.photos[0]}
                                                    alt={`Фото кабинета ${report.cabinet_number}`}
                                                    className="h-8 w-8 rounded-lg object-cover"
                                                />
                                                <span className="flex items-center gap-1">
                                                    <PhotoIcon className="h-4 w-4" />
                                                    {report.photos.length}
                                                </span>
                                            </button>
                                        ) : (
                                            <p className="mt-1 flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                                                <PhotoIcon className="h-4 w-4" />
                                                0
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Modal
                    isOpen={!!selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                    size="full"
                    title="Фото уборки"
                >
                    {selectedPhoto && (
                        <div className="flex items-center justify-center">
                            <img
                                src={selectedPhoto}
                                alt="Фото уборки"
                                className="max-h-[80vh] w-auto rounded-lg object-contain"
                            />
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
}
