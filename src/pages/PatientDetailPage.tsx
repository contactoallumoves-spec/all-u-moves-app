import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { EvaluationService } from '../services/evaluationService';
import { SessionService } from '../services/sessionService'; // [NEW]
import { Patient } from '../types/patient';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ArrowLeft, Clock, Calendar, FileText, Activity, PlayCircle, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export default function PatientDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (patientId: string) => {
        setLoading(true);
        try {
            const p = await PatientService.getById(patientId);
            setPatient(p);

            // Fetch Evaluations and Sessions
            const [evals, sessions] = await Promise.all([
                EvaluationService.getByPatientId(patientId),
                SessionService.getByPatientId(patientId)
            ]);

            // Normalize and Merge
            const normalizedEvals = evals.map(e => ({
                id: e.id,
                type: e.type === 'fast' ? 'eval_fast' : 'eval_complete',
                date: e.date,
                title: e.type === 'fast' ? 'Evaluación Rápida' : 'Evaluación Completa',
                summary: e.summary || 'Sin resumen',
                findings: e.details?.symptoms || [],
                timestamp: e.date instanceof Date ? e.date.getTime() : 0
            }));

            const normalizedSessions = sessions.map(s => ({
                id: s.id,
                type: 'session',
                date: s.date,
                title: 'Evolución / Sesión',
                summary: s.notes || 'Sin notas',
                findings: s.interventions || [],
                timestamp: s.date instanceof Date ? s.date.getTime() : 0
            }));

            const combinedHistory = [...normalizedEvals, ...normalizedSessions].sort((a, b) => b.timestamp - a.timestamp);
            setHistory(combinedHistory);

        } catch (error) {
            console.error("Error loading patient", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-brand-500">Cargando ficha...</div>;
    if (!patient) return <div className="p-8 text-center">Paciente no encontrada</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-brand-900">{patient.firstName} {patient.lastName}</h1>
                        <div className="flex gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
                                {patient.stage || 'General'}
                            </span>
                            <span className="text-sm text-brand-400">• {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} años</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/eval/new/${id}`)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Evaluación
                    </Button>
                    <Button className="bg-brand-800 text-white shadow-lg shadow-brand-200/50" onClick={() => navigate(`/users/${id}/sessions/new`)}>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Nueva Sesión (Evolución)
                    </Button>
                </div>
            </div>

            {/* Hub Grid */}
            <div className="grid md:grid-cols-3 gap-6">

                {/* Left Column: Timeline & History */}
                <div className="md:col-span-2 space-y-6">

                    {/* Active Alerts / Next Session Checklist */}
                    <Card className="bg-orange-50/50 border-orange-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm uppercase tracking-wider text-orange-800 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Checklist Próxima Sesión
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-brand-800">
                                    <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500" />
                                    Re-evaluar fuerza suelo pélvico (Oxford)
                                </li>
                                <li className="flex items-center gap-2 text-sm text-brand-800">
                                    <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500" />
                                    Preguntar adherencia ejercicios respiratorios
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-brand-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-brand-400" /> Historial Clínico
                        </h2>

                        <div className="relative border-l-2 border-brand-100 ml-3 space-y-8 pl-8 py-2">
                            {history.length === 0 && <p className="text-sm text-brand-400 italic">No hay registros aún.</p>}

                            {history.map((item, idx) => (
                                <div key={idx} className="relative group">
                                    {/* Dot */}
                                    <div className={cn(
                                        "absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm",
                                        item.type.includes('eval') ? "bg-purple-500" : "bg-brand-500"
                                    )} />

                                    <div className="bg-white p-4 rounded-xl border border-brand-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-brand-900">{item.title}</h3>
                                                <p className="text-xs text-brand-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {item.date?.toDate ? new Date(item.date.toDate()).toLocaleDateString() : 'Fecha desconocida'}
                                                </p>
                                            </div>
                                            <span className="text-xs font-mono text-brand-300 bg-brand-50 px-2 py-1 rounded">
                                                {item.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{item.summary}</p>

                                        {/* Tags/Chips */}
                                        <div className="flex flex-wrap gap-2">
                                            {item.findings?.slice(0, 3).map((f: string, i: number) => (
                                                <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                                                    {f}
                                                </span>
                                            ))}
                                            {item.findings?.length > 3 && <span className="text-xs text-brand-400">+{item.findings.length - 3} más</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Plan & Stats */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-brand-500">Plan Actual</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-bold text-xs text-brand-400 mb-2 uppercase">Tareas Activas</h4>
                                <div className="space-y-2">
                                    {['Respiración Diafragmática', 'Knack Pre-esfuerzo', 'Caminata 15min'].map(task => (
                                        <div key={task} className="flex items-center gap-2 p-2 bg-brand-50 rounded-lg text-sm text-brand-700">
                                            <FileText className="w-3 h-3 text-brand-400" /> {task}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-xs text-brand-400 mb-2 uppercase">Próximo Objetivo</h4>
                                <p className="text-sm text-brand-900 italic">"Lograr estornudar sin escapes para la próxima semana"</p>
                            </div>

                            <Button variant="outline" className="w-full text-xs" size="sm">
                                Ver Plan Completo / Editar
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-brand-500">Progreso</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200 text-xs text-gray-400">
                                Gráfico de Síntomas
                                {/* Placeholder for Charts */}
                            </div>
                            <div className="mt-4 flex justify-between text-xs text-center">
                                <div>
                                    <div className="font-bold text-brand-900 text-lg">3/5</div>
                                    <div className="text-brand-400">Oxford</div>
                                </div>
                                <div>
                                    <div className="font-bold text-brand-900 text-lg">7.5</div>
                                    <div className="text-brand-400">ICIQ-UI</div>
                                </div>
                                <div>
                                    <div className="font-bold text-brand-900 text-lg">80%</div>
                                    <div className="text-brand-400">Adherencia</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
