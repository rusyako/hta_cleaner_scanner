// src/pages/reports/index.tsx
import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Button,
    Input,
    Badge,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableHeader,
    TableCell,
    Pagination,
    Modal,
    Spinner,
    Alert,
} from '@/components/ui';
import { MagnifyingGlassIcon, PhotoIcon, ArrowDownTrayIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiService, Report } from '@/services/api.service';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function ReportsPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [editingReport, setEditingReport] = useState<Report | null>(null);
    const [editChecklist, setEditChecklist] = useState('');
    const itemsPerPage = 10;

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!user) {
            router.push('/login');
            return;
        }

        if (user.role !== 'admin' && user.role !== 'manager') {
            router.push('/cleaner');
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

    const filteredReports = useMemo(() => {
        return reports.filter(report =>
            report.cabinet_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [reports, searchTerm]);

    const paginatedReports = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredReports.slice(start, start + itemsPerPage);
    }, [filteredReports, currentPage]);

    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

    const handleViewReport = (report: Report) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

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
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Отчеты
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Просмотр отчетов клинеров
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { window.open(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/reports/export/csv`, '_blank'); }}>
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />Экспорт CSV
                        </Button>
                        <Button onClick={loadReports}>Обновить</Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <Input
                            placeholder="Поиск по номеру кабинета или роли..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Список отчетов</CardTitle>
                        <CardDescription>
                            Всего отчетов: {filteredReports.length}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Дата и время</TableHeader>
                                    <TableHeader>Роль</TableHeader>
                                    <TableHeader>Кабинет</TableHeader>
                                    <TableHeader>Чек-лист</TableHeader>
                                    <TableHeader>Фото</TableHeader>
                                    <TableHeader>Действия</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedReports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            {new Date(report.timestamp).toLocaleString('ru-RU')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={report.role === 'Клинер' ? 'success' : 'info'}>
                                                {report.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {report.cabinet_number}
                                        </TableCell>
                                        <TableCell>
                                            {report.checklist ? (
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {report.checklist.split(',').length} пунктов
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {report.photos && report.photos.length > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPhoto(report.photos[0])}
                                                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                                >
                                                    <img
                                                        src={report.photos[0]}
                                                        alt={`Фото кабинета ${report.cabinet_number}`}
                                                        className="h-8 w-8 rounded object-cover"
                                                    />
                                                    <Badge variant="primary" size="sm">
                                                        <PhotoIcon className="h-3 w-3 mr-1" />
                                                        {report.photos.length}
                                                    </Badge>
                                                </button>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                            <Button size="sm" variant="outline" onClick={() => handleViewReport(report)}>Просмотр</Button>
                                            {user?.role === 'admin' && (
                                                <>
                                                <Button size="sm" variant="ghost" onClick={() => { setEditingReport(report); setEditChecklist(report.checklist || ''); }}>
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={async () => {
                                                    if (confirm('Удалить отчёт?')) {
                                                        try {
                                                            await apiService.deleteReport(report.id);
                                                            loadReports();
                                                        } catch (err: any) {
                                                            alert(err.response?.data?.detail || 'Ошибка');
                                                        }
                                                    }
                                                }}>
                                                    <TrashIcon className="h-4 w-4 text-red-500" />
                                                </Button>
                                                </>
                                            )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {totalPages > 1 && (
                            <div className="mt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Модальное окно детального просмотра */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Отчет: Кабинет ${selectedReport?.cabinet_number}`}
                size="lg"
            >
                {selectedReport && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Дата и время</p>
                                <p className="font-medium">
                                    {new Date(selectedReport.timestamp).toLocaleString('ru-RU')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Роль</p>
                                <Badge variant={selectedReport.role === 'Клинер' ? 'success' : 'info'}>
                                    {selectedReport.role}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Номер кабинета</p>
                                <p className="font-medium">{selectedReport.cabinet_number}</p>
                            </div>
                        </div>

                        {selectedReport.checklist && (
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Выполненные работы</p>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <ul className="list-disc list-inside space-y-1">
                                        {selectedReport.checklist.split(',').map((item, i) => (
                                            <li key={i} className="text-sm">{item.trim()}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {selectedReport.photos && selectedReport.photos.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Фотографии</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedReport.photos.map((photo, i) => (
                                        <button
                                            key={i} 
                                            type="button"
                                            onClick={() => setSelectedPhoto(photo)}
                                            className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <PhotoIcon className="h-8 w-8 text-gray-400" />
                                            <span className="ml-2 text-sm">Фото {i + 1}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                Закрыть
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={!!selectedPhoto}
                onClose={() => setSelectedPhoto(null)}
                size="full"
                title="Фото отчета"
            >
                {selectedPhoto && (
                    <div className="flex items-center justify-center">
                        <img
                            src={selectedPhoto}
                            alt="Фото отчета"
                            className="max-h-[80vh] w-auto rounded-lg object-contain"
                        />
                    </div>
                )}
            </Modal>
        </MainLayout>
    );
}
