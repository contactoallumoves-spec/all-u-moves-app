import { useState, useEffect } from 'react';
import { X, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global timer state could be moved to Context if it needs to persist navigation
// For now, local state with 'lifted' control or simple specific usage.

interface SmartTimerProps {
    autoStartDuration?: number; // seconds
    onComplete?: () => void;
    isVisible: boolean;
    onClose: () => void;
}

export function SmartTimer({ autoStartDuration = 90, isVisible, onClose }: SmartTimerProps) {
    const [timeLeft, setTimeLeft] = useState(autoStartDuration);
    const [isRunning, setIsRunning] = useState(false);

    // Reset when visibility or duration changes
    useEffect(() => {
        if (isVisible) {
            setTimeLeft(autoStartDuration);
            setIsRunning(true);
        } else {
            setIsRunning(false);
        }
    }, [isVisible, autoStartDuration]);

    // Tick
    useEffect(() => {
        let interval: any;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((t) => t - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            // Optional: Play sound
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const progress = Math.max(0, (timeLeft / autoStartDuration) * 100);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-20 right-4 left-4 md:left-auto md:w-80 bg-zinc-900 border border-zinc-800 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        {/* Circular Progress */}
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="24" cy="24" r="20"
                                    className="stroke-zinc-700 fill-none"
                                    strokeWidth="4"
                                />
                                <circle
                                    cx="24" cy="24" r="20"
                                    className="stroke-brand-500 fill-none transition-all duration-1000 ease-linear"
                                    strokeWidth="4"
                                    strokeDasharray="125.6"
                                    strokeDashoffset={125.6 - (125.6 * progress) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-xs font-bold font-mono">{timeLeft}s</span>
                        </div>

                        <div>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Descanso</p>
                            <div className="flex gap-2 text-xs mt-1">
                                <button onClick={() => setTimeLeft(t => t + 15)} className="px-2 py-1 bg-zinc-800 rounded hover:bg-zinc-700">+15s</button>
                                <button onClick={() => setTimeLeft(t => Math.max(0, t - 15))} className="px-2 py-1 bg-zinc-800 rounded hover:bg-zinc-700">-15s</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition"
                        >
                            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-red-900/50 hover:text-red-400 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
