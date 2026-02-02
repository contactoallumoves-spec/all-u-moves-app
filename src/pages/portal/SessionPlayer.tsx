import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams, Link } from 'react-router-dom';
import { Patient } from '../../types/patient';
import { ExerciseService } from '../../services/exerciseService';
import { useSession } from '../../context/SessionContext';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, Info, Play, X, Flag, MessageSquare, Loader2 } from 'lucide-react';
import { SmartTimer } from './components/SmartTimer';
import { StrengthCard } from './components/StrengthCard';
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

            // 3. Navigate back
            navigate('../home');
        } catch (error) {
            console.error("Sync failed", error);
            // Optionally show error toast
            alert("Error al guardar la sesión en la nube. Se guardó localmente. Por favor revisa tu conexión.");
            navigate('../home'); // Exit anyway for now
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

    // Feedback View
    if (showFeedback) {
        return (
            <div className="flex flex-col h-screen bg-black text-white p-6 overflow-y-auto animate-in slide-in-from-bottom-10 fade-in duration-300">
                <h1 className="text-2xl font-bold mb-1 text-brand-100">Resumen de Sesión</h1>
                <p className="text-zinc-400 text-sm mb-6">Completa estos datos para mejorar tu próxima rutina.</p>

                <div className="space-y-8">
                    {/* RPE Scale (Premium) */}
                    <RPESelector
                        value={feedback.rpe}
                        onChange={(val) => setFeedback({ ...feedback, rpe: val })}
                    />

                    {/* Pain Scale (Premium) */}
                    <PainSelector
                        value={feedback.pain}
                        onChange={(val) => setFeedback({ ...feedback, pain: val })}
                    />

                    {/* Fatigue Scale (Standard Slider for now, or re-use RPE/Slider) */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-bold uppercase text-zinc-400">Fatiga General</span>
                            <span className="text-xs font-bold bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{feedback.fatigue}/10</span>
                        </div>
                        <input
                            type="range" min="0" max="10" step="1"
                            value={feedback.fatigue}
                            onChange={(e) => setFeedback({ ...feedback, fatigue: parseInt(e.target.value) })}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500">
                            <span>Fresco</span>
                            <span>Exhausto</span>
                        </div>
                    </div>

                    {/* Symptoms */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-zinc-400 block px-1">Sensaciones / Síntomas</label>
                        <div className="flex flex-wrap gap-2">
                            {["Pesadez Pélvica", "Escape de orina", "Dolor Articular", "Mareo", "Falta de aire", "Calambre"].map(sym => (
                                <button
                                    key={sym}
                                    onClick={() => toggleSymptom(sym)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95",
                                        feedback.symptoms.includes(sym)
                                            ? "bg-brand-900 border-brand-500 text-brand-100 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                    )}
                                >
                                    {sym}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-8">
                    <Button
                        size="lg"
                        className="w-full rounded-xl h-14 text-lg bg-brand-600 hover:bg-brand-700 text-white shadow-xl shadow-brand-200"
                        onClick={handleSendFeedback}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                        {isSubmitting ? 'Guardando...' : 'Enviar Feedback y Finalizar'}
                    </Button>
                </div>
            </div>
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
                        {/* For V1, we default to StrengthCard. In Phase 2, check exercise type */}

                        <div className="bg-white rounded-3xl p-1 shadow-sm border border-zinc-100 overflow-hidden">
                            <StrengthCard
                                exercise={currentItem}
                                sessionId={uniqueSessionId}
                                onSetComplete={handleSetComplete}
                            />
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
