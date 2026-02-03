import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Patient, SessionLog } from '../../types/patient';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlayCircle, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { SessionLogService } from '../../services/sessionLogService';

const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function PortalDashboard() {
    const { patient } = useOutletContext<{ patient: Patient }>();
    const navigate = useNavigate();

    // State for selected day view (default to Today)
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]); // [NEW] Store logs for calendar

    // Derived State
    const dayIndex = selectedDate.getDay();
    const dayKey = DAYS_MAP[dayIndex]; // 'monday', 'tuesday' etc.
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    // Plan Data
    const activePlan = patient.activePlan;

    // Calculate Scheduled Days (e.g. ['monday', 'wednesday'])
    const scheduledDays = activePlan && activePlan.schedule
        ? Object.entries(activePlan.schedule)
            .filter(([_, exercises]) => exercises && exercises.length > 0)
            .map(([day]) => day)
        : [];

    // [NEW] Fetch Session Logs on Mount to populate Calendar
    useEffect(() => {
        if (patient.id) {
            SessionLogService.getByPatientId(patient.id)
                .then(logs => {
                    setSessionLogs(logs);
                })
                .catch(err => console.error("Error fetching logs for dashboard", err));
        }
    }, [patient.id]);

    // [NEW] Compute Completed Dates from Logs
    const completedDates = sessionLogs.map(log => {
        // Handle Firestore Timestamp or JS Date
        let dateObj = log.date;
        if ((log.date as any)?.toDate) {
            dateObj = (log.date as any).toDate();
        } else if (!(log.date instanceof Date)) {
            dateObj = new Date(log.date);
        }
        return format(dateObj, 'yyyy-MM-dd');
    });

    // Selected Date Content
    const selectedExercises = activePlan && activePlan.schedule && (dayKey in activePlan.schedule)
        ? activePlan.schedule[dayKey as keyof typeof activePlan.schedule]
        : [];

    // Check if the SELECTED date is completed
    // We compare formatting selectedDate to YYYY-MM-DD with our completedDates list
    const isSelectedDateCompleted = completedDates.includes(format(selectedDate, 'yyyy-MM-dd'));
    const hasSession = selectedExercises && selectedExercises.length > 0;

    // [NEW] Missed Logic (Past date + Has Session + Not Completed)
    const isMissed = hasSession && !isSelectedDateCompleted && isBefore(selectedDate, startOfDay(new Date()));

    // [NEW] Equipment Summary (Mocked or Basic for now)
    const uniqueEquipment = Array.from(new Set(selectedExercises.map((ex: any) => ex.details?.equipment || 'Sin equipo').flat()));
    // Clean up 'Sin equipo' if mixed
    const equipmentSummary = uniqueEquipment.filter(e => e !== 'Sin equipo').join(', ') || (uniqueEquipment.includes('Sin equipo') ? 'Sin implementos' : '');

    // Formatting
    const dayName = format(selectedDate, 'EEEE', { locale: es }); // "lunes"
    const formattedDate = format(selectedDate, "d 'de' MMMM", { locale: es }); // "2 de febrero"

    return (
        <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20 max-w-md mx-auto">
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
            <WeeklyCalendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                scheduledDays={scheduledDays}
                completedDates={completedDates}
            />

            {/* Selected Day Card */}
            <Card className="border-brand-100 shadow-xl bg-white overflow-hidden relative transition-all duration-300 ring-1 ring-brand-50">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-brand-50 to-brand-100 rounded-bl-[100px] -mr-10 -mt-10 opacity-60 z-0 pointer-events-none" />

                <CardContent className="p-6 relative z-10 space-y-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="uppercase text-[10px] font-bold tracking-widest text-brand-400 bg-brand-50 px-2 py-0.5 rounded-full">
                                    {isToday ? "Hoy" : dayName}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-brand-900 leading-tight">
                                {hasSession
                                    ? (isSelectedDateCompleted ? "¡Sesión Completada!" : (isMissed ? "Sesión Pendiente" : "Tu Sesión"))
                                    : "Día de Descanso"}
                            </h2>
                            {hasSession && (
                                <div className="space-y-1 mt-1">
                                    <p className="text-brand-500 text-xs font-medium">
                                        {selectedExercises.length} ejercicios • ~45 min
                                    </p>
                                    {equipmentSummary && (
                                        <p className="text-xs text-brand-400 font-medium flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-brand-300" />
                                            {equipmentSummary}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                            isSelectedDateCompleted
                                ? "bg-green-500 text-white"
                                : isMissed
                                    ? "bg-orange-100 text-orange-600"
                                    : (hasSession ? "bg-brand-900 text-white" : "bg-zinc-100 text-zinc-400")
                        )}>
                            {isSelectedDateCompleted ? <CheckCircle2 className="w-6 h-6" /> : (hasSession ? <PlayCircle className="w-6 h-6 ml-0.5" /> : <Clock className="w-6 h-6" />)}
                        </div>
                    </div>

                    {hasSession ? (
                        <div className="space-y-4">
                            {/* Exercise Preview List (Limited) */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-brand-300 uppercase tracking-widest">Preview</p>
                                {selectedExercises.slice(0, 3).map((ex: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 text-sm text-brand-800 p-2.5 rounded-lg border border-brand-50 bg-brand-50/30">
                                        <div className="w-6 h-6 bg-brand-200 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-700">
                                            {idx + 1}
                                        </div>
                                        <span className="truncate flex-1 font-medium capitalize">{ex.name}</span>
                                    </div>
                                ))}
                                {selectedExercises.length > 3 && (
                                    <p className="text-xs text-brand-400 text-center italic">+ {selectedExercises.length - 3} más...</p>
                                )}
                            </div>

                            <Button
                                className={cn(
                                    "w-full text-white shadow-xl group h-12 text-base rounded-xl transition-colors",
                                    isSelectedDateCompleted
                                        ? "bg-green-600 hover:bg-green-700 shadow-green-900/20"
                                        : isMissed
                                            ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                                            : "bg-brand-900 hover:bg-brand-800 shadow-brand-900/20"
                                )}
                                onClick={() => navigate(`../session/${dayKey}`)}
                            >
                                <span className="mr-2">
                                    {isSelectedDateCompleted
                                        ? "Ver Resumen / Repetir"
                                        : isMissed
                                            ? "Recuperar Sesión"
                                            : "Iniciar Sesión"}
                                </span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    ) : (
                        <div className="py-8 px-4 bg-zinc-50 rounded-xl text-center border-2 border-zinc-100 border-dashed">
                            <CheckCircle2 className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                            <p className="text-zinc-400 text-sm">Disfruta tu descanso. ¡Nos vemos mañana!</p>
                        </div>
                    )}
                </CardContent>
            </Card >
        </div >
    );
}
