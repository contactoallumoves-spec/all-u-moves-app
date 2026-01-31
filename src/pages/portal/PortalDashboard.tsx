import { useOutletContext } from 'react-router-dom';
import { Patient } from '../../types/patient';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlayCircle, Calendar, Clock } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming cn utility is available or just use template literals

export default function PortalDashboard() {
    const { patient } = useOutletContext<{ patient: Patient }>();

    // Mock "Today's Session" logic (replace with real Plan filtering later)
    const today = new Date().toLocaleDateString('es-CL', { weekday: 'long' });
    const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Check if there is active plan
    const activePlan = patient.activePlan;
    const todaysExercises = activePlan?.schedule?.[todayKey as keyof typeof activePlan.schedule] || [];
    const hasSessionToday = todaysExercises.length > 0;

    return (
        <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header / Greeting */}
            <div className="space-y-1">
                <h1 className="text-2xl font-serif font-bold text-brand-900">
                    Hola, {patient.firstName}
                </h1>
                <p className="text-brand-500 text-sm">
                    {today.charAt(0).toUpperCase() + today.slice(1)} • Tienes {todaysExercises.length} ejercicios
                </p>
            </div>

            {/* Today's Hero Card */}
            <Card className="border-brand-200 shadow-lg bg-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-100 rounded-bl-full -mr-8 -mt-8 opacity-50 z-0" />
                <CardContent className="p-6 relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold text-brand-800">Tu Sesión de Hoy</h2>
                            {hasSessionToday ? (
                                <p className="text-brand-600 text-sm mt-1">Enfocada en: Movilidad & Suelo Pélvico</p>
                            ) : (
                                <p className="text-brand-400 text-sm mt-1">Hoy es día de descanso</p>
                            )}
                        </div>
                        <div className="bg-brand-100 p-2 rounded-full">
                            {hasSessionToday ? <PlayCircle className="w-6 h-6 text-brand-600" /> : <Clock className="w-6 h-6 text-brand-400" />}
                        </div>
                    </div>

                    {hasSessionToday ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-brand-500 font-medium bg-brand-50 p-2 rounded-lg w-fit">
                                <Clock className="w-3 h-3" /> ~25 Minutos
                            </div>
                            <Button className="w-full bg-brand-800 hover:bg-brand-900 text-white shadow-lg shadow-brand-200/50" size="lg">
                                Iniciar Ahora
                            </Button>
                        </div>
                    ) : (
                        <div className="p-4 bg-brand-50 rounded-lg text-center text-sm text-brand-500">
                            ¡Disfruta tu descanso! Nos vemos mañana.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Weekly Overview (Simplified) */}
            <div className="space-y-3">
                <h3 className="font-bold text-brand-800 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Tu Semana
                </h3>
                <div className="grid grid-cols-7 gap-1">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => {
                        const isToday = i === (new Date().getDay() - 1 < 0 ? 6 : new Date().getDay() - 1); // 0=Sun
                        return (
                            <div key={i} className={cn(
                                "aspect-[3/4] rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors border",
                                isToday ? "bg-brand-600 text-white border-brand-600 shadow-md transform scale-105" : "bg-white text-brand-400 border-brand-100"
                            )}>
                                <span>{day}</span>
                                <div className={cn("w-1.5 h-1.5 rounded-full mt-1", i < 2 ? "bg-green-400" : "bg-brand-200")} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-brand-50/50 border-brand-100">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <span className="text-2xl font-bold text-brand-700">3/5</span>
                        <span className="text-xs text-brand-400 uppercase font-bold tracking-wider mt-1">Sesiones</span>
                    </CardContent>
                </Card>
                <Card className="bg-brand-50/50 border-brand-100">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <span className="text-2xl font-bold text-brand-700">80%</span>
                        <span className="text-xs text-brand-400 uppercase font-bold tracking-wider mt-1">Cumplimiento</span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
