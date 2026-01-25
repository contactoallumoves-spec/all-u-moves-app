import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Users, Calendar, Activity, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { EvaluationService } from '../services/evaluationService';
import { SessionService } from '../services/sessionService';
import { Patient } from '../types/patient';

export default function DashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activeUsers: 0,
        evalsMonth: 0,
        sessionsMonth: 0
    });
    const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
    const [alerts, setAlerts] = useState<{ type: 'redFlag' | 'adherence', patient: string, message: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Load Stats
            const [usersCount, evalsCount, sessionsCount] = await Promise.all([
                PatientService.getCount(),
                EvaluationService.getThisMonthCount(),
                SessionService.getThisMonthCount()
            ]);

            setStats({
                activeUsers: usersCount,
                evalsMonth: evalsCount,
                sessionsMonth: sessionsCount
            });

            // 2. Load Recent Patients
            const recent = await PatientService.getRecent(5);
            setRecentPatients(recent);

            // 3. Generate Alerts (Simplified Logic for now)
            // In a real app, this might be a dedicated query. Here we scan recent patients for demo.
            const newAlerts: { type: 'redFlag' | 'adherence', patient: string, message: string }[] = [];

            // Check Red Flags in recent patients
            recent.forEach(p => {
                if (p.clinicalData?.redFlags && p.clinicalData.redFlags.length > 0) {
                    newAlerts.push({
                        type: 'redFlag',
                        patient: `${p.firstName} ${p.lastName}`,
                        message: `Presenta ${p.clinicalData.redFlags.length} bandera(s) roja(s): ${p.clinicalData.redFlags.slice(0, 2).join(', ')}`
                    });
                }
            });

            setAlerts(newAlerts);

        } catch (error) {
            console.error("Error loading dashboard", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-900">Hola, Fernanda</h1>
                    <p className="text-brand-500 mt-1">Aquí está el resumen de tu práctica hoy.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate('/users')}>Ver Pacientes</Button>
                    <Button onClick={() => navigate('/eval/new')}>Iniciar Consulta</Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-brand-500 uppercase tracking-wider">Usuarias Activas</CardTitle>
                        <Users className="h-4 w-4 text-brand-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-900">{loading ? '-' : stats.activeUsers}</div>
                        <p className="text-xs text-brand-400 mt-1">Total registrados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-brand-500 uppercase tracking-wider">Sesiones (Mes)</CardTitle>
                        <Calendar className="h-4 w-4 text-brand-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-900">{loading ? '-' : stats.sessionsMonth}</div>
                        <p className="text-xs text-brand-400 mt-1">Realizadas este mes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-brand-500 uppercase tracking-wider">Evaluaciones (Mes)</CardTitle>
                        <Activity className="h-4 w-4 text-brand-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-900">{loading ? '-' : stats.evalsMonth}</div>
                        <p className="text-xs text-brand-400 mt-1">Nuevos ingresos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Quick Lists */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-brand-800">Pacientes Recientes</h2>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/users')}>
                            Ver todas <ArrowRight className="ml-1 w-3 h-3" />
                        </Button>
                    </div>

                    <Card className="overflow-hidden min-h-[200px]">
                        <div className="divide-y divide-brand-50">
                            {loading && <div className="p-8 text-center text-brand-300">Cargando...</div>}

                            {!loading && recentPatients.length === 0 && (
                                <div className="p-8 text-center text-brand-300 italic">No hay pacientes recientes.</div>
                            )}

                            {!loading && recentPatients.map((user) => (
                                <div key={user.id} onClick={() => navigate(`/users/${user.id}`)} className="p-4 flex items-center justify-between hover:bg-brand-50/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-brand-900 group-hover:text-brand-700">{user.firstName} {user.lastName}</p>
                                            <p className="text-xs text-brand-500">{user.stage || 'General'}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-brand-400">Ver Ficha</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-brand-800">Alertas Clínicas</h2>
                    </div>
                    <Card className="bg-orange-50/50 border-orange-100 min-h-[200px]">
                        <div className="p-4 space-y-3">
                            {loading && <div className="p-4 text-center text-orange-300">Verificando...</div>}

                            {!loading && alerts.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full py-8 text-brand-400">
                                    <CheckCircle2 className="w-8 h-8 mb-2 text-green-400/50" />
                                    <p className="text-sm">Todo en orden por ahora.</p>
                                </div>
                            )}

                            {!loading && alerts.map((alert, i) => (
                                <div key={i} className="flex gap-3 items-start p-2 rounded-lg bg-orange-100/30">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-orange-400 shrink-0 animate-pulse" />
                                    <div>
                                        <p className="text-sm font-medium text-brand-900 cursor-pointer hover:underline" onClick={() => {
                                            // Find patient ID logic would be needed here, or store ID in alert
                                            // For now just name
                                        }}>
                                            {alert.message.includes('Red Flags') ? 'Bandera Roja: ' : 'Atención: '}
                                            {alert.patient}
                                        </p>
                                        <p className="text-xs text-brand-600 mt-0.5">{alert.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
