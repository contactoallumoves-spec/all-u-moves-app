import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { PlanService } from '../../services/planService';
import { AnnualPlan } from '../../types/plan';
import { startOfWeek, parseISO } from 'date-fns';
import { Patient } from '../../types/patient';
// import { ExerciseService } from '../../services/exerciseService';
import { useSession } from '../../context/SessionContext';
import { Button } from '../../components/ui/Button';
// import { ChevronLeft, Info, Loader2, CheckCircle2, SkipForward } from 'lucide-react';
// import { cn } from '../../lib/utils';
// import { motion } from 'framer-motion'; // Disable Animation temporarily

// CARDS DISABLED TO ISOLATE CRASH
// import { SmartTimer } from './components/SmartTimer';
// import { StrengthCard } from './components/StrengthCard';
// import { PelvicCard } from './components/PelvicCard';
// import { TimerCard } from './components/TimerCard';

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

    console.log("DEBUGVARS:", dispatch, uniqueSessionId); // Force usage

    // 3. Logic: Fetch Plan
    const [annualPlan, setAnnualPlan] = useState<AnnualPlan | null>(null);
    const [currentWeekExercises, setCurrentWeekExercises] = useState<any[] | null>(null);
    const [loadingPlan, setLoadingPlan] = useState(true);

    useEffect(() => {
        setLoadingPlan(true);
        if (patient.id) {
            PlanService.getActivePlan(patient.id)
                .then(plan => setAnnualPlan(plan))
                .catch(err => console.error("Plan Fetch Error", err))
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

        // Fallback
        const legacyExercises = patient.activePlan?.schedule?.[targetDay as keyof typeof patient.activePlan.schedule] || [];
        setCurrentWeekExercises(legacyExercises);

    }, [annualPlan, sessionDate, targetDay, patient.activePlan]);

    const planExercises = currentWeekExercises;

    // 4. Render
    if (loadingPlan && !planExercises) {
        return <div className="p-8 text-center text-brand-600">Cargando Plan... (Hooks OK)</div>;
    }

    if (!planExercises || planExercises.length === 0) {
        return <div className="p-8 text-center text-zinc-500">No hay ejercicios (Hooks OK)</div>;
    }

    const currentItem = planExercises[0]; // Just show first for test

    return (
        <div className="min-h-screen bg-zinc-50 p-6">
            <h1 className="text-xl font-bold text-blue-600 mb-4">SEMI-SAFE MODE</h1>
            <p className="mb-4">Hooks activados. Imports de Cartas desactivados.</p>

            <div className="bg-white p-4 rounded shadow border border-blue-200">
                <h3 className="font-bold mb-2">Datos del Ejercicio:</h3>
                <pre className="text-xs bg-zinc-100 p-2 rounded overflow-auto h-64">
                    {JSON.stringify(currentItem, null, 2)}
                </pre>
            </div>

            <Button className="mt-4" onClick={() => navigate('../home')}>Salir</Button>
        </div>
    );
}
