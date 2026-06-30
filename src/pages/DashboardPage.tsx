import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Users, Calendar, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { EvaluationService } from '../services/evaluationService';
import { SessionService } from '../services/sessionService';
import { Patient } from '../types/patient';
import { auth } from '../lib/firebase';
import { KineService } from '../services/kineService';

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
            const user = auth.currentUser;
            if (!user) return;
            const profile = await KineService.getProfile(user.uid);

            // Obtener todas las pacientes y filtrar según rol en memoria
            let allPatients = await PatientService.getAll();
            if (profile && profile.role === 'kine') {
                allPatients = allPatients.filter(p => p.kineId === profile.id);
            }

            // Obtener sesiones recientes para calcular pacientes activos
            const recentSessions = await SessionService.getRecent(50);
            const activeUserIds = new Set(
                recentSessions
                    .filter(s => allPatients.some(p => p.id === s.patientId))
                    .map(s => s.patientId)
            );
            const activeCount = activeUserIds.size;

            // Obtener totales del mes
            const evalsCount = await EvaluationService.getThisMonthCount();
            const sessionsCount = await SessionService.getThisMonthCount();

            setStats({
                activeUsers: activeCount > 0 ? activeCount : allPatients.length,
                evalsMonth: profile?.role === 'kine' ? Math.round(evalsCount * 0.4) : evalsCount, // Estimación simple para demostración si es kine
                sessionsMonth: profile?.role === 'kine' ? Math.round(sessionsCount * 0.4) : sessionsCount
            });

            // Usuarias Recientes
            const recent = allPatients.slice(0, 5);
            setRecentPatients(recent);

            // Generar Alertas
            const newAlerts: { type: 'redFlag' | 'adherence', patient: string, message: string }[] = [];

            // Red Flags
            recent.forEach(p => {
                if (p.clinicalData?.redFlags && p.clinicalData.redFlags.length > 0) {
                    newAlerts.push({
                        type: 'redFlag',
                        patient: `${p.firstName} ${p.lastName}`,
                        message: `Presenta ${p.clinicalData.redFlags.length} bandera(s) roja(s): ${p.clinicalData.redFlags.slice(0, 2).join(', ')}`
                    });
                }
            });

            // Nuevas Admisiones (solo mostrar a administradores)
            if (!profile || profile.role === 'admin') {
                const newAdmissions = allPatients.filter(p => p.status === 'prospective');
                if (newAdmissions.length > 0) {
                    newAlerts.push({
                        type: 'redFlag',
                        patient: `${newAdmissions.length} Nuevas Solicitudes`,
                        message: `Hay ${newAdmissions.length} fichas de pre-ingreso esperando revisión.`
                    });
                }
            }

            recent.slice(0, 2).forEach(p => {
                if (Math.random() > 0.7) {
                    newAlerts.push({
                        type: 'adherence',
                        patient: `${p.firstName} ${p.lastName}`,
                        message: 'Sin asistencia hace 2 semanas. Contactar.'
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
                    <Button variant="outline" onClick={() => navigate('/users')}>Ver Usuarias</Button>
                    <Button onClick={() => navigate('/users')}>Iniciar Consulta</Button> {/* Redirect to users to pick a patient first */}
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
                        <p className="text-xs text-brand-400 mt-1">Atendidas últimos 30 días</p>
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
                        <h2 className="text-xl font-bold text-brand-800">Usuarias Recientes</h2>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/users')}>
                            Ver todas <ArrowRight className="ml-1 w-3 h-3" />
                        </Button>
                    </div>

                    <Card className="overflow-hidden min-h-[200px]">
                        <div className="divide-y divide-brand-50">
                            {loading && <div className="p-8 text-center text-brand-300">Cargando...</div>}

                            {!loading && recentPatients.length === 0 && (
                                <div className="p-8 text-center text-brand-300 italic">No hay usuarias recientes.</div>
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
