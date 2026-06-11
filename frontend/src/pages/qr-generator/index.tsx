// src/pages/qr-generator/index.tsx
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Button,
    Input,
    Alert,
    Spinner,
} from '@/components/ui';
import { QrCodeIcon, LinkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { apiService } from '@/services/api.service';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import { useAuth } from '@/contexts/AuthContext';

export default function QRGeneratorPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [cabinetNumber, setCabinetNumber] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

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
    }, [router, user, isAuthLoading]);

    const handleGenerate = async () => {
        if (!cabinetNumber.trim()) {
            setError('Введите номер кабинета');
            return;
        }

        setIsLoading(true);
        setError('');
        setCopySuccess(false);

        try {
            const response = await apiService.generateQRLink(cabinetNumber);
            setGeneratedLink(response.link);

            // Генерируем QR-код
            const qrDataUrl = await QRCode.toDataURL(response.link, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });
            setQrCodeDataUrl(qrDataUrl);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка генерации ссылки');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleDownloadQR = () => {
        const link = document.createElement('a');
        link.download = `qr-cabinet-${cabinetNumber}.png`;
        link.href = qrCodeDataUrl;
        link.click();
    };

    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>QR-код для кабинета ${cabinetNumber}</title>
                        <style>
                            body {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                min-height: 100vh;
                                margin: 0;
                                font-family: Arial, sans-serif;
                            }
                            h1 {
                                margin-bottom: 20px;
                            }
                            img {
                                border: 2px solid #000;
                                padding: 20px;
                            }
                            p {
                                margin-top: 20px;
                                font-size: 14px;
                                color: #666;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Кабинет ${cabinetNumber}</h1>
                        <img src="${qrCodeDataUrl}" alt="QR Code" />
                        <p>Отсканируйте QR-код для заполнения формы</p>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Генератор QR-кодов
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Создание QR-кодов и ссылок с pre-fill для кабинетов
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Создать QR-код</CardTitle>
                        <CardDescription>
                            Введите номер кабинета для генерации уникальной ссылки и QR-кода
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Например: 101"
                                        value={cabinetNumber}
                                        onChange={(e) => setCabinetNumber(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                                        disabled={isLoading}
                                    />
                                </div>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isLoading || !cabinetNumber.trim()}
                                >
                                    {isLoading ? (
                                        <>
                                            <Spinner size="sm" className="mr-2" />
                                            Генерация...
                                        </>
                                    ) : (
                                        <>
                                            <QrCodeIcon className="h-4 w-4 mr-2" />
                                            Сгенерировать
                                        </>
                                    )}
                                </Button>
                            </div>

                            {error && <Alert variant="error">{error}</Alert>}
                        </div>
                    </CardContent>
                </Card>

                {generatedLink && qrCodeDataUrl && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* QR-код */}
                        <Card>
                            <CardHeader>
                                <CardTitle>QR-код</CardTitle>
                                <CardDescription>
                                    Кабинет {cabinetNumber}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                                        <img
                                            src={qrCodeDataUrl}
                                            alt="QR Code"
                                            className="w-64 h-64"
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={handleDownloadQR}
                                        >
                                            Скачать
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={handlePrintQR}
                                        >
                                            Печать
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ссылка */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ссылка с pre-fill</CardTitle>
                                <CardDescription>
                                    Прямая ссылка на форму
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg break-all text-sm">
                                        {generatedLink}
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleCopyLink}
                                    >
                                        {copySuccess ? (
                                            <>
                                                <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                                                Скопировано!
                                            </>
                                        ) : (
                                            <>
                                                <LinkIcon className="h-4 w-4 mr-2" />
                                                Копировать ссылку
                                            </>
                                        )}
                                    </Button>
                                    <Alert variant="info">
                                        <p className="text-sm">
                                            Эта ссылка автоматически подставляет номер кабинета в Google Форму.
                                            Клинеры и гости могут использовать её для быстрого заполнения.
                                        </p>
                                    </Alert>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Инструкция */}
                <Card>
                    <CardHeader>
                        <CardTitle>Как использовать</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>Введите номер кабинета и нажмите &quot;Сгенерировать&quot;</li>
                            <li>Скачайте или распечатайте QR-код</li>
                            <li>Разместите QR-код в кабинете на видном месте</li>
                            <li>Клинеры смогут отсканировать код для быстрого перехода к форме отчета</li>
                            <li>Номер кабинета будет автоматически подставлен в форму</li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
