
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PrescribedPlan, PlanExercise, SESSION_BLOCKS } from '../../types/patient';
import { Exercise } from '../../types/exercise';
import { ExerciseService } from '../../services/exerciseService';
import { PatientService } from '../../services/patientService';
import { Button } from '../ui/Button';
import { ExerciseCreatorModal } from './ExerciseCreatorModal';
import { WithTooltip } from '../ui/Tooltip';
import { Search, Plus, Save, Calendar, Filter, Target, GripVertical, ChevronRight, X as XIcon, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Timestamp } from 'firebase/firestore';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, DragOverEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types & Constants ---

const DAYS = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
] as const;

type DayKey = typeof DAYS[number]['key'];

interface PlanBuilderV3Props {
    patient: Patient;
    onSave?: () => void;
    initialPlan?: PrescribedPlan;
    customSaveHandler?: (plan: PrescribedPlan) => Promise<void>;
    weekDates?: Record<string, Date>;
}

// --- Draggable Components ---

function DraggableLibraryItem({ id, data, children, className }: { id: string, data: any, children: React.ReactNode, className?: string }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { ...data, type: 'LibraryExercise' } });
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
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(className, isDragging ? "opacity-30 z-50 ring-2 ring-brand-500" : "")}>
            {children}
        </div>
    );
}

// --- Main Component ---

