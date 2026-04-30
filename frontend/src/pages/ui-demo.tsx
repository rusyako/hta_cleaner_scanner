// src/pages/ui-demo.tsx
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
    Button,
    Input,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Modal,
    Dropdown,
    DropdownButton,
    Badge,
    Spinner,
    Alert,
    Skeleton,
    SkeletonText,
    Pagination,
    Tabs,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableHeader,
    TableCell,
    toast,
} from '@/components/ui';

export default function UIDemo() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeAlert, setActiveAlert] = useState<string | null>(null);
    const [isLoadingState, setIsLoadingState] = useState(false);

    // Демо-данные для таблицы
    const demoUsers = [
        { id: 1, name: 'Иван Иванов', email: 'ivan@example.com', role: 'Админ', status: 'active' },
        { id: 2, name: 'Петр Петров', email: 'petr@example.com', role: 'Пользователь', status: 'pending' },
        { id: 3, name: 'Сидор Сидоров', email: 'sidor@example.com', role: 'Модератор', status: 'active' },
        { id: 4, name: 'Анна Аннова', email: 'anna@example.com', role: 'Пользователь', status: 'inactive' },
    ];

    // Демо-данные для пагинации
    const demoItems = Array.from({ length: 45 }, (_, i) => ({
        id: i + 1,
        name: `Элемент ${i + 1}`,
    }));
    const itemsPerPage = 10;
    const paginatedItems = demoItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const totalPages = Math.ceil(demoItems.length / itemsPerPage);

    const handleToastExample = () => {
        toast.success('Успешно! Операция выполнена');
        setTimeout(() => toast.info('Информационное сообщение'), 1000);
        setTimeout(() => toast.warning('Внимание! Проверьте данные'), 2000);
        setTimeout(() => toast.error('Ошибка! Что-то пошло не так'), 3000);
    };

    const handleLoadingDemo = async () => {
        setIsLoadingState(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoadingState(false);
        toast.success('Загрузка завершена');
    };

    const dropdownItems = [
        { label: 'Профиль', value: 'profile', onClick: () => toast.info('Открыт профиль') },
        { label: 'Настройки', value: 'settings', onClick: () => toast.info('Открыты настройки') },
        { label: 'Выйти', value: 'logout', onClick: () => toast.warning('Выход из системы'), danger: true },
    ];

    const tabsData = [
        {
            id: 'tab1',
            label: 'Компоненты',
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Badge variant="primary">Primary Badge</Badge>
                            <Badge variant="success" className="ml-2">Success</Badge>
                            <Badge variant="warning" className="ml-2">Warning</Badge>
                            <Badge variant="danger" className="ml-2">Danger</Badge>
                            <Badge variant="info" className="ml-2">Info</Badge>
                        </div>
                        <div>
                            <Badge variant="primary" dot>С точкой</Badge>
                            <Badge variant="success" rounded className="ml-2">Rounded</Badge>
                            <Badge variant="warning" size="sm" className="ml-2">Small</Badge>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="primary" size="sm">Primary</Button>
                        <Button variant="secondary" size="sm">Secondary</Button>
                        <Button variant="outline" size="sm">Outline</Button>
                        <Button variant="ghost" size="sm">Ghost</Button>
                        <Button variant="danger" size="sm">Danger</Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button isLoading size="sm">Загрузка</Button>
                        <Button leftIcon="🔍" size="sm">Поиск</Button>
                        <Button rightIcon="→" size="sm">Далее</Button>
                    </div>
                </div>
            ),
        },
        {
            id: 'tab2',
            label: 'Формы',
            content: (
                <div className="space-y-4">
                    <Input
                        label="Имя пользователя"
                        placeholder="Введите имя"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        helper="Введите ваше имя"
                    />
                    <Input
                        label="Email"
                        placeholder="user@example.com"
                        error={inputValue ? undefined : "Поле обязательно для заполнения"}
                        leftIcon="📧"
                    />
                    <Input
                        label="Пароль"
                        type="password"
                        placeholder="••••••••"
                        rightIcon="🔒"
                    />
                </div>
            ),
        },
        {
            id: 'tab3',
            label: 'Уведомления',
            content: (
                <div className="space-y-3">
                    {activeAlert && (
                        <Alert
                            variant={activeAlert as any}
                            title="Пример уведомления"
                            description="Это демонстрационное сообщение. Вы можете закрыть его."
                            dismissible
                            onDismiss={() => setActiveAlert(null)}
                        />
                    )}
                    <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => setActiveAlert('success')}>Успех</Button>
                        <Button size="sm" variant="danger" onClick={() => setActiveAlert('error')}>Ошибка</Button>
                        <Button size="sm" variant="warning" onClick={() => setActiveAlert('warning')}>Предупреждение</Button>
                        <Button size="sm" variant="secondary" onClick={() => setActiveAlert('info')}>Информация</Button>
                        <Button size="sm" variant="outline" onClick={handleToastExample}>Toast</Button>
                    </div>
                </div>
            ),
        },
        {
            id: 'tab4',
            label: 'Состояния',
            content: (
                <div className="space-y-4">
                    {isLoadingState ? (
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <SkeletonText lines={3} />
                            <div className="flex justify-center">
                                <Spinner size="lg" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Нажмите кнопку для демонстрации загрузки
                            </p>
                            <Button onClick={handleLoadingDemo} variant="outline">
                                Показать скелетон
                            </Button>
                        </div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Заголовок */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            UI Components Demo
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Демонстрация всех компонентов библиотеки
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Dropdown trigger={<DropdownButton>Меню</DropdownButton>} items={dropdownItems} />
                        <Button onClick={() => setIsModalOpen(true)}>Открыть модальное окно</Button>
                    </div>
                </div>

                {/* Tabs с демо компонентов */}
                <Card variant="bordered">
                    <CardHeader>
                        <CardTitle>Демонстрация компонентов</CardTitle>
                        <CardDescription>
                            Интерактивные примеры использования всех UI компонентов
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs tabs={tabsData} variant="default" />
                    </CardContent>
                </Card>

                {/* Таблица с данными */}
                <Card variant="bordered">
                    <CardHeader>
                        <CardTitle>Пользователи</CardTitle>
                        <CardDescription>Список пользователей с их ролями и статусами</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>ID</TableHeader>
                                    <TableHeader>Имя</TableHeader>
                                    <TableHeader>Email</TableHeader>
                                    <TableHeader>Роль</TableHeader>
                                    <TableHeader>Статус</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {demoUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'Админ' ? 'danger' : user.role === 'Модератор' ? 'warning' : 'default'} size="sm">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'default'} dot>
                                                {user.status === 'active' ? 'Активен' : user.status === 'pending' ? 'На проверке' : 'Неактивен'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Пагинация */}
                <Card>
                    <CardHeader>
                        <CardTitle>Пагинация</CardTitle>
                        <CardDescription>Демонстрация компонента пагинации</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>ID</TableHeader>
                                        <TableHeader>Название</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.id}</TableCell>
                                            <TableCell>{item.name}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                showFirstLast
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Модальное окно */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Модальное окно"
                description="Это пример модального окна с демонстрацией компонентов"
                size="lg"
            >
                <div className="space-y-4">
                    <Alert
                        variant="info"
                        title="Информация"
                        description="Это модальное окно создано с помощью компонента Modal"
                    />
                    <Input
                        label="Ваше имя"
                        placeholder="Введите имя"
                        leftIcon="👤"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={() => {
                            toast.success('Данные сохранены');
                            setIsModalOpen(false);
                        }}>
                            Сохранить
                        </Button>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
}