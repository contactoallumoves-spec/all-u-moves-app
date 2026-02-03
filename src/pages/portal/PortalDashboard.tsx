import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { Patient, SessionLog } from '../../types/patient';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { format, isBefore, startOfDay, isAfter, endOfDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { SessionLogService } from '../../services/sessionLogService';
import { ExerciseService } from '../../services/exerciseService';

import { PlanService } from '../../services/planService';
import { AnnualPlan } from '../../types/plan';

const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function PortalDashboard() {
    const { patient } = useOutletContext<{ patient: Patient }>();
    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>();

    // State for selected day view (default to Today)
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
    const [equipmentList, setEquipmentList] = useState<string[]>([]);

    // Derived State
    const dayIndex = selectedDate.getDay();
    const dayKey = DAYS_MAP[dayIndex]; // 'monday', 'tuesday' etc.
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    // Plan Data
    const [annualPlan, setAnnualPlan] = useState<AnnualPlan | null>(null);

    // Fetch Annual Plan
    useEffect(() => {
        if (patient.id) {
            PlanService.getActivePlan(patient.id)
                .then(plan => setAnnualPlan(plan))
                .catch(err => console.error("Error fetching annual plan", err));
        }
    }, [patient.id]);

    // Derived Week Logic
    const getActiveWeekPlan = () => {
        // 1. If we have an Annual Plan, try to find the specific week for the selected date
        if (annualPlan) {
            const planStart = annualPlan.startDate instanceof Date ? annualPlan.startDate : (annualPlan.startDate as any).toDate();
            // Calculate relative week number manually to match ProgrammingPage logic
            const oneDay = 24 * 60 * 60 * 1000;
            const start = startOfWeek(planStart, { weekStartsOn: 1 });
            const current = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const diffDays = Math.round(Math.abs((current.getTime() - start.getTime()) / oneDay));
            const weekNum = Math.floor(diffDays / 7) + 1;

            if (annualPlan.weeks && annualPlan.weeks[weekNum]) {
                return annualPlan.weeks[weekNum];
            }
        }

        // 2. Fallback to the generic activePlan on the patient (Legacy/Simplest)
        return patient.activePlan;
    };

    const activePlan = getActiveWeekPlan();

    // Helper for Firestore Timestamps or Strings
    const safeDate = (d: any): Date | undefined => {
        if (!d) return undefined;
        try {
            // Firestore Timestamp strategy 1: method
            if (typeof d.toDate === 'function') return d.toDate();

            // Strategy 2: serialized object { seconds, ... }
            if (typeof d === 'object' && d !== null && 'seconds' in d) {
                return new Date(d.seconds * 1000);
            }

            // Strategy 3: Native Date
            if (d instanceof Date) return d;

            // Strategy 4: String/Number construction
            const parsed = new Date(d);
            return isNaN(parsed.getTime()) ? undefined : parsed;
        } catch (e) {
            return undefined;
        }
    };

    //... (keep existing code in between)

    {/* TEMP DEBUG: Verify Plan Dates */ }
    <div className="text-[10px] text-zinc-300 p-2 text-center font-mono overflow-hidden text-ellipsis whitespace-nowrap">
        Start: {safeDate(activePlan?.startDate) ? format(safeDate(activePlan?.startDate)!, 'yyyy-MM-dd') : 'INVALID'} |
        End: {safeDate(activePlan?.endDate) ? format(safeDate(activePlan?.endDate)!, 'yyyy-MM-dd') : 'OPEN'}
    </div>

    // [NEW] Check if Selected Date is within Plan Duration
    const isPlanActiveForDate = activePlan ? (() => {
        const planStart = safeDate(activePlan.startDate);
        if (!planStart) return true; // Safety: if no start date, assume active or handle as error? Assume active to avoid blocking.

        // Start of plan is inclusive
        if (isBefore(selectedDate, startOfDay(planStart))) return false;

        // If end date exists
        if (activePlan.endDate) {
            const planEnd = safeDate(activePlan.endDate);
            if (planEnd && isAfter(selectedDate, endOfDay(planEnd))) return false;
        }
        return true;
    })() : false;

    // Calculate Scheduled Days (e.g. ['monday', 'wednesday'])
    const scheduledDays = activePlan && activePlan.schedule
        ? Object.entries(activePlan.schedule)
            .filter(([_, exercises]) => exercises && exercises.length > 0)
            .map(([day]) => day)
        : [];

    // Fetch Session Logs on Mount
    useEffect(() => {
        if (patient.id) {
            SessionLogService.getByPatientId(patient.id)
                .then(logs => setSessionLogs(logs))
                .catch(err => console.error("Error fetching logs", err));
        }
    }, [patient.id]);

    // [NEW] Fetch Equipment for Selected Exercises
    useEffect(() => {
        const fetchEquipment = async () => {
            if (!activePlan?.schedule || !(dayKey in activePlan.schedule)) {
                setEquipmentList([]);
                return;
            }

            const exercises = activePlan.schedule[dayKey as keyof typeof activePlan.schedule] || [];
            if (exercises.length === 0) {
                setEquipmentList([]);
                return;
            }

            // Optimization: Maybe cache this in a real app, but for V1 we fetch
            try {
                const equipmentSet = new Set<string>();
                await Promise.all(exercises.map(async (ex) => {
                    const fullExercise = await ExerciseService.getById(ex.exerciseId);
                    if (fullExercise && fullExercise.equipment) {
                        fullExercise.equipment.forEach(eq => {
                            if (eq && eq !== 'Sin Implemento') equipmentSet.add(eq);
                        });
                    }
                }));
                setEquipmentList(Array.from(equipmentSet));
            } catch (error) {
                console.error("Error fetching equipment", error);
            }
        };

        fetchEquipment();
    }, [dayKey, activePlan]);

    // Compute Completed Dates
    const completedDates = sessionLogs.map(log => {
        const d = safeDate(log.date);
        return d ? format(d, 'yyyy-MM-dd') : '';
    }).filter(d => d !== '');

    // Selected Date Content
    const selectedExercises = activePlan && activePlan.schedule && (dayKey in activePlan.schedule)
        ? activePlan.schedule[dayKey as keyof typeof activePlan.schedule]
        : [];

    // Check if the SELECTED date is completed
    const isSelectedDateCompleted = completedDates.includes(format(selectedDate, 'yyyy-MM-dd'));

    // [FIX] Has Session: Must be scheduled AND within plan dates
    const hasSession = isPlanActiveForDate && selectedExercises && selectedExercises.length > 0;

    // Missed Logic
    const isMissed = hasSession && !isSelectedDateCompleted && isBefore(selectedDate, startOfDay(new Date()));

    // Equipment Summary
    const equipmentSummary = equipmentList.join(', ') || ((hasSession && equipmentList.length === 0) ? '' : '');

    // Formatting
    const dayName = format(selectedDate, 'EEEE', { locale: es }); // "lunes"
    const displayDate = format(selectedDate, "d 'de' MMMM", { locale: es }); // "3 de Febrero"
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header / Nav */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-serif text-brand-900">Hola, {patient.firstName}</h1>
                        <p className="text-xs text-brand-500 capitalize">{capitalizedDay}, {displayDate}</p>
                    </div>
                </div>
            </div>

            {/* Weekly Calendar (Interactive) */}
            <WeeklyCalendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                scheduledDays={scheduledDays}
                completedDates={completedDates}
                planStartDate={safeDate(activePlan?.startDate)}
                planEndDate={safeDate(activePlan?.endDate)}
            />

            {/* Selected Day Card */}
            <Card className="mx-4 mt-4 border-none shadow-xl bg-white/80 backdrop-blur-sm relative overflow-hidden flex-1 mb-20">
                {/* Decorative Background Blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 pointer-events-none" />

                <CardContent className="p-0 h-full flex flex-col justify-between relative z-10">
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-brand-50 text-[10px] uppercase tracking-wider font-bold text-brand-600 rounded-sm">
                                {isToday ? 'HOY' : capitalizedDay}
                            </span>
                            {/* Visual Status Badge */}
                            {isSelectedDateCompleted ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> COMPLETADA
                                </span>
                            ) : isMissed ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full animate-pulse">
                                    RECUPERAR SESIÓN
                                </span>
                            ) : null}
                        </div>

                        <div>
                            {hasSession ? (
                                <>
                                    <h2 className="text-xl font-bold text-brand-900 leading-tight">
                                        Tu Sesión
                                    </h2>
                                    {/* Equipment Summary Line */}
                                    {equipmentSummary && (
                                        <p className="text-xs text-brand-500 mt-1 flex items-center gap-1">
                                            <span className="font-semibold">+</span> {equipmentSummary}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-[9px]">
                                                {selectedExercises.length}
                                            </div>
                                            ejercicios
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> ~45 min
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <h2 className="text-xl font-bold text-brand-900">Día de Descanso</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        No hay ejercicios programados para hoy. ¡Aprovecha para recuperar energía!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Exercise Preview List (First 3) */}
                        {hasSession && (
                            <div className="space-y-2 mt-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">PREVIEW</p>
                                {selectedExercises.slice(0, 3).map((ex: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/50 border border-gray-100">
                                        <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-700">
                                            {i + 1}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 truncate">{ex.name}</span>
                                    </div>
                                ))}
                                {selectedExercises.length > 3 && (
                                    <p className="text-xs text-center text-brand-400 pt-1">
                                        + {selectedExercises.length - 3} ejercicios más
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Main CTA */}
                    <div className="p-5 pt-0 mt-auto">
                        {hasSession ? (
                            <Button
                                className="w-full bg-brand-900 hover:bg-brand-800 text-white shadow-brand-900/20 shadow-lg h-12 text-sm font-medium flex justify-between items-center pl-6 pr-4 group transition-all"
                                onClick={() => navigate(`/portal/${token}/session/${dayKey}`)}
                            >
                                <span>Iniciar Sesión</span>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full border-dashed border-gray-300 text-gray-400 hover:bg-gray-50 hover:text-gray-500 h-12"
                                disabled
                            >
                                Descanso Programado
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card >

            {/* TEMP DEBUG: Verify Plan Dates */}
            <div className="text-[10px] text-zinc-300 p-2 text-center font-mono">
                DEBUG: Plan Start: {activePlan?.startDate ? String(activePlan.startDate) : 'None'} |
                Safe: {safeDate(activePlan?.startDate) ? format(safeDate(activePlan?.startDate)!, 'yyyy-MM-dd') : 'INVALID'}
            </div>
        </div >
    );
}