export function PlanBuilderV3({ patient, onSave, initialPlan, customSaveHandler, weekDates }: PlanBuilderV3Props) {
    // -- State --
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [activeDay, setActiveDay] = useState<DayKey>('monday'); // [NEW] Focus Day
    const [activeDragItem, setActiveDragItem] = useState<any | null>(null); // For DragOverlay

    // Initial Plan State
    const [plan, setPlan] = useState<PrescribedPlan>(() => initialPlan || {
        startDate: Timestamp.now(),
        schedule: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
        activeBlocks: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
    } as any);

    // Initialization
    useEffect(() => {
        const load = async () => {
            // Always ensure exercises are loaded
            if (exercises.length === 0) {
                const exList = await ExerciseService.getAll();
                setExercises(exList);
                setLoading(false);
            }
        };
        load();
    }, []);

    // Sync from Props (Support external updates e.g. from template loading)
    useEffect(() => {
        if (initialPlan) {
            setPlan(initialPlan);
        }
    }, [initialPlan]);

    // -- DnD Logic --
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragItem(event.active.data.current);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        // Where was it dropped?
        // In V3, we only drop into the ACTIVE DAY canvas (which effectively is one container)
        // Or reorder within the active day.

        const droppedOnContainer = over.id === 'active-day-droppable';
        const activeData = active.data.current as any;
        const isLibraryItem = activeData?.type === 'LibraryExercise';

        // 1. Library -> Active Day
        if (isLibraryItem && droppedOnContainer) {
            handleAddExercise(activeData as Exercise);
            return;
        }

        // 2. Reorder within Active Day
        if (!isLibraryItem && active.id !== over.id) {
            // Reorder logic
            const oldIndex = plan.schedule[activeDay].findIndex(x => x.id === active.id);
            const newIndex = plan.schedule[activeDay].findIndex(x => x.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newSchedule = arrayMove(plan.schedule[activeDay], oldIndex, newIndex);
                updatePlan(activeDay, newSchedule);
            }
        }
    };

    // -- Actions --

    const updatePlan = (day: DayKey, newExercises: PlanExercise[], newBlocks?: string[]) => {
        const updatedPlan = {
            ...plan,
            schedule: {
                ...plan.schedule,
                [day]: newExercises
            },
            activeBlocks: newBlocks ? {
                ...plan.activeBlocks,
                [day]: newBlocks
            } : plan.activeBlocks
        };

        setPlan(updatedPlan);

        // IMMEDIATE SYNC (No Debounce)
        if (customSaveHandler) {
            customSaveHandler(updatedPlan);
        } else if (onSave) {
            // Legacy save
            if (patient?.id) PatientService.update(patient.id, { activePlan: updatedPlan });
        }
    };

    const handleAddExercise = (exercise: Exercise) => {
        const newItem: PlanExercise = {
            id: crypto.randomUUID(),
            exerciseId: exercise.id!,
            name: exercise.name,
            block: SESSION_BLOCKS.MAIN, // Default block
            details: {
                sets: exercise.defaultParams?.sets || '3',
                reps: exercise.defaultParams?.reps || '10',
                note: ''
            }
        };

        const currentDayExercises = plan.schedule[activeDay];
        updatePlan(activeDay, [...currentDayExercises, newItem]);

        // Ensure block exists
        const currentBlocks = plan.activeBlocks?.[activeDay] || [];
        if (!currentBlocks.includes(SESSION_BLOCKS.MAIN)) {
            const newBlocks = [...currentBlocks, SESSION_BLOCKS.MAIN];
            // This is slightly complex because updatePlan takes one or the other or both.
            // Implemented simplistic update above, let's refine if needed.
            // For now, let's just make sure activeBlocks is up to date in the same state update
            setPlan(prev => {
                const next = {
                    ...prev,
                    schedule: {
                        ...prev.schedule,
                        [activeDay]: [...currentDayExercises, newItem]
                    },
                    activeBlocks: {
                        ...prev.activeBlocks,
                        [activeDay]: newBlocks
                    }
                };
                if (customSaveHandler) customSaveHandler(next);
                return next;
            });
        }
    };

    const handleRemoveExercise = (id: string) => {
        const filtered = plan.schedule[activeDay].filter(x => x.id !== id);
        updatePlan(activeDay, filtered);
    };

    const handleUpdateExerciseDetails = (id: string, details: any) => {
        // Debounce? Maybe local state in card is better, but here we update source directly for now (or careful with typing lag)
        // For V3 "Pro", we might want simple onBlur updates. 
        const updated = plan.schedule[activeDay].map(x => x.id === id ? { ...x, details: { ...x.details, ...details } } : x);
        updatePlan(activeDay, updated);
    };


    // -- Render Helpers --
    const filteredExercises = exercises.filter(ex =>
        (selectedCategory === 'All' || ex.category === selectedCategory) &&
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = Array.from(new Set(exercises.map(e => e.category)));

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex bg-slate-50 h-[calc(100vh-140px)] rounded-xl overflow-hidden border border-slate-200">
                {/* 1. Sidebar Library */}
                <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-white z-10 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                placeholder="Buscar ejercicios..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient-right">
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className={cn("px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition-colors", selectedCategory === 'All' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                            >
                                Todos
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn("px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition-colors", selectedCategory === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar content-start">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                                <span className="text-xs">Cargando biblioteca...</span>
                            </div>
                        ) : (
                            filteredExercises.map(ex => (
                                <DraggableLibraryItem key={ex.id} id={ex.id!} data={ex}>
                                    <div className="group flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 hover:border-brand-300 hover:shadow-md hover:shadow-brand-500/5 transition-all cursor-grab active:cursor-grabbing">
                                        <div className="w-8 h-8 rounded bg-brand-50 flex items-center justify-center shrink-0 text-brand-600">
                                            {/* Icon based on category? */}
                                            <Target className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate group-hover:text-brand-700">{ex.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{ex.category}</p>
                                        </div>
                                        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-brand-400" />
                                    </div>
                                </DraggableLibraryItem>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Main Canvas Area */}
                <div className="flex-1 flex flex-col bg-slate-50/50">

                    {/* Top Day Tabs */}
                    <div className="flex items-center px-4 pt-4 pb-0 bg-white border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar">
                        {DAYS.map(day => {
                            const count = plan.schedule[day.key].length;
                            const isActive = activeDay === day.key;
                            return (
                                <button
                                    key={day.key}
                                    onClick={() => setActiveDay(day.key)}
                                    className={cn(
                                        "relative flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2",
                                        isActive
                                            ? "bg-slate-50 border-brand-500 text-brand-700"
                                            : "bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                    )}
                                >
                                    {day.label}
                                    {count > 0 && (
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", isActive ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-600")}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Active Day Canvas */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-3xl mx-auto space-y-6">

                            {/* Droppable Zone */}
                            <DroppableCanvas id="active-day-droppable" items={plan.schedule[activeDay]}>
                                <SortableContext
                                    items={plan.schedule[activeDay].map(x => x.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {plan.schedule[activeDay].length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                                <Plus className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="font-medium text-lg">Tu día está vacío</p>
                                            <p className="text-sm mt-1">Arrastra ejercicios desde la izquierda para comenzar</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {plan.schedule[activeDay].map((item, index) => (
                                                <SortableExerciseItem key={item.id} id={item.id} data={item}>
                                                    <ExerciseCardPro
                                                        item={item}
                                                        index={index}
                                                        onRemove={() => handleRemoveExercise(item.id)}
                                                        onUpdate={(updates) => handleUpdateExerciseDetails(item.id, updates)}
                                                    />
                                                </SortableExerciseItem>
                                            ))}
                                        </div>
                                    )}
                                </SortableContext>
                            </DroppableCanvas>

                        </div>
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeDragItem ? (
                    <div className="bg-white p-4 rounded-lg shadow-xl border border-brand-500/30 w-64 opacity-90 cursor-grabbing">
                        <p className="font-bold text-brand-800">{activeDragItem.name}</p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// --- Sub-Components ---

function DroppableCanvas({ id, children, items }: { id: string, children: React.ReactNode, items: any[] }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={cn(
                "min-h-[500px] transition-colors rounded-xl",
                isOver && items.length === 0 ? "bg-brand-50/50 ring-2 ring-brand-500/20" : ""
            )}
        >
            {children}
        </div>
    )
}

function ExerciseCardPro({ item, index, onRemove, onUpdate }: { item: PlanExercise, index: number, onRemove: () => void, onUpdate: (d: any) => void }) {
    // Local state for inputs to prevent lag, flush on blur
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                        {index + 1}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-base">{item.name}</h4>
                        <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">Bloque Principal</span>
                    </div>
                </div>
                <button
                    onClick={onRemove}
                    className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Inline Editor Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Series</label>
                    <input
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm font-medium focus:border-brand-500 outline-none"
                        defaultValue={item.details?.sets}
                        onBlur={(e) => onUpdate({ sets: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reps / Tiempo</label>
                    <input
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm font-medium focus:border-brand-500 outline-none"
                        defaultValue={item.details?.reps}
                        onBlur={(e) => onUpdate({ reps: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Carga (Kg)</label>
                    <input
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm font-medium focus:border-brand-500 outline-none"
                        defaultValue={item.details?.load}
                        onBlur={(e) => onUpdate({ load: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">RPE (1-10)</label>
                    <input
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm font-medium focus:border-brand-500 outline-none"
                        defaultValue={item.details?.rpe}
                        onBlur={(e) => onUpdate({ rpe: e.target.value })}
                    />
                </div>
                <div className="col-span-2 md:col-span-4 space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notas / Instrucciones</label>
                    <input
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-600 focus:border-brand-500 outline-none placeholder:text-slate-300"
                        placeholder="Ej. Pausa de 2 segundos abajo..."
                        defaultValue={item.details?.notes}
                        onBlur={(e) => onUpdate({ notes: e.target.value })}
                    />
                </div>
            </div>
        </div>
    )
}
