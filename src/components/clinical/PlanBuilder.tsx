import React, { useState, useEffect } from 'react';
import { Patient, PrescribedPlan, PlanExercise, SESSION_BLOCKS } from '../../types/patient';
import { Exercise } from '../../types/exercise';
import { ExerciseService } from '../../services/exerciseService';
import { PatientService } from '../../services/patientService';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { ExerciseCreatorModal } from './ExerciseCreatorModal'; // [NEW]
import { Search, Plus, Save, Calendar, Link as LinkIcon, Copy, Play, Info as InfoIcon, X as XIcon, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Timestamp } from 'firebase/firestore';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, DragOverEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function DraggableItem({ id, data, children, className }: { id: string, data: any, children: React.ReactNode, className?: string }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data });
    return (
        <div ref={setNodeRef} {...listeners} {...attributes} className={cn(className, isDragging ? "opacity-50" : "")}>
            {children}
        </div>
    );
}

function SortableExerciseItem({ id, children, className, data }: { id: string, children: React.ReactNode, className?: string, data?: any }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, data });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(className, isDragging ? "opacity-30" : "")}>
            {children}
        </div>
    );
}

function DroppableDay({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className={cn(className, isOver ? "ring-2 ring-brand-400 bg-brand-50" : "")}>
            {children}
        </div>
    );
}

