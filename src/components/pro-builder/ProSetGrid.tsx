import { ProSet, StrengthSet, DurationSet } from '../../types/pro-plan';
import { Button } from '../ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// Helper to get default set based on type
const createDefaultSet = (type: 'strength' | 'pelvic' | 'timer' | 'breathing' | 'cardio'): ProSet => {
    const base = {
        id: crypto.randomUUID(),
        completed: false,
    };

    if (type === 'strength') {
        return { ...base, type: 'working', reps: 10, loadKg: 0, rpeTarget: 8, restSec: 90 } as StrengthSet;
    }
    // Default for duration-based types
    return { ...base, type: 'working', workSec: 30, restSec: 10, reps: 3 } as DurationSet;
};

interface ProSetGridProps {
    cardType: 'strength' | 'pelvic' | 'timer' | 'breathing' | 'cardio';
    sets: ProSet[];
    onChange: (sets: ProSet[]) => void;
}

export function ProSetGrid({ cardType, sets, onChange }: ProSetGridProps) {

    // Add Set
    const addSet = () => {
        const newSet = sets.length > 0
            ? { ...sets[sets.length - 1], id: crypto.randomUUID() } // Clone last
            : createDefaultSet(cardType); // Create fresh
        onChange([...sets, newSet]);
    };

    // Remove Set
    const removeSet = (index: number) => {
        onChange(sets.filter((_, i) => i !== index));
    };

    // Update Field
    const updateSet = (index: number, field: any, value: any) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: value };
        onChange(newSets);
    };

    const isStrength = cardType === 'strength';

    return (
        <div className="w-full bg-white">
            {/* Table Header */}
            <div className="grid grid-cols-[32px_1fr_1fr_1fr_1fr_32px] gap-2 py-2 px-2 bg-slate-50 border-b border-slate-100 text-[10px] items-center font-bold text-slate-400 uppercase tracking-wider text-center">
                <div>#</div>
                <div>{isStrength ? 'Reps' : 'Trabajo'}</div>
                <div>{isStrength ? 'Carga' : 'Pausa'}</div>
                <div>{isStrength ? 'RPE' : 'Ciclos'}</div>
                <div>Tipo</div>
                <div></div>
            </div>

            {/* Sets Rows */}
            <div className="divide-y divide-slate-50">
                {sets.map((set, i) => {
                    const s = set as any;
                    return (
                        <div key={set.id} className="grid grid-cols-[32px_1fr_1fr_1fr_1fr_32px] gap-2 items-center py-2 px-2 group hover:bg-slate-50/50 transition-colors">
                            {/* Set Number */}
                            <div className="flex items-center justify-center font-mono text-xs font-bold text-slate-400 bg-slate-100/50 rounded h-7 w-7 mx-auto">
                                {i + 1}
                            </div>

                            {/* Column 1: Reps / Work */}
                            <input
                                type="number"
                                className="h-8 w-full bg-white border border-slate-200 rounded-md text-center text-sm font-bold text-slate-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
                                value={isStrength ? s.reps : s.workSec}
                                onChange={(e) => updateSet(i, isStrength ? 'reps' : 'workSec', Number(e.target.value))}
                                placeholder={isStrength ? "10" : "30"}
                            />

                            {/* Column 2: Load / Rest */}
                            <input
                                type="number"
                                className="h-8 w-full bg-white border border-slate-200 rounded-md text-center text-sm font-bold text-slate-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
                                value={isStrength ? s.loadKg : s.restSec}
                                onChange={(e) => updateSet(i, isStrength ? 'loadKg' : 'restSec', Number(e.target.value))}
                                placeholder={isStrength ? "kg" : "s"}
                            />

                            {/* Column 3: RPE / Cycles */}
                            <input
                                type="text"
                                className="h-8 w-full bg-white border border-slate-200 rounded-md text-center text-sm font-bold text-slate-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
                                value={isStrength ? (s.rpeTarget || '') : s.reps}
                                onChange={(e) => updateSet(i, isStrength ? 'rpeTarget' : 'reps', isStrength ? Number(e.target.value) : Number(e.target.value))}
                                placeholder={isStrength ? "-" : "1"}
                            />

                            {/* Column 4: Type Selector */}
                            <div className="relative">
                                <select
                                    className={cn(
                                        "h-8 w-full appearance-none pl-2 pr-6 border border-slate-200 rounded-md text-xs font-bold uppercase outline-none cursor-pointer focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all text-center",
                                        s.type === 'warmup' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                            s.type === 'working' ? "bg-white text-slate-700" :
                                                s.type === 'drop' ? "bg-red-50 text-red-700 border-red-200" :
                                                    "bg-slate-50"
                                    )}
                                    value={s.type}
                                    onChange={(e) => updateSet(i, 'type', e.target.value)}
                                >
                                    <option value="working">Work</option>
                                    <option value="warmup">Warm</option>
                                    <option value="failure">Fail</option>
                                    <option value="drop">Drop</option>
                                </select>
                            </div>

                            {/* Delete Action */}
                            <div className="flex justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => removeSet(i)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div className="p-2 bg-slate-50/50 border-t border-slate-100">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={addSet}
                    className="w-full bg-white border border-dashed border-slate-300 text-slate-500 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 h-9 text-xs gap-2 font-medium shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" /> Añadir Serie
                </Button>
            </div>
        </div>
    );
}
