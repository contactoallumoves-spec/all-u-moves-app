
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProgressChartProps {
    history: any[];
}

export function ProgressChart({ history }: ProgressChartProps) {
    // 1. Filter sessions/evals that have chartable data
    const data = history
        .filter(item => {
            // Must have a date
            if (!item.date) return false;
            // Must have either symptomsScore (Session) OR oxford (Eval/Session)
            const hasScore = item.raw?.symptomsScore !== undefined;
            const hasOxford = item.raw?.pelvic?.oxford !== undefined || item.raw?.reassessment?.oxford !== undefined;
            return hasScore || hasOxford;
        })
        .map(item => {
            let dateObj = new Date();
            if (item.date?.toDate) dateObj = item.date.toDate();
            else if (item.date instanceof Date) dateObj = item.date;

            return {
                date: dateObj,
                dateLabel: format(dateObj, 'd MMM', { locale: es }),
                eva: item.raw?.symptomsScore || 0,
                oxford: item.raw?.pelvic?.oxford || item.raw?.reassessment?.oxford || 0
            };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // Chronological order

    if (data.length === 0) {
        return <div className="h-40 flex items-center justify-center text-xs text-gray-400">Sin datos suficientes para graficar.</div>;
    }

    return (
        <div className="h-40 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorEva" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f87171" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOxford" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, 10]}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                    />
                    {/* EVA (Pain) Area */}
                    <Area
                        type="monotone"
                        dataKey="eva"
                        name="Dolor (EVA)"
                        stroke="#f87171"
                        fillOpacity={1}
                        fill="url(#colorEva)"
                        strokeWidth={2}
                    />
                    {/* Oxford (Strength) Area */}
                    <Area
                        type="monotone"
                        dataKey="oxford"
                        name="Fuerza (Oxford)"
                        stroke="#818cf8"
                        fillOpacity={1}
                        fill="url(#colorOxford)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
