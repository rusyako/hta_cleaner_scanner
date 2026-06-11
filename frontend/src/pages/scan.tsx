import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Html5Qrcode } from 'html5-qrcode';
import { MainLayout } from '@/components/layout/MainLayout';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner, toast } from '@/components/ui';
import { QRScanner } from '@/components/QRScanner';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowPathIcon, CheckCircleIcon, PhotoIcon, QrCodeIcon, XMarkIcon } from '@heroicons/react/24/outline';

const checklistOptions = [
    'Полы',
    'Пыль',
    'Зеркала',
    'Санузел',
    'Мебель',
    'Расходники',
];

export default function ScanPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [cabinetNumber, setCabinetNumber] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [photos, setPhotos] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [lastSubmittedCabinet, setLastSubmittedCabinet] = useState('');
    const photoInputRef = useRef<HTMLInputElement>(null);
    const qrPhotoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!user) {
            router.push('/login');
            return;
        }
    }, [router, user, isAuthLoading]);

    useEffect(() => {
        const queryCabinet = router.query.cabinet;
        if (typeof queryCabinet === 'string' && queryCabinet.trim()) {
            setCabinetNumber(queryCabinet);
        }
    }, [router.query.cabinet]);

    const handleScan = (qrCode: string) => {
        const cabinetMatch = qrCode.match(/cabinet=([^&]+)/i);
        setCabinetNumber(cabinetMatch ? decodeURIComponent(cabinetMatch[1]) : qrCode.trim());
        setError('');
    };

    const handleQrPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            setError('');
            toast.success('Фото QR загружено, распознаем код...');
            const scanner = new Html5Qrcode('qr-photo-reader');
            const result = await scanner.scanFile(file, true);
            handleScan(result);
            toast.success('QR код распознан');
        } catch (err) {
            console.error('QR photo scan error:', err);
            setError('QR код не найден на фото. Попробуйте снять ближе и четче.');
        } finally {
            event.target.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!cabinetNumber.trim() || selectedItems.length === 0) {
            setError('Укажите кабинет и выберите хотя бы один пункт уборки');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');
            setSuccess('');
            await apiService.createReport({
                cabinet_number: cabinetNumber,
                checklist: selectedItems.join(', '),
                photos,
            });
            setLastSubmittedCabinet(cabinetNumber);
            setSelectedItems([]);
            setPhotos([]);
            setCabinetNumber('');
            setSuccess(`Отчет по кабинету ${cabinetNumber} отправлен`);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка отправки отчета');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForNextCabinet = () => {
        setCabinetNumber('');
        setSelectedItems([]);
        setPhotos([]);
        setError('');
        setSuccess('');
        setLastSubmittedCabinet('');
        setIsScannerOpen(true);
    };

    const backToCleanerDashboard = () => {
        router.push('/cleaner');
    };

    const toggleChecklistItem = (item: string) => {
        setSelectedItems((prev) =>
            prev.includes(item) ? prev.filter((current) => current !== item) : [...prev, item]
        );
    };

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            return;
        }

        const availableSlots = Math.max(0, 3 - photos.length);
        const selectedFiles = Array.from(files).slice(0, availableSlots);

        if (selectedFiles.length === 0) {
            toast.warning('Можно добавить не более 3 фото');
            event.target.value = '';
            return;
        }

        try {
            const convertedFiles = await Promise.all(
                selectedFiles.map(
                    (file) =>
                        new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(String(reader.result));
                            reader.onerror = () => reject(new Error('Не удалось прочитать фото'));
                            reader.readAsDataURL(file);
                        })
                )
            );

            setPhotos((prev) => [...prev, ...convertedFiles]);
            setError('');
            toast.success(`Фото добавлено: ${convertedFiles.length}`);
        } catch {
            setError('Не удалось обработать фото');
        } finally {
            event.target.value = '';
        }
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    };

    const openPhotoPicker = () => {
        photoInputRef.current?.click();
    };

    const openQrPhotoPicker = () => {
        qrPhotoInputRef.current?.click();
    };

    if (isAuthLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-96">
                    <Spinner size="lg" />
                </div>
            </MainLayout>
        );
    }

    if (success) {
        return (
            <MainLayout>
                <div className="max-w-xl mx-auto">
                    <Card>
                        <CardContent className="space-y-5 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircleIcon className="h-9 w-9" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Отчет отправлен</h1>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">
                                    Кабинет <span className="font-semibold text-gray-900 dark:text-white">{lastSubmittedCabinet}</span> успешно сохранен.
                                </p>
                            </div>

                            <div className="rounded-2xl bg-gray-50 p-4 text-left dark:bg-gray-800/70">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Что дальше?</p>
                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                                    Можно сразу перейти к следующему кабинету или вернуться к списку своих отчетов.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    size="xl"
                                    fullWidth
                                    onClick={resetForNextCabinet}
                                    leftIcon={<ArrowPathIcon className="h-5 w-5" />}
                                >
                                    Следующий кабинет
                                </Button>

                                <Button
                                    size="xl"
                                    fullWidth
                                    variant="outline"
                                    onClick={backToCleanerDashboard}
                                >
                                    Вернуться к моим отчетам
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-5 max-w-2xl mx-auto">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Новая уборка</h1>
                    <p className="text-gray-600 dark:text-gray-400">Отсканируйте QR-код и отметьте выполненные действия</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Шаг 1. QR кабинета</CardTitle>
                        <CardDescription>Отсканируйте код или введите номер кабинета вручную</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button size="xl" fullWidth onClick={() => setIsScannerOpen(true)} leftIcon={<QrCodeIcon className="h-5 w-5" />}>
                            Открыть сканер
                        </Button>

                        <input
                            ref={qrPhotoInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleQrPhotoUpload}
                        />

                        <Button
                            size="xl"
                            fullWidth
                            variant="outline"
                            onClick={openQrPhotoPicker}
                            leftIcon={<PhotoIcon className="h-5 w-5" />}
                        >
                            Сделать фото QR кода
                        </Button>

                        <div id="qr-photo-reader" className="hidden" />

                        <input
                            value={cabinetNumber}
                            onChange={(e) => setCabinetNumber(e.target.value)}
                            placeholder="Или введите номер кабинета вручную"
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />

                        {cabinetNumber && (
                            <div className="rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                Выбран кабинет: <span className="font-semibold">{cabinetNumber}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Шаг 2. Что выполнено</CardTitle>
                        <CardDescription>Выберите выполненные пункты уборки</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {checklistOptions.map((item) => {
                                const selected = selectedItems.includes(item);

                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => toggleChecklistItem(item)}
                                        className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm font-medium transition-colors ${selected ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-200' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                                    >
                                        <span>{item}</span>
                                        {selected && <CheckCircleIcon className="h-5 w-5" />}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Шаг 3. Отправка</CardTitle>
                        <CardDescription>Добавьте фото и отправьте отчет</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Фото уборки
                            </label>
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                multiple
                                className="hidden"
                                onChange={handlePhotoChange}
                            />
                            <Button
                                type="button"
                                fullWidth
                                variant="outline"
                                className="rounded-2xl border-dashed py-4"
                                onClick={openPhotoPicker}
                                leftIcon={<PhotoIcon className="h-5 w-5" />}
                            >
                                Добавить фото
                            </Button>

                            {photos.length > 0 && (
                                <div className="grid grid-cols-3 gap-3">
                                    {photos.map((photo, index) => (
                                        <div key={`${photo.slice(0, 20)}-${index}`} className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                                            <img src={photo} alt={`Фото ${index + 1}`} className="pointer-events-none h-24 w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Кабинет</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{cabinetNumber || 'Не выбран'}</p>
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Выбрано пунктов</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{selectedItems.length}</p>
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Фото</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{photos.length}</p>
                        </div>

                        {error && <Alert variant="error">{error}</Alert>}

                        <div className="flex justify-end">
                            <Button size="xl" fullWidth onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Отправка...' : 'Отправить отчет'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {isScannerOpen && (
                    <QRScanner
                        onScan={handleScan}
                        onClose={() => setIsScannerOpen(false)}
                    />
                )}
            </div>
        </MainLayout>
    );
}
