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
    const [showTypeMenu, setShowTypeMenu] = useState(false);

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

    const CARD_TYPES = [
        { id: 'strength', label: 'Fuerza / Kg', icon: '🏋️' },
        { id: 'timer', label: 'Timer / HIIT', icon: '⏱️' },
        { id: 'pelvic', label: 'Pélvico / Kegel', icon: '🌸' },
        { id: 'breathing', label: 'Respiración', icon: '🌬️' },
        { id: 'cardio', label: 'Cardio', icon: '🏃' }
    ];

    const currentType = CARD_TYPES.find(t => t.id === exercise.cardType) || CARD_TYPES[0];

    return (
        <Card className={cn("border bg-white shadow-sm transition-all overflow-visible", isExpanded ? "border-brand-200 ring-1 ring-brand-100" : "border-slate-200")}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-brand-600 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div>
                        <h4 className="font-bold text-sm text-slate-800">{exercise.name}</h4>
                        {!isExpanded && (
                            <div className="flex gap-2 text-[10px] font-mono text-slate-500 mt-0.5 items-center">
                                <span className="bg-slate-200 px-1.5 py-0.5 rounded-sm">{exercise.sets.length} sets</span>
                                <span className="uppercase text-[9px] border border-slate-200 px-1.5 rounded-sm bg-white">{exercise.cardType}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Collapsed Monitoring Summary */}
                    {!isExpanded && (
                        <div className="flex gap-1.5 mr-2">
                            {exercise.monitoring.askRpe && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded">RPE</span>}
                            {exercise.monitoring.askPain && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded">DOLOR</span>}
                        </div>
                    )}
                    <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Body */}
            {isExpanded && (
                <div className="p-3 animate-in slide-in-from-top-2 duration-200">
                    {/* Toolbar: Card Type & Monitoring */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-2 bg-slate-50/80 rounded-lg border border-slate-100">

                        {/* Type Selector (Custom Dropdown) */}
                        <div className="relative">
                            <button
                                onClick={() => setShowTypeMenu(!showTypeMenu)}
                                onBlur={() => setTimeout(() => setShowTypeMenu(false), 200)}
                                className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1.5 hover:border-brand-300 hover:bg-brand-50 transition-all shadow-sm w-full sm:w-auto justify-between"
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="text-sm">{currentType.icon}</span>
                                    {currentType.label}
                                </span>
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>

                            {/* Dropdown Menu */}
                            {showTypeMenu && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cambiar Modo</div>
                                    {CARD_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors text-left",
                                                exercise.cardType === type.id ? "text-brand-600 bg-brand-50 font-medium" : "text-slate-600"
                                            )}
                                            onClick={() => {
                                                onChange({ ...exercise, cardType: type.id as any });
                                                setShowTypeMenu(false);
                                            }}
                                        >
                                            <span>{type.icon}</span>
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Monitoring Toggles */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            <MonitorToggle
                                active={exercise.monitoring.askRpe}
                                onClick={() => toggleMonitor('askRpe')}
                                icon={Settings}
                                label="RPE"
                                color="text-blue-600 bg-blue-50 border-blue-200 ring-1 ring-blue-100"
                            />
                            <MonitorToggle
                                active={exercise.monitoring.askPain}
                                onClick={() => toggleMonitor('askPain')}
                                icon={Eye}
                                label="Dolor"
                                color="text-red-600 bg-red-50 border-red-200 ring-1 ring-red-100"
                            />
                            <MonitorToggle
                                active={exercise.monitoring.askTechniqueVideo}
                                onClick={() => toggleMonitor('askTechniqueVideo')}
                                icon={Video}
                                label="Video"
                                color="text-purple-600 bg-purple-50 border-purple-200 ring-1 ring-purple-100"
                            />
                            <MonitorToggle
                                active={exercise.monitoring.askNotes}
                                onClick={() => toggleMonitor('askNotes')}
                                icon={MessageSquare}
                                label="Notas"
                                color="text-amber-600 bg-amber-50 border-amber-200 ring-1 ring-amber-100"
                            />
                        </div>
                    </div>

                    {/* The Grid */}
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                        <ProSetGrid
                            cardType={exercise.cardType}
                            sets={exercise.sets}
                            onChange={(newSets) => onChange({ ...exercise, sets: newSets })}
                        />
                    </div>
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
                "flex items-center gap-1.5 px-2 py-1.5 rounded-md border transition-all text-[10px] font-bold uppercase whitespace-nowrap",
                active ? color : "bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
            title={`Solicitar ${label}`}
        >
            <Icon className="w-3 h-3" />
            {label}
        </button>
    );
}
