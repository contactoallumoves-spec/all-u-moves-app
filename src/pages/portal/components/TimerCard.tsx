import { useState, useEffect, useRef } from 'react';
import { PlanExercise, SessionExerciseLog } from '../../../types/patient';
import { Play, Pause, RotateCcw, Check, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useSession } from '../../../context/SessionContext';

interface TimerCardProps {
    exercise: PlanExercise;
    sessionId: string;
    onSetComplete: () => void;
}

export function TimerCard({ exercise, sessionId, onSetComplete }: TimerCardProps) {
    const { state, dispatch } = useSession();

    // Get log
    const sessionLog = state.logs[sessionId];
    const exerciseLog: SessionExerciseLog | undefined = sessionLog?.exercises?.find(e => e.exerciseId === exercise.exerciseId);

    // Plan Details
    const details = exercise.details || {};
    const prescribedSets = parseInt(details.sets || '1');

    // Duration parsing (e.g., "30s", "1 min")
    const parseDuration = (durStr?: string) => {
        if (!durStr) return 0;
        if (durStr.includes('min')) return parseInt(durStr) * 60;
        return parseInt(durStr);
    };
    const targetSeconds = parseDuration(details.duration || details.holdTime || '60s');

    // Local Timer State per Set
    // We only track active timer for the current set ideally, or allow multiple?
    // Let's simple: One active timer at a time.
    const [activeSetIndex, setActiveSetIndex] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(targetSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial state for completion if not already logged
    // logic: "mark as done" implies full duration was met?

    useEffect(() => {
        if (isRunning && activeSetIndex !== null) {
            timerRef.current = setInterval(() => {
                setCurrentTime(prev => {
                    if (prev <= 1) {
                        // Timer Finished
                        handleTimerFinish(activeSetIndex);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRunning, activeSetIndex]);

    const handleTimerFinish = (index: number) => {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);

        // Auto-complete set
        handleCheckSet(index, true);
        // Play sound? (Future)
    };

    const toggleTimer = (index: number) => {
        if (activeSetIndex === index) {
            setIsRunning(!isRunning);
        } else {
            // Switch set
            setActiveSetIndex(index);
            setCurrentTime(targetSeconds);
            setIsRunning(true);
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        setCurrentTime(targetSeconds);
        // If unchecking? handled by check logic
    };

    const handleCheckSet = (index: number, completed: boolean) => {
        dispatch({
            type: 'UPDATE_SET',
            payload: {
                sessionId,
                exerciseId: exercise.exerciseId,
                setIndex: index,
                data: { completed } // we could store actual time too if we extend the model
            }
        });

        if (completed) onSetComplete();
    };

    // Render Rows
    return (
        <div className="space-y-4">
            {/* Info Header */}
            <div className="flex items-center gap-2 px-2 text-sm text-brand-500 font-medium bg-brand-50 p-2 rounded-lg">
                <Clock className="w-4 h-4" />
                <span>Meta: <strong>{details.duration || details.holdTime || "Tiempo Libre"}</strong></span>
            </div>

            <div className="space-y-3">
                {Array.from({ length: prescribedSets }).map((_, i) => {
                    const setLog = exerciseLog?.sets?.[i] || { completed: false };
                    const isActive = activeSetIndex === i;
                    const displayTime = isActive ? currentTime : targetSeconds;

                    // Format MM:SS
                    const mins = Math.floor(displayTime / 60);
                    const secs = displayTime % 60;
                    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

                    return (
                        <div key={i} className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                            setLog.completed
                                ? "bg-green-50/50 border-green-200"
                                : isActive ? "border-brand-300 bg-brand-50/30" : "bg-white border-zinc-100 shadow-sm"
                        )}>
                            <div className="w-8 flex justify-center text-xs font-bold text-zinc-300">
                                SET {i + 1}
                            </div>

                            {/* Timer Display */}
                            <div className="flex-1 flex items-center justify-between bg-zinc-50 rounded-lg px-4 py-2">
                                <span className={cn(
                                    "text-2xl font-mono font-bold tracking-wider",
                                    isActive ? "text-brand-600" : "text-zinc-600",
                                    setLog.completed && "text-green-600"
                                )}>
                                    {timeStr}
                                </span>

                                <div className="flex gap-2">
                                    {!setLog.completed && (
                                        <>
                                            <button
                                                onClick={() => toggleTimer(i)}
                                                className="w-10 h-10 rounded-full bg-white shadow-sm border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 active:scale-95 transition-all"
                                            >
                                                {isActive && isRunning ? (
                                                    <Pause className="w-4 h-4 text-brand-600 fill-brand-600" />
                                                ) : (
                                                    <Play className="w-4 h-4 text-brand-600 fill-brand-600 ml-0.5" />
                                                )}
                                            </button>
                                            {isActive && (
                                                <button
                                                    onClick={() => handleReset()}
                                                    className="w-10 h-10 rounded-full bg-white shadow-sm border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 active:scale-95 transition-all text-zinc-400"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Manual Check */}
                            <button
                                onClick={() => handleCheckSet(i, !setLog.completed)}
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95",
                                    setLog.completed
                                        ? "bg-green-500 text-white shadow-green-200 ring-2 ring-green-100"
                                        : "bg-zinc-100 text-zinc-300 hover:bg-zinc-200"
                                )}
                            >
                                <Check className={cn("w-5 h-5 transition-transform", setLog.completed && "scale-110 stroke-[3px]")} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
