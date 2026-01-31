import { useState, useEffect } from 'react';
import { Patient, PrescribedPlan, PlanExercise } from '../../types/patient';
import { Exercise } from '../../types/exercise';
import { ExerciseService } from '../../services/exerciseService';
import { PatientService } from '../../services/patientService';
import { Button } from '../ui/Button';
import { Search, Plus, Save, Calendar, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Timestamp } from 'firebase/firestore';

interface PlanBuilderProps {
    patient: Patient;
    onSave: () => void;
}

const DAYS = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
] as const;

export function PlanBuilder({ patient, onSave }: PlanBuilderProps) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Plan State
    const [plan, setPlan] = useState<PrescribedPlan>({
        startDate: Timestamp.now(),
        schedule: {
            monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
        }
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const exList = await ExerciseService.getAll();
        setExercises(exList);

        if (patient.activePlan) {
            setPlan(patient.activePlan);
        } else if (patient.activeTasks && patient.activeTasks.length > 0) {
            // OPTIONAL: Convert legacy tasks to Monday or daily?
            // For now, start fresh or keep empty
        }
        setLoading(false);
    };

    const handleAddExercise = (dayKey: keyof typeof plan.schedule, exercise: Exercise) => {
        const newItem: PlanExercise = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            exerciseId: exercise.id!,
            name: exercise.name,
            params: exercise.defaultParams ? `${exercise.defaultParams.sets || ''}x${exercise.defaultParams.reps || ''}` : '',
            completed: false
        };

        setPlan(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [dayKey]: [...prev.schedule[dayKey], newItem]
            }
        }));
    };

    const handleRemoveExercise = (dayKey: keyof typeof plan.schedule, instanceId: string) => {
        setPlan(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [dayKey]: prev.schedule[dayKey].filter(i => i.id !== instanceId)
            }
        }));
    };

    const handleUpdateParams = (dayKey: keyof typeof plan.schedule, instanceId: string, newParams: string) => {
        setPlan(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [dayKey]: prev.schedule[dayKey].map(i => i.id === instanceId ? { ...i, params: newParams } : i)
            }
        }));
    };

    const handleSavePlan = async () => {
        setIsSaving(true);
        try {
            await PatientService.update(patient.id!, {
                activePlan: plan
            });
            onSave();
            alert("Plan guardado correctamente");
        } catch (error) {
            console.error(error);
            alert("Error al guardar el plan");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredExercises = exercises.filter(ex =>
        (selectedCategory === 'All' || ex.category === selectedCategory) &&
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = Array.from(new Set(exercises.map(e => e.category)));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
            {/* Left: Exercise Library */}
            <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-brand-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-brand-100 space-y-3">
                    <h3 className="font-bold text-brand-900 flex items-center gap-2">
                        <Search className="w-4 h-4" /> Biblioteca
                    </h3>
                    <input
                        className="w-full text-sm px-3 py-2 bg-brand-50 rounded-lg outline-none"
                        placeholder="Buscar ejercicio..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory('All')}
                            className={cn("px-2 py-1 text-[10px] rounded-full whitespace-nowrap", selectedCategory === 'All' ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600")}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn("px-2 py-1 text-[10px] rounded-full whitespace-nowrap", selectedCategory === cat ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600")}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? <p className="text-center text-xs text-brand-400">Cargando...</p> :
                        filteredExercises.map(ex => (
                            <div key={ex.id} className="p-3 bg-brand-50/50 rounded-lg border border-brand-100 hover:border-brand-300 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-semibold text-brand-800">{ex.name}</p>
                                        <p className="text-[10px] text-brand-500 uppercase">{ex.category}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <div className="relative group/add">
                                            <button className="p-1 bg-brand-100 rounded-full text-brand-600 hover:bg-brand-200">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <div className="absolute right-0 top-6 w-32 bg-white shadow-xl rounded-lg border border-brand-100 p-1 hidden group-hover/add:grid grid-cols-4 gap-1 z-50">
                                                {DAYS.map(d => (
                                                    <button
                                                        key={d.key}
                                                        onClick={() => handleAddExercise(d.key as any, ex)}
                                                        className="aspect-square flex items-center justify-center text-[10px] font-bold bg-brand-50 hover:bg-brand-500 hover:text-white rounded"
                                                        title={`Agregar a ${d.label}`}
                                                    >
                                                        {d.label.substr(0, 1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Right: Weekly Schedule */}
            <div className="lg:col-span-8 flex flex-col overflow-hidden bg-brand-50/30 rounded-xl border border-brand-100">
                <div className="p-4 bg-white border-b border-brand-100 flex justify-between items-center">
                    <h3 className="font-bold text-brand-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5" /> Plan Semanal
                    </h3>
                    <div className="flex gap-2">
                        <Button onClick={handleSavePlan} disabled={isSaving} size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Guardando...' : 'Guardar Plan'}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                    <div className="grid grid-cols-7 gap-3 min-w-[800px] h-full">
                        {DAYS.map(day => (
                            <div key={day.key} className="flex flex-col h-full bg-white rounded-lg border border-brand-200 shadow-sm">
                                <div className="p-2 border-b border-brand-100 bg-brand-50/50 rounded-t-lg text-center">
                                    <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">{day.label}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {plan.schedule[day.key as keyof typeof plan.schedule]?.map((item, idx) => (
                                        <div key={item.id} className="relative p-2 bg-white border border-brand-100 rounded-md shadow-sm group hover:border-brand-300 transition-all">
                                            <p className="text-xs font-medium text-brand-800 leading-tight">{item.name}</p>
                                            <input
                                                className="mt-1 w-full text-[10px] border-b border-dotted border-brand-300 outline-none text-brand-500 bg-transparent"
                                                value={item.params}
                                                onChange={(e) => handleUpdateParams(day.key as any, item.id, e.target.value)}
                                                placeholder="Params..."
                                            />
                                            <button
                                                onClick={() => handleRemoveExercise(day.key as any, item.id)}
                                                className="absolute -top-1 -right-1 p-0.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {plan.schedule[day.key as keyof typeof plan.schedule]?.length === 0 && (
                                        <div className="h-full flex items-center justify-center opacity-30">
                                            <Plus className="w-6 h-6 text-brand-200" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    )
}
