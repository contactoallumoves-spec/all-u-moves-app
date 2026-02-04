import { useState, useEffect, useRef } from 'react';
import { PlanExercise, SessionExerciseLog } from '../../../types/patient';
import { Play, Pause, RotateCcw, Check, SkipForward, Timer } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useSession } from '../../../context/SessionContext';

interface IntervalCardProps {
    exercise: PlanExercise;
    sessionId: string;
    onSetComplete: () => void;
}

type IntervalPhase = 'prepare' | 'work' | 'rest' | 'finished';

export function IntervalCard({ exercise, sessionId, onSetComplete }: IntervalCardProps) {
    const { state, dispatch } = useSession(); // Access context

    // 1. Get Log and Config
    // ---------------------
    const sessionLog = state.logs[sessionId];
    const exerciseLog: SessionExerciseLog | undefined = sessionLog?.exercises?.find(e => e.exerciseId === exercise.exerciseId);

    const details = exercise.details || {};
    const rounds = parseInt(details.sets || '3'); // Defaults to 3 rounds
    const workTime = parseInt(details.duration || '30'); // Defaults 30s Work
    const restTime = parseInt(details.rest || '15'); // Defaults 15s Rest

    // 2. Local Timer Logic
    // --------------------
    const [currentRound, setCurrentRound] = useState(0); // 0-indexed
    const [phase, setPhase] = useState<IntervalPhase>('prepare');
    const [timeLeft, setTimeLeft] = useState(5); // Start with 5s prep
    const [isRunning, setIsRunning] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Audio Cues (Simple Beep Simulation)
    // In a real app, use Howler.js or Audio API.
    const playBeep = (_type: 'short' | 'long') => {
        // Placeholder for audio
        // console.log(`BEEP: ${_type}`); 
    };

    // Timer Effect
    useEffect(() => {
        if (isRunning && phase !== 'finished') {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handlePhaseTransition();
                        return 0; // Transition handles reset
                    }
                    if (prev <= 4) playBeep('short'); // Warning beep
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRunning, phase, currentRound]);

    // Phase Management
    const handlePhaseTransition = () => {
        // Order: Prepare -> Work -> Rest -> Work -> ... -> Finished

        if (phase === 'prepare') {
            setPhase('work');
            setTimeLeft(workTime);
            playBeep('long'); // GO!
        } else if (phase === 'work') {
            // Mark Round Complete internally
            handleLogRound(currentRound, true);

            if (currentRound < rounds - 1) {
                setPhase('rest');
                setTimeLeft(restTime);
                playBeep('long'); // REST
            } else {
                setPhase('finished');
                setIsRunning(false);
                onSetComplete(); // Notify parent block finished
                playBeep('long'); // VICTORY
            }
        } else if (phase === 'rest') {
            setCurrentRound(r => r + 1);
            setPhase('work');
            setTimeLeft(workTime);
            playBeep('long'); // GO!
        }
    };

    // Logger
    const handleLogRound = (roundIndex: number, completed: boolean) => {
        dispatch({
            type: 'UPDATE_SET',
            payload: {
                sessionId,
                exerciseId: exercise.exerciseId,
                setIndex: roundIndex,
                data: { completed } // Minimal logging for intervals
            }
        });
    };

    // Controls
    const toggleTimer = () => setIsRunning(!isRunning);

    const skipPhase = () => {
        handlePhaseTransition();
    };

    const resetBlock = () => {
        setIsRunning(false);
        setPhase('prepare');
        setCurrentRound(0);
        setTimeLeft(5);
        // Optional: Reset logs? Maybe too destructive.
    };

    // Visual Helpers
    const getPhaseColor = () => {
        switch (phase) {
            case 'work': return 'text-brand-500';
            case 'rest': return 'text-blue-400';
            case 'prepare': return 'text-amber-400';
            case 'finished': return 'text-green-500';
        }
    };

    const getPhaseLabel = () => {
        switch (phase) {
            case 'work': return '¡TRABAJO!';
            case 'rest': return 'DESCANSO';
            case 'prepare': return 'PREPARATE';
            case 'finished': return 'TERMINADO';
        }
    };

    const progress = (() => {
        const total = phase === 'work' ? workTime : phase === 'rest' ? restTime : 5;
        return ((total - timeLeft) / total) * 100;
    })();

    // 3. Render
    // ---------
    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="flex justify-between items-center text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">
                <span>Ronda {Math.min(currentRound + 1, rounds)} / {rounds}</span>
                <span>{details.sets} x {details.duration}s / {details.rest}s</span>
            </div>

            {/* Main Timer Display */}
            <div className="relative aspect-square max-h-[300px] mx-auto flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100" />
                    <circle
                        cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                        className={cn("transition-colors duration-500",
                            phase === 'work' ? 'text-brand-500' :
                                phase === 'rest' ? 'text-blue-400' :
                                    'text-zinc-300'
                        )}
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * progress) / 100}
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Inner Content */}
                <div className="relative z-10 flex flex-col items-center">
                    <div
                        key={phase}
                        className={cn("text-center transition-all duration-300",
                            phase === 'finished' ? "scale-110" : "scale-100"
                        )}
                    >
                        <span className={cn("text-5xl font-black tabular-nums tracking-tighter transition-colors duration-300", getPhaseColor())}>
                            {timeLeft}
                        </span>
                        <span className="block text-xs font-bold text-zinc-400 mt-2 uppercase tracking-[0.2em]">
                            {getPhaseLabel()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                <button
                    onClick={resetBlock}
                    className="flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-400 transition-colors"
                >
                    <RotateCcw className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">Reiniciar</span>
                </button>

                <button
                    onClick={toggleTimer}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 p-4 rounded-2xl transition-all shadow-lg active:scale-95",
                        isRunning ? "bg-amber-100 text-amber-600 shadow-amber-200" : "bg-brand-600 text-white shadow-brand-200"
                    )}
                >
                    {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>

                <button
                    onClick={skipPhase}
                    className="flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-400 transition-colors"
                >
                    <SkipForward className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">Saltar</span>
                </button>
            </div>

            {/* Rounds List (Mini Overview) */}
            <div className="space-y-2 mt-4 max-h-[150px] overflow-y-auto px-1">
                {Array.from({ length: rounds }).map((_, i) => {
                    const setLog = exerciseLog?.sets?.[i] || { completed: false };
                    return (
                        <div key={i} className={cn(
                            "flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors",
                            i === currentRound ? "bg-brand-50 border border-brand-200 text-brand-700" :
                                setLog.completed ? "bg-green-50 text-green-700 opacity-60" : "bg-zinc-50 text-zinc-400"
                        )}>
                            <span>Ronda {i + 1}</span>
                            {setLog.completed ? <Check className="w-4 h-4" /> : i === currentRound ? <Timer className="w-4 h-4 animate-pulse" /> : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
