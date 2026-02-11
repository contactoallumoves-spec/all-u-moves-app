
import React, { useState, useEffect } from 'react';
import { Patient, PrescribedPlan, PlanExercise, SESSION_BLOCKS } from '../../types/patient';
import { Exercise } from '../../types/exercise';
import { ExerciseService } from '../../services/exerciseService';
import { PatientService } from '../../services/patientService';
import { Button } from '../ui/Button';
import { Search, Plus, Calendar, Target, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Timestamp } from 'firebase/firestore';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
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

function DraggableLibraryItem({ id, data, children, className, onAdd }: { id: string, data: any, children: React.ReactNode, className?: string, onAdd?: () => void }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { ...data, type: 'LibraryExercise' } });
    return (
        <div ref={setNodeRef} className={cn(className, isDragging ? "opacity-50" : "relative")}>
            {/* Drag Handle Wrapper */}
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing w-full">
                {children}
            </div>
            {/* Explicit Add Button - Overlay or distinct action */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (onAdd) onAdd();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white hover:bg-brand-100 text-brand-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                title="Agregar a este día"
            >
                <Plus className="w-4 h-4" />
            </button>
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

export function PlanBuilderV3({ patient, onSave, initialPlan, customSaveHandler }: PlanBuilderV3Props) {
    // -- State --
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [activeDay, setActiveDay] = useState<DayKey>('monday'); // [NEW] Focus Day
    const [activeDragItem, setActiveDragItem] = useState<any | null>(null); // For DragOverlay
    const [isWeekView, setIsWeekView] = useState(false); // [NEW] Toggle View
    const [sidebarOpen, setSidebarOpen] = useState(true); // [NEW] Sidebar Toggle

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

        const isLibraryItem = active.data.current?.type === 'LibraryExercise';

        if (isLibraryItem) {
            let targetBlock: string = SESSION_BLOCKS.MAIN;
            const overId = over.id as string;

            // Check if dropped on a block header/container
            if (Object.values(SESSION_BLOCKS).includes(overId as any)) {
                targetBlock = overId as any;
            } else {
                // If dropped on an item, use its block
                const overItem = plan.schedule[activeDay].find(i => i.id === overId);
                if (overItem?.block) targetBlock = overItem.block;
            }

            handleAddExercise(active.data.current as Exercise, targetBlock);
            return;
        }

        // Standard reorder logic is handled by DragOver for visual updates,
        // but we might want to ensure state consistency here or handle final drops differently if needed.
    };

    const handleDragOver = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeItem = plan.schedule[activeDay].find(x => x.id === active.id);
        const isLibraryItem = active.data.current?.type === 'LibraryExercise';
        if (!activeItem || isLibraryItem) return; // Library items handled in DragEnd

        // Check if over is an item or a container
        const overId = over.id as string;
        const overItem = plan.schedule[activeDay].find(x => x.id === overId);

        // Target Block Logic
        let targetBlock = activeItem.block;

        if (overItem) {
            targetBlock = overItem.block || SESSION_BLOCKS.MAIN;
        } else {
            // Check if over is a container ID (we'll use Block Name as ID)
            const isContainer = (plan.activeBlocks?.[activeDay] || []).includes(overId);
            if (isContainer) targetBlock = overId;
        }

        // If block changed
        if (activeItem.block !== targetBlock) {
            setPlan((prev) => {
                const newSchedule = prev.schedule[activeDay].map(item =>
                    item.id === active.id ? { ...item, block: targetBlock } : item
                );
                return {
                    ...prev,
                    schedule: {
                        ...prev.schedule,
                        [activeDay]: newSchedule
                    }
                };
            });
            return;
        }

        // If same block, standard reorder (optimistic UI)
        // Actually dnd-kit recommends doing this in DragOver for sortable
        if (overItem && activeItem.block === overItem.block) {
            const oldIndex = plan.schedule[activeDay].findIndex(x => x.id === active.id);
            const newIndex = plan.schedule[activeDay].findIndex(x => x.id === over.id);
            if (oldIndex !== newIndex) {
                const newSchedule = arrayMove(plan.schedule[activeDay], oldIndex, newIndex);
                // We don't save to DB on DragOver to avoid spam, strictly local state
                // BUT we need to update 'plan' state for the UI to move
                setPlan(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, [activeDay]: newSchedule }
                }));
            }
        }
    };

    // -- Actions --

    const updatePlan = (day: DayKey, newExercises: PlanExercise[], newBlocks?: string[]) => {
        const updatedPlan: PrescribedPlan = {
            ...plan,
            schedule: {
                ...plan.schedule,
                [day]: newExercises
            },
            activeBlocks: newBlocks ? {
                ...(plan.activeBlocks || { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }),
                [day]: newBlocks
            } : (plan.activeBlocks || { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] })
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

    const handleAddExercise = (exercise: Exercise, targetBlock: string = SESSION_BLOCKS.MAIN) => {
        const newItem: PlanExercise = {
            id: crypto.randomUUID(),
            exerciseId: exercise.id!,
            name: exercise.name,
            block: targetBlock,
            details: {
                sets: exercise.defaultParams?.sets || '3',
                reps: exercise.defaultParams?.reps || '10',
                notes: ''
            }
        };

        // Add to schedule
        const currentDayExercises = plan.schedule[activeDay];
        const newSchedule = [...currentDayExercises, newItem];

        // Ensure block exists in activeBlocks
        const currentBlocks = plan.activeBlocks?.[activeDay] || [];
        let newBlocks = currentBlocks;
        if (!currentBlocks.includes(targetBlock)) {
            newBlocks = [...currentBlocks, targetBlock];
            // Optional: Sort blocks order? (Warmup -> Main -> Cool down)
        }

        updatePlan(activeDay, newSchedule, newBlocks);
    };

    const handleAddBlock = (blockName: string) => {
        const currentBlocks = plan.activeBlocks?.[activeDay] || [];
        if (!currentBlocks.includes(blockName)) {
            updatePlan(activeDay, plan.schedule[activeDay], [...currentBlocks, blockName]);
        }
    };

    const handleRemoveBlock = (blockName: string) => {
        // Remove items in this block? Or move them?
        // Let's remove items for now for simplicity, or warn user.
        // For streamlined UX: Move items to Main, then remove block.
        // Actually, let's just delete the block and its items.
        const newSchedule = plan.schedule[activeDay].filter(ex => ex.block !== blockName);
        const newBlocks = (plan.activeBlocks?.[activeDay] || []).filter(b => b !== blockName);
        updatePlan(activeDay, newSchedule, newBlocks);
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
            onDragOver={handleDragOver as any} // Fix typing
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-[calc(100vh-130px)] bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                {/* Top Bar: Navigation & Toggle */}
                <div className="bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 h-14">

                    <div className="flex items-center gap-4">
                        {/* Sidebar Toggle */}
                        {!isWeekView && (
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className={cn("p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors", !sidebarOpen && "bg-slate-100 text-brand-600")}
                                title={sidebarOpen ? "Ocultar Biblioteca" : "Mostrar Biblioteca"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /></svg>
                            </button>
                        )}

                        {/* View Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setIsWeekView(false)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                                    !isWeekView ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Target className="w-3.5 h-3.5" />
                                Día (Focus)
                            </button>
                            <button
                                onClick={() => setIsWeekView(true)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                                    isWeekView ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                Semana
                            </button>
                        </div>
                    </div>

                    {/* Day Tabs (Only visible in Focus Mode) */}
                    {!isWeekView && (
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mx-4">
                            {DAYS.map(day => {
                                const count = plan.schedule[day.key].length;
                                const isActive = activeDay === day.key;
                                return (
                                    <button
                                        key={day.key}
                                        onClick={() => setActiveDay(day.key)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                                            isActive
                                                ? "bg-brand-50 text-brand-700"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
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
                    )}
                </div>

                {/* Content Area */}
                <div className="flex flex-1 overflow-hidden relative">

                    {/* View 1: Focus Mode (Sidebar + Canvas) */}
                    {!isWeekView && (
                        <>
                            {/* 1. Sidebar Library - Collapsible */}
                            <div className={cn(
                                "bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
                                sidebarOpen ? "w-[300px] opacity-100" : "w-0 opacity-0 border-r-0"
                            )}>
                                <div className="p-3 border-b border-slate-100 space-y-2 min-w-[300px]">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                            placeholder="Buscar ejercicios..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient-right">
                                        <button
                                            onClick={() => setSelectedCategory('All')}
                                            className={cn("px-2 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors", selectedCategory === 'All' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                                        >
                                            Todos
                                        </button>
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={cn("px-2 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors", selectedCategory === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar min-w-[300px]">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                                            <span className="text-xs">Cargando...</span>
                                        </div>
                                    ) : (
                                        filteredExercises.map(ex => (
                                            <DraggableLibraryItem
                                                key={ex.id}
                                                id={ex.id!}
                                                data={ex}
                                                onAdd={() => handleAddExercise(ex)}
                                            >
                                                <div className="group flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-100 hover:border-brand-300 hover:shadow-sm transition-all">
                                                    <div className="w-7 h-7 rounded bg-brand-50 flex items-center justify-center shrink-0 text-brand-600 text-xs font-bold">
                                                        {ex.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-8">
                                                        <p className="text-xs font-medium text-slate-700 truncate group-hover:text-brand-700">{ex.name}</p>
                                                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">{ex.category}</p>
                                                    </div>
                                                    {/* Button is handled in DraggableLibraryItem now */}
                                                </div>
                                            </DraggableLibraryItem>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* 2. Active Day Canvas - Sectioned */}
                            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 custom-scrollbar">
                                <div className="w-full max-w-[1600px] mx-auto pb-20">
                                    <div className="mb-6 flex items-center justify-between">

                                        <div className="flex items-center gap-4">
                                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                                {DAYS.find(d => d.key === activeDay)?.label}
                                            </h2>
                                            {/* Top Quick Actions */}
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="bg-white border border-slate-200 text-xs font-medium rounded-md px-2 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer hover:border-brand-300 transition-colors"
                                                    onChange={(e) => {
                                                        if (e.target.value) handleAddBlock(e.target.value);
                                                        e.target.value = "";
                                                    }}
                                                >
                                                    <option value="">+ Añadir Sección</option>
                                                    {Object.values(SESSION_BLOCKS).map(block => (
                                                        <option key={block} value={block}>{block}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <span className="text-sm font-normal text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
                                            {plan.schedule[activeDay].length} Ejercicios
                                        </span>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Default Main Block if no blocks exist */}
                                        {(!plan.activeBlocks?.[activeDay] || plan.activeBlocks[activeDay].length === 0) && (
                                            <div className="text-center py-10">
                                                <Button onClick={() => handleAddBlock(SESSION_BLOCKS.MAIN)}>
                                                    Comenzar Entrenamiento (Agregar Bloque Principal)
                                                </Button>
                                            </div>
                                        )}

                                        {/* Render Sections */}
                                        {(plan.activeBlocks?.[activeDay] || []).map(blockName => {
                                            const blockItems = plan.schedule[activeDay].filter(x => (x.block || SESSION_BLOCKS.MAIN) === blockName);

                                            // Determine Sortable Context for this block
                                            return (
                                                <div key={blockName} className="relative group/section">
                                                    {/* Section Header */}
                                                    <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                                        <h3 className="text-sm font-bold text-brand-700 uppercase tracking-wider flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                                                            {blockName}
                                                        </h3>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleRemoveBlock(blockName)}
                                                                className="text-slate-400 hover:text-red-500 text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3" /> Eliminar Sección
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <DroppableCanvas id={blockName} items={blockItems}>
                                                        <SortableContext
                                                            items={blockItems.map(x => x.id)}
                                                            strategy={verticalListSortingStrategy}
                                                            id={blockName} // Context ID matches Droppable ID
                                                        >
                                                            {blockItems.length === 0 ? (
                                                                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 text-slate-400 text-sm italic hover:bg-white transition-colors">
                                                                    Arrastra o añade ejercicios aquí
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {blockItems.map((item, index) => (
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
                                            )
                                        })}
                                    </div>

                                    {/* Bottom "Quick Add" Area */}
                                    <div className="mt-8 pt-8 border-t border-slate-200 flex justify-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
                                        <Button variant="outline" onClick={() => handleAddBlock(SESSION_BLOCKS.WARMUP)}>
                                            + Calentamiento
                                        </Button>
                                        <Button variant="outline" onClick={() => handleAddBlock(SESSION_BLOCKS.RECOVERY)}>
                                            + Vuelta a la Calma
                                        </Button>
                                    </div>

                                </div>
                            </div>
                        </>
                    )}

                    {/* View 2: Week Overview Grid - Horizontal Scroll */}
                    {isWeekView && (
                        <div className="flex-1 w-full overflow-x-auto p-6 bg-slate-50 custom-scrollbar">
                            <div className="flex gap-4 min-w-full pb-4 h-full">
                                {DAYS.map(day => (
                                    <div key={day.key} className="min-w-[200px] flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden shrink-0">
                                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <h3 className="font-bold text-slate-700">{day.label}</h3>
                                            <span className="text-xs text-slate-400 font-medium">{plan.schedule[day.key].length} ej.</span>
                                        </div>
                                        <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-2 bg-white">
                                            {plan.schedule[day.key].length === 0 ? (
                                                <div className="h-32 flex items-center justify-center text-slate-300 text-xs italic">
                                                    Día de descanso
                                                </div>
                                            ) : (
                                                plan.schedule[day.key].map((ex) => (
                                                    <div key={ex.id} className="p-2 bg-slate-50 rounded border border-slate-100 text-xs hover:border-brand-200 transition-colors">
                                                        <div className="font-semibold text-slate-700 truncate mb-1">{ex.name}</div>
                                                        <div className="flex gap-2 text-slate-500 text-[10px]">
                                                            <span>{ex.details?.sets || '-'} x {ex.details?.reps || '-'}</span>
                                                            {ex.details?.load && <span>{ex.details.load}kg</span>}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-slate-100 bg-slate-50">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-xs h-8 text-brand-600 hover:bg-white hover:shadow-sm"
                                                onClick={() => {
                                                    setActiveDay(day.key);
                                                    setIsWeekView(false);
                                                }}
                                            >
                                                Editar Día
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <DragOverlay>
                {activeDragItem ? (
                    <div className="bg-white p-3 rounded-lg shadow-xl border border-brand-500/30 w-56 opacity-90 cursor-grabbing">
                        <p className="font-bold text-sm text-brand-800 truncate">{activeDragItem.name}</p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// ... Sub-components remain mostly the same, minor style tweaks inlining above logic


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
