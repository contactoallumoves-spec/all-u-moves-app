
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

interface ProgressChartProps {
    history: any[];
    className?: string;
}

export function ProgressChart({ history, className }: ProgressChartProps) {
    const [visible, setVisible] = useState({
        eva: true,
        oxford: true,
        endurance: true,
        repetitions: true,
        fast: true,
        sane: true,
        psfs: true,
        iciq: true,
        udi6: true
    });

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
            const hasPerfect = item.raw?.perfectScheme !== undefined;
            const isQuestionnaire = item.type === 'questionnaire';

            return hasScore || hasOxford || hasSane || hasPsfs || hasPerfect || isQuestionnaire;
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

            // Questionnaire Logic
            let iciqRaw = null;
            let udi6Raw = null;

            if (item.type === 'questionnaire') {
                if (item.questionnaire?.type === 'iciq-sf') {
                    iciqRaw = item.questionnaire.score;
                } else if (item.questionnaire?.type === 'udi-6') {
                    udi6Raw = item.questionnaire.score;
                }
            }

            return {
                date: dateObj,
                dateLabel: format(dateObj, 'd MMM', { locale: es }),
                eva: item.raw?.symptomsScore !== undefined ? Number(item.raw.symptomsScore) : null,
                oxford: item.raw?.pelvic?.oxford || item.raw?.reassessment?.oxford || item.raw?.perfectScheme?.power || 0,
                endurance: item.raw?.perfectScheme?.endurance || 0,
                repetitions: item.raw?.perfectScheme?.repetitions || 0,
                fast: item.raw?.perfectScheme?.fast || 0,
                sane, // Normalized
                saneRaw, // Original for tooltip
                psfs: psfsAvg,
                psfsRaw: psfsAvg !== null ? psfsAvg.toFixed(1) : null,
                iciq: iciqRaw !== null ? (iciqRaw / 2.1) : null, // Normalize 0-21 -> 0-10
                iciqRaw,
                udi6: udi6Raw !== null ? (udi6Raw / 10) : null, // Normalize 0-100 -> 0-10
                udi6Raw
            };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // Chronological order

    if (data.length === 0) {
        return <div className="h-40 flex items-center justify-center text-xs text-gray-400">Sin datos suficientes para graficar.</div>;
    }

    const toggle = (key: keyof typeof visible) => setVisible(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className={`w-full mt-2 ${className || 'h-56'}`}>

            {/* Interactive Legend */}
            <div className="flex flex-wrap justify-end gap-2 mb-4">
                <button onClick={() => toggle('eva')} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border transition-all ${visible.eva ? 'bg-red-50 border-red-200 text-red-700' : 'bg-transparent border-transparent text-gray-300 opacity-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-red-400 shadow-sm"></div> Dolor (EVA)
                </button>
                <button onClick={() => toggle('oxford')} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border transition-all ${visible.oxford ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-transparent border-transparent text-gray-300 opacity-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm"></div> P (Oxford)
                </button>
                <button onClick={() => toggle('iciq')} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border transition-all ${visible.iciq ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-transparent border-transparent text-gray-300 opacity-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-teal-400 shadow-sm"></div> ICIQ-SF
                </button>
                <button onClick={() => toggle('udi6')} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border transition-all ${visible.udi6 ? 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700' : 'bg-transparent border-transparent text-gray-300 opacity-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-sm"></div> UDI-6
                </button>
                <button onClick={() => toggle('endurance')} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border transition-all ${visible.endurance ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-transparent border-transparent text-gray-300 opacity-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm"></div> E (Resist.)
                </button>
                <button onClick={() => toggle('repetitions')} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border transition-all ${visible.repetitions ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-transparent border-transparent text-gray-300 opacity-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-sm"></div> R (Reps)
                </button>
                <button onClick={() => toggle('fast')} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border transition-all ${visible.fast ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-transparent border-transparent text-gray-300 opacity-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-pink-400 shadow-sm"></div> F (Rápidas)
                </button>
                <button onClick={() => toggle('sane')} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border transition-all ${visible.sane ? 'bg-green-50 border-green-200 text-green-700' : 'bg-transparent border-transparent text-gray-300 opacity-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm"></div> SANE
                </button>
                <button onClick={() => toggle('psfs')} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border transition-all ${visible.psfs ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-transparent border-transparent text-gray-300 opacity-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-orange-400 shadow-sm"></div> PSFS
                </button>
            </div>

            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorEva" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f87171" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOxford" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSane" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPsfs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorEndurance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRepetitions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorFast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f472b6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorIciq" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorUdi6" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e879f9" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#e879f9" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis
                        domain={[0, 10]}
                        tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                        formatter={(value: any, name: any, props: any) => {
                            if (name === 'SANE' && visible.sane) return [`${props.payload.saneRaw}%`, name];
                            if (name === 'PSFS' && visible.psfs) return [props.payload.psfsRaw, name];
                            if (name === 'ICIQ-SF' && visible.iciq) return [`${props.payload.iciqRaw}/21`, name];
                            if (name === 'UDI-6' && visible.udi6) return [`${props.payload.udi6Raw}/100`, name];
                            return [value, name];
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
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                        hide={!visible.eva}
                    />
                    {/* ICIQ Area */}
                    <Area
                        type="monotone"
                        dataKey="iciq"
                        name="ICIQ-SF"
                        stroke="#2dd4bf"
                        fillOpacity={1}
                        fill="url(#colorIciq)"
                        strokeWidth={2}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                        hide={!visible.iciq}
                    />
                    {/* UDI-6 Area */}
                    <Area
                        type="monotone"
                        dataKey="udi6"
                        name="UDI-6"
                        stroke="#e879f9"
                        fillOpacity={1}
                        fill="url(#colorUdi6)"
                        strokeWidth={2}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                        hide={!visible.udi6}
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
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                        hide={!visible.oxford}
                    />
                    {/* Endurance Area */}
                    <Area
                        type="monotone"
                        dataKey="endurance"
                        name="Resistencia"
                        stroke="#22d3ee"
                        fillOpacity={1}
                        fill="url(#colorEndurance)"
                        strokeWidth={2}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                        hide={!visible.endurance}
                    />
                    {/* Repetitions Area */}
                    <Area
                        type="monotone"
                        dataKey="repetitions"
                        name="Repeticiones"
                        stroke="#c084fc"
                        fillOpacity={1}
                        fill="url(#colorRepetitions)"
                        strokeWidth={2}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                        hide={!visible.repetitions}
                    />
                    {/* Fast Area */}
                    <Area
                        type="monotone"
                        dataKey="fast"
                        name="Rápidas"
                        stroke="#f472b6"
                        fillOpacity={1}
                        fill="url(#colorFast)"
                        strokeWidth={2}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                        hide={!visible.fast}
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
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                        hide={!visible.sane}
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
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                        hide={!visible.psfs}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
