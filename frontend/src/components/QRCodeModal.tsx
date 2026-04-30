// src/components/QRCodeModal.tsx
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Modal, Button } from '@/components/ui';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrCode: string;
    cabinetNumber: string;
    building: string;
}

export function QRCodeModal({ isOpen, onClose, qrCode, cabinetNumber, building }: QRCodeModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dataUrl, setDataUrl] = useState<string>('');

    useEffect(() => {
        if (isOpen && canvasRef.current && qrCode) {
            // Генерируем QR код
            QRCode.toCanvas(canvasRef.current, qrCode, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            }).then(() => {
                // Сохраняем data URL для скачивания
                const url = canvasRef.current?.toDataURL('image/png');
                if (url) setDataUrl(url);
            }).catch(err => {
                console.error('QR generation error:', err);
            });
        }
    }, [isOpen, qrCode]);

    const handleDownload = () => {
        if (dataUrl) {
            const link = document.createElement('a');
            link.download = `QR_${qrCode}.png`;
            link.href = dataUrl;
            link.click();
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                {/* Заголовок */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        QR-код кабинета
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Информация о кабинете */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Номер:</strong> {cabinetNumber}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Корпус:</strong> {building}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>QR-код:</strong> {qrCode}
                    </p>
                </div>

                {/* QR код */}
                <div className="flex justify-center mb-4 p-4 bg-white rounded-lg border-2 border-gray-200 dark:border-gray-600">
                    <canvas ref={canvasRef} />
                </div>

                {/* Кнопки */}
                <div className="flex gap-2">
                    <Button
                        onClick={handleDownload}
                        className="flex-1"
                        disabled={!dataUrl}
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Скачать PNG
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1"
                    >
                        Закрыть
                    </Button>
                </div>

                {/* Подсказка */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                        Распечатайте QR-код и разместите его в кабинете для быстрого сканирования
                    </p>
                </div>
            </div>
        </Modal>
    );
}
