import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { EvaluationService } from '../services/evaluationService';
import { SessionService } from '../services/sessionService';
import { Patient } from '../types/patient';
import { pdfService } from '../services/pdfService';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Clock, Calendar, FileText, Activity, PlayCircle, Plus, Trash2, ChevronLeft, CheckCircle2, AlertCircle, TrendingUp, PlusCircle, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getLabel } from '../data/catalog';

import { ProgressChart } from '../components/patient/ProgressChart';
import { ProgressDetailModal } from '../components/patient/ProgressDetailModal';
const DataRenderer = ({ data, level = 0 }: { data: any, level?: number }) => {
    if (data === null || data === undefined) return null;
    if (typeof data !== 'object') return <span className="text-gray-800 ml-2 font-medium">{String(data)}</span>;
    if (Object.keys(data).length === 0) return null;

    return (
        <div className={`space-y-3 ${level > 0 ? 'ml-4 pl-4 border-l-2 border-brand-100 mt-2' : 'mt-2'}`}>
            {Object.entries(data).map(([key, value]) => {
                if (value === null || value === undefined || value === '') return null;

                // 1. Translate Key
                // Try exact match first, then snake_case, then lower case fallback
                let label = getLabel(key);
                if (label === key) label = getLabel(key.toLowerCase());
                if (label === key) label = getLabel(key.replace(/([A-Z])/g, '_$1').toLowerCase()); // Try camelToSnake for catalog lookup

                // If still no translation, prettify the key (CamelCase -> Title Case)
                if (label === key || label.includes('_')) {
                    label = key.replace(/([A-Z])/g, ' $1')
                        .replace(/_/g, ' ')
                        .replace(/^./, str => str.toUpperCase())
                        .trim();
                }

                // 2. Handle Nested Objects (Recursive)
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return (
                        <div key={key} className="mt-4">
                            <h4 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b border-brand-100 pb-1 mb-2">
                                {label}
                            </h4>
                            <DataRenderer data={value} level={level + 1} />
                        </div>
                    );
                }

                // 3. Format Value
                let renderedValue: React.ReactNode = String(value);

                // Booleans
                if (typeof value === 'boolean') renderedValue = value ? 'Sí' : 'No';
                if (value === 'true') renderedValue = 'Sí';
                if (value === 'false') renderedValue = 'No';

                // Arrays OR Comma-Separated Strings (that look like lists)
                let isList = Array.isArray(value);
                let listItems: string[] = [];

                if (Array.isArray(value)) {
                    listItems = value.map(String);
                } else if (typeof value === 'string' && (value.includes(',') || (value.includes('_') && !value.includes(' ')))) {
                    // Heuristic: if it has commas, split it.
                    // OR if it has underscores and is not just a single word key/sentence, likely a code list.
                    if (value.includes(',')) {
                        listItems = value.split(',').map(s => s.trim());
                        isList = true;
                    }
                }

                if (isList && listItems.length > 0) {
                    renderedValue = (
                        <div className="flex flex-wrap gap-2 mt-1">
                            {listItems.map((item, idx) => (
                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                                    {getLabel(item)}
                                </span>
                            ))}
                        </div>
                    );
                } else if (!isList && typeof value === 'string') {
                    // Try to translate single string values too
                    const potentialTranslation = getLabel(value);
                    if (potentialTranslation !== value) {
                        renderedValue = potentialTranslation;
                    }
                }

                return (
                    <div key={key} className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-4 py-2 border-b border-gray-50 last:border-0">
                        <span className="md:col-span-4 font-semibold text-gray-500 text-xs uppercase tracking-wide pt-1">
                            {label}
                        </span>
                        <div className="md:col-span-8 text-gray-800 text-sm font-medium leading-relaxed">
                            {renderedValue}
                        </div>
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

    // States for Modal    // Modal State
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false); // [NEW] Expanded View Modal>(null);
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
                    <Button variant="outline" onClick={() => pdfService.generateFullHistoryReport(patient!, history)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Exportar Evoluciones
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/eval/new/${id}`)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Evaluación
                    </Button>
                    <Button className="bg-brand-800 text-white shadow-lg shadow-brand-200/50" onClick={() => navigate(`/users/${id}/sessions/new`)}>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Nueva Sesión
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
                                                    {(() => {
                                                        let d = new Date();
                                                        if (item.date?.toDate) d = item.date.toDate();
                                                        else if (item.date instanceof Date) d = item.date;
                                                        else if (item.date) d = new Date(item.date);
                                                        return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
                                                    })()}
                                                    {item.raw?.location && <span className="text-brand-300 ml-2">• {item.raw.location}</span>}
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
                                                    {getLabel(f)}
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
                                    {patient.activeTasks && patient.activeTasks.length > 0 ? (
                                        patient.activeTasks.map((task, i) => (
                                            <div key={i} className="flex flex-col p-2 bg-brand-50 rounded-lg text-sm text-brand-700 border border-brand-100">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <FileText className="w-3 h-3 text-brand-400" /> {task.description}
                                                </div>
                                                <span className="text-xs text-brand-400 ml-5">{task.frequency}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">No hay tareas activas asignadas.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-xs text-brand-400 mb-2 uppercase">Próximo Objetivo</h4>
                                {/* TODO: Make this dynamic from latest session or patient goal field */}
                                <p className="text-sm text-brand-900 italic">"Lograr estornudar sin escapes para la próxima semana"</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" className="text-xs" size="sm" onClick={() => pdfService.generateHomePlanPDF(patient, patient.activeTasks || [])}>
                                    <FileText className="w-3 h-3 mr-1" /> PDF Plan
                                </Button>
                                <Button variant="outline" className="text-xs" size="sm" onClick={() => navigate(`/users/${id}/sessions/new`)}>
                                    Editar Plan
                                </Button>
                            </div>

                            <Button
                                className="w-full text-xs bg-green-500 hover:bg-green-600 text-white border-none"
                                size="sm"
                                onClick={() => {
                                    if (!patient.activeTasks || patient.activeTasks.length === 0) {
                                        alert("No hay tareas activas para enviar.");
                                        return;
                                    }
                                    const tasksList = patient.activeTasks.map(t => `- ${t.description} (${t.frequency})`).join('\n');
                                    const text = `Hola ${patient.firstName}, aquí tienes tu plan actualizado:\n\n` +
                                        `Tareas:\n${tasksList}\n\n` +
                                        `¡Tú puedes! 💪`;
                                    window.open(`https://wa.me/${patient.phone?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                            >
                                Enviar por WhatsApp
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-brand-500">Progreso</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative group cursor-pointer" onClick={() => setIsExpanded(true)}>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-50 p-1 rounded-full text-brand-600">
                                    <Maximize2 size={16} />
                                </div>
                                <ProgressChart history={history} />
                            </div>

                            {/* Dynamic Stats */}
                            <div className="mt-4 flex justify-between text-xs text-center border-t border-gray-50 pt-4">
                                <div>
                                    <div className="font-bold text-brand-900 text-lg">
                                        {(() => {
                                            const item = history.find(h => (h.raw?.pelvic?.oxford !== undefined) || (h.raw?.reassessment?.oxford !== undefined));
                                            if (!item) return '-/5';
                                            const val = item.raw?.reassessment?.oxford ?? item.raw?.pelvic?.oxford;
                                            return `${val}/5`;
                                        })()}
                                    </div>
                                    <div className="text-brand-400">Oxford</div>
                                </div>
                                <div>
                                    <div className="font-bold text-brand-900 text-lg">
                                        {(() => {
                                            // Priority: ICIQ -> SANE -> Any other
                                            const iciqItem = history.find(h => h.raw?.functional?.questionnaire?.score !== undefined);
                                            if (iciqItem) return iciqItem.raw.functional.questionnaire.score;

                                            const saneItem = history.find(h => h.raw?.proms?.sane !== undefined);
                                            if (saneItem) return `${saneItem.raw.proms.sane}%`;

                                            return '-';
                                        })()}
                                    </div>
                                    <div className="text-brand-400">
                                        {history.some(h => h.raw?.functional?.questionnaire?.score) ? 'ICIQ-UI' : 'SANE'}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-brand-900 text-lg">
                                        {(() => {
                                            const sessions = history.filter(h => h.type === 'session' && h.raw?.adherence);
                                            if (sessions.length === 0) return '-';
                                            const total = sessions.reduce((acc, s) => {
                                                if (s.raw.adherence === 'alta') return acc + 100;
                                                if (s.raw.adherence === 'media') return acc + 50;
                                                return acc;
                                            }, 0);
                                            return `${Math.round(total / sessions.length)}%`;
                                        })()}
                                    </div>
                                    <div className="text-brand-400">Adherencia</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Premium Detail Modal */}
            <ProgressDetailModal
                isOpen={isExpanded}
                onClose={() => setIsExpanded(false)}
                history={history}
                patientName={`${patient?.firstName} ${patient?.lastName}`}
            />

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl p-8 shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-brand-900">{selectedItem.title}</h2>
                                <p className="text-brand-500 text-sm">
                                    {(() => {
                                        let d = new Date();
                                        if (selectedItem.date?.toDate) d = selectedItem.date.toDate();
                                        else if (selectedItem.date instanceof Date) d = selectedItem.date;
                                        else if (selectedItem.date) d = new Date(selectedItem.date);
                                        return d.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                                    })()}
                                    {selectedItem.raw?.location && <span className="ml-2 font-medium">• {selectedItem.raw.location}</span>}
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

                                        {/* Presets with Details */}
                                        <div className="flex flex-col gap-2">
                                            {selectedItem.raw.interventions?.length > 0 ? selectedItem.raw.interventions.map((inte: string, i: number) => (
                                                <div key={i} className="flex justify-between items-center bg-purple-50 text-purple-700 px-3 py-2 rounded-md text-sm border border-purple-100 shadow-sm">
                                                    <span className="font-medium">{getLabel(inte)}</span>
                                                    {selectedItem.raw.interventionDetails?.[inte] && (
                                                        <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-purple-100">
                                                            {selectedItem.raw.interventionDetails[inte]}
                                                        </span>
                                                    )}
                                                </div>
                                            )) : <span className="text-sm text-gray-400 italic mb-2">No se seleccionaron presets.</span>}
                                        </div>

                                        {/* [NEW] Custom Activities Render */}
                                        {selectedItem.raw.customActivities?.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Actividades Específicas</h4>
                                                <div className="grid gap-2">
                                                    {selectedItem.raw.customActivities.map((act: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-lg text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-1.5 py-0.5 bg-white rounded text-[10px] border border-gray-200 uppercase font-bold text-gray-400">
                                                                    {act.category}
                                                                </span>
                                                                <span className="font-medium text-gray-700">{act.name}</span>
                                                            </div>
                                                            {act.params && (
                                                                <span className="font-mono text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded">
                                                                    {act.params}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-bold text-brand-800 text-sm uppercase border-b border-gray-100 pb-1">Revisión de Tareas</h3>
                                        <ul className="space-y-1">
                                            {selectedItem.raw.tasks?.map((t: any, i: number) => {
                                                const isActive = t.completed !== undefined ? t.completed : t.active;
                                                // Note: Logic in EvolutionPage seems to treat 'completed' as the status of the task in the session context? 
                                                // Actually in EvolutionPage 'completed' is boolean.
                                                // Wait, if it's "Review tasks", usually we check if they were done.
                                                // Let's assume 'completed' or 'active' true means checked/done.

                                                return (
                                                    <li key={i} className="flex items-center gap-2 text-sm">
                                                        <span className={isActive ? "text-green-600" : "text-gray-400"}>
                                                            {isActive ? "✓" : "•"}
                                                        </span>
                                                        <span className={isActive ? "text-gray-700" : "text-gray-500"}>
                                                            {t.description || t.label || "Tarea sin nombre"}
                                                            {t.frequency && <span className="text-xs text-gray-400 ml-1">({t.frequency})</span>}
                                                        </span>
                                                    </li>
                                                );
                                            })}
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
                                                        <li key={i}>{getLabel(e)}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {selectedItem.raw.plan?.tasks?.length > 0 && (
                                            <div>
                                                <span className="text-xs font-bold text-brand-400 block">TAREAS / EJERCICIOS</span>
                                                <ul className="list-disc pl-5 text-sm text-gray-700">
                                                    {selectedItem.raw.plan.tasks.map((t: string, i: number) => (
                                                        <li key={i}>{getLabel(t)}</li>
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
                                <Button
                                    onClick={() => {
                                        if (!selectedItem) return;
                                        if (selectedItem.type === 'session') {
                                            // Assume we create a route /users/:patientId/sessions/:sessionId/edit OR query param
                                            // Navigation to generic creator with edit param is easier for now
                                            navigate(`/users/${id}/sessions/new?editId=${selectedItem.id}`);
                                        } else {
                                            const mode = selectedItem.type.includes('fast') ? 'fast' : 'complete';
                                            navigate(`/eval/${mode}/${id}?editId=${selectedItem.id}`);
                                        }
                                    }}
                                    className="bg-brand-100 text-brand-700 hover:bg-brand-200"
                                >
                                    Editar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
