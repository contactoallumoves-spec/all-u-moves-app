import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { EvaluationService } from '../services/evaluationService';
import { SessionService } from '../services/sessionService';
import { Patient } from '../types/patient';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ArrowLeft, Clock, Calendar, FileText, Activity, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getLabel } from '../data/catalog';

// Helper to recursively render any object data
const DataRenderer = ({ data, level = 0 }: { data: any, level?: number }) => {
    if (data === null || data === undefined) return null;
    if (typeof data !== 'object') return <span className="text-gray-600 font-medium ml-2">{String(data)}</span>;
    if (Object.keys(data).length === 0) return null;

    return (
        <div className={`space-y-2 ${level > 0 ? 'ml-3 border-l-2 border-brand-100 pl-3 mt-2' : ''}`}>
            {Object.entries(data).map(([key, value]) => {
                if (value === null || value === undefined || value === '') return null;
                // Beautify key
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return (
                        <div key={key} className="mt-1">
                            <span className="text-xs font-bold text-brand-500 uppercase tracking-wide block mb-1">{label}</span>
                            <DataRenderer data={value} level={level + 1} />
                        </div>
                    );
                }

                return (
                    <div key={key} className="flex gap-1 text-sm items-start">
                        <span className="font-semibold text-brand-800 min-w-[140px] text-xs uppercase opacity-80 pt-0.5">{label}:</span>
                        <span className="text-gray-800 text-sm">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default function PatientDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // States for Modal and Checklist
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [checklist, setChecklist] = useState<{ label: string, checked: boolean }[]>([]);

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

            // Initialize checklist if exists, else defaults
            if (p?.nextSessionChecklist) {
                setChecklist(p.nextSessionChecklist);
            } else {
                setChecklist([
                    { label: 'Re-evaluar fuerza suelo pélvico (Oxford)', checked: false },
                    { label: 'Preguntar adherencia ejercicios respiratorios', checked: false }
                ]);
            }

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
                raw: e, // Store full object for detail view
                timestamp: e.date instanceof Date ? e.date.getTime() : 0
            }));

            const normalizedSessions = sessions.map(s => ({
                id: s.id,
                type: 'session',
                date: s.date,
                title: 'Evolución / Sesión',
                summary: s.notes || 'Sin notas',
                findings: s.interventions || [],
                raw: s, // Store full object for detail view
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

    const handleChecklistChange = async (index: number) => {
        if (!patient?.id) return;
        const newChecklist = [...checklist];
        newChecklist[index].checked = !newChecklist[index].checked;
        setChecklist(newChecklist);
        await PatientService.update(patient.id, { nextSessionChecklist: newChecklist });
    };

    const handleDelete = async (item: any) => {
        if (!confirm("¿Estás segura de eliminar este registro? Esta acción no se puede deshacer.")) return;

        try {
            if (item.type === 'session') {
                await SessionService.delete(item.id);
            } else {
                await EvaluationService.delete(item.id);
            }
            if (patient?.id) loadData(patient.id);
            setSelectedItem(null);
        } catch (error) {
            console.error("Error deleting", error);
            alert("Error al eliminar");
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
                                {checklist.map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-brand-800">
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => handleChecklistChange(idx)}
                                            className="rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                                        />
                                        <span className={item.checked ? "line-through opacity-50" : ""}>{item.label}</span>
                                    </li>
                                ))}
                                <li className="pt-2">
                                    <Button variant="ghost" size="sm" className="text-xs text-orange-600 h-6" onClick={() => {
                                        const label = prompt("Nueva tarea:");
                                        if (label) {
                                            const newItem = { label, checked: false };
                                            const newChecklist = [...checklist, newItem];
                                            setChecklist(newChecklist);
                                            // Safe update (if patient loaded)
                                            if (patient?.id) PatientService.update(patient.id, { nextSessionChecklist: newChecklist });
                                        }
                                    }}>
                                        + Agregar Item
                                    </Button>
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
                                <div key={idx} className="relative group cursor-pointer" onClick={() => setSelectedItem(item)}>
                                    {/* Dot */}
                                    <div className={cn(
                                        "absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-110",
                                        item.type.includes('eval') ? "bg-purple-500" : "bg-brand-500"
                                    )} />

                                    <div className="bg-white p-4 rounded-xl border border-brand-100 shadow-sm hover:shadow-md transition-all group-hover:border-brand-300">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-brand-900">{item.title}</h3>
                                                <p className="text-xs text-brand-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {item.date?.toDate ? new Date(item.date.toDate()).toLocaleDateString() : 'Fecha desconocida'}
                                                </p>
                                            </div>
                                            <span className="text-xs font-mono text-brand-300 bg-brand-50 px-2 py-1 rounded">
                                                {item.type === 'session' ? 'SESIÓN' : 'EVAL'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.summary}</p>

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

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl p-8 shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-brand-900">{selectedItem.title}</h2>
                                <p className="text-brand-500 text-sm">
                                    {selectedItem.date?.toDate ? new Date(selectedItem.date.toDate()).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha desconocida'}
                                </p>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
                        </div>

                        <div className="space-y-6">

                            {/* --- SESSION DETAILS --- */}
                            {selectedItem.type === 'session' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-brand-50 p-4 rounded-xl">
                                            <span className="text-xs font-bold text-brand-400 uppercase block mb-1">EVA / Síntomas</span>
                                            <span className="text-2xl font-bold text-brand-700">{selectedItem.raw.symptomsScore}/10</span>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl">
                                            <span className="text-xs font-bold text-green-600 uppercase block mb-1">Adherencia</span>
                                            <span className="text-2xl font-bold text-green-700 capitalize">{selectedItem.raw.adherence || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-bold text-brand-800 text-sm uppercase border-b border-gray-100 pb-1">Notas Subjetivas</h3>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">{selectedItem.raw.notes || 'Sin notas.'}</p>
                                    </div>

                                    {/* Re-assessment Data [NEW] */}
                                    {selectedItem.raw.reassessment && (
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                            <h3 className="font-bold text-blue-800 text-sm uppercase mb-3">Re-evaluación Física</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                {selectedItem.raw.reassessment.oxford !== undefined && (
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-400 text-xs">Oxford</span>
                                                        <span className="font-bold text-blue-900 text-lg">{selectedItem.raw.reassessment.oxford}/5</span>
                                                    </div>
                                                )}
                                                {selectedItem.raw.reassessment.tonicity && (
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-400 text-xs">Tonicidad</span>
                                                        <span className="font-bold text-blue-900">{selectedItem.raw.reassessment.tonicity}</span>
                                                    </div>
                                                )}
                                                {selectedItem.raw.reassessment.breating && (
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-400 text-xs">Patrón Respiratorio</span>
                                                        <span className="font-bold text-blue-900">{selectedItem.raw.reassessment.breating}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <h3 className="font-bold text-brand-800 text-sm uppercase border-b border-gray-100 pb-1">Intervenciones Realizadas</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.raw.interventions?.length > 0 ? selectedItem.raw.interventions.map((inte: string, i: number) => (
                                                <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-md text-sm border border-purple-100 shadow-sm">
                                                    {getLabel(inte)}
                                                </span>
                                            )) : <span className="text-sm text-gray-400 italic">No se registraron intervenciones.</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-bold text-brand-800 text-sm uppercase border-b border-gray-100 pb-1">Revisión de Tareas</h3>
                                        <ul className="space-y-1">
                                            {selectedItem.raw.tasks?.map((t: any, i: number) => (
                                                <li key={i} className="flex items-center gap-2 text-sm">
                                                    <span className={t.active ? "text-green-600" : "text-gray-400 line-through"}>
                                                        {t.active ? "✓" : "✕"}
                                                    </span>
                                                    <span className={t.active ? "text-gray-700" : "text-gray-400"}>{t.label}</span>
                                                </li>
                                            ))}
                                            {(!selectedItem.raw.tasks || selectedItem.raw.tasks.length === 0) && <li className="text-sm text-gray-400 italic">Sin lista de tareas.</li>}
                                        </ul>
                                    </div>
                                </>
                            )}


                            {/* --- EVALUATION DETAILS --- */}
                            {(selectedItem.type === 'eval_fast' || selectedItem.type === 'eval_complete') && (
                                <>
                                    {/* Red Flags Alert */}
                                    {selectedItem.raw.patientData?.redFlags?.length > 0 && (
                                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                                            <h3 className="text-red-800 font-bold flex items-center gap-2">
                                                <Activity className="w-5 h-5" /> Red Flags Detectadas
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedItem.raw.patientData.redFlags.map((flag: string, i: number) => (
                                                    <span key={i} className="bg-white text-red-600 px-2 py-1 rounded text-xs font-bold border border-red-100">
                                                        {flag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Evaluation Summary */}
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-brand-800 text-sm uppercase border-b border-gray-100 pb-1">Resumen del Caso</h3>
                                        <p className="text-gray-700 text-sm leading-relaxed">{selectedItem.summary}</p>
                                    </div>

                                    {/* Detailed Physical Exam Data - FULL RENDERER */}
                                    {selectedItem.raw.details && (
                                        <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                                            <h3 className="font-bold text-gray-700 text-sm uppercase">Detalles Clínicos Completos</h3>
                                            <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                                <DataRenderer data={selectedItem.raw.details} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Active Clusters */}
                                    {selectedItem.raw.clusters?.active?.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-brand-800 text-sm uppercase border-b border-gray-100 pb-1">Hipótesis / Clusters Activos</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedItem.raw.clusters.active.map((c: string, i: number) => (
                                                    <span key={i} className="bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-xs font-bold">
                                                        {getLabel(c)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Plan */}
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-brand-800 text-sm uppercase border-b border-gray-100 pb-1">Plan de Tratamiento</h3>

                                        {selectedItem.raw.plan?.education?.length > 0 && (
                                            <div className="mb-2">
                                                <span className="text-xs font-bold text-brand-400 block">EDUCACIÓN</span>
                                                <ul className="list-disc pl-5 text-sm text-gray-700">
                                                    {selectedItem.raw.plan.education.map((e: string, i: number) => (
                                                        <li key={i}>{e}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {selectedItem.raw.plan?.tasks?.length > 0 && (
                                            <div>
                                                <span className="text-xs font-bold text-brand-400 block">TAREAS / EJERCICIOS</span>
                                                <ul className="list-disc pl-5 text-sm text-gray-700">
                                                    {selectedItem.raw.plan.tasks.map((t: string, i: number) => (
                                                        <li key={i}>{t}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
                            <Button variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(selectedItem)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar Registro
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                                    Cerrar
                                </Button>
                                <Button disabled className="bg-brand-100 text-brand-400 cursor-not-allowed">
                                    Editar (Pronto)
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
