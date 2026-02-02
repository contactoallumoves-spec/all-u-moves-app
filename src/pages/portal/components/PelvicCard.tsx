import { useState, useEffect, useRef } from 'react';
import { PlanExercise, SessionExerciseLog } from '../../../types/patient';
import { Play, Pause, RotateCcw, Check, Zap } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useSession } from '../../../context/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';

interface PelvicCardProps {
    exercise: PlanExercise;
    sessionId: string;
    onSetComplete: () => void;
}

export function PelvicCard({ exercise, sessionId, onSetComplete }: PelvicCardProps) {
    const { state, dispatch } = useSession();

    // Get log
    const sessionLog = state.logs[sessionId];
    const exerciseLog: SessionExerciseLog | undefined = sessionLog?.exercises?.find(e => e.exerciseId === exercise.exerciseId);

    // Plan Details
    const details = exercise.details || {};
    const prescribedSets = parseInt(details.sets || '1');
    const prescribedReps = parseInt(details.reps || '5');

    // Timings
    const workTime = parseInt(details.contractionTime || '5'); // Contract
    const restTime = parseInt(details.relaxationTime || '5');  // Relax
    // const breakTime = 30; // Between sets (optional, not implemented yet)

    // State
    const [activeSetIndex, setActiveSetIndex] = useState<number | null>(null);
    const [currentRep, setCurrentRep] = useState(1);
    const [phase, setPhase] = useState<'IDLE' | 'WORK' | 'REST' | 'DONE'>('IDLE');
    const [secondsLeft, setSecondsLeft] = useState(workTime);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial parsing
    const currentSetLog = exerciseLog?.sets?.[activeSetIndex || 0];

    const startSet = (index: number) => {
        if (activeSetIndex !== index) {
            setActiveSetIndex(index);
            setCurrentRep(1);
        }
        setPhase('WORK');
        setSecondsLeft(workTime);
    };

    const pause = () => {
        setPhase('IDLE');
        if (timerRef.current) clearInterval(timerRef.current);
    };

    useEffect(() => {
        if (phase === 'WORK' || phase === 'REST') {
            timerRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        return handlePhaseChange();
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase, secondsLeft]);

    const handlePhaseChange = () => {
        // Logic for state machine
        if (phase === 'WORK') {
            // Finished Contraction -> Go to Rest
            setPhase('REST');
            return restTime;
        } else if (phase === 'REST') {
            // Finished Rest -> Check Reps
            if (currentRep < prescribedReps) {
                // Next Rep
                setCurrentRep(p => p + 1);
                setPhase('WORK');
                return workTime;
            } else {
                // Finished Set
                if (activeSetIndex !== null) handleSetFinish(activeSetIndex);
                setPhase('DONE');
                return 0;
            }
        }
        return 0;
    };

    const handleSetFinish = (index: number) => {
        setPhase('DONE');
        dispatch({
            type: 'UPDATE_SET',
            payload: {
                sessionId,
                exerciseId: exercise.exerciseId,
                setIndex: index,
                data: { completed: true, reps: prescribedReps.toString() }
            }
        });
        onSetComplete();
    };

    // --- Visualization ---
    // Bloom scales: 1 = Relaxed (Big), 0.5 = Contracted (Small) ?? 
    // Usually Pelvic floor: Contract = Lift/Squeeze (Visual metaphor: Inner Circle shrinks/becomes dense or Flower Claims up?)
    // Let's go with: 
    // Relaxed = Large, Soft, Open (Scale 1.2, Opacity 0.5)
    // Contracted = Condensed, Strong, Up (Scale 0.6, Opacity 1)

    const getVisualState = () => {
        switch (phase) {
            case 'WORK': return { scale: 0.6, opacity: 1, color: '#EC4899' }; // Strong pink, contracted
            case 'REST': return { scale: 1.1, opacity: 0.6, color: '#FBCFE8' }; // Soft pink, relaxed
            case 'IDLE': return { scale: 1, opacity: 0.8, color: '#E4E4E7' }; // Grey
            case 'DONE': return { scale: 1, opacity: 0.8, color: '#22C55E' }; // Green
        }
    };

    const visual = getVisualState();

    return (
        <div className="space-y-6">
            {/* 1. Header Info */}
            <div className="flex justify-between items-center text-sm px-2">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1 text-brand-600 font-bold bg-brand-50 px-2 py-1 rounded">
                        <Zap className="w-3 h-3" />
                        {workTime}s Contaer
                    </span>
                    <span className="flex items-center gap-1 text-zinc-500 font-medium bg-zinc-100 px-2 py-1 rounded">
                        {restTime}s Relajar
                    </span>
                </div>
            </div>

            {/* 2. The Visualizer (Only visible if active set or just display 1st?) */}
            <div className="aspect-square w-full max-w-[280px] mx-auto bg-white rounded-full shadow-[0_0_40px_rgba(236,72,153,0.1)] border border-pink-50 relative flex items-center justify-center overflow-hidden">

                {/* Background ripples */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: phase === 'REST' ? [1, 1.1, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-48 h-48 rounded-full bg-pink-50/50"
                    />
                </div>

                {/* Main Bloom Circle */}
                <motion.div
                    className="w-40 h-40 rounded-full shadow-lg backdrop-blur-sm z-10 flex items-center justify-center"
                    animate={{
                        scale: visual.scale,
                        backgroundColor: visual.color,
                        opacity: visual.opacity
                    }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                >
                    <div className="text-white text-center">
                        <span className="text-3xl font-bold block">{phase === 'IDLE' ? 'Ready' : phase === 'DONE' ? 'Bien!' : secondsLeft}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold">
                            {phase === 'WORK' ? 'CONTRAE' : phase === 'REST' ? 'RELAJA' : phase === 'DONE' ? 'Listo' : 'Inicio'}
                        </span>
                    </div>
                </motion.div>

                {/* Rep Counter Badge */}
                {phase !== 'IDLE' && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-zinc-500 shadow-sm border border-pink-100">
                        Rep {currentRep} / {prescribedReps}
                    </div>
                )}
            </div>

            {/* 3. Controls */}
            {activeSetIndex !== null && phase !== 'DONE' && (
                <div className="flex justify-center gap-4">
                    {phase === 'IDLE' ? (
                        <Button onClick={() => startSet(activeSetIndex)} size="lg" className="rounded-full w-16 h-16 shadow-xl bg-brand-600 hover:bg-brand-700 p-0">
                            <Play className="w-6 h-6 ml-1" />
                        </Button>
                    ) : (
                        <Button onClick={pause} variant="outline" size="lg" className="rounded-full w-16 h-16 border-2 border-brand-100 text-brand-600 p-0">
                            <Pause className="w-6 h-6" />
                        </Button>
                    )}
                </div>
            )}

            {/* 4. Set List (Simplified) */}
            <div className="space-y-2 mt-4">
                {Array.from({ length: prescribedSets }).map((_, i) => {
                    const setLog = exerciseLog?.sets?.[i] || { completed: false };

                    return (
                        <div key={i} className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                            setLog.completed ? "bg-green-50 border-green-200" : activeSetIndex === i ? "border-brand-300 bg-brand-50/20" : "bg-white border-zinc-100"
                        )}
                            onClick={() => {
                                setActiveSetIndex(i);
                                setPhase('IDLE');
                                setCurrentRep(1);
                            }}
                        >
                            <span className="text-sm font-bold text-zinc-600">Serie {i + 1}</span>
                            {setLog.completed ? (
                                <Check className="w-5 h-5 text-green-500" />
                            ) : (
                                <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                                    {prescribedReps} Reps
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
