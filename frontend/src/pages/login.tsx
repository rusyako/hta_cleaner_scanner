// src/pages/login.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button, Input, Card, CardContent, Alert } from '@/components/ui';
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login, user, isLoading: isAuthLoading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login({ email: username, password });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Неверные учетные данные');
        } finally {
            setIsLoading(false);
        }
    };

    // Проверяем, авторизован ли пользователь
    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (user) {
            router.push(user.role === 'cleaner' ? '/cleaner' : '/admin');
        }
    }, [router, user, isAuthLoading]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
            <div className="w-full max-w-md">
                {/* Логотип и заголовок */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <span className="text-3xl">🧹</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        HTA Cleaner Scanner
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Система управления уборкой кабинетов
                    </p>
                </div>

                {/* Форма входа */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Логин
                                </label>
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="admin"
                                    icon={<UserIcon className="h-5 w-5" />}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Пароль
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    icon={<LockClosedIcon className="h-5 w-5" />}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <Alert variant="error">
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Вход...' : 'Войти'}
                            </Button>
                        </form>

                        {/* Демо-аккаунты */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Учетные данные по умолчанию:
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    <strong>Администратор:</strong> admin / admin
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    <strong>Клинер:</strong> cleaner / cleaner
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                                Измените пароль в файле .env на сервере
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Футер */}
                <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                    <p>© 2026 HTA Cleaner Scanner. Все права защищены.</p>
                </div>
            </div>
        </div>
    );
}
