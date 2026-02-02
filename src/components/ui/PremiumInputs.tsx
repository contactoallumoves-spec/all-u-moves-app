import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

// --- RPE Selector (Effort) ---
interface RPESelectorProps {
    value: number;
    onChange: (val: number) => void;
}

const RPE_LABELS: Record<number, { label: string; color: string }> = {
    0: { label: "Descanso", color: "bg-blue-100 text-blue-800" },
    1: { label: "Muy Suave", color: "bg-blue-200 text-blue-900" },
    2: { label: "Suave", color: "bg-green-100 text-green-800" },
    3: { label: "Moderado", color: "bg-green-200 text-green-900" },
    4: { label: "Algo Duro", color: "bg-yellow-100 text-yellow-800" },
    5: { label: "Duro", color: "bg-yellow-200 text-yellow-900" },
    6: { label: "Muy Duro", color: "bg-orange-100 text-orange-800" },
    7: { label: "Intenso", color: "bg-orange-200 text-orange-900" },
    8: { label: "Muy Intenso", color: "bg-red-100 text-red-800" },
    9: { label: "Casi Máximo", color: "bg-red-200 text-red-900" },
    10: { label: "Máximo (Fallo)", color: "bg-red-600 text-white" },
};

export function RPESelector({ value, onChange }: RPESelectorProps) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold uppercase text-zinc-400">Nivel de Esfuerzo (RPE)</span>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded shadow-sm", RPE_LABELS[value]?.color)}>
                    {value} - {RPE_LABELS[value]?.label}
                </span>
            </div>

            <div className="relative h-12 flex items-center bg-zinc-800 rounded-xl px-2">
                {/* Track */}
                <div className="absolute left-3 right-3 h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-brand-500"
                        initial={false}
                        animate={{ width: `${value * 10}%` }}
                    />
                </div>

                {/* Ticks (Invisible touch targets) */}
                <div className="relative w-full flex justify-between z-10">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                        <button
                            key={v}
                            onClick={() => onChange(v)}
                            className="w-8 h-8 -ml-2 rounded-full flex items-center justify-center focus:outline-none group"
                        >
                            <motion.div
                                className={cn(
                                    "rounded-full transition-colors font-bold text-[10px]",
                                    value === v ? "w-6 h-6 bg-white text-black shadow-lg scale-125" : "w-2 h-2 bg-zinc-500 group-hover:bg-zinc-400 group-hover:scale-150 text-transparent"
                                )}
                                animate={{ scale: value === v ? 1.2 : 1 }}
                            >
                                {value === v && v}
                            </motion.div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- Pain Selector (VAS) ---
interface PainSelectorProps {
    value: number;
    onChange: (val: number) => void;
}

export function PainSelector({ value, onChange }: PainSelectorProps) { // Renamed from RPESelector (copy-paste error fix proactively)
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold uppercase text-zinc-400">Nivel de Dolor (EVA)</span>
                <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded shadow-sm",
                    value === 0 ? "bg-green-100 text-green-800" :
                        value < 4 ? "bg-yellow-100 text-yellow-800" :
                            value < 7 ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"
                )}>
                    {value === 0 ? "Sin Dolor" : `${value}/10`}
                </span>
            </div>

            <div className="relative h-12 flex items-center bg-zinc-800 rounded-xl px-2 border border-zinc-700/50">
                {/* Gradient Track */}
                <div className="absolute left-3 right-3 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 rounded-full opacity-30" />
                <div className="absolute left-3 right-3 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 rounded-full opacity-100 clip-path-inset" style={{ clipPath: `inset(0 ${100 - value * 10}% 0 0)` }} />

                {/* Ticks */}
                <div className="relative w-full flex justify-between z-10">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                        <button
                            key={v}
                            onClick={() => onChange(v)}
                            className="w-8 h-8 -ml-2 rounded-full flex items-center justify-center focus:outline-none group"
                        >
                            <div
                                className={cn(
                                    "rounded-full transition-all duration-300",
                                    value === v
                                        ? "w-6 h-6 bg-white shadow-lg border-2 border-zinc-700 flex items-center justify-center text-[10px] font-bold text-black"
                                        : "w-1.5 h-1.5 bg-zinc-600 group-hover:w-3 group-hover:h-3 group-hover:bg-zinc-500"
                                )}
                            >
                                {value === v && v}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
