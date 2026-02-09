import { ProPlanExercise } from '../../types/pro-plan';
import { Card } from '../ui/Card';
import { ProSetGrid } from './ProSetGrid';
import { Button } from '../ui/Button';
import { Settings, Video, Eye, MessageSquare, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface ProExerciseCardProps {
    exercise: ProPlanExercise;
    onChange: (ex: ProPlanExercise) => void;
    onDelete: () => void;
    expanded?: boolean;
}

export function ProExerciseCard({ exercise, onChange, onDelete, expanded = true }: ProExerciseCardProps) {
    const [isExpanded, setIsExpanded] = useState(expanded);

    // Monitoring Toggles
    const toggleMonitor = (key: keyof typeof exercise.monitoring) => {
        onChange({
            ...exercise,
            monitoring: {
                ...exercise.monitoring,
                [key]: !exercise.monitoring[key]
            }
        });
    };

    return (
        <Card className={cn("border bg-white shadow-sm transition-all", isExpanded ? "border-brand-200 ring-1 ring-brand-100" : "border-slate-200")}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-brand-600">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div>
                        <h4 className="font-bold text-sm text-slate-800">{exercise.name}</h4>
                        <div className="flex gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                            <span className="bg-slate-200 px-1 rounded">{exercise.sets.length} series</span>
                            <span className="uppercase">{exercise.cardType}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Collapsed Monitoring Summary */}
                    {!isExpanded && (
                        <div className="flex gap-1 mr-2">
                            {exercise.monitoring.askRpe && <span className="w-2 h-2 rounded-full bg-blue-400" title="RPE" />}
                            {exercise.monitoring.askPain && <span className="w-2 h-2 rounded-full bg-red-400" title="Dolor" />}
                        </div>
                    )}
                    <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Body */}
            {isExpanded && (
                <div className="p-3">
                    {/* Toolbar: Card Type & Monitoring */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        {/* Type Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Modo:</span>
                            <select
                                className="bg-white border border-slate-200 text-xs font-medium rounded py-1 px-2 focus:ring-1 focus:ring-brand-500 outline-none"
                                value={exercise.cardType}
                                onChange={(e) => onChange({ ...exercise, cardType: e.target.value as any })}
                            >
                                <option value="strength">🏋️ Fuerza / Kg</option>
                                <option value="timer">⏱️ Timer / HITT</option>
                                <option value="pelvic">🌸 Pélvico / Kegal</option>
                                <option value="breathing">🌬️ Respiración</option>
                                <option value="cardio">🏃 Cardio</option>
                            </select>
                        </div>

                        {/* Monitoring Toggles */}
                        <div className="flex items-center gap-1">
                            <MonitorToggle
                                active={exercise.monitoring.askRpe}
                                onClick={() => toggleMonitor('askRpe')}
                                icon={Settings}
                                label="RPE"
                                color="text-blue-600 bg-blue-50 border-blue-200"
                            />
                            <MonitorToggle
                                active={exercise.monitoring.askPain}
                                onClick={() => toggleMonitor('askPain')}
                                icon={Eye}
                                label="Dolor"
                                color="text-red-600 bg-red-50 border-red-200"
                            />
                            <MonitorToggle
                                active={exercise.monitoring.askTechniqueVideo}
                                onClick={() => toggleMonitor('askTechniqueVideo')}
                                icon={Video}
                                label="Video"
                                color="text-purple-600 bg-purple-50 border-purple-200"
                            />
                            <MonitorToggle
                                active={exercise.monitoring.askNotes}
                                onClick={() => toggleMonitor('askNotes')}
                                icon={MessageSquare}
                                label="Notas"
                                color="text-amber-600 bg-amber-50 border-amber-200"
                            />
                        </div>
                    </div>

                    {/* The Grid */}
                    <ProSetGrid
                        cardType={exercise.cardType}
                        sets={exercise.sets}
                        onChange={(newSets) => onChange({ ...exercise, sets: newSets })}
                    />
                </div>
            )}
        </Card>
    );
}

function MonitorToggle({ active, onClick, icon: Icon, label, color }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded border transition-all text-[10px] font-bold uppercase",
                active ? color : "bg-white border-transparent text-slate-400 hover:bg-slate-100"
            )}
            title={`Solicitar ${label}`}
        >
            <Icon className="w-3 h-3" />
            {active && label}
        </button>
    );
}
