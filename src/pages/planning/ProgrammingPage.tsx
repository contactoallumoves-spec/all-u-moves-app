import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlanService } from '../../services/planService';
import { PatientService } from '../../services/patientService';
import { SessionLogService } from '../../services/sessionLogService';
import { AnnualPlan } from '../../types/plan';
import { Patient, PrescribedPlan } from '../../types/patient';
// import { PlanBuilder } from '../../components/clinical/PlanBuilder'; // OLD
import { PlanBuilderV3 } from '../../components/clinical/PlanBuilderV3'; // NEW
import { Timestamp } from 'firebase/firestore';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ArrowLeft, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { SaveWeekAsTemplateModal } from '../../components/programs/SaveWeekAsTemplateModal';

export default function ProgrammingPage() {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [annualPlan, setAnnualPlan] = useState<AnnualPlan | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
    const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

    // Date State
    const [selectedDate, setSelectedDate] = useState(new Date()); // The specific day selected or today
    const [currentMonth, setCurrentMonth] = useState(new Date()); // For the mini-calendar navigation

    useEffect(() => {
        if (patientId) loadData();
    }, [patientId]);

    const loadData = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const [planData, patientData, logs] = await Promise.all([
                PlanService.getActivePlan(patientId),
                PatientService.getById(patientId),
                SessionLogService.getByPatientId(patientId)
            ]);

            // Process Completed Dates
            const dates = new Set(logs.map(log => {
                const d = (log.date as any)?.toDate ? (log.date as any).toDate() : new Date(log.date);
                return format(d, 'yyyy-MM-dd');
            }));
            setCompletedDates(dates);

            let activePlan = planData;
            // Create default plan if needed
            if (!activePlan) {
                const newId = await PlanService.create(patientId, `Temporada ${new Date().getFullYear()}`, new Date());
                activePlan = {
                    id: newId,
                    patientId,
                    name: `Temporada ${new Date().getFullYear()}`,
                    startDate: new Date(),
                    macrocycles: [],
                    weeks: {},
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }
            setAnnualPlan(activePlan);
            setPatient(patientData);
        } catch (error) {
            console.error("Error loading planner data", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Week Data based on Selected Date
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start

    const getWeekNumber = (date: Date, planStart: Date) => {
        const oneDay = 24 * 60 * 60 * 1000;
        const start = startOfWeek(planStart, { weekStartsOn: 1 });
        const current = startOfWeek(date, { weekStartsOn: 1 });
        const diffDays = Math.round(Math.abs((current.getTime() - start.getTime()) / oneDay));
        return Math.floor(diffDays / 7) + 1;
    };

    const currentWeekNumber = annualPlan ? getWeekNumber(selectedDate, annualPlan.startDate instanceof Timestamp ? annualPlan.startDate.toDate() : new Date(annualPlan.startDate)) : 1;

    // Persist changes
    const handleSaveWeek = async (weekPlan: PrescribedPlan) => {
        if (!annualPlan?.id) return;

        try {
            // 1. Update Annual Plan Repository
            await PlanService.updateWeek(annualPlan.id, currentWeekNumber, weekPlan);

            // 2. Sync to Patient Active Plan (For Portal Visibility)
            const weekEndDate = endOfDay(addDays(currentWeekStart, 6)); // Sunday end of day

            if (patientId) {
                await PatientService.update(patientId, {
                    activePlan: {
                        ...weekPlan,
                        endDate: weekEndDate
                    }
                });
            }

            // 3. Update Local State
            if (annualPlan) {
                const updatedWeeks = { ...annualPlan.weeks, [currentWeekNumber]: weekPlan };
                setAnnualPlan({ ...annualPlan, weeks: updatedWeeks });
            }
        } catch (error) {
            console.error("Error saving week:", error);
            alert("Error al guardar cambios");
        }
    };

    const getWeekInitialPlan = (): PrescribedPlan => {
        if (!annualPlan) return {} as any;
        const existing = annualPlan.weeks[currentWeekNumber];
        if (existing) return existing;

        return {
            startDate: Timestamp.fromDate(currentWeekStart),
            schedule: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
            activeBlocks: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
        };
    };

    // Mini Calendar Logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 6);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Generate weekDates object for PlanBuilder header
    const weekDates = {
        monday: currentWeekStart,
        tuesday: addDays(currentWeekStart, 1),
        wednesday: addDays(currentWeekStart, 2),
        thursday: addDays(currentWeekStart, 3),
        friday: addDays(currentWeekStart, 4),
        saturday: addDays(currentWeekStart, 5),
        sunday: addDays(currentWeekStart, 6),
    };

    if (loading) return <div className="p-8 text-brand-500 animate-pulse">Cargando Programación...</div>;
    if (!annualPlan || !patient) return <div className="p-8 text-red-500">Error: No se pudo cargar los datos.</div>;

    const currentWeekPlan = getWeekInitialPlan();

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
            {/* Sidebar Calendar */}
            <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/50 p-4 shrink-0">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:bg-transparent hover:text-brand-600 justify-start"
                    onClick={() => navigate(`/users/${patientId}`)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Ficha
                </Button>

                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-white rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                    <h2 className="font-bold text-gray-900 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-white rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 text-center text-xs mb-2 text-gray-400 font-medium">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-sm">
                    {calendarDays.map((day) => {
                        const isSameMonthDay = isSameMonth(day, monthStart);
                        const isSelected = isSameDay(day, selectedDate);

                        const weekNum = getWeekNumber(day, annualPlan.startDate instanceof Timestamp ? annualPlan.startDate.toDate() : new Date(annualPlan.startDate));
                        const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
                        const dayKey = dayKeys[day.getDay()];
                        const hasData = annualPlan.weeks[weekNum]?.schedule?.[dayKey]?.length > 0;

                        // Check Completion
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isCompleted = completedDates.has(dateStr);

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    "h-9 flex items-center justify-center rounded-lg relative transition-all",
                                    !isSameMonthDay && "text-gray-300",
                                    isSelected && "bg-brand-500 text-white shadow-md font-bold",
                                    !isSelected && isSameMonthDay && "hover:bg-white hover:shadow-sm text-gray-700",
                                )}
                            >
                                {format(day, 'd')}
                                {(hasData || isCompleted) && !isSelected && (
                                    <div className={cn(
                                        "absolute bottom-1 w-1 h-1 rounded-full",
                                        isCompleted ? "bg-green-500" : "bg-brand-400"
                                    )}></div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6">
                    <Button onClick={() => setSelectedDate(new Date())} variant="outline" size="sm" className="w-full">
                        Hoy
                    </Button>
                </div>

                <div className="mt-8"></div>
            </div>

            {/* Main Content: Week View */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header for Week */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-brand-900 capitalize">
                            {format(currentWeekStart, 'MMMM yyyy', { locale: es })}
                        </h1>
                        <p className="text-brand-500 text-sm">
                            Semana del {format(currentWeekStart, 'd')} al {format(addDays(currentWeekStart, 6), 'd MMM')}
                        </p>
                    </div>
                    {/* [NEW] Save as Template Button */}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setSaveTemplateOpen(true)}>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar como Plantilla
                        </Button>
                    </div>
                </div>

                {/* Plan Builder V3 (Week Editor) */}
                <div className="flex-1 overflow-hidden relative">
                    <PlanBuilderV3
                        key={currentWeekNumber} // Re-mount on week change
                        patient={patient}
                        initialPlan={currentWeekPlan}
                        customSaveHandler={handleSaveWeek}
                        weekDates={weekDates} // Pass real dates for the header
                    />
                </div>
            </div>

            {/* [NEW] Modal */}
            <SaveWeekAsTemplateModal
                weekPlan={currentWeekPlan}
                open={saveTemplateOpen}
                onClose={() => setSaveTemplateOpen(false)}
            />
        </div>
    );
}
