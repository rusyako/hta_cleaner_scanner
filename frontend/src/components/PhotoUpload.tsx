// src/components/PhotoUpload.tsx
import { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface PhotoUploadProps {
    onUpload: (urls: string[]) => void;
    maxFiles?: number;
    existingPhotos?: string[];
}

export function PhotoUpload({ onUpload, maxFiles = 5, existingPhotos = [] }: PhotoUploadProps) {
    const [photos, setPhotos] = useState<string[]>(existingPhotos);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const remainingSlots = maxFiles - photos.length;
        if (remainingSlots <= 0) {
            alert(`Максимум ${maxFiles} фото`);
            return;
        }

        const filesToUpload = Array.from(files).slice(0, remainingSlots);
        setUploading(true);

        try {
            const formData = new FormData();
            filesToUpload.forEach(file => {
                formData.append('files', file);
            });

            const response = await axios.post(
                `${API_BASE_URL}/upload/multiple`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const uploadedUrls = response.data.files.map((f: any) => 
                f.url.startsWith('http') ? f.url : `${API_BASE_URL}${f.url}`
            );
            
            const newPhotos = [...photos, ...uploadedUrls];
            setPhotos(newPhotos);
            onUpload(newPhotos);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Ошибка загрузки фото');
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleRemovePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        onUpload(newPhotos);
    };

    return (
        <div className="space-y-4">
            {/* Превью загруженных фото */}
            {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemovePhoto(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Зона загрузки */}
            {photos.length < maxFiles && (
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Перетащите фото сюда или
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFiles(e.target.files)}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? 'Загрузка...' : 'Выбрать файлы'}
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Максимум {maxFiles} фото, до 5 МБ каждое
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        Загружено: {photos.length} / {maxFiles}
                    </p>
                </div>
            )}
        </div>
    );
}
