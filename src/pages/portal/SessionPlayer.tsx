import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { Patient, PlanExercise } from '../../types/patient';
import { ExerciseService } from '../../services/exerciseService';
import { SessionLogService } from '../../services/sessionLogService';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ChevronLeft, Play, Info } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export default function SessionPlayer() {
    const { patient } = useOutletContext<{ patient: Patient }>();
    const navigate = useNavigate();
    const { date } = useParams(); // URL param

    // For now, let's assume we play "Today's" session
    const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const planExercises = patient.activePlan?.schedule?.[todayKey as keyof typeof patient.activePlan.schedule] || [];

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
                }))
            });
            alert("¡Sesión completada y guardada!");
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
                        <h1 className="text-2xl font-bold">{currentItem?.name}</h1>
                        <p className="text-zinc-400 text-sm">
                            {currentItem?.params || (currentDetails?.defaultParams && `${currentDetails.defaultParams.sets}x${currentDetails.defaultParams.reps}`)}
                        </p>
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
                        onClick={handleFinishSession}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Guardando..." : "Terminar Sesión"}
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
