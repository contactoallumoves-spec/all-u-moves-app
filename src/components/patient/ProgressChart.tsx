
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
            // Check for any metric
            const hasScore = item.raw?.symptomsScore !== undefined;
            const hasOxford = item.raw?.pelvic?.oxford !== undefined || item.raw?.reassessment?.oxford !== undefined;
            const hasSane = item.raw?.proms?.sane !== undefined;
            const psfsList = item.raw?.reassessment?.psfs || item.raw?.proms?.psfs || [];
            const hasPsfs = psfsList.length > 0;

            return hasScore || hasOxford || hasSane || hasPsfs;
        })
        .map(item => {
            let dateObj = new Date();
            if (item.date?.toDate) dateObj = item.date.toDate();
            else if (item.date instanceof Date) dateObj = item.date;

            // Extract & Calculate
            const saneRaw = item.raw?.proms?.sane;
            const sane = saneRaw !== undefined ? saneRaw / 10 : null; // Normalize 0-100 -> 0-10

            const psfsList = item.raw?.reassessment?.psfs || item.raw?.proms?.psfs || [];
            const psfsAvg = psfsList.length > 0
                ? psfsList.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0) / psfsList.length
                : null;

            return {
                date: dateObj,
                dateLabel: format(dateObj, 'd MMM', { locale: es }),
                eva: item.raw?.symptomsScore !== undefined ? Number(item.raw.symptomsScore) : null,
                oxford: item.raw?.pelvic?.oxford || item.raw?.reassessment?.oxford || 0,
                sane, // Normalized
                saneRaw, // Original for tooltip
                psfs: psfsAvg,
                psfsRaw: psfsAvg !== null ? psfsAvg.toFixed(1) : null
            };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // Chronological order

    if (data.length === 0) {
        return <div className="h-40 flex items-center justify-center text-xs text-gray-400">Sin datos suficientes para graficar.</div>;
    }

    return (
        <div className="h-48 w-full mt-2">
            <div className="flex justify-end gap-3 mb-2 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Dolor (EVA)</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> Fuerza (Oxford)</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"></div> SANE (/10)</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> PSFS (Avg)</span>
            </div>
            <ResponsiveContainer width="100%" height="85%">
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
                        <linearGradient id="colorSane" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPsfs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
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
                        formatter={(value: any, name: any, props: any) => {
                            if (name === 'SANE') return `${props.payload.saneRaw}%`;
                            if (name === 'PSFS') return props.payload.psfsRaw;
                            return value;
                        }}
                    />
                    {/* EVA (Pain) Area */}
                    <Area
                        type="monotone"
                        dataKey="eva"
                        name="Dolor"
                        stroke="#f87171"
                        fillOpacity={1}
                        fill="url(#colorEva)"
                        strokeWidth={2}
                        connectNulls
                    />
                    {/* Oxford (Strength) Area */}
                    <Area
                        type="monotone"
                        dataKey="oxford"
                        name="Fuerza"
                        stroke="#818cf8"
                        fillOpacity={1}
                        fill="url(#colorOxford)"
                        strokeWidth={2}
                        connectNulls
                    />
                    {/* SANE Area */}
                    <Area
                        type="monotone"
                        dataKey="sane"
                        name="SANE"
                        stroke="#4ade80"
                        fillOpacity={1}
                        fill="url(#colorSane)"
                        strokeWidth={2}
                        connectNulls
                    />
                    {/* PSFS Area */}
                    <Area
                        type="monotone"
                        dataKey="psfs"
                        name="PSFS"
                        stroke="#fbbf24"
                        fillOpacity={1}
                        fill="url(#colorPsfs)"
                        strokeWidth={2}
                        connectNulls
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
