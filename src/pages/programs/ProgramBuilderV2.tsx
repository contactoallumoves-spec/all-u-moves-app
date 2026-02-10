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

export default function ProgramBuilderV2() {
    const { programId } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState<ProProgram>(INITIAL_PROGRAM);
    const [activeWeekIndex, setActiveWeekIndex] = useState(0);

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
        setActiveWeekIndex(program.weeks.length); // Switch to new week
    };

    // Save Handling
    const handleSave = async () => {
        try {
            console.log("Saving Program:", program);
            const { id, ...data } = program;

            // Clean up unwanted fields if any
            // Ensure weeks are properly formatted

            if (id === 'new') {
                await ProgramService.create(data);
                // navigate(`/programs/${newId}`); // Stay on page or go back?
                navigate('/programs'); // Go back to library
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

    // Create generic "Week Dates" for the builder
    // Since it's a template, we just use a dummy week (e.g. current week) purely for the column headers "Lunes", "Martes"...
    const dummyDate = new Date();
    // Monday of current week
    const monday = new Date(dummyDate.setDate(dummyDate.getDate() - dummyDate.getDay() + 1));
    const weekDates = {
        monday: monday,
        tuesday: new Date(new Date(monday).setDate(monday.getDate() + 1)),
        wednesday: new Date(new Date(monday).setDate(monday.getDate() + 2)),
        thursday: new Date(new Date(monday).setDate(monday.getDate() + 3)),
        friday: new Date(new Date(monday).setDate(monday.getDate() + 4)),
        saturday: new Date(new Date(monday).setDate(monday.getDate() + 5)),
        sunday: new Date(new Date(monday).setDate(monday.getDate() + 6)),
    };

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
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
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
            <div className="flex flex-1 overflow-hidden">
                {/* Week Selector Sidebar */}
                <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Semanas</h3>
                        <Button onClick={addWeek} variant="outline" size="sm" className="w-full justify-start text-xs border-dashed border-slate-300 text-slate-500 hover:text-brand-600 hover:border-brand-300 h-8">
                            <Plus className="w-3 h-3 mr-2" /> Añadir Semana
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {program.weeks.map((week, idx) => (
                            <button
                                key={week.id}
                                onClick={() => setActiveWeekIndex(idx)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all text-left group",
                                    activeWeekIndex === idx
                                        ? "bg-brand-50 text-brand-900 ring-1 ring-brand-200 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <span className={cn(
                                        "w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold",
                                        activeWeekIndex === idx ? "bg-brand-200 text-brand-700" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                    )}>
                                        {idx + 1}
                                    </span>
                                    {week.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* The Builder Canvas */}
                <div className="flex-1 overflow-hidden bg-white flex flex-col">
                    {/* Reuse PlanBuilder but adapt it */}
                    {/* Note: We pass 'patient={null}' or a dummy object to indicate template mode if generic builder supports it. */}
                    {/* For now, reusing PlanBuilder with dummy dates. */}
                    <PlanBuilderV3
                        key={currentWeek.id} // Reset on week switch
                        patient={null as any} // Template mode
                        initialPlan={templatePlan as any}
                        weekDates={weekDates}
                        customSaveHandler={async (updatedPlan) => {
                            // Map back from PrescribedPlan (Flat) to ProProgramWeek (Nested)
                            const updatedWeeks = [...program.weeks];
                            const currentWeek = updatedWeeks[activeWeekIndex];

                            // Re-nesting Logic
                            const newDays: any = { ...currentWeek.days };

                            const blocks = updatedPlan.activeBlocks || {
                                monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
                            };

                            Object.keys(newDays).forEach(dayKey => {
                                const dayBlocks: string[] = blocks[dayKey as keyof typeof blocks] || [];
                                const dayExercises = updatedPlan.schedule[dayKey as keyof typeof updatedPlan.schedule] || [];

                                // Create sections from blocks
                                // In V3, simplified blocks to just MAIN for now, or ensure block tag is preserved
                                const newSections = dayBlocks.map((blockName, index) => {
                                    // Find exercises for this block
                                    const sectionExercises = dayExercises
                                        .filter((ex: any) => ex.block === blockName || (!ex.block && blockName === 'Trabajo Principal'))
                                        .map((ex: any) => {
                                            // Clean up the 'block' property we added for flattening
                                            const { block, ...rest } = ex;
                                            return rest;
                                        });

                                    return {
                                        id: crypto.randomUUID(), // Or preserve if we tracked IDs
                                        name: blockName,
                                        type: 'strength', // Default
                                        order: index + 1,
                                        exercises: sectionExercises
                                    };
                                });

                                newDays[dayKey] = {
                                    ...newDays[dayKey],
                                    sections: newSections
                                };
                            });

                            updatedWeeks[activeWeekIndex] = {
                                ...currentWeek,
                                days: newDays
                            };

                            setProgram(prev => ({ ...prev, weeks: updatedWeeks }));
                        }}
                    />
                </div>
            </div>
            );</div>
    );
}
