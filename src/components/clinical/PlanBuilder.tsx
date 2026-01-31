import { useState, useEffect } from 'react';
import { Patient, PrescribedPlan, PlanExercise } from '../../types/patient';
import { Exercise } from '../../types/exercise';
import { ExerciseService } from '../../services/exerciseService';
import { PatientService } from '../../services/patientService';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog'; // [NEW]
import { Search, Plus, Save, Calendar, Link as LinkIcon, Copy } from 'lucide-react';
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
    const [magicLink, setMagicLink] = useState<string | null>(null);

    useEffect(() => {
        if (patient.magicLinkToken) {
            // Reconstruct link if token exists
            const baseUrl = window.location.origin;
            setMagicLink(`${baseUrl}/portal/${patient.magicLinkToken}`);
        }
    }, [patient.magicLinkToken]);

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
        const defaultSets = exercise.defaultParams?.sets || '3';
        const defaultReps = exercise.defaultParams?.reps || '10';

        const newItem: PlanExercise = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            exerciseId: exercise.id!,
            name: exercise.name,
            // Initialize with structured details
            details: {
                sets: defaultSets,
                reps: defaultReps,
                load: '',
                rpe: '',
                rest: '',
                tempo: '',
                side: 'bilateral'
            },
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

    // Update specific field in details
    const handleUpdateDetail = (dayKey: keyof typeof plan.schedule, instanceId: string, field: string, value: any) => {
        setPlan(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [dayKey]: prev.schedule[dayKey].map(i =>
                    i.id === instanceId ? { ...i, details: { ...i.details, [field]: value } } : i
                )
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

    const handleGenerateMockLink = async () => {
        try {
            const token = await PatientService.generateMagicToken(patient.id!);
            const baseUrl = window.location.origin;
            const fullLink = `${baseUrl}/portal/${token}`;
            setMagicLink(fullLink);
            await navigator.clipboard.writeText(fullLink);
            alert("Enlace mágico copiado al portapapeles: " + fullLink);
        } catch (error) {
            console.error("Error generating token", error);
            alert("Error al generar el enlace");
        }
    };

    // Modal State
    const [editingItem, setEditingItem] = useState<{ day: keyof typeof plan.schedule, instanceId: string } | null>(null);
    const [editForm, setEditForm] = useState<any>(null);

    const handleEditClick = (dayKey: keyof typeof plan.schedule, item: PlanExercise) => {
        setEditingItem({ day: dayKey, instanceId: item.id });
        // Deep copy details to avoid direct mutation
        setEditForm({
            sets: item.details?.sets || '',
            reps: item.details?.reps || '',
            load: item.details?.load || '',
            rpe: item.details?.rpe || '',
            rest: item.details?.rest || '',
            tempo: item.details?.tempo || '',
            holdTime: item.details?.holdTime || '',
            unilateral: item.details?.unilateral || false,
            side: item.details?.side || 'bilateral',
            notes: item.details?.notes || ''
        });
    };

    const handleSaveEdit = () => {
        if (!editingItem || !editForm) return;

        setPlan(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [editingItem.day]: prev.schedule[editingItem.day].map(i =>
                    i.id === editingItem.instanceId ? { ...i, details: { ...editForm } } : i
                )
            }
        }));
        setEditingItem(null);
        setEditForm(null);
    };

    // Helper to get exercise name for modal title
    const getEditingExerciseName = () => {
        if (!editingItem) return '';
        const dayList = plan.schedule[editingItem.day];
        const item = dayList.find(i => i.id === editingItem.instanceId);
        return item ? item.name : '';
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
                        className="w-full text-sm px-3 py-2 bg-brand-50 rounded-lg outline-none focus:ring-2 focus:ring-brand-200"
                        placeholder="Buscar ejercicio..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory('All')}
                            className={cn("px-2 py-1 text-[10px] rounded-full whitespace-nowrap transition-colors", selectedCategory === 'All' ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600 hover:bg-brand-100")}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn("px-2 py-1 text-[10px] rounded-full whitespace-nowrap transition-colors", selectedCategory === cat ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600 hover:bg-brand-100")}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loading ? <p className="text-center text-xs text-brand-400">Cargando...</p> :
                        filteredExercises.map(ex => (
                            <div key={ex.id} className="p-3 bg-brand-50/50 rounded-lg border border-brand-100 hover:border-brand-300 transition-all hover:shadow-md group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-semibold text-brand-800">{ex.name}</p>
                                        <p className="text-[10px] text-brand-500 uppercase tracking-wide">{ex.category}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="relative group/add">
                                            <button className="p-1.5 bg-brand-100 rounded-full text-brand-600 hover:bg-brand-600 hover:text-white transition-colors">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <div className="absolute right-0 top-8 w-34 bg-white shadow-xl rounded-lg border border-brand-100 p-1.5 hidden group-hover/add:grid grid-cols-4 gap-1 z-50">
                                                {DAYS.map(d => (
                                                    <button
                                                        key={d.key}
                                                        onClick={() => handleAddExercise(d.key as any, ex)}
                                                        className="aspect-square flex items-center justify-center text-[10px] font-bold bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white rounded transition-colors"
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
                <div className="p-4 bg-white border-b border-brand-100 flex justify-between items-center shadow-sm z-10">
                    <h3 className="font-bold text-brand-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-brand-600" /> Plan Semanal
                    </h3>
                    <div className="flex gap-2">
                        <Button onClick={handleSavePlan} disabled={isSaving} size="sm" className="bg-brand-700 hover:bg-brand-800 text-white shadow-brand-200/50 shadow-lg">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Guardando...' : 'Guardar Plan'}
                        </Button>
                        <Button onClick={handleGenerateMockLink} variant="outline" size="sm" title="Generar/Copiar Enlace para Paciente" className="border-brand-200 text-brand-700 hover:bg-brand-50">
                            {magicLink ? <Copy className="w-4 h-4 mr-2" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                            {magicLink ? "Copiar Link" : "Generar Link"}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-gray-50/50">
                    <div className="grid grid-cols-7 gap-4 min-w-[1000px] h-full">
                        {/* Improved min-width for comfort */}
                        {DAYS.map(day => (
                            <div key={day.key} className="flex flex-col h-full bg-white rounded-xl border border-brand-100/50 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-3 border-b border-brand-50 bg-brand-50/30 rounded-t-xl text-center">
                                    <span className="text-xs font-bold text-brand-800 uppercase tracking-widest">{day.label}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                    {plan.schedule[day.key as keyof typeof plan.schedule]?.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleEditClick(day.key as any, item)}
                                            className="relative p-3 bg-white border border-brand-100 rounded-lg shadow-sm hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs font-bold text-brand-900 leading-tight line-clamp-2">{item.name}</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveExercise(day.key as any, item.id);
                                                    }}
                                                    className="p-0.5 text-zinc-300 hover:text-red-500 transition-colors"
                                                >
                                                    <XIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Summary Badges */}
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {item.details?.sets && item.details?.reps && (
                                                    <span className="px-1.5 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-medium rounded border border-brand-100">
                                                        {item.details.sets}x{item.details.reps}
                                                    </span>
                                                )}
                                                {item.details?.load && (
                                                    <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-medium rounded border border-orange-100">
                                                        {item.details.load}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Hover Edit Hint */}
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg" />
                                        </div>
                                    ))}
                                    {plan.schedule[day.key as keyof typeof plan.schedule]?.length === 0 && (
                                        <div className="h-full flex items-center justify-center opacity-40">
                                            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
                                                <Plus className="w-4 h-4 text-brand-300" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Editing Modal */}
            <Dialog
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                title={getEditingExerciseName()}
                className="max-w-xl"
                footer={(
                    <Button onClick={handleSaveEdit} className="bg-brand-600 hover:bg-brand-700 text-white w-full sm:w-auto">
                        Guardar Cambios
                    </Button>
                )}
            >
                {editForm && (
                    <div className="space-y-6">
                        {/* Primary Stats */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-brand-800 uppercase tracking-wider border-b border-brand-100 pb-1">Parámetros Básicos</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Series</label>
                                    <input
                                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:border-brand-500 outline-none"
                                        placeholder="3"
                                        value={editForm.sets}
                                        onChange={e => setEditForm({ ...editForm, sets: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Reps/Tiempo</label>
                                    <input
                                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:border-brand-500 outline-none"
                                        placeholder="10"
                                        value={editForm.reps}
                                        onChange={e => setEditForm({ ...editForm, reps: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Carga</label>
                                    <input
                                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:border-brand-500 outline-none"
                                        placeholder="-- kg"
                                        value={editForm.load}
                                        onChange={e => setEditForm({ ...editForm, load: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">RPE (1-10)</label>
                                    <input
                                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:border-brand-500 outline-none"
                                        placeholder="--"
                                        value={editForm.rpe}
                                        onChange={e => setEditForm({ ...editForm, rpe: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Advanced Stats */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-brand-800 uppercase tracking-wider border-b border-brand-100 pb-1">Detalles Técnicos</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Descanso</label>
                                    <input
                                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:border-brand-500 outline-none"
                                        placeholder="90s"
                                        value={editForm.rest}
                                        onChange={e => setEditForm({ ...editForm, rest: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Tempo</label>
                                    <input
                                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:border-brand-500 outline-none"
                                        placeholder="3010"
                                        value={editForm.tempo}
                                        onChange={e => setEditForm({ ...editForm, tempo: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Mantención</label>
                                    <input
                                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:border-brand-500 outline-none"
                                        placeholder="5s"
                                        value={editForm.holdTime}
                                        onChange={e => setEditForm({ ...editForm, holdTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Unilateral Config */}
                        <div className="p-3 bg-brand-50/50 rounded-lg border border-brand-100 space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="unilateral-check"
                                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                                    checked={editForm.unilateral}
                                    onChange={e => setEditForm({ ...editForm, unilateral: e.target.checked })}
                                />
                                <label htmlFor="unilateral-check" className="text-sm font-medium text-brand-900">Ejercicio Unilateral (Por lado)</label>
                            </div>

                            {editForm.unilateral && (
                                <div className="flex gap-2">
                                    {[
                                        { id: 'left', label: 'Izquierda' },
                                        { id: 'right', label: 'Derecha' },
                                        { id: 'alternating', label: 'Alternado' },
                                        { id: 'bilateral', label: 'Ambos' } // Maybe redundant but ok
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setEditForm({ ...editForm, side: opt.id })}
                                            className={cn(
                                                "flex-1 py-1.5 text-xs rounded border transition-colors",
                                                editForm.side === opt.id
                                                    ? "bg-brand-600 text-white border-brand-600"
                                                    : "bg-white text-zinc-600 border-zinc-200 hover:border-brand-300"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500">Notas / Instrucciones Específicas</label>
                            <textarea
                                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:border-brand-500 outline-none min-h-[80px]"
                                placeholder="Ej: Enfocarse en la respiración..."
                                value={editForm.notes}
                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                            />
                        </div>

                    </div>
                )}
            </Dialog>
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
