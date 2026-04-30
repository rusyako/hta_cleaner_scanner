// src/components/QRScanner.tsx
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface QRScannerProps {
    onScan: (qrCode: string) => void;
    onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string>('');
    const [cameraAvailable, setCameraAvailable] = useState(true);
    const [processing, setProcessing] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isStoppingRef = useRef(false);
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const stopScannerSafely = async () => {
        if (!scannerRef.current || isStoppingRef.current) {
            return;
        }

        isStoppingRef.current = true;

        try {
            await scannerRef.current.stop();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes('scanner is not running or paused')) {
                console.error(err);
            }
        } finally {
            scannerRef.current = null;
            isStoppingRef.current = false;
            setScanning(false);
            setProcessing(false);
        }
    };

    useEffect(() => {
        // На мобильных без HTTPS сразу показываем предупреждение
        if (isMobile && !isHttps) {
            setError('Для доступа к камере требуется HTTPS. Используйте загрузку QR фото на основной странице.');
            setCameraAvailable(false);
        }
        
        return () => {
            // Очистка при размонтировании
            void stopScannerSafely();
        };
    }, [isMobile, isHttps]);

    const startScanning = async () => {
        try {
            setError('');
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' }, // Задняя камера
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // QR код успешно отсканирован
                    setProcessing(true);
                    stopScannerSafely().then(() => {
                        onScan(decodedText);
                        onClose();
                    });
                },
                (errorMessage) => {
                    // Ошибка сканирования (игнорируем, это нормально)
                }
            );

            setScanning(true);
        } catch (err: any) {
            console.error('Camera error:', err);
            const isHttps = window.location.protocol === 'https:';
            const errorMsg = !isHttps 
                ? 'Для доступа к камере требуется HTTPS. Используйте загрузку QR фото на основной странице.'
                : 'Не удалось получить доступ к камере. Попробуйте загрузить изображение.';
            setError(errorMsg);
            setCameraAvailable(false);
        }
    };

    const stopScanning = () => {
        void stopScannerSafely();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
                {/* Заголовок */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Сканировать QR код
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Область сканирования */}
                <div className="mb-4">
                    <div 
                        id="qr-reader" 
                        className="w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
                        style={{ minHeight: scanning ? '300px' : '0' }}
                    />
                </div>

                {/* Ошибка */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Индикатор обработки */}
                {processing && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Сканирование QR кода...</p>
                        </div>
                    </div>
                )}

                {/* Кнопки */}
                <div className="space-y-3">
                    {!scanning && cameraAvailable && !processing && (
                        <Button
                            onClick={startScanning}
                            className="w-full"
                        >
                            <CameraIcon className="h-5 w-5 mr-2" />
                            Включить камеру
                        </Button>
                    )}

                    {scanning && (
                        <Button
                            onClick={stopScanning}
                            variant="outline"
                            className="w-full"
                        >
                            Остановить сканирование
                        </Button>
                    )}

                    {!processing && (
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="w-full"
                        >
                            Отмена
                        </Button>
                    )}
                </div>

                {/* Подсказка */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                        {!isHttps && isMobile ? (
                            <>🔒 Для прямого доступа к камере нужен HTTPS. Используйте загрузку QR фото на основной странице.</>
                        ) : (
                            <>💡 Наведите камеру на QR код</>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