interface PlanBuilderProps {
    patient: Patient;
    onSave?: () => void;
    initialPlan?: PrescribedPlan;
    customSaveHandler?: (plan: PrescribedPlan) => Promise<void>;
    weekDates?: Record<string, Date>; // [NEW] Display specific dates
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

export function PlanBuilder({ patient, onSave, initialPlan, customSaveHandler, weekDates }: PlanBuilderProps) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isSaving, setIsSaving] = useState(false);
    const [magicLink, setMagicLink] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [activeDragItem, setActiveDragItem] = useState<Exercise | null>(null);

    // Initialize plan state
    const [plan, setPlan] = useState<PrescribedPlan>(() => {
        if (initialPlan) return initialPlan;
        if (patient.activePlan) return { ...patient.activePlan, activeBlocks: patient.activePlan.activeBlocks || {} };
        return {
            startDate: Timestamp.now(), // We need Timestamp here actually for default? No, usually Date in Types, check type defs. Local Date is fine for now or Timestamp.fromDate(new Date()) 
            // actually the Type says Timestamp | Date usually. Let's use Date for safety if Timestamp is causing issues, or keep imported if needed.
            // Wait, I am removing Timestamp import? If I remove it, I can't use it.
            // Let's use new Date() if allowed by type.
            schedule: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
            activeBlocks: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
        } as any;
    });

    // Auto-save buffer
    const [isDirty, setIsDirty] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Track first mount to avoid saving initial state
    const [isFirstMount, setIsFirstMount] = useState(true);

    useEffect(() => {
        setIsFirstMount(false);
    }, []);



    // Track if update is from parent to prevent save loop
    const isRemoteUpdate = React.useRef(false);

    // Auto-save Effect
    useEffect(() => {
        if (isFirstMount) return;

        // If this change was caused by a remote update (props), ignore it for auto-save
        if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false;
            return;
        }

        setIsDirty(true);
        const timer = setTimeout(async () => {
            console.log("Auto-saving...");
            if (customSaveHandler) {
                await customSaveHandler(plan);
            } else if (onSave) {
                await PatientService.update(patient.id!, { activePlan: plan });
            }
            setLastSaved(new Date());
            setIsDirty(false);
        }, 2000); // 2 seconds debounce

        return () => clearTimeout(timer);
    }, [plan]);

    const handleCreateClick = () => setIsCreating(true);

    const handleSaveNewExercise = async (newEx: Exercise) => {
        setExercises(prev => [...prev, newEx]);
        setIsCreating(false);
        setSearchTerm(newEx.name);
    };

    // Initialize/Update when initialPlan or patient changes
    // Initialize/Update when initialPlan or patient changes
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            // Always ensure exercises are loaded
            if (exercises.length === 0) {
                const exList = await ExerciseService.getAll();
                setExercises(exList);
            }

            // Only load from props if it's the first mount OR if we explicitly want to reset (not implemented yet)
            // This prevents external updates (e.g. from save) from overwriting local state
            if (isFirstMount) {
                if (initialPlan) {
                    isRemoteUpdate.current = true; // Mark as remote
                    setPlan(initialPlan);
                } else if (patient.activePlan) {
                    isRemoteUpdate.current = true; // Mark as remote
                    let activeBlocks = patient.activePlan.activeBlocks;

                    if (!activeBlocks) {
                        activeBlocks = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
                        const schedule = patient.activePlan.schedule || {};
                        Object.entries(schedule).forEach(([day, exList]) => {
                            if (Array.isArray(exList)) {
                                const uniqueBlocks = new Set<string>();
                                exList.forEach(ex => {
                                    uniqueBlocks.add(ex.block || SESSION_BLOCKS.MAIN);
                                });
                                // @ts-ignore
                                if (activeBlocks) activeBlocks[day] = Array.from(uniqueBlocks);
                            }
                        });
                    }

                    setPlan({
                        ...patient.activePlan,
                        activeBlocks
                    });
                }
            }

            setLoading(false);
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFirstMount, initialPlan]);

    // Removed the old independent loadData() effect to avoid conflicts

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
            if (customSaveHandler) {
                await customSaveHandler(plan);
            } else {
                await PatientService.update(patient.id!, {
                    activePlan: plan
                });
            }

            if (onSave) onSave();
            setLastSaved(new Date());
            // alert("Plan guardado correctamente"); // Removed alert for smoother experience, using UI feedback instead
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
    const [activeTab, setActiveTab] = useState<'general' | 'load' | 'specifics' | 'notes'>('general');

    // Add Workflow State
    const [addingToDay, setAddingToDay] = useState<keyof typeof plan.schedule | null>(null);
    const [selectedExerciseForAdd, setSelectedExerciseForAdd] = useState<Exercise | null>(null);

    const handleSelectExerciseForAdd = (ex: Exercise) => {
        setSelectedExerciseForAdd(ex);
        // Initialize form with defaults
        setActiveTab('general');
        setEditForm({
            sets: ex.defaultParams?.sets || '3',
            reps: ex.defaultParams?.reps || '10',
            load: '',
            rpe: '',
            rest: '',
            tempo: '',
            holdTime: '',
            unilateral: false,
            side: 'bilateral',
            notes: '',
            rir: '',
            percent1rm: '',
            // [NEW]
            duration: '',
            distance: '',
            heartRateZone: '',
            incline: '',
            breathPattern: '',
            contractionTime: '',
            relaxationTime: ''
        });
    };

    const handleConfirmAdd = () => {
        if (!addingToDay || !selectedExerciseForAdd || !editForm) return;

        const newItem: PlanExercise = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            exerciseId: selectedExerciseForAdd.id!,
            name: selectedExerciseForAdd.name,
            details: { ...editForm },
            block: SESSION_BLOCKS.MAIN, // Default to MAIN, could vary
            completed: false
        };

        setPlan(prev => {
            const currentActiveBlocks = prev.activeBlocks || {
                monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
            };

            return {
                ...prev,
                schedule: {
                    ...prev.schedule,
                    [addingToDay]: [...prev.schedule[addingToDay], newItem]
                },
                // Ensure block exists
                activeBlocks: {
                    ...currentActiveBlocks,
                    [addingToDay]: Array.from(new Set([...(currentActiveBlocks[addingToDay] || []), SESSION_BLOCKS.MAIN]))
                }
            };
        });

        // Reset
        setAddingToDay(null);
        setSelectedExerciseForAdd(null);
        setEditForm(null);
    };

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
            // [NEW]
            duration: item.details?.duration || '',
            distance: item.details?.distance || '',
            heartRateZone: item.details?.heartRateZone || '',
            incline: item.details?.incline || '',
            breathPattern: item.details?.breathPattern || '',
            contractionTime: item.details?.contractionTime || '',
            relaxationTime: item.details?.relaxationTime || ''
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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current) {
            setActiveDragItem(event.active.data.current as Exercise);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find which container (day) the items belong to
        const findContainer = (id: string) => {
            if (id in plan.schedule) return id as keyof typeof plan.schedule;
            // Find day containing this exercise ID
            return (Object.keys(plan.schedule) as Array<keyof typeof plan.schedule>).find(day =>
                plan.schedule[day].some(item => item.id === id)
            );
        };

        const activeContainer = findContainer(activeId as string);
        const overContainer = findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        // Move item to new container during drag (Optimistic UI)
        setPlan(prev => {
            const activeItems = prev.schedule[activeContainer];
            const overItems = prev.schedule[overContainer];

            const activeIndex = activeItems.findIndex(i => i.id === activeId);
            const overIndex = overItems.findIndex(i => i.id === overId);

            let newIndex;
            if (overId in prev.schedule) {
                // Dropped ON a day container
                newIndex = overItems.length + 1;
            } else {
                // Dropped ON an item in the day
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                schedule: {
                    ...prev.schedule,
                    [activeContainer]: [
                        ...prev.schedule[activeContainer].filter(item => item.id !== activeId)
                    ],
                    [overContainer]: [
                        ...prev.schedule[overContainer].slice(0, newIndex),
                        activeItems[activeIndex],
                        ...prev.schedule[overContainer].slice(newIndex, prev.schedule[overContainer].length)
                    ]
                }
            };
        });
    };


    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // If dragging from library (new item)
        if (active.data.current && (active.data.current as any).type !== 'PlanExercise') {
            // Logic for new item from library (DraggableItem)
            if (overId in plan.schedule) {
                // Dropped on a day
                const dayKey = overId as keyof typeof plan.schedule;
                const exercise = active.data.current as Exercise;
                handleAddExercise(dayKey, exercise, SESSION_BLOCKS.MAIN);
                handleAddBlock(dayKey, SESSION_BLOCKS.MAIN);
            }
            return;
        }

        // Dragging existing PlanExercise (Sortable logic)
        const findContainer = (id: string) => {
            if (id in plan.schedule) return id as keyof typeof plan.schedule;
            return (Object.keys(plan.schedule) as Array<keyof typeof plan.schedule>).find(day =>
                plan.schedule[day].some(item => item.id === id)
            );
        };

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (activeContainer && overContainer && activeContainer === overContainer) {
            // Reordering within same day
            const activeIndex = plan.schedule[activeContainer].findIndex(i => i.id === activeId);
            const overIndex = plan.schedule[overContainer].findIndex(i => i.id === overId);

            if (activeIndex !== overIndex) {
                setPlan(prev => ({
                    ...prev,
                    schedule: {
                        ...prev.schedule,
                        [activeContainer]: arrayMove(prev.schedule[activeContainer], activeIndex, overIndex)
                    }
                }));
            }
        }
        // If moved between containers, handled in DragOver, we just persist.
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
        >
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
                                    <DraggableItem key={ex.id} id={ex.id!} data={ex} className="cursor-grab active:cursor-grabbing">
                                        <div className="p-3 bg-brand-50/50 rounded-lg border border-brand-100 hover:border-brand-300 transition-all hover:shadow-md group">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-semibold text-brand-800 flex items-center gap-2">
                                                        <GripVertical className="w-3 h-3 text-brand-300" />
                                                        {ex.name}
                                                    </p>
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
                                                    {/* Hover menu removed as requested */}
                                                </div>
                                            </div>
                                        </div>
                                    </DraggableItem>
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
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] text-gray-500 font-medium mr-1 transition-opacity duration-300">
                                {isSaving ? 'Guardando...' : isDirty ? 'Cambios pendientes...' : lastSaved ? `Guardado ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </span>
                            <Button onClick={handleSavePlan} disabled={isSaving} size="sm" className="bg-brand-700 hover:bg-brand-800 text-white shadow-brand-200/50 shadow-lg relative">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Guardando...' : 'Guardar'}
                                {isDirty && <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Cambios sin guardar"></span>}
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
                                        <div className={cn(
                                            "p-3 border-b border-brand-50 bg-brand-50/30 rounded-t-xl text-center sticky top-0 z-10 backdrop-blur-sm",
                                            weekDates?.[day.key] && new Date().toDateString() === weekDates[day.key].toDateString() ? "bg-brand-100/50" : ""
                                        )}>
                                            <div className="flex flex-col items-center">
                                                <span className={cn(
                                                    "text-xs font-bold uppercase tracking-widest",
                                                    weekDates?.[day.key] && new Date().toDateString() === weekDates[day.key].toDateString() ? "text-brand-700" : "text-brand-800"
                                                )}>
                                                    {day.label}
                                                </span>
                                                {weekDates?.[day.key] && (
                                                    <span className={cn(
                                                        "text-[10px] font-medium mt-0.5",
                                                        weekDates[day.key].toDateString() === new Date().toDateString() ? "text-brand-600" : "text-gray-400"
                                                    )}>
                                                        {weekDates[day.key].getDate()} {weekDates[day.key].toLocaleDateString('es-ES', { month: 'short' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <DroppableDay id={day.key} className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar relative min-h-[200px]">
                                            <SortableContext
                                                id={day.key}
                                                items={dayExercises.map(d => d.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
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
                                                                    <SortableExerciseItem
                                                                        key={item.id}
                                                                        id={item.id}
                                                                        data={{ type: 'PlanExercise', current: item }}
                                                                    >
                                                                        <div
                                                                            onClick={() => handleEditClick(day.key as any, item)}
                                                                            className="relative p-2.5 bg-white border border-brand-100 rounded-lg shadow-sm hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group"
                                                                        >
                                                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                                                <p className="text-xs font-bold text-brand-900 leading-tight line-clamp-2 text-left">{item.name}</p>

                                                                                <button
                                                                                    onClick={(e: React.MouseEvent) => {
                                                                                        e.stopPropagation();
                                                                                        handleRemoveExercise(day.key as any, item.id);
                                                                                    }}
                                                                                    className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-colors absolute top-1 right-1 p-1 bg-white/90 rounded"
                                                                                    onPointerDown={(e) => e.stopPropagation()}
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
                                                                    </SortableExerciseItem>
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
                                            </SortableContext>

                                            {/* Quick Add Button - Moved to bottom as requested */}
                                            <div className="flex justify-center mt-2 mb-2 z-20 relative">
                                                <button
                                                    onClick={() => setAddingToDay(day.key as any)}
                                                    className="w-full py-1 text-[10px] text-brand-400 hover:text-brand-600 hover:bg-brand-50 border border-transparent hover:border-brand-100 rounded transition-all flex items-center justify-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Agregar Ejercicio
                                                </button>
                                            </div>

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
                                        </DroppableDay>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Add Exercise Modal / Selector */}
                <Dialog
                    isOpen={!!addingToDay}
                    onClose={() => {
                        setAddingToDay(null);
                        setSelectedExerciseForAdd(null);
                    }}
                    title={selectedExerciseForAdd ? `Prescribir: ${selectedExerciseForAdd.name}` : "Seleccionar Ejercicio"}
                    className="max-w-4xl"
                >
                    {!selectedExerciseForAdd ? (
                        // SEARCH VIEW
                        <div className="h-[60vh] flex flex-col">
                            <div className="mb-4">
                                <input
                                    className="w-full text-sm px-4 py-3 bg-brand-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-200 border-none"
                                    placeholder="🔍 Buscar ejercicio..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2 overflow-x-auto pb-1 mt-2 no-scrollbar">
                                    <button onClick={() => setSelectedCategory('All')} className={cn("px-3 py-1 text-xs rounded-full transition-colors", selectedCategory === 'All' ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>Todos</button>
                                    {categories.map(cat => (
                                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-3 py-1 text-xs rounded-full transition-colors", selectedCategory === cat ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>{cat}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
                                {filteredExercises.map(ex => (
                                    <div
                                        key={ex.id}
                                        onClick={() => handleSelectExerciseForAdd(ex)}
                                        className="p-3 bg-white border border-brand-100 rounded-xl hover:border-brand-400 hover:shadow-md transition-all cursor-pointer flex flex-col gap-2 group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-brand-900 text-sm group-hover:text-brand-600 transition-colors">{ex.name}</span>
                                            {ex.videoUrl && <Play className="w-3 h-3 text-brand-300" />}
                                        </div>
                                        <div className="flex gap-1 flex-wrap">
                                            <span className="text-[10px] px-1.5 py-0.5 bg-brand-50 text-brand-600 rounded">{ex.category}</span>
                                            {ex.equipment?.[0] && <span className="text-[10px] px-1.5 py-0.5 bg-zinc-50 text-zinc-500 rounded">{ex.equipment[0]}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // PRESCRIPTION VIEW (Reusing form styles)
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto pr-2">
                                {/* SIMPLIFIED FORM FOR ADDING - Reusing Edit Logic Structure but streamlined */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-sm">
                                            {selectedExerciseForAdd.videoUrl ? (
                                                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYoutubeId(selectedExerciseForAdd.videoUrl)}?rel=0`} title="Video" frameBorder="0" allowFullScreen></iframe>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-500"><span className="text-xs">Sin video</span></div>
                                            )}
                                        </div>
                                        {selectedExerciseForAdd.instructions && <p className="text-xs text-zinc-500">{selectedExerciseForAdd.instructions}</p>}
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div><label className="text-xs font-bold text-zinc-500">SETS</label><input autoFocus className="w-full p-2 bg-zinc-50 rounded border border-zinc-200" value={editForm.sets} onChange={e => setEditForm({ ...editForm, sets: e.target.value })} /></div>
                                            <div><label className="text-xs font-bold text-zinc-500">REPS</label><input className="w-full p-2 bg-zinc-50 rounded border border-zinc-200" value={editForm.reps} onChange={e => setEditForm({ ...editForm, reps: e.target.value })} /></div>
                                            <div><label className="text-xs font-bold text-zinc-500">CARGA</label><input className="w-full p-2 bg-zinc-50 rounded border border-zinc-200" value={editForm.load} placeholder="kg" onChange={e => setEditForm({ ...editForm, load: e.target.value })} /></div>
                                            <div><label className="text-xs font-bold text-zinc-500">RPE</label><input className="w-full p-2 bg-zinc-50 rounded border border-zinc-200" value={editForm.rpe} placeholder="1-10" onChange={e => setEditForm({ ...editForm, rpe: e.target.value })} /></div>
                                        </div>
                                        <div className="pt-2">
                                            <label className="text-xs font-bold text-zinc-500">NOTAS</label>
                                            <textarea className="w-full p-2 bg-zinc-50 rounded border border-zinc-200 text-sm" rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-100">
                                <Button variant="ghost" onClick={() => setSelectedExerciseForAdd(null)}>Volver a búsqueda</Button>
                                <Button onClick={handleConfirmAdd} className="bg-brand-600 text-white min-w-[150px]">Confirmar y Agregar</Button>
                            </div>
                        </div>
                    )}
                </Dialog>

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
                                        { id: 'load', label: 'Carga/Intensidad' },
                                        { id: 'specifics', label: 'Específicos' },
                                        { id: 'notes', label: 'Notas' }
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
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-zinc-600 uppercase">Zona FC</label>
                                                    <input
                                                        className="w-full p-2.5 bg-red-50/50 border border-red-100 text-red-800 rounded-lg text-sm focus:border-red-500 outline-none"
                                                        placeholder="Zona 2"
                                                        value={editForm.heartRateZone}
                                                        onChange={e => setEditForm({ ...editForm, heartRateZone: e.target.value })}
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

                                    {/* SPECIFICS TAB (NEW) */}
                                    {activeTab === 'specifics' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                                            {/* Cardio Section */}
                                            <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-100 space-y-3">
                                                <h6 className="text-[10px] uppercase font-bold text-orange-700 flex items-center gap-1">Cardio & Running</h6>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-zinc-600 uppercase">Distancia</label>
                                                        <input
                                                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-sm outline-none"
                                                            placeholder="5km"
                                                            value={editForm.distance}
                                                            onChange={e => setEditForm({ ...editForm, distance: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-zinc-600 uppercase">Inclinación</label>
                                                        <input
                                                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-sm outline-none"
                                                            placeholder="1.5%"
                                                            value={editForm.incline}
                                                            onChange={e => setEditForm({ ...editForm, incline: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pelvic / Isometric Section */}
                                            <div className="p-3 bg-pink-50/50 rounded-lg border border-pink-100 space-y-3">
                                                <h6 className="text-[10px] uppercase font-bold text-pink-700 flex items-center gap-1">Suelo Pélvico / Isometría</h6>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-zinc-600 uppercase">T. Contracción</label>
                                                        <input
                                                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-sm outline-none"
                                                            placeholder="5s"
                                                            value={editForm.contractionTime}
                                                            onChange={e => setEditForm({ ...editForm, contractionTime: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-zinc-600 uppercase">T. Relajación</label>
                                                        <input
                                                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-sm outline-none"
                                                            placeholder="10s"
                                                            value={editForm.relaxationTime}
                                                            onChange={e => setEditForm({ ...editForm, relaxationTime: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Breathing Section */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-600 uppercase">Patrón Respiratorio (Yoga/Pilates)</label>
                                                <input
                                                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 outline-none"
                                                    placeholder="In 4s / Ret 4s / Ex 4s / Ret 4s"
                                                    value={editForm.breathPattern}
                                                    onChange={e => setEditForm({ ...editForm, breathPattern: e.target.value })}
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
            <DragOverlay>
                {activeDragItem ? (
                    <div className="p-3 bg-white rounded-lg border border-brand-200 shadow-xl w-64 opacity-90 rotate-3">
                        <p className="text-sm font-bold text-brand-800">{activeDragItem.name}</p>
                        <span className="text-xs text-brand-500">{activeDragItem.category}</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext >
    );
}


