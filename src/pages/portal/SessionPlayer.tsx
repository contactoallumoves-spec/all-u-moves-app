import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams, Link } from 'react-router-dom';
import { Patient } from '../../types/patient';
import { ExerciseService } from '../../services/exerciseService';
import { useSession } from '../../context/SessionContext';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, Info, Play, X, Flag, MessageSquare, Loader2 } from 'lucide-react';
import { SmartTimer } from './components/SmartTimer';
import { StrengthCard } from './components/StrengthCard';
import { PelvicCard } from './components/PelvicCard';
import { TimerCard } from './components/TimerCard';
import { IntervalCard } from './components/IntervalCard';
import { RPESelector, PainSelector } from '../../components/ui/PremiumInputs';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function SessionPlayer() {
    const { patient } = useOutletContext<{ patient: Patient }>();
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const { dispatch, syncSession, loadHistory } = useSession();

    // 1. Resolve Session ID (Date Key)
    const todayIndex = new Date().getDay();
    const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = DAYS_MAP[todayIndex];
    const targetDay = (sessionId || todayKey).toLowerCase();

    // 2. Load Plan
    const planExercises = patient.activePlan?.schedule?.[targetDay as keyof typeof patient.activePlan.schedule] || [];
    const uniqueSessionId = `${new Date().toISOString().split('T')[0]}_${targetDay}`;

    // 3. Initialize Context Session & Load History
    useEffect(() => {
        if (patient.id) {
            // Init Session
            dispatch({
                type: 'INIT_SESSION',
                payload: { sessionId: uniqueSessionId, patientId: patient.id }
            });
            // Load History
            loadHistory(patient.id);
        }
    }, [patient.id, uniqueSessionId, dispatch]);

    // 4. Local UI State
    const [activeIndex, setActiveIndex] = useState(0);
    const [exerciseCache, setExerciseCache] = useState<Record<string, any>>({});
    const [timerVisible, setTimerVisible] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feedback State
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState({
        rpe: 5,
        pain: 0,
        fatigue: 5,
        symptoms: [] as string[],
        notes: ''
    });

    // Fetch Details cache
    useEffect(() => {
        const fetchDetails = async () => {
            const data: Record<string, any> = {};
            for (const item of planExercises) {
                if (item.exerciseId && !exerciseCache[item.exerciseId]) {
                    const ex = await ExerciseService.getById(item.exerciseId);
                    if (ex) data[item.exerciseId] = ex;
                }
            }
            setExerciseCache(prev => ({ ...prev, ...data }));
        };
        if (planExercises.length > 0) fetchDetails();
    }, [planExercises.length, activeIndex]);

    // Current Item
    const currentItem = planExercises[activeIndex];
    const currentDetails = currentItem ? exerciseCache[currentItem.exerciseId] : null;

    // Helpers
    const getYoutubeId = (url?: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };
    const videoId = getYoutubeId(currentDetails?.videoUrl);

    // Handlers
    const handleSetComplete = () => {
        setTimerVisible(true);
    };

    const handleFinish = () => {
        setShowFeedback(true);
    };

    const handleSendFeedback = async () => {
        setIsSubmitting(true);
        try {
            // 1. Save Logic in Context
            dispatch({
                type: 'UPDATE_FEEDBACK',
                payload: { sessionId: uniqueSessionId, feedback }
            });

            // 2. Trigger Cloud Sync (Pass feedback directly to avoid stale state)
            await syncSession(uniqueSessionId, { feedback });

            // 3. Success state is handled by UI button now
            // navigate('../home'); 
        } catch (error) {
            console.error("Sync failed", error);
            // Optionally show error toast
            alert("Error al guardar la sesión en la nube. Se guardó localmente. Por favor revisa tu conexión.");
            // navigate('../home'); // Stay to show error? Or just let them retry.
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSymptom = (symptom: string) => {
        setFeedback(prev => ({
            ...prev,
            symptoms: prev.symptoms.includes(symptom)
                ? prev.symptoms.filter(s => s !== symptom)
                : [...prev.symptoms, symptom]
        }));
    };

    // Handle completion of specific item to auto-advance
    const handleComplete = () => {
        if (activeIndex < planExercises.length - 1) {
            setTimeout(() => setActiveIndex(prev => prev + 1), 500);
        } else {
            handleFinish();
        }
    };


    // --- Loading / Empty States ---
    if (!planExercises.length) return (
        <div className="h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Día de Descanso</h2>
            <p className="text-zinc-400 mb-6">No hay ejercicios programados para este día.</p>
            <Button onClick={() => navigate('../home')}>Volver</Button>
        </div>
    );

    // Duration State
    const [startTime] = useState<number>(Date.now());
    const [sessionDuration, setSessionDuration] = useState<string>('');
    const [isSaved, setIsSaved] = useState(false); // Success state

    // Calculate duration on finish
    useEffect(() => {
        if (showFeedback && !sessionDuration) {
            const end = Date.now();
            const diffMinutes = Math.round((end - startTime) / 60000);
            setSessionDuration(`${diffMinutes} min`);
        }
    }, [showFeedback, startTime, sessionDuration]);


    // Feedback View (Unified Summary Screen)
    if (showFeedback) {
        // Success / Saved State
        if (isSaved) {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col h-screen bg-black text-white items-center justify-center p-6 text-center"
                >
                    <div className="w-20 h-20 bg-brand-600/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-brand-500/50 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
                        <Flag className="w-10 h-10 text-brand-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 text-white">¡Gracias!</h1>
                    <p className="text-zinc-400 mb-8 max-w-xs">Tu sesión y feedback han sido guardados correctamente en tu historial.</p>

                    <Button
                        size="lg"
                        onClick={() => navigate('../home')}
                        className="w-full max-w-sm rounded-xl h-14 bg-zinc-100 text-black hover:bg-white font-bold"
                    >
                        Volver al Inicio
                    </Button>
                </motion.div>
            );
        }

        // Summary Input State
        return (
            <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col h-screen bg-black text-white overflow-hidden"
            >

                {/* 1. Header & Stats Section (Premium Glass) */}
                <div className="relative overflow-hidden bg-brand-950 p-6 pb-8 border-b border-white/5">
                    {/* Background Glow */}
                    <div className="absolute top-[-50%] left-[-20%] w-[300px] h-[300px] bg-brand-600/20 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div onClick={() => setShowFeedback(false)} className="text-brand-200/50 text-sm flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                <ChevronLeft className="w-4 h-4" /> Ajustar
                            </div>
                            <span className="text-brand-200/30 text-xs font-mono tracking-widest uppercase">{new Date().toLocaleDateString()}</span>
                        </div>

                        <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-200">
                            ¡Misión Cumplida!
                        </h1>
                        <p className="text-brand-200/70 text-sm mb-6 font-light">Has dado un paso más hacia tu recuperación.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
                                <span className="text-3xl font-bold text-white mb-1 tabular-nums">{sessionDuration || '0'}</span>
                                <span className="text-[10px] uppercase tracking-widest text-brand-200/50 font-bold">Minutos</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
                                <span className="text-3xl font-bold text-brand-400 mb-1 tabular-nums">{planExercises.length}</span>
                                <span className="text-[10px] uppercase tracking-widest text-brand-200/50 font-bold">Ejercicios</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Scrollable Feedback Form */}
                <div className="flex-1 overflow-y-auto px-6 pb-28 pt-6">
                    <div className="space-y-10">

                        {/* Title for Feedback Section */}
                        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                            <MessageSquare className="w-4 h-4 text-brand-500" />
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">¿Cómo te sentiste?</h3>
                        </div>

                        {/* RPE Scale (Premium) */}
                        <div className="space-y-3">
                            <RPESelector
                                value={feedback.rpe}
                                onChange={(val) => setFeedback({ ...feedback, rpe: val })}
                            />
                        </div>

                        {/* Pain Scale (Premium) */}
                        <div className="space-y-3">
                            <PainSelector
                                value={feedback.pain}
                                onChange={(val) => setFeedback({ ...feedback, pain: val })}
                            />
                        </div>

                        {/* Fatigue Scale */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Fatiga</span>
                                <span className="text-xs font-bold bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md min-w-[3rem] text-center">{feedback.fatigue}/10</span>
                            </div>
                            <input
                                type="range" min="0" max="10" step="1"
                                value={feedback.fatigue}
                                onChange={(e) => setFeedback({ ...feedback, fatigue: parseInt(e.target.value) })}
                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-600 uppercase font-bold tracking-wider">
                                <span>Energía Total</span>
                                <span>Agotamiento</span>
                            </div>
                        </div>

                        {/* Symptoms */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider block px-1">Síntomas Notables</label>
                            <div className="flex flex-wrap gap-2">
                                {["Pesadez Pélvica", "Escape de orina", "Dolor Articular", "Mareo", "Falta de aire", "Calambre"].map(sym => (
                                    <button
                                        key={sym}
                                        onClick={() => toggleSymptom(sym)}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-xs font-medium border transition-all active:scale-95",
                                            feedback.symptoms.includes(sym)
                                                ? "bg-brand-900/50 border-brand-500 text-brand-100 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                                        )}
                                    >
                                        {sym}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Footer Action */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-50 pt-12">
                    <Button
                        size="lg"
                        className="w-full rounded-2xl h-14 text-lg bg-white text-black hover:bg-brand-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 font-bold"
                        onClick={async () => {
                            await handleSendFeedback();
                            setIsSaved(true);
                        }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                        {isSubmitting ? 'Guardando...' : 'Finalizar Sesión'}
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
            {/* 1. Immersive Header (Progress Bar) */}
            <div className="h-1 bg-zinc-100 w-full">
                <motion.div
                    className="h-full bg-brand-600 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (activeIndex / planExercises.length) }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-zinc-50 shadow-sm z-10">
                <Link to="../home" className="p-2 -ml-2 text-zinc-400 hover:text-brand-900 transition-colors">
                    <X className="w-6 h-6" />
                </Link>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                        Ejercicio {activeIndex + 1} / {planExercises.length}
                    </span>
                    <span className="font-bold text-brand-900 text-sm truncate max-w-[200px]">
                        {currentItem?.name}
                    </span>
                </div>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={cn("p-2 -mr-2 transition-colors", showInfo ? "text-brand-600" : "text-zinc-400")}
                >
                    <Info className="w-6 h-6" />
                </button>
            </div>

            {/* 2. Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-zinc-50 pb-32">
                {/* Video Card (Sticky-ish?) */}
                <div className="w-full aspect-video bg-black sticky top-0 z-0 shadow-lg">
                    {videoId ? (
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=0`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <Play className="w-16 h-16 opacity-20" />
                        </div>
                    )}
                </div>

                {/* Exercise Card Area */}
                <div className="p-4 -mt-4 relative z-10">
                    <motion.div
                        key={currentItem.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Dynamic Card Template Switcher */}
                        <div className="bg-white rounded-3xl p-1 shadow-sm border border-zinc-100 overflow-hidden">
                            {(() => {
                                // Determine card type
                                const explicitType = currentItem.details?.cardType;
                                const cat = currentDetails?.category || 'Fuerza';
                                const system = currentDetails?.system;

                                // 1. Explicit Selection (Overrides everything)
                                if (explicitType === 'pelvic') {
                                    return <PelvicCard exercise={currentItem} sessionId={uniqueSessionId} onSetComplete={handleSetComplete} />;
                                }
                                if (explicitType === 'timer') {
                                    return <TimerCard exercise={currentItem} sessionId={uniqueSessionId} onSetComplete={handleSetComplete} />;
                                }
                                if (explicitType === 'strength') {
                                    return <StrengthCard exercise={currentItem} sessionId={uniqueSessionId} onSetComplete={handleSetComplete} />;
                                }
                                if (explicitType === 'interval') {
                                    return <IntervalCard exercise={currentItem} sessionId={uniqueSessionId} onSetComplete={handleSetComplete} />;
                                }

                                // 2. Fallback to Category/System Logic
                                if (cat === 'Suelo Pélvico' || system === 'Suelo Pélvico') {
                                    return (
                                        <PelvicCard
                                            exercise={currentItem}
                                            sessionId={uniqueSessionId}
                                            onSetComplete={handleSetComplete}
                                        />
                                    );
                                }

                                if (cat === 'Movilidad' || cat === 'Relajación' || cat === 'Respiración') {
                                    return (
                                        <TimerCard
                                            exercise={currentItem}
                                            sessionId={uniqueSessionId}
                                            onSetComplete={handleSetComplete}
                                        />
                                    );
                                }

                                // Default Strength
                                return (
                                    <StrengthCard
                                        exercise={currentItem}
                                        sessionId={uniqueSessionId}
                                        onSetComplete={handleSetComplete}
                                    />
                                );
                            })()}
                        </div>

                        {/* Info / Instructions (Conditionally revealed or inline) */}
                        {showInfo && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-brand-50 rounded-2xl p-4 text-sm text-brand-800 border border-brand-100">
                                <h4 className="font-bold mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Instrucciones</h4>
                                <p className="whitespace-pre-wrap leading-relaxed">{currentDetails?.instructions || "Sin instrucciones específicas."}</p>
                            </motion.div>
                        )}

                        {/* Feedback / Util Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-500 py-3 rounded-xl text-sm font-bold hover:bg-zinc-50 disabled:opacity-50">
                                <Flag className="w-4 h-4" /> Reportar Dolor
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-500 py-3 rounded-xl text-sm font-bold hover:bg-zinc-50">
                                <MessageSquare className="w-4 h-4" /> Nota
                            </button>
                        </div>

                    </motion.div>
                </div>
            </div>

            {/* 3. Footer Navigation (Fixed) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-zinc-100 z-40 max-w-md mx-auto">
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 rounded-xl h-14 text-zinc-400 border-zinc-200"
                        onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                        disabled={activeIndex === 0}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>

                    {activeIndex < planExercises.length - 1 ? (
                        <Button
                            size="lg"
                            className="flex-[3] rounded-xl h-14 text-lg bg-zinc-900 hover:bg-black text-white shadow-xl shadow-zinc-300"
                            onClick={() => handleComplete()}
                        >
                            Siguiente
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            className="flex-[3] rounded-xl h-14 text-lg bg-brand-600 hover:bg-brand-700 text-white shadow-xl shadow-brand-200"
                            onClick={handleFinish}
                        >
                            Finalizar Sesión
                        </Button>
                    )}
                </div>
            </div>

            {/* 4. Floating Timer */}
            <SmartTimer
                isVisible={timerVisible}
                onClose={() => setTimerVisible(false)}
            />
        </div>
    );
}
