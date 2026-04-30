import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Пн', отчёты: 4 },
    { name: 'Вт', отчёты: 7 },
    { name: 'Ср', отчёты: 5 },
    { name: 'Чт', отчёты: 9 },
    { name: 'Пт', отчёты: 12 },
    { name: 'Сб', отчёты: 3 },
    { name: 'Вс', отчёты: 2 },
];

export function DailyCleaning() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Статистика отчётов по дням
            </h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="отчёты" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}