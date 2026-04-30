// src/services/reports.demo.ts

type DemoReport = {
    id: string;
    title: string;
    description: string;
    status: 'approved' | 'pending' | 'rejected';
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
};

export const DEMO_REPORTS: DemoReport[] = [
    {
        id: '1',
        title: 'Отчёт по продажам',
        description: 'Анализ продаж за март 2024 года',
        status: 'approved',
        createdAt: '2024-03-15T10:00:00Z',
        user: {
            id: '1',
            name: 'Иван Иванов',
            email: 'ivan@example.com',
        },
    },
    {
        id: '2',
        title: 'Анализ эффективности',
        description: 'Оценка работы сотрудников',
        status: 'pending',
        createdAt: '2024-03-14T10:00:00Z',
        user: {
            id: '2',
            name: 'Петр Петров',
            email: 'petr@example.com',
        },
    },
    {
        id: '3',
        title: 'Финансовый отчёт',
        description: 'Доходы и расходы за квартал',
        status: 'pending',
        createdAt: '2024-03-13T10:00:00Z',
        user: {
            id: '1',
            name: 'Иван Иванов',
            email: 'ivan@example.com',
        },
    },
    {
        id: '4',
        title: 'Маркетинговое исследование',
        description: 'Анализ рынка и конкурентов',
        status: 'approved',
        createdAt: '2024-03-12T10:00:00Z',
        user: {
            id: '3',
            name: 'Сидор Сидоров',
            email: 'sidor@example.com',
        },
    },
    {
        id: '5',
        title: 'Технический отчёт',
        description: 'Состояние инфраструктуры',
        status: 'rejected',
        createdAt: '2024-03-11T10:00:00Z',
        user: {
            id: '2',
            name: 'Петр Петров',
            email: 'petr@example.com',
        },
    },
];
