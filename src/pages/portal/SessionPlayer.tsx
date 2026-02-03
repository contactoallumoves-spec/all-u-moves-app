import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { PlanService } from '../../services/planService';
import { AnnualPlan } from '../../types/plan';
import { startOfWeek, parseISO } from 'date-fns';
import { Patient } from '../../types/patient';
// import { ExerciseService } from '../../services/exerciseService';
import { useSession } from '../../context/SessionContext';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, Info, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
// import { motion } from 'framer-motion'; // [FIX] Disabled Animation to prevent crash

// CARDS (Sequentially enabling)
// import { SmartTimer } from './components/SmartTimer';
import { StrengthCard } from './components/StrengthCard'; // [TEST] Enabling this one
// import { PelvicCard } from './components/PelvicCard';
// import { TimerCard } from './components/TimerCard';
// import { IntervalCard } from './components/IntervalCard';

export default function SessionPlayer() {
    const { patient } = useOutletContext<{ patient: Patient }>();
    const navigate = useNavigate();
    const { dateStr } = useParams<{ dateStr: string }>();

    // 1. RE-ENABLE SESSION CONTEXT
    const { dispatch } = useSession();

    // 2. Logic: Date & IDs
    const sessionDate = dateStr ? parseISO(dateStr) : new Date();
    const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const sessionDayIndex = sessionDate.getDay();
    const targetDay = DAYS_MAP[sessionDayIndex];
    const uniqueSessionId = `${dateStr || new Date().toISOString().split('T')[0]}_${targetDay}`;

    // 3. Logic: Fetch Plan
    const [annualPlan, setAnnualPlan] = useState<AnnualPlan | null>(null);
    const [currentWeekExercises, setCurrentWeekExercises] = useState<any[] | null>(null);
    const [loadingPlan, setLoadingPlan] = useState(true);

    useEffect(() => {
        setLoadingPlan(true);
        if (patient.id) {
            PlanService.getActivePlan(patient.id)
                .then(plan => setAnnualPlan(plan))
                .catch(err => console.error(err))
                .finally(() => setLoadingPlan(false));
        }
    }, [patient.id]);

    useEffect(() => {
        if (annualPlan) {
            // [FIX] Robust Date Parsing
            let planStart: Date;
            const rawStart = annualPlan.startDate;
            if (rawStart && typeof (rawStart as any).toDate === 'function') {
                planStart = (rawStart as any).toDate();
            } else if (typeof rawStart === 'string') {
                planStart = parseISO(rawStart);
            } else if (rawStart instanceof Date) {
                planStart = rawStart;
            } else {
                planStart = new Date();
            }

            const oneDay = 24 * 60 * 60 * 1000;
            const start = startOfWeek(planStart, { weekStartsOn: 1 });
            const current = startOfWeek(sessionDate, { weekStartsOn: 1 });
            const diffDays = Math.round(Math.abs((current.getTime() - start.getTime()) / oneDay));
            const weekNum = Math.floor(diffDays / 7) + 1;

            if (annualPlan.weeks && annualPlan.weeks[weekNum]) {
                const weekPlan = annualPlan.weeks[weekNum];
                const exercises = weekPlan.schedule?.[targetDay as keyof typeof weekPlan.schedule] || [];
                setCurrentWeekExercises(exercises);
                return;
            }
        }

        const legacyExercises = patient.activePlan?.schedule?.[targetDay as keyof typeof patient.activePlan.schedule] || [];
        setCurrentWeekExercises(legacyExercises);

    }, [annualPlan, sessionDate, targetDay, patient.activePlan]);

    const planExercises = currentWeekExercises;

    // 4. Player State
    const [activeIndex, setActiveIndex] = useState(0);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        setActiveIndex(0);
        // Init Session Log if needed
        if (planExercises && planExercises.length > 0 && patient.id) {
            dispatch({ type: 'INIT_SESSION', payload: { sessionId: uniqueSessionId, patientId: patient.id } });
        }
    }, [uniqueSessionId, patient.id, planExercises?.length]);

    // Navigation
    const handleNext = () => {
        if (activeIndex < (planExercises?.length || 0) - 1) {
            setActiveIndex(prev => prev + 1);
        } else {
            navigate('../home');
        }
    };

    const handlePrev = () => {
        if (activeIndex > 0) setActiveIndex(prev => prev - 1);
    };

    const handleSetComplete = () => {
        console.log("Set Completed");
    };

    // 5. Guards
    if (loadingPlan && !planExercises) return <div className="fixed inset-0 bg-white flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;
    if (!planExercises || planExercises.length === 0) return <div className="p-8 text-center">Descanso</div>;

    const currentItem = planExercises[activeIndex];

    if (!currentItem) return <div>Cargando...</div>;


    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-zinc-100 sticky top-0 z-40">
                <button onClick={() => navigate('../home')} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                        Ejercicio {activeIndex + 1} de {planExercises?.length}
                    </p>
                    <h2 className="text-sm font-medium text-zinc-900 truncate max-w-[200px]">
                        {currentItem.name || "Ejercicio"}
                    </h2>
                </div>
                <div className="w-10 flex justify-end">
                    <button onClick={() => setShowInfo(!showInfo)} className="p-2 -mr-2 text-zinc-400 hover:text-brand-500">
                        <Info className={cn("w-5 h-5", showInfo && "text-brand-500 fill-brand-50")} />
                    </button>
                </div>
            </div>

            {/* Content w/o Motion */}
            <div className="flex-1 overflow-y-auto pb-24 relative">
                <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand-50/50 to-transparent pointer-events-none" />

                <div className="p-4 relative z-10 max-w-md mx-auto space-y-6">
                    {/* CARD RENDERER */}
                    <div className="bg-white rounded-3xl p-1 shadow-sm border border-zinc-100 overflow-hidden">
                        {(() => {
                            const explicitType = currentItem.details?.cardType;
                            // Only StrengthCard enabled for now
                            if (explicitType === 'pelvic' || explicitType === 'timer') {
                                return <div className="p-4 text-center text-zinc-400">Carta desactivada por seguridad (Modo Debug)</div>
                            }
                            return <StrengthCard exercise={currentItem} sessionId={uniqueSessionId} onSetComplete={handleSetComplete} />;
                        })()}
                    </div>

                    {showInfo && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                            <h4 className="font-semibold text-blue-900 text-sm mb-2">Instrucciones</h4>
                            <p className="text-sm text-blue-800">{currentItem.details?.instructions || "Sin instrucciones."}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white border-t border-zinc-100 p-4 sticky bottom-0 z-40 safe-area-pb">
                <div className="max-w-md mx-auto flex gap-3">
                    <Button variant="ghost" className="flex-1 h-14" onClick={handlePrev} disabled={activeIndex === 0}>Anterior</Button>
                    <Button className="flex-[2] h-14" onClick={handleNext}>
                        {activeIndex === planExercises.length - 1 ? "Finalizar" : "Siguiente"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
