// src/pages/cabinets/index.tsx
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
    Card, CardHeader, CardTitle, CardContent,
    Button, Input, Badge, Spinner, Alert, Modal,
} from '@/components/ui';
import {
    PlusIcon, TrashIcon, QrCodeIcon,
} from '@heroicons/react/24/outline';
import { apiService, CabinetStatus } from '@/services/api.service';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const UPLOADS_BASE = API_BASE === '/api' ? '' : API_BASE.replace(/\/api$/, '');

function qrSrc(path: string | null) {
    if (!path) return '';
    if (UPLOADS_BASE) return `${UPLOADS_BASE}${path}`;
    return path;
}

const statusLabels: Record<string, string> = {
    green: 'Чистый',
    yellow: 'В плане',
    red: 'Критично',
};

const statusColors: Record<string, any> = {
    green: 'success',
    yellow: 'warning',
    red: 'error',
};

export default function CabinetsPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [cabinets, setCabinets] = useState<CabinetStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [newCabinet, setNewCabinet] = useState('');
    const [addError, setAddError] = useState('');

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'admin' && user.role !== 'manager') { router.push('/cleaner'); return; }
        load();
    }, [router, user, isAuthLoading]);

    const load = async () => {
        try {
            const d = await apiService.getCabinets();
            setCabinets(d);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newCabinet.trim()) return;
        setAddError('');
        try {
            await apiService.createCabinet(newCabinet.trim());
            await apiService.generateCabinetQr(newCabinet.trim());
            setNewCabinet('');
            setShowAdd(false);
            await load();
        } catch (err: any) {
            setAddError(err.response?.data?.detail || 'Ошибка');
        }
    };

    const handleQr = async (cabinetNumber: string) => {
        try {
            await apiService.generateCabinetQr(cabinetNumber);
            await load();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Ошибка');
        }
    };

    const handleDelete = async (cabinetNumber: string) => {
        if (!confirm(`Удалить кабинет ${cabinetNumber}?`)) return;
        try {
            await apiService.deleteCabinet(cabinetNumber);
            await load();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Ошибка');
        }
    };

    if (isLoading || isAuthLoading) {
        return <MainLayout><div className="flex items-center justify-center h-64"><Spinner size="lg" /></div></MainLayout>;
    }
    if (error) return <MainLayout><Alert variant="error">{error}</Alert></MainLayout>;

    const canEdit = user?.role === 'admin' || user?.role === 'manager';

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Кабинеты</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">QR-коды и статусы кабинетов</p>
                    </div>
                    {canEdit && (
                        <Button onClick={() => setShowAdd(true)} leftIcon={<PlusIcon className="h-4 w-4" />}>
                            Добавить кабинет
                        </Button>
                    )}
                </div>

                {cabinets.length === 0 && (
                    <Alert variant="info">Нет кабинетов. Добавьте первый кабинет.</Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cabinets.map((cab) => (
                        <Card key={cab.cabinet_number}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            Каб. {cab.cabinet_number}
                                        </span>
                                        <Badge variant={statusColors[cab.status]}>
                                            {statusLabels[cab.status]}
                                        </Badge>
                                    </div>
                                    {canEdit && (
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(cab.cabinet_number)}>
                                            <TrashIcon className="h-4 w-4 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm">
                                        <p className="text-gray-500 dark:text-gray-400">Последняя уборка</p>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {cab.last_cleaned ? new Date(cab.last_cleaned).toLocaleString('ru-RU') : 'Нет'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Клинер: {cab.cleaner_name || '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t dark:border-gray-700 pt-3">
                                    {cab.qr_code ? (
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={qrSrc(cab.qr_code)}
                                                alt={`QR ${cab.cabinet_number}`}
                                                className="w-20 h-20 rounded-lg border dark:border-gray-600"
                                            />
                                            <div className="flex flex-col gap-1.5 text-xs">
                                                <a
                                                    href={qrSrc(cab.qr_code)}
                                                    download
                                                    className="text-primary-600 hover:underline font-medium"
                                                >
                                                    Скачать
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(qrSrc(cab.qr_code), '_blank')}
                                                    className="text-gray-600 hover:underline text-left"
                                                >
                                                    Распечатать
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-gray-400 hover:underline text-left"
                                                    onClick={() => handleQr(cab.cabinet_number)}
                                                >
                                                    Перегенерировать
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleQr(cab.cabinet_number)}
                                            leftIcon={<QrCodeIcon className="h-4 w-4" />}
                                        >
                                            Сгенерировать QR
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setAddError(''); }} title="Добавить кабинет + QR-код" size="sm">
                    <div className="space-y-4">
                        <Input
                            value={newCabinet}
                            onChange={(e) => setNewCabinet(e.target.value)}
                            placeholder="Номер кабинета, например 101"
                        />
                        {addError && <Alert variant="error">{addError}</Alert>}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setShowAdd(false); setAddError(''); }}>Отмена</Button>
                            <Button onClick={handleAdd}>Добавить</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </MainLayout>
    );
}
