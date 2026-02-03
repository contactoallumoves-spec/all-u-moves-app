import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SkipExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, note?: string) => void;
}

const SKIP_REASONS = [
    'Dolor / Molestia',
    'Falta de tiempo',
    'No tengo el equipo',
    'No entendí cómo hacerlo',
    'Muy difícil',
    'Otro'
];

export function SkipExerciseModal({ isOpen, onClose, onConfirm }: SkipExerciseModalProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [note, setNote] = useState('');

    const handleConfirm = () => {
        if (!selectedReason) return;
        onConfirm(selectedReason, note);
        // Reset state after confirm
        setSelectedReason(null);
        setNote('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl safe-area-bottom max-w-md mx-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                ¿Por qué no realizaste este ejercicio?
                            </h3>
                            <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Reasons Grid */}
                            <div className="flex flex-wrap gap-2">
                                {SKIP_REASONS.map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => setSelectedReason(reason)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedReason === reason
                                                ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-500 ring-offset-1'
                                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                            }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>

                            {/* Note Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    Nota adicional (Opcional)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Detalles sobre por qué lo cambiaste u omitiste..."
                                    className="w-full bg-zinc-50 border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none min-h-[80px]"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-2">
                                <Button
                                    onClick={handleConfirm}
                                    disabled={!selectedReason}
                                    className={`w-full py-6 text-base font-bold rounded-2xl ${selectedReason
                                            ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-300'
                                            : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                                        }`}
                                >
                                    Confirmar y Saltar
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
