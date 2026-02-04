import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import { Frown, Smile } from 'lucide-react';

interface SessionFeedbackProps {
    onComplete: (data: { rpe: number; notes: string; pain?: boolean }) => void;
}

export function SessionFeedback({ onComplete }: SessionFeedbackProps) {
    const [rpe, setRpe] = useState<number | null>(null);
    const [notes, setNotes] = useState('');
    const [pain, setPain] = useState<boolean | null>(null);

    const handleSubmit = () => {
        if (rpe === null) return;
        onComplete({ rpe, notes, pain: pain || false });
    };

    return (
        <div className="fixed inset-0 bg-brand-600/95 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-8"
            >
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-brand-900">¿Cómo estuvo la sesión?</h2>
                    <p className="text-zinc-500 text-sm">Tu feedback nos ayuda a ajustar tu plan.</p>
                </div>

                {/* RPE Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-semibold text-brand-800">
                        <span>Esfuerzo Percibido (RPE)</span>
                        <span className="text-2xl font-black text-brand-600">{rpe ?? '-'}</span>
                    </div>

                    <div className="relative h-12 flex items-center justify-between gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                            // Color gradient logic
                            const getColor = (v: number) => {
                                if (v <= 3) return 'bg-green-400';
                                if (v <= 6) return 'bg-amber-400';
                                if (v <= 8) return 'bg-orange-500';
                                return 'bg-red-500';
                            };

                            return (
                                <button
                                    key={val}
                                    onClick={() => setRpe(val)}
                                    className={cn(
                                        "flex-1 h-full rounded-lg transition-all duration-200 hover:scale-110",
                                        rpe === val ? "ring-2 ring-offset-2 ring-brand-900 scale-110 shadow-lg" : "opacity-40 hover:opacity-100",
                                        getColor(val)
                                    )}
                                    title={`Nivel ${val}`}
                                >
                                    <span className="sr-only">{val}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        <span>Muy Fácil</span>
                        <span>Extremo</span>
                    </div>
                </div>

                {/* Pain Check */}
                <div className="space-y-3">
                    <span className="text-sm font-semibold text-brand-800 block">¿Sentiste dolor o molestias?</span>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setPain(false)}
                            className={cn(
                                "p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all",
                                pain === false ? "border-green-500 bg-green-50 text-green-700 font-bold" : "border-zinc-100 text-zinc-400"
                            )}
                        >
                            <Smile className="w-5 h-5" /> Todo Bien
                        </button>
                        <button
                            onClick={() => setPain(true)}
                            className={cn(
                                "p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all",
                                pain === true ? "border-red-500 bg-red-50 text-red-700 font-bold" : "border-zinc-100 text-zinc-400"
                            )}
                        >
                            <Frown className="w-5 h-5" /> Tuve Dolor
                        </button>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-brand-800">Notas Adicionales (Opcional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Comentarios para tu kinesiólogo..."
                        className="w-full p-4 rounded-xl bg-zinc-50 border-0 focus:ring-2 focus:ring-brand-500 resize-none h-24 text-sm"
                    />
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={rpe === null}
                    className="w-full h-14 text-lg bg-brand-800 hover:bg-brand-900 text-white rounded-2xl shadow-xl shadow-brand-200/50"
                >
                    Finalizar Sesión
                </Button>
            </motion.div>
        </div>
    );
}
