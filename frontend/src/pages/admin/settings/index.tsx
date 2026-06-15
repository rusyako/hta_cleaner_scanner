import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Spinner, Alert, Input } from '@/components/ui';
import { apiService, SettingsData } from '@/services/api.service';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [settings, setSettings] = useState<SettingsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingUser, setSavingUser] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'admin') { router.push('/manager'); return; }
        loadSettings();
    }, [router, user, isAuthLoading]);

    const loadSettings = async () => {
        try {
            const data = await apiService.getSettings();
            setSettings(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка загрузки настроек');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTab = (username: string, tabId: string) => {
        if (!settings) return;
        setSettings((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                users: prev.users.map((u) => {
                    if (u.username !== username) return u;
                    const tabs = u.tabs.includes(tabId)
                        ? u.tabs.filter((t) => t !== tabId)
                        : [...u.tabs, tabId];
                    return { ...u, tabs };
                }),
            };
        });
    };

    const saveTabs = async (username: string) => {
        if (!settings) return;
        const userSettings = settings.users.find((u) => u.username === username);
        if (!userSettings) return;
        try {
            setSavingUser(username);
            await apiService.setUserTabs(username, userSettings.tabs);
            setSavingUser(null);
        } catch (err: any) {
            setSavingUser(null);
            alert(err.response?.data?.detail || 'Ошибка сохранения');
        }
    };

    const roleLabel: Record<string, string> = {
        admin: 'Админ',
        manager: 'Руководитель',
        cleaner: 'Клинер',
    };

    const roleColor: Record<string, any> = {
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки вкладок</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Настройте, какие вкладки видны каждому пользователю</p>
                </div>

                {settings?.users.map((u) => (
                    <Card key={u.username}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CardTitle>{u.full_name}</CardTitle>
                                    <Badge variant={roleColor[u.role] as any}>{roleLabel[u.role] ?? u.role}</Badge>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => saveTabs(u.username)}
                                    disabled={savingUser === u.username}
                                >
                                    {savingUser === u.username ? 'Сохранение...' : 'Сохранить'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                {settings?.available_tabs.filter(t => t.id !== '__divider__').map((tab) => {
                                    const enabled = u.tabs.includes(tab.id);
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => toggleTab(u.username, tab.id)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                                enabled
                                                    ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                                    : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <PasswordChangeCard />

        </MainLayout>
    );
}

function PasswordChangeCard() {
    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [msg, setMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const handleChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oldPw || !newPw) return;
        setSaving(true);
        setMsg('');
        try {
            await apiService.changePassword(oldPw, newPw);
            setMsg('Пароль изменен');
            setOldPw('');
            setNewPw('');
        } catch (err: any) {
            setMsg(err.response?.data?.detail || 'Ошибка');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Смена пароля</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleChange} className="space-y-3 max-w-sm">
                    <Input type="password" placeholder="Текущий пароль" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
                    <Input type="password" placeholder="Новый пароль" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                    {msg && <Alert variant={msg === 'Пароль изменен' ? 'success' : 'error'}>{msg}</Alert>}
                    <Button type="submit" disabled={saving}>{saving ? '...' : 'Сменить пароль'}</Button>
                </form>
            </CardContent>
        </Card>
    );
}
