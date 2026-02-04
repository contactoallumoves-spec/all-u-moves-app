import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { PlanService } from '../../services/planService';
import { AnnualPlan } from '../../types/plan';
import { startOfWeek, parseISO } from 'date-fns';
import { Patient } from '../../types/patient';
import { ExerciseService } from '../../services/exerciseService';
import { useSession } from '../../context/SessionContext';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, Info, Loader2, CheckCircle2, Play, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
// import { motion } from 'framer-motion'; // [FIX] Disabled Animation to prevent crash

// CARDS
import { SmartTimer } from './components/SmartTimer';
import { StrengthCard } from './components/StrengthCard';
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
    const [fullExercise, setFullExercise] = useState<any>(null); // [NEW] Full Details (Video)
    const [isTimerVisible, setIsTimerVisible] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        setActiveIndex(0);
        setIsFinished(false);
        // Init Session Log if needed
        if (planExercises && planExercises.length > 0 && patient.id) {
            dispatch({ type: 'INIT_SESSION', payload: { sessionId: uniqueSessionId, patientId: patient.id } });
        }
    }, [uniqueSessionId, patient.id, planExercises?.length]);

    const currentItem = planExercises?.[activeIndex];

    // [NEW] Fetch Full Exercise Details
    useEffect(() => {
        if (currentItem?.exerciseId) {
            // Optimization: If we already have this exercise loaded, do nothing
            if (fullExercise && fullExercise.id === currentItem.exerciseId) {
                return;
            }

            setFullExercise(null); // Clear only if changing ID
            ExerciseService.getById(currentItem.exerciseId).then(ex => {
                setFullExercise(ex);
            }).catch(e => {
                console.error("Failed to fetch exercise details", e);
                setFullExercise(null);
            });
        }
    }, [currentItem?.exerciseId, fullExercise]);

    // Navigation
    const handleNext = () => {
        if (activeIndex < (planExercises?.length || 0) - 1) {
            setActiveIndex(prev => prev + 1);
            // setFullExercise(null); // [FIX] Don't clear here, let useEffect handle it
        } else {
            setIsFinished(true); // Show Finish Screen instead of just exiting
        }
    };

    const handlePrev = () => {
        if (activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
            // setFullExercise(null); // [FIX] Don't clear here
        }
    };

    const handleSetComplete = () => {
        setIsTimerVisible(true);
    };

    const handleFinishSession = () => {
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' }); // Force sync attempt
        navigate('../home');
    };

    // 5. Guards
    if (loadingPlan && !planExercises) return <div className="fixed inset-0 bg-white flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;

    // [NEW] Finish Screen
    if (isFinished) {
        return (
            <div className="fixed inset-0 bg-brand-600 z-50 flex flex-col items-center justify-center p-8 text-white">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
                    <Check className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2">¡Sesión Completada!</h1>
                <p className="text-brand-100 text-center mb-8">Has terminado tu entrenamiento de hoy. Tómate un momento para descansar/hidratarte.</p>
                <Button onClick={handleFinishSession} className="bg-white text-brand-600 hover:bg-brand-50 w-full max-w-xs h-12 text-lg">
                    Volver al Inicio
                </Button>
            </div>
        )
    }

    if (!planExercises || planExercises.length === 0) return <div className="p-8 text-center">Descanso</div>;

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

                    {/* [NEW] Video / Visual Aid */}
                    <div className="aspect-video bg-black rounded-2xl shadow-lg overflow-hidden relative group">
                        {(() => {
                            const url = fullExercise?.videoUrl;
                            const isValidVideo = url && (url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo'));

                            if (isValidVideo) {
                                let embedUrl = url;
                                if (url.includes('watch?v=')) embedUrl = url.replace('watch?v=', 'embed/');
                                else if (url.includes('youtu.be/')) embedUrl = url.replace('youtu.be/', 'www.youtube.com/embed/');

                                return (
                                    <iframe
                                        src={embedUrl}
                                        title="Exercise Video"
                                        className="w-full h-full object-cover"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                );
                            }

                            return (
                                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-zinc-900">
                                    <Play className="w-12 h-12 mb-2 opacity-50" />
                                    <span className="text-xs">
                                        {url ? "Formato de video no soportado" : "Sin Video Disponible"}
                                    </span>
                                </div>
                            );
                        })()}
                        {/* Overlay Instructions if toggled */}
                        {showInfo && (
                            <div className="absolute inset-0 bg-black/80 p-6 text-white overflow-auto backdrop-blur-sm z-20">
                                <h4 className="font-bold text-lg mb-2 text-brand-300">Instrucciones</h4>
                                <p className="text-sm leading-relaxed text-zinc-300">
                                    {fullExercise?.instructions || currentItem.details?.instructions || "Sigue las indicaciones de tu kinesiólogo."}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* CARD RENDERER */}
                    <div className="bg-white rounded-3xl p-1 shadow-sm border border-zinc-100 overflow-hidden">
                        {(() => {
                            const explicitType = currentItem.details?.cardType;

                            // [FIX] Restore all cards
                            if (explicitType === 'pelvic') {
                                return <PelvicCard exercise={currentItem} sessionId={uniqueSessionId} onSetComplete={handleSetComplete} />;
                            }
                            if (explicitType === 'timer') {
                                return <TimerCard exercise={currentItem} sessionId={uniqueSessionId} onSetComplete={handleSetComplete} />;
                            }
                            // Default to StrengthCard for now if components are missing, 
                            // BUT DO NOT SHOW "DISABLED" message which scares users.
                            // Ideally we should import them if they exist.
                            return <StrengthCard exercise={currentItem} sessionId={uniqueSessionId} onSetComplete={handleSetComplete} />;
                        })()}
                    </div>
                </div>
            </div>

            {/* Smart Timer */}
            <SmartTimer
                isVisible={isTimerVisible}
                onClose={() => setIsTimerVisible(false)}
                autoStartDuration={90}
            />

            {/* Controls */}
            <div className="bg-white border-t border-zinc-100 p-4 sticky bottom-0 z-40 safe-area-pb">
                <div className="max-w-md mx-auto flex gap-3">
                    <Button variant="ghost" className="flex-1 h-14" onClick={handlePrev} disabled={activeIndex === 0}>Anterior</Button>
                    <Button className="flex-[2] h-14 bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200" onClick={handleNext}>
                        <div className="flex items-center gap-2">
                            {activeIndex === planExercises.length - 1 ? (
                                <> <CheckCircle2 className="w-5 h-5" /> Finalizar Sesión </>
                            ) : (
                                <> Siguiente Ejercicio <ChevronLeft className="w-5 h-5 rotate-180" /> </>
                            )}
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
}
