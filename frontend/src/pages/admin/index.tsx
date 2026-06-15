// src/pages/admin/index.tsx
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Badge,
    Spinner,
    Alert,
    Button,
} from '@/components/ui';
import {
    BuildingOfficeIcon,
    CheckCircleIcon,
    ClockIcon,
    QrCodeIcon,
    ArrowPathIcon,
    PhotoIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { apiService, CabinetStatus, Report, Statistics } from '@/services/api.service';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [stats, setStats] = useState<Statistics | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [cabinets, setCabinets] = useState<CabinetStatus[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!user) {
            router.push('/login');
            return;
        }

        if (user.role !== 'admin') {
            router.push(user.role === 'manager' ? '/manager' : '/cleaner');
            return;
        }

        loadDashboard();
    }, [router, user, isAuthLoading]);

    const loadDashboard = async () => {
        try {
            const [statsData, reportsData, cabinetsData, analyticsData] = await Promise.all([
                apiService.getStatistics(),
                apiService.getReports(),
                apiService.getCabinets(),
                apiService.getAnalytics().catch(() => null),
            ]);
            setStats(statsData);
            setReports(reportsData);
            setCabinets(cabinetsData);
            setAnalytics(analyticsData);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка загрузки статистики');
        } finally {
            setIsLoading(false);
        }
    };

    const recentReports = reports.slice(0, 5);
    const attentionCabinets = cabinets.filter((cabinet) => cabinet.status === 'yellow').slice(0, 5);

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

    const statsCards = [
        {
            title: 'Всего кабинетов',
            value: stats?.total_cabinets || 0,
            icon: BuildingOfficeIcon,
            bgColor: 'bg-blue-100 dark:bg-blue-900',
            iconColor: 'text-blue-600 dark:text-blue-400',
            subtext: 'В системе',
        },
        {
            title: 'Уборок сегодня',
            value: stats?.cleanings_today || 0,
            icon: CheckCircleIcon,
            bgColor: 'bg-green-100 dark:bg-green-900',
            iconColor: 'text-green-600 dark:text-green-400',
            subtext: 'Завершено',
        },
        {
            title: 'Всего отчетов',
            value: stats?.total_reports || 0,
            icon: ClockIcon,
            bgColor: 'bg-purple-100 dark:bg-purple-900',
            iconColor: 'text-purple-600 dark:text-purple-400',
            subtext: 'В базе данных',
        },
    ];

    return (
        <MainLayout>
                <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Панель администратора
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Контроль текущей смены и состояния кабинетов
                        </p>
                    </div>
                    <Button variant="outline" onClick={loadDashboard} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
                        Обновить
                    </Button>
                </div>

                {/* Статистика */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsCards.map((stat, index) => (
                        <Card key={index}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {stat.title}
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                            {stat.value}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            {stat.subtext}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                        <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Быстрые действия */}
                <Card>
                    <CardHeader>
                        <CardTitle>Быстрые действия</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link href="/cabinets">
                                <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors">
                                    <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mb-2" />
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Состояние кабинетов</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Просмотр статусов всех кабинетов
                                    </p>
                                </div>
                            </Link>
                            <Link href="/reports">
                                <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 cursor-pointer transition-colors">
                                    <CheckCircleIcon className="h-8 w-8 text-green-600 mb-2" />
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Отчеты</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Просмотр отчетов и фотографий
                                    </p>
                                </div>
                            </Link>
                            <Link href="/qr-generator">
                                <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-yellow-500 dark:hover:border-yellow-500 cursor-pointer transition-colors">
                                    <QrCodeIcon className="h-8 w-8 text-yellow-600 mb-2" />
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Генератор QR</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Создание QR-кодов для кабинетов
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Последние отчеты</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentReports.length === 0 && (
                                <Alert variant="info">Пока нет отчетов за смену.</Alert>
                            )}

                            {recentReports.map((report) => (
                                <div key={report.id} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">Кабинет {report.cabinet_number}</p>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(report.timestamp).toLocaleString('ru-RU')}
                                            </p>
                                        </div>
                                        <Badge variant="success">{report.role}</Badge>
                                    </div>

                                    <div className="mt-3 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <span>{report.checklist ? report.checklist.split(',').length : 0} пунктов</span>
                                        <span className="flex items-center gap-1">
                                            <PhotoIcon className="h-4 w-4" />
                                            {report.photos.length}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {recentReports.length > 0 && (
                                <div className="pt-2">
                                    <Link href="/reports" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                                        Открыть все отчеты
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Требуют внимания</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {attentionCabinets.length === 0 && (
                                <Alert variant="success">Сейчас все кабинеты в хорошем состоянии.</Alert>
                            )}

                            {attentionCabinets.map((cabinet) => (
                                <div key={cabinet.cabinet_number} className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">Кабинет {cabinet.cabinet_number}</p>
                                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                                Последняя уборка: {cabinet.last_cleaned ? new Date(cabinet.last_cleaned).toLocaleString('ru-RU') : 'нет данных'}
                                            </p>
                                        </div>
                                        <Badge variant="warning">Требует уборки</Badge>
                                    </div>

                                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                                        Ответственный: {cabinet.cleaner_name || 'не назначен'}
                                    </p>
                                </div>
                            ))}

                            {attentionCabinets.length > 0 && (
                                <div className="pt-2">
                                    <Link href="/cabinets" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                                        Открыть все кабинеты
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Топ клинеров сегодня</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {analytics.top_cleaners?.length === 0 && <Alert variant="info">Нет уборок сегодня.</Alert>}
                            {analytics.top_cleaners?.map((c: any, i: number) => (
                                <div key={c.username} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-400 w-6">{i + 1}</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{c.full_name}</span>
                                    </div>
                                    <Badge variant="success">{c.count} уборок</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Состояние кабинетов</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                                    <p className="text-2xl font-bold text-red-600">{analytics.summary?.red ?? 0}</p>
                                    <p className="text-xs text-red-500">Критичные</p>
                                </div>
                                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                                    <p className="text-2xl font-bold text-yellow-600">{analytics.summary?.yellow ?? 0}</p>
                                    <p className="text-xs text-yellow-500">В плане</p>
                                </div>
                                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                                    <p className="text-2xl font-bold text-green-600">{analytics.summary?.green ?? 0}</p>
                                    <p className="text-xs text-green-500">Чистые</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                )}
            </div>
        </MainLayout>
    );
}
