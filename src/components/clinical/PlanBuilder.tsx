import React, { useState, useEffect } from 'react';
import { Patient, PrescribedPlan, PlanExercise, SESSION_BLOCKS } from '../../types/patient';
import { Exercise } from '../../types/exercise';
import { ExerciseService } from '../../services/exerciseService';
import { PatientService } from '../../services/patientService';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { ExerciseCreatorModal } from './ExerciseCreatorModal'; // [NEW]
import { Search, Plus, Save, Calendar, Link as LinkIcon, Copy, Play, Info as InfoIcon, X as XIcon } from 'lucide-react';
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
        },
        activeBlocks: {
            monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
        }
    });

    const [isSaving, setIsSaving] = useState(false);
    const [magicLink, setMagicLink] = useState<string | null>(null);

    // Quick Create State
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateClick = () => {
        setIsCreating(true);
    };

    // NEW: We don't need 'newExercise' state here anymore, handled by modal
    const handleSaveNewExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
        try {
            const id = await ExerciseService.create(exerciseData);
            const created = { id, ...exerciseData } as Exercise;
            setExercises(prev => [...prev, created]);
            setSearchTerm(exerciseData.name);
            setIsCreating(false);
        } catch (e) {
            console.error("Error creating exercise", e);
            throw e;
        }
    };

    useEffect(() => {
        if (patient.magicLinkToken) {
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
            let activeBlocks = patient.activePlan.activeBlocks;

            // Backward Compatibility: Derive blocks if missing
            if (!activeBlocks) {
                activeBlocks = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };

                // Helper to safely iterate schedule
                const schedule = patient.activePlan.schedule || {};
                Object.entries(schedule).forEach(([day, exercises]) => {
                    if (Array.isArray(exercises)) {
                        const uniqueBlocks = new Set<string>();
                        exercises.forEach(ex => {
                            uniqueBlocks.add(ex.block || SESSION_BLOCKS.MAIN);
                        });
                        if (activeBlocks) {
                            (activeBlocks as any)[day] = Array.from(uniqueBlocks);
                        }
                    }
                });
            }

            setPlan({
                ...patient.activePlan,
                activeBlocks
            });
        }
        setLoading(false);
    };

    const handleAddExercise = (dayKey: keyof typeof plan.schedule, exercise: Exercise, block: string = SESSION_BLOCKS.MAIN) => {
        const defaultSets = exercise.defaultParams?.sets || '3';
        const defaultReps = exercise.defaultParams?.reps || '10';

        const newItem: PlanExercise = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            exerciseId: exercise.id!,
            name: exercise.name,
            details: {
                sets: defaultSets,
                reps: defaultReps,
                load: '',
                rpe: '',
                rest: '',
                tempo: '',
                side: 'bilateral'
            },
            block: block, // [NEW] Assign to block
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

    const handleAddBlock = (dayKey: keyof typeof plan.schedule, blockName: string) => {
        setPlan(prev => {
            const currentBlocks = prev.activeBlocks?.[dayKey] || [];
            if (currentBlocks.includes(blockName)) return prev;

            const existingBlocks = prev.activeBlocks || {
                monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
            };

            return {
                ...prev,
                activeBlocks: {
                    ...existingBlocks,
                    [dayKey]: [...currentBlocks, blockName]
                }
            };
        });
    };

    const handleRemoveBlock = (dayKey: keyof typeof plan.schedule, blockName: string) => {
        setPlan(prev => {
            const currentBlocks = prev.activeBlocks?.[dayKey] || [];
            const existingBlocks = prev.activeBlocks || {
                monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
            };

            return {
                ...prev,
                activeBlocks: {
                    ...existingBlocks,
                    [dayKey]: currentBlocks.filter(b => b !== blockName)
                }
            };
        });
    };

    const handleRemoveExercise = (dayKey: keyof typeof plan.schedule, exerciseId: string) => {
        setPlan(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [dayKey]: prev.schedule[dayKey].filter(ex => ex.id !== exerciseId)
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
    const [activeTab, setActiveTab] = useState<'general' | 'load' | 'notes'>('general');

    const handleEditClick = (dayKey: keyof typeof plan.schedule, item: PlanExercise) => {
        setEditingItem({ day: dayKey, instanceId: item.id });
        setActiveTab('general'); // Reset tab
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
            notes: item.details?.notes || '',
            rir: item.details?.rir || '',
            percent1rm: item.details?.percent1rm || '',
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

    // Helper: Get Full Exercise for Modal (Video, etc)
    const getEditingExercise = () => {
        if (!editingItem) return null;
        const dayList = plan.schedule[editingItem.day];
        const item = dayList.find(i => i.id === editingItem.instanceId);
        if (!item) return null;
        return exercises.find(e => e.id === item.exerciseId) || { name: item.name };
    };

    // Helper: Extract YouTube ID
    const getYoutubeId = (url?: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const editingExercise = getEditingExercise();

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
                        filteredExercises.length > 0 ? (
                            filteredExercises.map(ex => (
                                <div key={ex.id} className="p-3 bg-brand-50/50 rounded-lg border border-brand-100 hover:border-brand-300 transition-all hover:shadow-md group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-brand-800">{ex.name}</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                <span className="text-[9px] px-1.5 py-0.5 bg-brand-50 text-brand-600 rounded border border-brand-100 uppercase tracking-tight font-medium">
                                                    {ex.category}
                                                </span>
                                                {ex.system && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 uppercase tracking-tight">
                                                        {ex.system}
                                                    </span>
                                                )}
                                                {ex.pattern && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-100 uppercase tracking-tight">
                                                        {ex.pattern}
                                                    </span>
                                                )}
                                                {ex.equipment && ex.equipment.length > 0 && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded border border-gray-100 uppercase tracking-tight">
                                                        {ex.equipment[0]} {ex.equipment.length > 1 ? '+' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="relative group/add">
                                                <button className="p-1.5 bg-brand-100 rounded-full text-brand-600 hover:bg-brand-600 hover:text-white transition-colors">
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <div className="absolute right-0 top-8 w-40 bg-white shadow-xl rounded-lg border border-brand-100 p-2 hidden group-hover/add:block z-50">
                                                    <p className="text-[10px] font-bold text-center text-brand-400 mb-1">Agregar a...</p>
                                                    <div className="grid grid-cols-4 gap-1">
                                                        {DAYS.map(d => (
                                                            <button
                                                                key={d.key}
                                                                onClick={() => handleAddExercise(d.key as any, ex, SESSION_BLOCKS.MAIN)}
                                                                className="aspect-square flex items-center justify-center text-[10px] font-bold bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white rounded transition-colors"
                                                                title={`Agregar a ${d.label} (Principal)`}
                                                            >
                                                                {d.label.substr(0, 1)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                                <p className="text-sm text-brand-400">No se encontraron ejercicios.</p>
                                {searchTerm && (
                                    <Button
                                        onClick={handleCreateClick}
                                        variant="outline"
                                        className="text-brand-600 border-brand-200 hover:bg-brand-50"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Crear "{searchTerm}"
                                    </Button>
                                )}
                            </div>
                        )
                    }
                </div>
            </div>

            {/* NEW: Exercise Creator Modal */}
            <ExerciseCreatorModal
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                initialName={searchTerm}
                onSave={handleSaveNewExercise}
            />

            {/* Right: Weekly Schedule (Block Based) */}
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
                    <div className="grid grid-cols-7 gap-4 min-w-[1200px] h-full">
                        {DAYS.map(day => {
                            // Logic: Render blocks present in `activeBlocks[day]`
                            // Fallback: If no blocks activ, show "Add Block" button or check if legacy exercises exist.
                            const activeBlockList = plan.activeBlocks?.[day.key as keyof typeof plan.activeBlocks] || [];
                            const dayExercises = plan.schedule[day.key as keyof typeof plan.schedule];

                            return (
                                <div key={day.key} className="flex flex-col h-full bg-white rounded-xl border border-brand-100/50 shadow-sm hover:shadow-md transition-shadow relative group/day">
                                    <div className="p-3 border-b border-brand-50 bg-brand-50/30 rounded-t-xl text-center sticky top-0 z-10 backdrop-blur-sm">
                                        <span className="text-xs font-bold text-brand-800 uppercase tracking-widest">{day.label}</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar relative">

                                        {/* Render Active Blocks */}
                                        {activeBlockList.map(blockName => {
                                            const blockExercises = dayExercises.filter((i: PlanExercise) => i.block === blockName);

                                            return (
                                                <div key={blockName} className="space-y-2 group/block">
                                                    <div className="flex items-center gap-2 px-1 justify-between group/header cursor-default">
                                                        <div className="h-px bg-brand-50 flex-1 group-hover/header:bg-brand-100 transition-colors" />
                                                        <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap text-brand-400 group-hover/header:text-brand-600">
                                                            {blockName}
                                                        </span>
                                                        <div className="h-px bg-brand-50 flex-1 group-hover/header:bg-brand-100 transition-colors" />

                                                        {/* Remove Block Button (Only if empty) */}
                                                        {blockExercises.length === 0 && (
                                                            <button
                                                                onClick={() => handleRemoveBlock(day.key as any, blockName)}
                                                                className="opacity-0 group-hover/header:opacity-100 text-gray-300 hover:text-red-400 transition-all p-0.5"
                                                                title="Eliminar bloque vacío"
                                                            >
                                                                <XIcon className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2 min-h-[20px]">
                                                        {blockExercises.map((item: PlanExercise) => (
                                                            <div
                                                                key={item.id}
                                                                onClick={() => handleEditClick(day.key as any, item)}
                                                                className="relative p-2.5 bg-white border border-brand-100 rounded-lg shadow-sm hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group"
                                                            >
                                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                                    <p className="text-xs font-bold text-brand-900 leading-tight line-clamp-2">{item.name}</p>

                                                                    <button
                                                                        onClick={(e: React.MouseEvent) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveExercise(day.key as any, item.id);
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-colors absolute top-1 right-1 p-1 bg-white/90 rounded"
                                                                    >
                                                                        <XIcon className="w-3 h-3" />
                                                                    </button>
                                                                </div>

                                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                                    {item.details?.sets && item.details?.reps && (
                                                                        <span className="px-1.5 py-0.5 bg-brand-50 text-brand-700 text-[9px] font-medium rounded border border-brand-100">
                                                                            {item.details.sets}x{item.details.reps}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Drop Placeholder if empty */}
                                                        {blockExercises.length === 0 && (
                                                            <div className="h-6 w-full rounded border border-dashed border-gray-100 flex items-center justify-center text-[9px] text-gray-300">
                                                                Arrastra o agrega aquí
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* "Add Block" Button at bottom */}
                                        <div className="pt-2 opacity-0 group-hover/day:opacity-100 transition-opacity flex justify-center">
                                            <div className="relative group/add-block">
                                                <button className="flex items-center gap-1 px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 text-[10px] font-bold rounded-full transition-colors border border-brand-100">
                                                    <Plus className="w-3 h-3" /> Agregar Sección
                                                </button>
                                                {/* Block Dropdown */}
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-8 w-48 bg-white shadow-xl rounded-lg border border-brand-100 p-1 hidden group-hover/add-block:block z-50 max-h-60 overflow-y-auto">
                                                    {Object.values(SESSION_BLOCKS).map(b => (
                                                        <button
                                                            key={b}
                                                            onClick={() => handleAddBlock(day.key as any, b)}
                                                            className="w-full text-left px-3 py-1.5 text-[10px] text-brand-700 hover:bg-brand-50 rounded transition-colors truncate"
                                                        >
                                                            {b}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Pro Editing Modal */}
            <Dialog
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                title={(editingExercise as Exercise)?.name || 'Editar Ejercicio'}
                className="max-w-4xl" // Wider for pro view
                footer={(
                    <Button onClick={handleSaveEdit} className="bg-brand-600 hover:bg-brand-700 text-white w-full sm:w-auto font-bold px-8">
                        Guardar Cambios
                    </Button>
                )}
            >
                {editForm && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column 1: Media & Context */}
                        <div className="space-y-4">
                            {/* Video Player */}
                            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-inner border border-zinc-200">
                                {(editingExercise as Exercise)?.videoUrl ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${getYoutubeId((editingExercise as Exercise).videoUrl)}?rel=0`}
                                        title="Exercise Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-500 flex-col gap-2">
                                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <Play className="w-6 h-6 text-zinc-400" />
                                        </div>
                                        <span className="text-xs">Sin video disponible</span>
                                    </div>
                                )}
                            </div>

                            {/* Instructions Preview */}
                            {(editingExercise as Exercise)?.instructions && (
                                <div className="p-3 bg-brand-50/50 rounded-lg text-xs text-brand-800 border border-brand-100">
                                    <h5 className="font-bold mb-1 flex items-center gap-1"><InfoIcon className="w-3 h-3" /> Instrucciones Base</h5>
                                    <p className="opacity-80 leading-relaxed">{(editingExercise as Exercise).instructions}</p>
                                </div>
                            )}

                            {/* Taxonomy Badges */}
                            <div className="flex flex-wrap gap-1">
                                {(editingExercise as Exercise)?.pattern && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full border border-blue-100">{(editingExercise as Exercise).pattern}</span>}
                                {(editingExercise as Exercise)?.clean_region && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded-full border border-purple-100">{(editingExercise as Exercise).clean_region}</span>}
                                {(editingExercise as Exercise)?.function && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] rounded-full border border-green-100">{(editingExercise as Exercise).function}</span>}
                            </div>
                        </div>

                        {/* Column 2: Parameters Form */}
                        <div className="flex flex-col h-full">
                            {/* Tabs */}
                            <div className="flex gap-1 mb-4 bg-zinc-100 p-1 rounded-lg">
                                {[
                                    { id: 'general', label: 'General' },
                                    { id: 'load', label: 'Carga & Intensidad' },
                                    { id: 'notes', label: 'Clínica & Notas' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                                            activeTab === tab.id
                                                ? "bg-white text-brand-700 shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 space-y-4">

                                {/* GENERAL TAB */}
                                {activeTab === 'general' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-600 uppercase">Series</label>
                                                <input
                                                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                                    placeholder="3"
                                                    value={editForm.sets}
                                                    onChange={e => setEditForm({ ...editForm, sets: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-600 uppercase">Reps / Tiempo</label>
                                                <input
                                                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                                    placeholder="10"
                                                    value={editForm.reps}
                                                    onChange={e => setEditForm({ ...editForm, reps: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-600 uppercase">Descanso</label>
                                                <input
                                                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 outline-none transition-all"
                                                    placeholder="90s"
                                                    value={editForm.rest}
                                                    onChange={e => setEditForm({ ...editForm, rest: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-600 uppercase">Tempo</label>
                                                <input
                                                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 outline-none transition-all"
                                                    placeholder="3010"
                                                    value={editForm.tempo}
                                                    onChange={e => setEditForm({ ...editForm, tempo: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="unilateral-check"
                                                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                                                    checked={!!editForm.unilateral}
                                                    onChange={e => setEditForm({ ...editForm, unilateral: e.target.checked })}
                                                />
                                                <label htmlFor="unilateral-check" className="text-sm font-medium text-zinc-700">Unilateral</label>
                                            </div>
                                            {editForm.unilateral && (
                                                <select
                                                    className="text-xs p-1 bg-white border border-zinc-200 rounded outline-none"
                                                    value={editForm.side}
                                                    onChange={e => setEditForm({ ...editForm, side: e.target.value })}
                                                >
                                                    <option value="left">Izquierda</option>
                                                    <option value="right">Derecha</option>
                                                    <option value="alternating">Alternado</option>
                                                    <option value="bilateral">Ambos</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* LOAD TAB */}
                                {activeTab === 'load' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-600 uppercase">Carga (kg/lbs)</label>
                                                <input
                                                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 outline-none"
                                                    placeholder="-- kg"
                                                    value={editForm.load}
                                                    onChange={e => setEditForm({ ...editForm, load: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-600 uppercase">% 1RM</label>
                                                <input
                                                    className="w-full p-2.5 bg-blue-50/50 border border-blue-100 text-blue-800 rounded-lg text-sm focus:border-blue-500 outline-none"
                                                    placeholder="75%"
                                                    value={editForm.percent1rm}
                                                    onChange={e => setEditForm({ ...editForm, percent1rm: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-600 uppercase">RPE (1-10)</label>
                                                <input
                                                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 outline-none"
                                                    placeholder="8"
                                                    value={editForm.rpe}
                                                    onChange={e => setEditForm({ ...editForm, rpe: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-600 uppercase">RIR (Reserva)</label>
                                                <input
                                                    className="w-full p-2.5 bg-purple-50/50 border border-purple-100 text-purple-800 rounded-lg text-sm focus:border-purple-500 outline-none"
                                                    placeholder="2 RIR"
                                                    value={editForm.rir}
                                                    onChange={e => setEditForm({ ...editForm, rir: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1 pt-2 border-t border-zinc-100">
                                            <label className="text-xs font-bold text-zinc-600 uppercase">Mantención (Isometría)</label>
                                            <input
                                                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 outline-none"
                                                placeholder="5s"
                                                value={editForm.holdTime}
                                                onChange={e => setEditForm({ ...editForm, holdTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* NOTES TAB */}
                                {activeTab === 'notes' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200 h-full flex flex-col">
                                        <div className="space-y-1 flex-1 flex flex-col">
                                            <label className="text-xs font-bold text-zinc-600 uppercase">Notas Clínicas / Instrucciones</label>
                                            <textarea
                                                className="w-full flex-1 p-3 bg-yellow-50/30 border border-yellow-200/50 rounded-lg text-sm focus:border-yellow-400 outline-none resize-none"
                                                placeholder="Instrucciones específicas para el paciente (ej: 'No arquear la espalda', 'Respirar al subir')..."
                                                value={editForm.notes}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm({ ...editForm, notes: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}


