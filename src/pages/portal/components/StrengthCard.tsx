import { PlanExercise } from '../../../types/patient';
import { SessionExerciseLog } from '../../../types/patient';
import { Check, RotateCcw } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useSession } from '../../../context/SessionContext';

interface StrengthCardProps {
    exercise: PlanExercise;
    sessionId: string;
    onSetComplete: () => void; // Trigger timer
}

export function StrengthCard({ exercise, sessionId, onSetComplete }: StrengthCardProps) {
    const { state, dispatch } = useSession();

    // Get log for this exercise
    const sessionLog = state.logs[sessionId];
    const exerciseLog: SessionExerciseLog | undefined = sessionLog?.exercises?.find(e => e.exerciseId === exercise.exerciseId);

    // Initial parsing of plan
    const details = exercise.details || {};
    const prescribedSets = parseInt(details.sets || '3');

    // Parse "Ghost Data" (Last week)
    const historyLog = state.history?.exercises?.find(e => e.exerciseId === exercise.exerciseId);
    let ghostData = "Sin datos previos";
    if (historyLog && historyLog.sets && historyLog.sets.length > 0) {
        // Simple heuristic: Take the first set or average? Let's show the last completed set.
        const lastSet = [...historyLog.sets].reverse().find(s => s.completed && s.load);
        if (lastSet) {
            ghostData = `${historyLog.sets.length}x${lastSet.reps} @ ${lastSet.load}kg`;
        }
    }

    // --- Actions ---

    const handleCheckSet = (index: number) => {
        const currentSet = exerciseLog?.sets?.[index] || { completed: false };
        const newStatus = !currentSet.completed;

        dispatch({
            type: 'UPDATE_SET',
            payload: {
                sessionId,
                exerciseId: exercise.exerciseId,
                setIndex: index,
                data: { completed: newStatus }
            }
        });

        if (newStatus) {
            onSetComplete(); // Trigger global timer
        }
    };

    const handleInputChange = (index: number, field: 'load' | 'reps', value: string) => {
        dispatch({
            type: 'UPDATE_SET',
            payload: {
                sessionId,
                exerciseId: exercise.exerciseId,
                setIndex: index,
                data: { [field]: value }
            }
        });
    };

    const handleRepeatLoad = () => {
        if (!historyLog || !historyLog.sets) return;

        // Apply history to current sets
        historyLog.sets.forEach((histSet, i) => {
            if (i < prescribedSets) {
                dispatch({
                    type: 'UPDATE_SET',
                    payload: {
                        sessionId,
                        exerciseId: exercise.exerciseId,
                        setIndex: i,
                        data: {
                            load: histSet.load,
                            reps: histSet.reps
                        }
                    }
                });
            }
        });
    };

    // Render Rows
    const rows = Array.from({ length: prescribedSets }).map((_, i) => {
        const setLog = exerciseLog?.sets?.[i] || { completed: false, load: '', reps: '' };
        const histSet = historyLog?.sets?.[i];

        return (
            <div key={i} className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                setLog.completed
                    ? "bg-green-50/50 border-green-200"
                    : "bg-white border-zinc-100 shadow-sm"
            )}>
                <div className="w-8 flex justify-center text-xs font-bold text-zinc-300">
                    SET {i + 1}
                </div>

                {/* Inputs: Using type="tel" for better mobile keyboard, or we build custom numpad later */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="relative">
                        <input
                            type="tel" // triggers numeric keypad on mobile
                            inputMode="decimal"
                            placeholder={histSet?.load || details.load || "kg"} // Show history as placeholder if available
                            value={setLog.load || ''}
                            onChange={(e) => handleInputChange(i, 'load', e.target.value)}
                            className={cn(
                                "w-full bg-zinc-50 border-transparent rounded-lg py-3 px-3 text-center font-bold text-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none",
                                setLog.completed && "text-green-700 bg-white/50"
                            )}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-bold pointer-events-none">KG</span>
                    </div>
                    <div className="relative">
                        <input
                            type="tel"
                            inputMode="numeric"
                            placeholder={histSet?.reps || details.reps || "reps"}
                            value={setLog.reps || ''}
                            onChange={(e) => handleInputChange(i, 'reps', e.target.value)}
                            className={cn(
                                "w-full bg-zinc-50 border-transparent rounded-lg py-3 px-3 text-center font-bold text-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none",
                                setLog.completed && "text-green-700 bg-white/50"
                            )}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-bold pointer-events-none">REPS</span>
                    </div>
                </div>

                {/* Big Check Button */}
                <button
                    onClick={() => handleCheckSet(i)}
                    className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95",
                        setLog.completed
                            ? "bg-green-500 text-white shadow-green-200 ring-2 ring-green-100"
                            : "bg-zinc-100 text-zinc-300 hover:bg-zinc-200"
                    )}
                >
                    <Check className={cn("w-6 h-6 transition-transform", setLog.completed && "scale-110 stroke-[3px]")} />
                </button>
            </div>
        );
    });

    return (
        <div className="space-y-4">
            {/* Ghost Data Header */}
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2 text-xs text-brand-400 font-medium">
                    <RotateCcw className="w-3 h-3" />
                    <span>Última vez: <strong className="text-brand-600">{ghostData}</strong></span>
                </div>
                {historyLog && (
                    <button
                        onClick={handleRepeatLoad}
                        className="text-[10px] bg-brand-50 text-brand-600 px-2 py-1 rounded-md font-bold uppercase hover:bg-brand-100 transition"
                    >
                        Repetir Carga
                    </button>
                )}
            </div>

            {/* Set List */}
            <div className="space-y-3">
                {rows}
            </div>
        </div>
    );
}
