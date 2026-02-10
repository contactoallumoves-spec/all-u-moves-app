import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProProgram, ProProgramWeek } from '../../types/pro-plan';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Plus, Save, MoreVertical } from 'lucide-react';
import { ProgramService } from '../../services/programService'; // [NEW]
import { cn } from '../../lib/utils';
import { PlanBuilderV3 } from '../../components/clinical/PlanBuilderV3';
import { Timestamp } from 'firebase/firestore';

// Initial Template State
const INITIAL_PROGRAM: ProProgram = {
    id: 'new',
    name: 'Nuevo Programa',
    description: '',
    tags: [],
    authorId: 'me',
    createdAt: new Date(),
    updatedAt: new Date(),
    weeks: [
        {
            id: crypto.randomUUID(),
            order: 1,
            name: 'Semana 1',
            days: {
                monday: { id: 'mon', sections: [] },
                tuesday: { id: 'tue', sections: [] },
                wednesday: { id: 'wed', sections: [] },
                thursday: { id: 'thu', sections: [] },
                friday: { id: 'fri', sections: [] },
                saturday: { id: 'sat', sections: [] },
                sunday: { id: 'sun', sections: [] },
            }
        }
    ]
};

// ... imports

export default function ProgramBuilderV2() {
    const { programId } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState<ProProgram>(INITIAL_PROGRAM);
    const [activeWeekIndex, setActiveWeekIndex] = useState(0);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false); // Hover state

    // [NEW] Load program if ID exists (Mock)
    useEffect(() => {
        if (programId && programId !== 'new') {
            console.log("Loading program:", programId);
            // Simulate load
            setProgram(prev => ({ ...prev, id: programId, name: "Programa Existente Mock" }));
        }
    }, [programId]);

    // Week Management
    const addWeek = () => {
        const newWeek: ProProgramWeek = {
            id: crypto.randomUUID(),
            order: program.weeks.length + 1,
            name: `Semana ${program.weeks.length + 1}`,
            days: {
                monday: { id: 'mon', sections: [] },
                tuesday: { id: 'tue', sections: [] },
                wednesday: { id: 'wed', sections: [] },
                thursday: { id: 'thu', sections: [] },
                friday: { id: 'fri', sections: [] },
                saturday: { id: 'sat', sections: [] },
                sunday: { id: 'sun', sections: [] },
            }
        };
        setProgram({ ...program, weeks: [...program.weeks, newWeek] });
        setActiveWeekIndex(program.weeks.length);
    };

    // Save Handling
    const handleSave = async () => {
        try {
            console.log("Saving Program:", program);
            const { id, ...data } = program;

            if (id === 'new') {
                await ProgramService.create(data);
                navigate('/programs');
            } else {
                await ProgramService.update(id, data);
            }
        } catch (error) {
            console.error("Error saving program:", error);
            alert("Error al guardar el programa. Revisa la consola.");
        }
    };

    // Transforming ProProgramWeek to PrescribedPlan format for the PlanBuilder component
    // We need to "fake" the dates for the PlanBuilder visual generic component
    const currentWeek: ProProgramWeek = program.weeks[activeWeekIndex];

    // Helper to map generic template structure to PrescribedPlan structure expected by PlanBuilder
    const getTemplatePlan = () => {
        const schedule: any = {
            monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
        };
        const activeBlocks: any = {
            monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
        };

        // Flatten nested sections into flat schedule + block names
        Object.entries(currentWeek.days).forEach(([dayKey, dayData]: [string, any]) => {
            const sections = dayData.sections || [];
            sections.forEach((section: any) => {
                // Add block name
                activeBlocks[dayKey].push(section.name);
                // Add exercises with block tag
                (section.exercises || []).forEach((ex: any) => {
                    schedule[dayKey].push({
                        ...ex,
                        block: section.name
                    });
                });
            });
        });

        return {
            startDate: Timestamp.now(),
            schedule,
            activeBlocks
        };
    };

    const templatePlan = getTemplatePlan();

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 flex-col">
            {/* Top Bar */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                {/* ... (Header content unchanged) */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/programs')}>
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </Button>
                    <div>
                        <input
                            type="text"
                            value={program.name}
                            onChange={(e) => setProgram({ ...program, name: e.target.value })}
                            className="text-xl font-bold text-slate-900 border-none focus:ring-0 p-0 placeholder:text-slate-300 w-96 bg-transparent"
                            placeholder="Nombre del Programa (ej: Fase 1)"
                        />
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
                            <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded uppercase tracking-wider">Plantilla</span>
                            <span>•</span>
                            <span>{program.weeks.length} Semanas</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="text-slate-500 border-slate-200">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                    <Button onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10">
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Plantilla
                    </Button>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Week Selector Sidebar - Hover Expandable */}
                <div
                    className={cn(
                        "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-30 absolute left-0 top-0 bottom-0 shadow-xl",
                        isSidebarHovered ? "w-64" : "w-14 items-center"
                    )}
                    onMouseEnter={() => setIsSidebarHovered(true)}
                    onMouseLeave={() => setIsSidebarHovered(false)}
                >
                    <div className={cn(
                        "p-4 border-b border-slate-100 bg-slate-50/50 flex items-center h-14 shrink-0 overflow-hidden whitespace-nowrap",
                        isSidebarHovered ? "justify-between" : "justify-center px-0"
                    )}>
                        {isSidebarHovered ? (
                            <>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semanas</h3>
                                <div className="p-1 text-slate-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left-close"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /><path d="m16 15-3-3 3-3" /></svg>
                                </div>
                            </>
                        ) : (
                            <span className="text-[10px] font-bold text-slate-400">SEM</span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar w-full">
                        {program.weeks.map((week, idx) => (
                            <button
                                key={week.id}
                                onClick={() => setActiveWeekIndex(idx)}
                                className={cn(
                                    "flex items-center transition-all text-left group rounded-lg relative overflow-hidden whitespace-nowrap",
                                    isSidebarHovered ? "w-full px-3 py-3 justify-start" : "w-10 h-10 justify-center p-0",
                                    activeWeekIndex === idx
                                        ? "bg-brand-50 text-brand-900 ring-1 ring-brand-200 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50"
                                )}
                                title={week.name}
                            >
                                <span className={cn(
                                    "flex items-center justify-center rounded text-xs font-bold shrink-0 transition-all",
                                    isSidebarHovered ? "w-5 h-5 text-[10px] mr-2" : "w-full h-full text-xs",
                                    activeWeekIndex === idx ? "bg-brand-200 text-brand-700" : "bg-transparent text-slate-400 group-hover:bg-slate-200"
                                )}>
                                    {idx + 1}
                                </span>
                                <span className={cn(
                                    "text-sm font-medium transition-opacity duration-200",
                                    isSidebarHovered ? "opacity-100" : "opacity-0 w-0 hidden"
                                )}>
                                    {week.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Add Week Button */}
                    <div className="p-2 border-t border-slate-100 mt-auto shrink-0 bg-white">
                        <button
                            onClick={addWeek}
                            className={cn(
                                "flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-colors border-dashed border-slate-300 hover:border-brand-300",
                                isSidebarHovered ? "w-full py-2 px-3 border text-xs gap-2" : "w-10 h-10 border-0"
                            )}
                            title="Añadir Semana"
                        >
                            <Plus className={cn("transition-all", isSidebarHovered ? "w-3 h-3" : "w-5 h-5")} />
                            {isSidebarHovered && <span>Añadir Semana</span>}
                        </button>
                    </div>
                </div>

                {/* Main Content Spacer - since sidebar is absolute, we add a margin equal to collapsed width */}
                <div className="flex-1 overflow-hidden bg-white flex flex-col pl-14 transition-all">
                    {/* Reuse PlanBuilder but adapt it */}
                    <PlanBuilderV3
                        key={currentWeek.id}
                        patient={null as any}
                        initialPlan={templatePlan as any}
                        customSaveHandler={async (updatedPlan) => {
                            // ... (existing save handler logic)
                            const updatedWeeks = [...program.weeks];
                            const currentWeek = updatedWeeks[activeWeekIndex];
                            const newDays: any = { ...currentWeek.days };
                            const blocks = updatedPlan.activeBlocks || {
                                monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
                            };

                            Object.keys(newDays).forEach(dayKey => {
                                const dayBlocks: string[] = blocks[dayKey as keyof typeof blocks] || [];
                                const dayExercises = updatedPlan.schedule[dayKey as keyof typeof updatedPlan.schedule] || [];
                                const newSections = dayBlocks.map((blockName, index) => {
                                    const sectionExercises = dayExercises
                                        .filter((ex: any) => ex.block === blockName || (!ex.block && blockName === 'Trabajo Principal'))
                                        .map((ex: any) => {
                                            const { block, ...rest } = ex;
                                            return rest;
                                        });

                                    return {
                                        id: crypto.randomUUID(),
                                        name: blockName,
                                        type: 'strength',
                                        order: index + 1,
                                        exercises: sectionExercises
                                    };
                                });
                                newDays[dayKey] = { ...newDays[dayKey], sections: newSections };
                            });
                            updatedWeeks[activeWeekIndex] = { ...currentWeek, days: newDays };
                            setProgram(prev => ({ ...prev, weeks: updatedWeeks }));
                        }}
                    />
                </div>
            </div>
            );</div>
    );
}
