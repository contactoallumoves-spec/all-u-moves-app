import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Patient } from '../../types/patient';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlayCircle, Calendar, Clock, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// Robust mapping for 0-6 day index
const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Helper to get day dates for the current week (starting Monday for display preference, but using native date logic)
const getCurrentWeekDays = () => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) - 6 (Sat)

    // Calculate Monday of the current week
    // If Sunday (0), we need to go back 6 days. If Monday (1), go back 0 days? No, if Monday(1), diff is today.getDate() - 1 + 1?
    // Standard algorithm:
    // day === 0 ? -6 : 1 - day
    // Mon(1) -> 0. Tue(2) -> -1. Sun(0) -> -6.
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));

    const week = [];
    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        week.push(nextDay);
    }
    return week;
};

export default function PortalDashboard() {
    const { patient } = useOutletContext<{ patient: Patient }>();
    const navigate = useNavigate();

    // State for selected day view (default to Today)
    const [selectedDate, setSelectedDate] = useState(new Date());
    const weekDays = getCurrentWeekDays();

    // Derived State
    const dayIndex = selectedDate.getDay();
    const dayKey = DAYS_MAP[dayIndex]; // 'monday', 'tuesday' etc. SAFE KEY
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    // Plan Data
    const activePlan = patient.activePlan;

    // Safe Access with Fallback
    const selectedExercises = activePlan && activePlan.schedule && (dayKey in activePlan.schedule)
        ? activePlan.schedule[dayKey as keyof typeof activePlan.schedule]
        : [];

    const hasSession = selectedExercises && selectedExercises.length > 0;

    // Formatting for display (Locale ES-CL)
    const dayName = selectedDate.toLocaleDateString('es-CL', { weekday: 'long' });
    const formattedDate = selectedDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });

    return (
        <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
            {/* Header / Greeting */}
            <div className="space-y-1">
                <h1 className="text-2xl font-serif font-bold text-brand-900">
                    Hola, {patient.firstName}
                </h1>
                <p className="text-brand-500 text-sm capitalize">
                    {dayName}, {formattedDate}
                </p>
            </div>

            {/* Weekly Calendar (Interactive) */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-brand-800 text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Tu Semana
                    </h3>
                    {!isToday && (
                        <button
                            onClick={() => setSelectedDate(new Date())}
                            className="text-[10px] text-brand-600 font-bold uppercase hover:bg-brand-50 px-2 py-1 rounded transition-colors"
                        >
                            Volver a Hoy
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((date, i) => {
                        const dIndex = date.getDay();
                        const dKey = DAYS_MAP[dIndex];
                        const count = activePlan?.schedule?.[dKey as keyof typeof activePlan.schedule]?.length || 0;
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const isCurrentDay = date.toDateString() === new Date().toDateString();

                        // Strict Spanish single letter labels
                        const label = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][dIndex];

                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(date)}
                                className={cn(
                                    "aspect-[3/4] rounded-xl flex flex-col items-center justify-center gap-1 transition-all border relative overflow-hidden",
                                    isSelected
                                        ? "bg-brand-600 text-white border-brand-600 shadow-lg scale-105 z-10"
                                        : "bg-white text-brand-400 border-brand-100 hover:border-brand-300 hover:bg-brand-50",
                                    isCurrentDay && !isSelected && "ring-2 ring-brand-200 ring-offset-1"
                                )}
                            >
                                <span className="text-[10px] font-bold opacity-80">{label}</span>
                                <span className={cn("text-sm font-bold", isSelected ? "text-white" : "text-brand-900")}>
                                    {date.getDate()}
                                </span>

                                {/* Status Dot */}
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full mt-1",
                                    count > 0
                                        ? (isSelected ? "bg-white" : "bg-brand-400")
                                        : "bg-transparent"
                                )} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Card */}
            <Card className="border-brand-200 shadow-lg bg-white overflow-hidden relative transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-100 rounded-bl-full -mr-8 -mt-8 opacity-50 z-0" />
                <CardContent className="p-6 relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold text-brand-800">
                                {isToday ? "Tu Sesión de Hoy" : `Sesión del ${dayName}`}
                            </h2>
                            {hasSession ? (
                                <p className="text-brand-600 text-sm mt-1">
                                    {selectedExercises.length} ejercicio{selectedExercises.length !== 1 ? 's' : ''} programados
                                </p>
                            ) : (
                                <p className="text-brand-400 text-sm mt-1">Día de descanso</p>
                            )}
                        </div>
                        <div className={cn("p-2 rounded-full", hasSession ? "bg-brand-100" : "bg-zinc-100")}>
                            {hasSession ? <PlayCircle className="w-6 h-6 text-brand-600" /> : <Clock className="w-6 h-6 text-zinc-400" />}
                        </div>
                    </div>

                    {hasSession ? (
                        <div className="space-y-3">
                            {/* Exercise Preview List */}
                            <div className="space-y-2 mt-2">
                                {selectedExercises.slice(0, 3).map((ex: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-brand-700 bg-brand-50/50 p-2 rounded border border-brand-100/50">
                                        <div className="w-1 h-8 bg-brand-300 rounded-full" />
                                        <span className="truncate flex-1 font-medium capitalize">{ex.name}</span>
                                    </div>
                                ))}
                                {selectedExercises.length > 3 && (
                                    <p className="text-xs text-brand-400 text-center italic">+ {selectedExercises.length - 3} más...</p>
                                )}
                            </div>

                            <Button
                                className="w-full bg-brand-800 hover:bg-brand-900 text-white shadow-lg shadow-brand-200/50 mt-2 group"
                                size="lg"
                                onClick={() => navigate(`../session/${dayKey}`)} // Use relative up .. to ensure we stay under :token
                            >
                                <span className="mr-2">Ver Sesión</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    ) : (
                        <div className="p-6 bg-brand-50/50 rounded-xl text-center border border-brand-100 border-dashed">
                            <p className="text-brand-400 text-sm">No hay ejercicios asignados para este día.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
