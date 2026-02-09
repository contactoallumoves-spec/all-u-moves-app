import { ProSectionBlock, ProPlanExercise, StrengthSet } from '../../types/pro-plan';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Trash2, GripVertical, Dumbbell, Flame, Timer, Zap, LayoutTemplate, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { ProExerciseCard } from './ProExerciseCard';

interface SectionBlockProps {
    section: ProSectionBlock;
    index: number;
    onChange: (section: ProSectionBlock) => void;
    onDelete: () => void;
    onAddExerciseRequest?: () => void; // [NEW] Callback to prompt parent to add exercise
}

const BLOCK_ICONS = {
    warmup: Flame,
    strength: Dumbbell,
    power: Zap,
    cardio: Timer,
    other: LayoutTemplate
};

export function SectionBlock({ section, index, onChange, onDelete, onAddExerciseRequest }: SectionBlockProps) {
    const Icon = BLOCK_ICONS[section.type] || LayoutTemplate;
    const [isRenaming, setIsRenaming] = useState(false);

    // Helpers
    const updateExercise = (exIndex: number, updatedEx: ProPlanExercise) => {
        const newExercises = [...section.exercises];
        newExercises[exIndex] = updatedEx;
        onChange({ ...section, exercises: newExercises });
    };

    const removeExercise = (exIndex: number) => {
        const newExercises = section.exercises.filter((_, i) => i !== exIndex);
        onChange({ ...section, exercises: newExercises });
    };

    const handleAddClick = () => {
        if (onAddExerciseRequest) {
            onAddExerciseRequest();
        } else {
            // Fallback for demo/testing if no callback provided
            const newEx: ProPlanExercise = {
                id: crypto.randomUUID(),
                exerciseId: 'placeholder_id',
                cardType: 'strength',
                monitoring: {
                    askRpe: true,
                    askPain: false,
                    askTechniqueVideo: false,
                    askNotes: false
                },
                sets: [
                    { id: crypto.randomUUID(), type: 'working', reps: 10, loadKg: 20, rpeTarget: 8, restSec: 60, completed: false } as StrengthSet
                ]
            };
            onChange({ ...section, exercises: [...section.exercises, newEx] });
        }
    };

    return (
        <Card className="border border-slate-200 shadow-sm bg-white overflow-visible group transition-all hover:shadow-md">
            {/* Block Header */}
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                {/* Drag Handle */}
                <button className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1">
                    <GripVertical className="w-5 h-5" />
                </button>

                {/* Type Icon */}
                <div className={cn(
                    "p-2 rounded-lg flex items-center justify-center",
                    section.type === 'warmup' ? "bg-orange-100 text-orange-600" :
                        section.type === 'strength' ? "bg-blue-100 text-blue-600" :
                            "bg-slate-100 text-slate-600"
                )}>
                    <Icon className="w-4 h-4" />
                </div>

                {/* Editable Title */}
                <div className="flex-1">
                    {isRenaming ? (
                        <input
                            autoFocus
                            className="bg-white border border-brand-300 rounded px-2 py-1 text-sm font-bold text-slate-900 w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                            value={section.name}
                            onChange={(e) => onChange({ ...section, name: e.target.value })}
                            onBlur={() => setIsRenaming(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsRenaming(false)}
                        />
                    ) : (
                        <h3
                            className="text-sm font-bold text-slate-700 cursor-pointer hover:text-brand-600 hover:underline decoration-dashed underline-offset-4"
                            onClick={() => setIsRenaming(true)}
                        >
                            {section.name}
                        </h3>
                    )}
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Bloque {index + 1}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Block Content (Exercises) */}
            <div className="p-4 bg-slate-50 flex flex-col gap-4 min-h-[100px]">
                {section.exercises.length === 0 ? (
                    <div
                        onClick={handleAddClick}
                        className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-white/50 text-slate-400 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600 transition-all cursor-pointer"
                    >
                        <p className="text-xs font-medium">Click para buscar en Biblioteca</p>
                        <p className="text-[10px] opacity-70">o arrastra ejercicios aquí</p>
                        <div className="mt-2 text-brand-600 text-xs font-bold flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Añadir
                        </div>
                    </div>
                ) : (
                    <>
                        {section.exercises.map((ex, i) => (
                            <ProExerciseCard
                                key={ex.id}
                                exercise={ex}
                                onChange={(updated) => updateExercise(i, updated)}
                                onDelete={() => removeExercise(i)}
                            />
                        ))}

                        {/* Quick Add Button at bottom of list */}
                        <Button
                            variant="ghost"
                            onClick={handleAddClick}
                            className="self-center text-xs text-brand-600 hover:bg-brand-50 border border-transparent hover:border-brand-200"
                        >
                            <Plus className="w-3 h-3 mr-1" /> Añadir Ejercicio
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
}
