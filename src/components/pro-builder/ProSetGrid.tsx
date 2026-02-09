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
    // Casting field to 'any' to allow updating specific union members keys like 'reps' or 'workSec'
    const updateSet = (index: number, field: any, value: any) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: value };
        onChange(newSets);
    };

    const isStrength = cardType === 'strength';

    return (
        <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_40px] gap-2 mb-2 text-[10px] items-center font-bold text-slate-400 uppercase tracking-wider text-center">
                <div>#</div>
                <div>{isStrength ? 'Reps' : 'Trabajo (s)'}</div>
                <div>{isStrength ? 'Carga (kg)' : 'Pausa (s)'}</div>
                <div>{isStrength ? 'RPE / RIR' : 'Ciclos'}</div>
                <div>Tipo</div>
                <div></div>
            </div>

            {/* Sets Rows */}
            <div className="space-y-1">
                {sets.map((set, i) => {
                    const s = set as any; // Cast for easier access to union fields
                    return (
                        <div key={set.id} className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_40px] gap-2 items-center group">
                            {/* Set Number */}
                            <div className="flex items-center justify-center font-mono text-xs font-bold text-slate-400 bg-slate-100 rounded h-8">
                                {i + 1}
                            </div>

                            {/* Column 1: Reps / Work */}
                            <input
                                type="number"
                                className="h-8 bg-slate-50 border border-slate-200 rounded text-center text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                                value={isStrength ? s.reps : s.workSec}
                                onChange={(e) => updateSet(i, isStrength ? 'reps' : 'workSec', Number(e.target.value))}
                                placeholder={isStrength ? "10" : "30s"}
                            />

                            {/* Column 2: Load / Rest */}
                            <input
                                type="number"
                                className="h-8 bg-slate-50 border border-slate-200 rounded text-center text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                                value={isStrength ? s.loadKg : s.restSec}
                                onChange={(e) => updateSet(i, isStrength ? 'loadKg' : 'restSec', Number(e.target.value))}
                                placeholder={isStrength ? "kg" : "10s"}
                            />

                            {/* Column 3: RPE / Cycles */}
                            <input
                                type="text" // Text to allow "2 RIR" or simple numbers
                                className="h-8 bg-slate-50 border border-slate-200 rounded text-center text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                                value={isStrength ? (s.rpeTarget || '') : s.reps}
                                onChange={(e) => updateSet(i, isStrength ? 'rpeTarget' : 'reps', isStrength ? Number(e.target.value) : Number(e.target.value))}
                                placeholder={isStrength ? "RPE" : "Ciclos"}
                            />

                            {/* Column 4: Type Selector */}
                            <select
                                className={cn(
                                    "h-8 border border-slate-200 rounded text-center text-[10px] font-bold uppercase outline-none cursor-pointer",
                                    s.type === 'warmup' ? "bg-yellow-50 text-yellow-700" :
                                        s.type === 'working' ? "bg-white text-slate-700" :
                                            s.type === 'drop' ? "bg-red-50 text-red-700" :
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

                            {/* Delete Action */}
                            <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => removeSet(i)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div className="mt-2 flex justify-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={addSet}
                    className="w-full border border-dashed border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-200 h-8 text-xs gap-1"
                >
                    <Plus className="w-3 h-3" /> Añadir Serie
                </Button>
            </div>
        </div>
    );
}
