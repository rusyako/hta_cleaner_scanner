import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CleaningChartProps {
    data?: Array<{ date: string; отчёты: number; активные: number }>;
}

const defaultData = [
    { date: '01.03', отчёты: 2, активные: 1 },
    { date: '02.03', отчёты: 5, активные: 3 },
    { date: '03.03', отчёты: 8, активные: 6 },
    { date: '04.03', отчёты: 12, активные: 9 },
    { date: '05.03', отчёты: 9, активные: 7 },
    { date: '06.03', отчёты: 4, активные: 4 },
    { date: '07.03', отчёты: 6, активные: 5 },
];

export function CleaningChart({ data = defaultData }: CleaningChartProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Динамика отчётов
            </h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="отчёты" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="активные" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}