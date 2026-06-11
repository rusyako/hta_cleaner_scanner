// src/pages/cabinets/index.tsx
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
    Spinner,
    Alert,
} from '@/components/ui';
import {
    MagnifyingGlassIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { apiService, CabinetStatus } from '@/services/api.service';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

const statusLabels = {
    green: 'Чистый',
    yellow: 'Требует уборки',
};

const statusColors = {
    green: 'success',
    yellow: 'warning',
} as const;

function CabinetsPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [cabinets, setCabinets] = useState<CabinetStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
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

        loadCabinets();
    }, [router, user, isAuthLoading]);

    const loadCabinets = async () => {
        try {
            const data = await apiService.getCabinets();
            setCabinets(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка загрузки кабинетов');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCabinets = useMemo(() => {
        return cabinets.filter(cabinet =>
            cabinet.cabinet_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [cabinets, searchTerm]);

    const paginatedCabinets = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredCabinets.slice(start, start + itemsPerPage);
    }, [filteredCabinets, currentPage]);

    const totalPages = Math.ceil(filteredCabinets.length / itemsPerPage);

    if (isLoading || isAuthLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
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
                            Состояние кабинетов
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Мониторинг статусов всех кабинетов
                        </p>
                    </div>
                    <Button onClick={loadCabinets}>
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Обновить
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Список кабинетов</CardTitle>
                                <CardDescription>
                                    Всего кабинетов: {filteredCabinets.length}
                                </CardDescription>
                            </div>
                            <div className="w-64">
                                <Input
                                    placeholder="Поиск по номеру..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Номер кабинета</TableHeader>
                                    <TableHeader>Статус</TableHeader>
                                    <TableHeader>Последняя уборка</TableHeader>
                                    <TableHeader>Клинер</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedCabinets.map((cabinet) => (
                                    <TableRow key={cabinet.cabinet_number}>
                                        <TableCell className="font-medium">
                                            {cabinet.cabinet_number}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusColors[cabinet.status]}>
                                                {statusLabels[cabinet.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {cabinet.last_cleaned 
                                                ? new Date(cabinet.last_cleaned).toLocaleString('ru-RU')
                                                : 'Никогда'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {cabinet.cleaner_name || '-'}
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
        </MainLayout>
    );
}

export default CabinetsPage;
