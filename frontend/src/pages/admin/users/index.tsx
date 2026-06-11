import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
    Card, CardHeader, CardTitle, CardContent, Button, Input,
    Badge, Spinner, Alert, Modal,
} from '@/components/ui';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiService, UserInfo } from '@/services/api.service';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('cleaner');
    const [newFullName, setNewFullName] = useState('');
    const [newManagerId, setNewManagerId] = useState('');
    const [formError, setFormError] = useState('');
    const [deletingUser, setDeletingUser] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'admin') { router.push('/manager'); return; }
        loadUsers();
    }, [router, user, isAuthLoading]);

    const loadUsers = async () => {
        try {
            const data = await apiService.getUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка загрузки пользователей');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim() || !newPassword.trim() || !newFullName.trim()) {
            setFormError('Заполните все поля');
            return;
        }
        try {
            setFormError('');
            await apiService.createUser({
                username: newUsername,
                password: newPassword,
                role: newRole,
                full_name: newFullName,
                manager_id: newManagerId || undefined,
            });
            setNewUsername('');
            setNewPassword('');
            setNewFullName('');
            setNewManagerId('');
            setShowForm(false);
            await loadUsers();
        } catch (err: any) {
            setFormError(err.response?.data?.detail || 'Ошибка создания');
        }
    };

    const handleDelete = async (username: string) => {
        if (!confirm(`Удалить пользователя ${username}?`)) return;
        try {
            setDeletingUser(username);
            await apiService.deleteUser(username);
            await loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Ошибка удаления');
        } finally {
            setDeletingUser(null);
        }
    };

    const roleLabel: Record<string, string> = {
        admin: 'Админ',
        manager: 'Руководитель',
        cleaner: 'Клинер',
    };

    const roleColor: Record<string, string> = {
        admin: 'error',
        manager: 'warning',
        cleaner: 'success',
    };

    if (isLoading || isAuthLoading) {
        return <MainLayout><div className="flex items-center justify-center h-96"><Spinner size="lg" /></div></MainLayout>;
    }

    if (error) {
        return <MainLayout><Alert variant="error">{error}</Alert></MainLayout>;
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Пользователи</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Управление пользователями системы</p>
                    </div>
                    <Button onClick={() => setShowForm(true)} leftIcon={<PlusIcon className="h-4 w-4" />}>
                        Добавить
                    </Button>
                </div>

                <Card>
                    <CardHeader><CardTitle>Список пользователей ({users.length})</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3">Логин</th>
                                        <th className="px-4 py-3">Имя</th>
                                        <th className="px-4 py-3">Роль</th>
                                        <th className="px-4 py-3">Руководитель ID</th>
                                        <th className="px-4 py-3">Вкладки</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.username} className="border-b dark:border-gray-700">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.username}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.full_name}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={(roleColor[u.role] ?? 'info') as any}>{roleLabel[u.role] ?? u.role}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.manager_id ?? '-'}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{u.tabs.join(', ')}</td>
                                            <td className="px-4 py-3">
                                                {u.username !== 'admin' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(u.username)}
                                                        disabled={deletingUser === u.username}
                                                    >
                                                        <TrashIcon className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Modal isOpen={showForm} onClose={() => { setShowForm(false); setFormError(''); }} title="Добавить пользователя" size="md">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Логин</label>
                            <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="cleaner2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
                            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Полное имя</label>
                            <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="Иван Петров" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Роль</label>
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                            >
                                <option value="admin">Админ</option>
                                <option value="manager">Руководитель</option>
                                <option value="cleaner">Клинер</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID руководителя (опционально)</label>
                            <Input value={newManagerId} onChange={(e) => setNewManagerId(e.target.value)} placeholder="mgr_1" />
                        </div>
                        {formError && <Alert variant="error">{formError}</Alert>}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => { setShowForm(false); setFormError(''); }}>Отмена</Button>
                            <Button type="submit">Создать</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </MainLayout>
    );
}
