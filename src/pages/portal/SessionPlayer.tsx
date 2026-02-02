import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { Patient, PlanExercise } from '../../types/patient';
import { ExerciseService } from '../../services/exerciseService';
import { SessionLogService } from '../../services/sessionLogService';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ChevronLeft, Play, Info, Timer, Ruler, Activity, TrendingUp, Wind, Zap, PauseCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export default function SessionPlayer() {
    const { patient } = useOutletContext<{ patient: Patient }>();
    const navigate = useNavigate();


    // Get day from URL params (e.g. 'monday', 'tuesday')
    const { sessionId } = useParams();

    // Robust fallback to today's key if no param or invalid
    const todayIndex = new Date().getDay();
    const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = DAYS_MAP[todayIndex];

    const targetDay = (sessionId || todayKey).toLowerCase(); // Ensure lowercase
    const planExercises = patient.activePlan?.schedule?.[targetDay as keyof typeof patient.activePlan.schedule] || [];

    const [activeIndex, setActiveIndex] = useState(0);
    const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
    const [exerciseData, setExerciseData] = useState<Record<string, any>>({}); // Cache for exercise details (videoUrl etc)
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch full exercise details (like video) for the plan items
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const data: Record<string, any> = {};
            for (const item of planExercises) {
                if (item.exerciseId) {
                    const ex = await ExerciseService.getById(item.exerciseId);
                    if (ex) data[item.exerciseId] = ex;
                }
            }
            setExerciseData(data);
            setLoading(false);
        };
        fetchDetails();
    }, [planExercises.length]);

    const handleComplete = (item: PlanExercise) => {
        setCompletedMap(prev => ({ ...prev, [item.id]: true }));
        // Auto advance after short delay
        if (activeIndex < planExercises.length - 1) {
            setTimeout(() => setActiveIndex(prev => prev + 1), 500);
        }
    };




    // Feedback State
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState({
        rpe: 5,
        pain: 0,
        fatigue: 0,
        symptoms: [] as string[],
        notes: ''
    });

    const toggleSymptom = (symptom: string) => {
        setFeedback(prev => ({
            ...prev,
            symptoms: prev.symptoms.includes(symptom)
                ? prev.symptoms.filter(s => s !== symptom)
                : [...prev.symptoms, symptom]
        }));
    };

    const handleFinishSession = async () => {
        setIsSubmitting(true);
        try {
            await SessionLogService.create({
                patientId: patient.id!,
                date: Timestamp.now(),
                exercises: planExercises.map(item => ({
                    exerciseId: item.exerciseId,
                    name: item.name,
                    completed: !!completedMap[item.id],
                    // We can add actual values inputs later
                })),
                feedback: {
                    rpe: feedback.rpe,
                    pain: feedback.pain,
                    fatigue: feedback.fatigue,
                    symptoms: feedback.symptoms,
                    notes: feedback.notes
                }
            });
            alert("¡Sesión guardada con éxito!");
            navigate('../home');
        } catch (error) {
            console.error(error);
            alert("Error al guardar la sesión");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center bg-zinc-900 text-white h-screen">Cargando ejercicios...</div>;

    if (planExercises.length === 0) {
        return (
            <div className="p-4 text-center space-y-4 bg-zinc-900 text-white h-screen flex flex-col items-center justify-center">
                <p>No tienes ejercicios programados para hoy.</p>
                <Button onClick={() => navigate('../home')}>Volver al inicio</Button>
            </div>
        );
    }

    // Feedback View
    if (showFeedback) {
        return (
            <div className="flex flex-col h-screen bg-black text-white p-6 overflow-y-auto">
                <h1 className="text-2xl font-bold mb-6">Resumen de Sesión</h1>

                <div className="space-y-6">
                    {/* RPE Scale */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Esfuerzo Global (0-10)</label>
                        <input
                            type="range" min="0" max="10" step="1"
                            value={feedback.rpe}
                            onChange={(e) => setFeedback({ ...feedback, rpe: parseInt(e.target.value) })}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>Nada</span>
                            <span>Máximo</span>
                        </div>
                        <p className="text-center font-bold text-xl">{feedback.rpe}</p>
                    </div>

                    {/* Pain Scale */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Nivel de Dolor (0-10)</label>
                        <input
                            type="range" min="0" max="10" step="1"
                            value={feedback.pain}
                            onChange={(e) => setFeedback({ ...feedback, pain: parseInt(e.target.value) })}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>Sin dolor</span>
                            <span>Incoportable</span>
                        </div>
                        <p className="text-center font-bold text-xl text-red-400">{feedback.pain}</p>
                    </div>

                    {/* Fatigue Scale */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Fatiga / Cansancio (0-10)</label>
                        <input
                            type="range" min="0" max="10" step="1"
                            value={feedback.fatigue}
                            onChange={(e) => setFeedback({ ...feedback, fatigue: parseInt(e.target.value) })}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>Fresco</span>
                            <span>Exhausto</span>
                        </div>
                        <p className="text-center font-bold text-xl text-yellow-400">{feedback.fatigue}</p>
                    </div>

                    {/* Symptoms */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">¿Sentiste algo particular?</label>
                        <div className="flex flex-wrap gap-2">
                            {["Pesadez Pélvica", "Escape de orina", "Dolor Articular", "Mareo", "Falta de aire", "Calambre"].map(sym => (
                                <button
                                    key={sym}
                                    onClick={() => toggleSymptom(sym)}
                                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${feedback.symptoms.includes(sym)
                                        ? "bg-red-500/20 border-red-500 text-red-200"
                                        : "bg-zinc-800 border-zinc-700 text-zinc-400"
                                        }`}
                                >
                                    {sym}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Comentarios (Opcional)</label>
                        <textarea
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm focus:border-brand-500 outline-none"
                            rows={3}
                            placeholder="¿Cómo te sentiste?"
                            value={feedback.notes}
                            onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => setShowFeedback(false)}>Volver</Button>
                    <Button className="flex-[2] bg-brand-600 hover:bg-brand-500 text-white" onClick={handleFinishSession} disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Finalizar"}
                    </Button>
                </div>
            </div>
        );
    }

    const currentItem = planExercises[activeIndex];
    const currentDetails = currentItem ? exerciseData[currentItem.exerciseId] : null;

    // Helper to extract YouTube ID
    const getYoutubeId = (url?: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };
    const videoId = getYoutubeId(currentDetails?.videoUrl);

    return (
        <div className="flex flex-col h-[calc(100vh-60px)] bg-black text-white">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between bg-zinc-900 border-b border-zinc-800">
                <button onClick={() => navigate('../home')} className="text-zinc-400 hover:text-white">
                    <ChevronLeft />
                </button>
                <div className="text-sm font-medium">
                    Ejercicio {activeIndex + 1} de {planExercises.length}
                </div>
                <div className="w-6" /> {/* Spacer */}
            </div>

            {/* Main Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto pb-20">
                {/* Video Area */}
                <div className="aspect-video bg-zinc-900 w-full relative">
                    {videoId ? (
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Play className="w-12 h-12 opacity-50" />
                        </div>
                    )}
                </div>

                {/* Info Area */}
                <div className="p-6 space-y-6">
                    <div className="space-y-1">
                        {currentItem?.block && (
                            <span className="inline-block bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2">
                                {currentItem.block}
                            </span>
                        )}
                        <h1 className="text-2xl font-bold">{currentItem?.name}</h1>
                        <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
                            {currentItem?.details ? (
                                <>
                                    {currentItem.details.sets && <span className="bg-zinc-800 px-2 py-1 rounded">{currentItem.details.sets} series</span>}
                                    {currentItem.details.reps && <span className="bg-zinc-800 px-2 py-1 rounded">{currentItem.details.reps} reps</span>}
                                    {currentItem.details.load && <span className="bg-zinc-800 px-2 py-1 rounded text-orange-300 font-bold">{currentItem.details.load}</span>}
                                    {currentItem.details.rpe && <span className="bg-zinc-800 px-2 py-1 rounded text-purple-300">RPE: {currentItem.details.rpe}</span>}

                                    {/* Cardio / Endurance */}
                                    {currentItem.details.duration && <span className="flex items-center gap-1 bg-blue-900/40 text-blue-200 px-2 py-1 rounded border border-blue-900/50"><Timer className="w-3 h-3" /> {currentItem.details.duration}</span>}
                                    {currentItem.details.distance && <span className="flex items-center gap-1 bg-blue-900/40 text-blue-200 px-2 py-1 rounded border border-blue-900/50"><Ruler className="w-3 h-3" /> {currentItem.details.distance}</span>}
                                    {currentItem.details.heartRateZone && <span className="flex items-center gap-1 bg-red-900/40 text-red-200 px-2 py-1 rounded border border-red-900/50"><Activity className="w-3 h-3" /> {currentItem.details.heartRateZone}</span>}
                                    {currentItem.details.incline && <span className="flex items-center gap-1 bg-orange-900/40 text-orange-200 px-2 py-1 rounded border border-orange-900/50"><TrendingUp className="w-3 h-3" /> {currentItem.details.incline}</span>}

                                    {/* Pelvic / Isometric */}
                                    {currentItem.details.contractionTime && <span className="flex items-center gap-1 bg-pink-900/40 text-pink-200 px-2 py-1 rounded border border-pink-900/50"><Zap className="w-3 h-3" /> {currentItem.details.contractionTime}</span>}
                                    {currentItem.details.relaxationTime && <span className="flex items-center gap-1 bg-pink-900/20 text-pink-300 px-2 py-1 rounded border border-pink-900/30"><PauseCircle className="w-3 h-3" /> {currentItem.details.relaxationTime}</span>}

                                    {/* Breath */}
                                    {currentItem.details.breathPattern && <span className="flex items-center gap-1 bg-teal-900/40 text-teal-200 px-2 py-1 rounded border border-teal-900/50"><Wind className="w-3 h-3" /> {currentItem.details.breathPattern}</span>}

                                    {/* Technical */}
                                    {currentItem.details.unilateral && <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs border border-zinc-700">Unilateral</span>}
                                    {currentItem.details.holdTime && <span className="bg-zinc-800 px-2 py-1 rounded">Hold: {currentItem.details.holdTime}</span>}
                                </>
                            ) : (
                                <span>{currentDetails?.defaultParams && `${currentDetails.defaultParams.sets}x${currentDetails.defaultParams.reps}`}</span>
                            )}
                        </div>
                        {currentItem?.details?.side && <p className="text-xs text-brand-400 uppercase font-bold tracking-wider">{currentItem.details.side === 'bilateral' ? 'Ambos lados' : (currentItem.details.side === 'alternating' ? 'Alternado' : `Lado ${currentItem.details.side === 'left' ? 'Izquierdo' : 'Derecho'}`)}</p>}
                    </div>

                    {/* Description/Instructions */}
                    <Card className="bg-zinc-900/50 border-zinc-800 text-sm md:text-base">
                        <CardContent className="p-4 space-y-2 text-zinc-300">
                            <h4 className="font-semibold text-zinc-100 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Instrucciones
                            </h4>
                            <p className="whitespace-pre-wrap">{currentDetails?.instructions || "Sigue las indicaciones del video."}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-zinc-800 flex gap-4 max-w-md mx-auto z-50">
                <Button
                    variant="outline"
                    className="flex-1 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                    onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
                    disabled={activeIndex === 0}
                >
                    Anterior
                </Button>

                {activeIndex === planExercises.length - 1 ? (
                    <Button
                        className="flex-[2] bg-brand-600 hover:bg-brand-500 text-white font-bold"
                        onClick={() => setShowFeedback(true)}
                        disabled={isSubmitting}
                    >
                        Terminar
                    </Button>
                ) : (
                    <Button
                        className="flex-[2] bg-white text-black hover:bg-zinc-200 font-bold"
                        onClick={() => handleComplete(currentItem)}
                    >
                        Siguiente
                    </Button>
                )}
            </div>
        </div>
    );
}
