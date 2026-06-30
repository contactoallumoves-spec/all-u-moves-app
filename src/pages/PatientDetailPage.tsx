import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { EvaluationService } from '../services/evaluationService';
import { SessionService } from '../services/sessionService';
import { SessionLogService } from '../services/sessionLogService';
import { AppointmentService } from '../services/appointmentService';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Patient } from '../types/patient';
import { Appointment } from '../types/appointment';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import {
    Calendar,
    Activity,
    FileText,
    Clock,
    PlayCircle,
    Plus,
    Trash2,
    Maximize2,
    ArrowLeft,
    Link as LinkIcon
} from 'lucide-react';
import { QuestionnaireResultViewer } from '../components/clinical/questionnaires/QuestionnaireResultViewer';
import { cn } from '../lib/utils';
import { getLabel } from '../data/catalog';

import { ProgressChart } from '../components/patient/ProgressChart';
import { ProgressDetailModal } from '../components/patient/ProgressDetailModal';
import { BodyMap } from '../components/clinical/BodyMap';
import { BodyMapHistoryModal } from '../components/patient/BodyMapHistoryModal';
import { BodyMapLegend } from '../components/clinical/BodyMapLegend';
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
    const [activeTab, setActiveTab] = useState<'clinical' | 'anamnesis' | 'planning'>('clinical'); // [NEW]

    const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);

    // Modal States
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isBodyMapHistoryOpen, setIsBodyMapHistoryOpen] = useState(false);
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

            // Fetch Evaluations, Clinical Sessions, Patient Home Sessions, v2 Evals and Appointments
            const [evals, sessions, sessionLogs, appointments, v2Snap] = await Promise.all([
                EvaluationService.getByPatientId(patientId),
                SessionService.getByPatientId(patientId),
                SessionLogService.getByPatientId(patientId),
                AppointmentService.getByPatient(patientId),
                getDocs(query(
                    collection(db, 'evaluaciones_express_v2'),
                    where('patientId', '==', patientId),
                    orderBy('createdAt', 'desc')
                )).catch(() => ({ docs: [] } as any))
            ]);

            // Next upcoming appointment
            const now = new Date();
            const upcoming = appointments.filter(a => {
                const d = (a as any).dateTimestamp?.toDate?.() || new Date(`${a.date}T${a.time}`);
                return d >= now && a.status !== 'cancelado';
            }).sort((a, b) => {
                const da = (a as any).dateTimestamp?.toDate?.() || new Date(`${a.date}T${a.time}`);
                const db_ = (b as any).dateTimestamp?.toDate?.() || new Date(`${b.date}T${b.time}`);
                return da.getTime() - db_.getTime();
            });
            setNextAppointment(upcoming[0] || null);

            // Normalize and Merge
            const normalizedEvals = evals.map(e => ({
                id: e.id,
                type: e.type === 'questionnaire' ? 'questionnaire' : (e.type === 'fast' ? 'eval_fast' : 'eval_complete'),
                date: e.date,
                title: e.type === 'questionnaire'
                    ? (e.questionnaire?.type === 'udi-6' ? 'Cuestionario UDI-6' : 'Cuestionario ICIQ-SF')
                    : (e.type === 'fast' ? 'Evaluación Rápida' : 'Evaluación Completa'),
                summary: e.summary || 'Sin resumen',
                findings: e.details?.symptoms || [],
                questionnaire: e.questionnaire, // Explicitly pass questionnaire data
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

            // [NEW] Normalize Patient Session Logs
            const normalizedLogs = sessionLogs.map(log => ({
                id: log.id,
                type: 'patient_session',
                date: log.date,
                title: 'Sesión Realizada (Casa)',
                summary: `RPE: ${log.feedback?.rpe ?? '-'} | Dolor: ${log.feedback?.pain ?? '-'}`,
                findings: log.exercises.filter(e => e.completed).map(e => e.name), // Show completed exercises as "findings" tag
                raw: log,
                timestamp: log.date instanceof Date ? log.date.getTime() : (log.date as any)?.toDate ? (log.date as any).toDate().getTime() : 0
            }));

            const AREA_LABELS: Record<string, string> = { pisoPelvico: 'Piso Pélvico', msk: 'Kine MSK', deportiva: 'Kine Deportiva' };
            const normalizedV2 = v2Snap.docs.map((d: any) => {
                const data = d.data();
                const areaLabel = AREA_LABELS[data.area] || 'Evaluación';
                const summary = data.p4?.diagnosticoNarrativo || data.razonamientoIA?.slice(0, 200) || data.patientContext || 'Sin resumen';
                const ts = data.createdAt ? new Date(data.createdAt).getTime() : 0;
                return {
                    id: d.id,
                    type: 'eval_v2',
                    date: data.createdAt ? new Date(data.createdAt) : new Date(),
                    title: `Evaluación Inicial — ${areaLabel}`,
                    summary,
                    findings: data.p4?.objetivosSmart?.slice(0, 3).map((o: any) => o.texto).filter(Boolean) || [],
                    raw: data,
                    timestamp: ts,
                };
            });

            const combinedHistory = [...normalizedEvals, ...normalizedSessions, ...normalizedLogs, ...normalizedV2].sort((a, b) => b.timestamp - a.timestamp);
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
            } else if (item.type === 'patient_session') {
                await SessionLogService.delete(item.id);
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
    if (!patient) return <div className="p-8 text-center">Usuaria no encontrada</div>;

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
                    <Button variant={activeTab === 'clinical' ? 'primary' : 'outline'} onClick={() => setActiveTab('clinical')}>
                        Resumen Clínico
                    </Button>
                    <Button variant={activeTab === 'anamnesis' ? 'primary' : 'outline'} onClick={() => setActiveTab('anamnesis')}>
                        Anamnesis Remota
                    </Button>
                </div>
                <div className="flex gap-2">

                    <Button variant="outline" onClick={async () => {
                        const { pdfService } = await import('../services/pdfService');
                        pdfService.generateFullHistoryReport(patient!, history);
                    }}>
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

            {/* [NEW] Quick Actions Bar */}
            <div className="bg-white p-4 rounded-xl border border-brand-100 shadow-sm flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-2 text-sm text-brand-600">
                    <Activity className="w-4 h-4" />
                    <span className="font-semibold">Accesos Rápidos:</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-brand-600 bg-brand-50 hover:bg-brand-100" onClick={() => {
                        const url = `${window.location.origin}/surveys/${id}/iciq-sf`;
                        navigator.clipboard.writeText(url);
                        alert("Enlace ICIQ-SF copiado al portapapeles");
                    }}>
                        <LinkIcon className="w-3 h-3 mr-1" /> Copiar Link ICIQ-SF
                    </Button>
                    <Button variant="ghost" size="sm" className="text-brand-600 bg-brand-50 hover:bg-brand-100" onClick={() => {
                        const url = `${window.location.origin}/surveys/${id}/udi-6`;
                        navigator.clipboard.writeText(url);
                        alert("Enlace UDI-6 copiado al portapapeles");
                    }}>
                        <LinkIcon className="w-3 h-3 mr-1" /> Copiar Link UDI-6
                    </Button>
                </div>
            </div>
            {/* ANAMNESIS VIEW */}
            {activeTab === 'anamnesis' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {!patient.clinicalData && !patient.prospectiveData ? (
                        <Card><CardContent className="p-8 text-center text-gray-500">No hay datos de pre-ingreso disponibles.</CardContent></Card>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Card 1: Main Info */}
                            <Card>
                                <CardHeader><CardTitle>Motivo de Consulta</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-brand-500 uppercase">Motivo Principal</h4>
                                        <p className="text-lg font-medium text-brand-900">{patient.prospectiveData?.reason || patient.clinicalData?.prospectiveReason || '-'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-brand-500 uppercase">Historia</h4>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{patient.prospectiveData?.story || '-'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-brand-500 uppercase">Expectativas</h4>
                                        <p className="text-brand-700 italic">"{patient.prospectiveData?.expectations || '-'}"</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Clinical Background */}
                            <Card>
                                <CardHeader><CardTitle>Antecedentes Clínicos</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                            <h4 className="text-xs font-bold text-red-500 uppercase mb-2">Banderas Rojas</h4>
                                            {patient.clinicalData?.redFlags && patient.clinicalData.redFlags.length > 0 ? (
                                                <ul className="list-disc pl-4 text-sm text-red-700">
                                                    {patient.clinicalData.redFlags.map((f: string) => <li key={f}>{getLabel(f)}</li>)}
                                                </ul>
                                            ) : <span className="text-sm text-gray-400">Ninguna reportada</span>}
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <h4 className="text-xs font-bold text-blue-500 uppercase mb-2">Gineco-Obstétrico</h4>
                                            {patient.clinicalData?.gynObs ? (
                                                <div className="text-sm space-y-1 text-blue-800">
                                                    <div className="flex justify-between"><span>Gestaciones:</span> <b>{patient.clinicalData.gynObs.gestations}</b></div>
                                                    <div className="flex justify-between"><span>Partos:</span> <b>{patient.clinicalData.gynObs.births}</b></div>
                                                    <div className="flex justify-between"><span>Cesáreas:</span> <b>{patient.clinicalData.gynObs.cesareans}</b></div>
                                                    {patient.clinicalData.gynObs.menopause && <div className="mt-2 text-xs bg-white px-2 py-1 rounded border border-blue-200 text-center font-bold">MENOPAUSIA</div>}
                                                </div>
                                            ) : <span className="text-sm text-gray-400">Sin datos</span>}
                                        </div>
                                    </div>

                                    {patient.insurance && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-bold text-brand-500">Previsión:</span>
                                            <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-gray-700">{patient.insurance}</span>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: CLINICAL DASHBOARD */}
            {activeTab === 'clinical' && (
                <div className="grid md:grid-cols-3 gap-6">


                    {/* Left Column: Timeline & History */}
                    <div className="md:col-span-2 space-y-6">



                        {/* [NEW] BodyMap Summary Card (Most Recent) */}
                        {(() => {
                            // --- Aggregate ALL Body Maps for History ---
                            const allMaps: any[] = [];

                            // 1. Evaluations (Newest first implicitly if history is sorted, otherwise sort later)
                            history.forEach(h => {
                                if (h.type.includes('eval') && (h.raw?.details?.pelvic?.painRegions?.length > 0 || h.raw?.painMap)) {
                                    allMaps.push({
                                        date: h.date,
                                        source: 'Evaluación',
                                        data: {
                                            painRegions: h.raw?.details?.pelvic?.painRegions || h.raw?.painMap?.painRegions || [],
                                            painType: ''
                                        }
                                    });
                                }
                            });

                            // 2. Pre-Ingreso (Push at the end, then sort)
                            if (patient?.clinicalData?.bodyMap?.painRegions && patient.clinicalData.bodyMap.painRegions.length > 0) {
                                allMaps.push({
                                    date: patient.createdAt || new Date(),
                                    source: 'Pre-Ingreso',
                                    data: {
                                        painRegions: patient.clinicalData.bodyMap.painRegions,
                                        painType: patient.clinicalData.bodyMap.painType || ''
                                    }
                                });
                            }

                            // Sort Descending (Newest First)
                            allMaps.sort((a, b) => {
                                const dateA = a.date instanceof Date ? a.date : (a.date as any)?.toDate?.() || new Date(a.date);
                                const dateB = b.date instanceof Date ? b.date : (b.date as any)?.toDate?.() || new Date(b.date);
                                return dateB.getTime() - dateA.getTime();
                            });


                            // 3. Determine Most Recent for Display
                            const latestMap = allMaps.length > 0 ? allMaps[0] : null;

                            if (!latestMap) return null;

                            return (
                                <>
                                    <Card className="bg-white border-brand-100 overflow-hidden">
                                        <CardHeader className="pb-2 bg-slate-50 border-b border-brand-50">
                                            <CardTitle className="text-sm uppercase tracking-wider text-brand-800 flex items-center gap-2 w-full">
                                                <div className="flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-brand-500" />
                                                    Mapa Corporal ({latestMap.source})
                                                </div>

                                                <div className="ml-auto flex items-center gap-3">
                                                    <span className="text-xs font-normal text-gray-400 hidden sm:inline-block">
                                                        {latestMap.date instanceof Date ? latestMap.date.toLocaleDateString() :
                                                            (latestMap.date as any)?.toDate ? (latestMap.date as any).toDate().toLocaleDateString() :
                                                                new Date(latestMap.date).toLocaleDateString()}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-xs text-brand-600 hover:text-brand-800 hover:bg-brand-50"
                                                        onClick={() => setIsBodyMapHistoryOpen(true)}
                                                    >
                                                        <Maximize2 className="w-3 h-3 mr-1" /> Expandir / Ver Todo ({allMaps.length})
                                                    </Button>
                                                </div>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {/* Legend */}
                                            <div className="px-4 pt-4 pb-0">
                                                <BodyMapLegend />
                                            </div>
                                            {/* Adjusted height to show more body */}
                                            <div className="flex bg-slate-900/5 justify-center py-4 relative h-[500px] overflow-hidden">
                                                <div className="scale-75 origin-top absolute top-4">
                                                    <BodyMap
                                                        value={latestMap.data}
                                                        onChange={() => { }}
                                                        readOnly={true}
                                                        bodyFill="#D6C0B8"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <BodyMapHistoryModal
                                        isOpen={isBodyMapHistoryOpen}
                                        onClose={() => setIsBodyMapHistoryOpen(false)}
                                        maps={allMaps}
                                        patientName={`${patient?.firstName} ${patient?.lastName}`}
                                    />
                                </>
                            );
                        })()}

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
                                            item.type === 'eval_v2' ? "bg-brand-600" : item.type.includes('eval') ? "bg-purple-500" : (item.type === 'patient_session' ? "bg-green-500" : "bg-brand-500")
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
                                                <span className={`text-xs font-mono px-2 py-1 rounded ${item.type === 'eval_v2' ? 'text-brand-700 bg-brand-100' : 'text-brand-300 bg-brand-50'}`}>
                                                    {item.type === 'session' ? 'SESIÓN' : item.type === 'eval_v2' ? 'EVAL IA' : 'EVAL'}
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

                        {/* Próxima Cita */}
                        {nextAppointment ? (
                            <Card className="border-brand-200 bg-brand-50/60">
                                <CardContent className="pt-4 pb-4 space-y-3">
                                    <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> Próxima Cita
                                    </h4>
                                    <div>
                                        <p className="font-bold text-brand-900 text-base">
                                            {(() => {
                                                const [y, m, d] = nextAppointment.date.split('-').map(Number);
                                                return new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
                                            })()} — {nextAppointment.time}
                                        </p>
                                        <p className="text-xs text-brand-500 capitalize mt-0.5">{nextAppointment.type} · {nextAppointment.durationMinutes} min</p>
                                        {nextAppointment.notes && <p className="text-xs text-brand-400 mt-1 italic">{nextAppointment.notes}</p>}
                                    </div>
                                    {patient.phone && (
                                        <button
                                            onClick={() => {
                                                const [y, m, d] = nextAppointment.date.split('-').map(Number);
                                                const fecha = new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
                                                const msg = `Hola ${patient.firstName}! Te recuerdo tu cita el ${fecha} a las ${nextAppointment.time}. Por favor confírmame si puedes asistir 🙏`;
                                                const phone = patient.phone!.replace(/[^0-9]/g, '');
                                                window.open(`https://wa.me/56${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                            }}
                                            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.934 1.395 5.61L0 24l6.545-1.366A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.368l-.36-.214-3.733.979.995-3.638-.235-.374A9.818 9.818 0 1112 21.818z"/></svg>
                                            Confirmar por WhatsApp
                                        </button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-dashed border-brand-200">
                                <CardContent className="pt-4 pb-4 text-center">
                                    <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center justify-center gap-1.5 mb-2">
                                        <Calendar className="w-3.5 h-3.5" /> Próxima Cita
                                    </h4>
                                    <p className="text-xs text-brand-300 italic mb-2">Sin cita agendada</p>
                                    <button onClick={() => navigate('/turnos')} className="text-xs text-brand-500 hover:text-brand-700 font-bold underline">
                                        Agendar en Turnos →
                                    </button>
                                </CardContent>
                            </Card>
                        )}

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
                                     <Button variant="outline" className="text-xs" size="sm" onClick={async () => {
                                         const { pdfService } = await import('../services/pdfService');
                                         pdfService.generateHomePlanPDF(patient, patient.activeTasks || []);
                                     }}>
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
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm uppercase tracking-wider text-brand-500">Progreso</CardTitle>
                                <button
                                    onClick={() => setIsExpanded(true)}
                                    className="text-brand-400 hover:text-brand-600 transition-colors p-1 hover:bg-brand-50 rounded-full"
                                    title="Expandir gráfico"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </CardHeader>
                            <CardContent>
                                <div className="relative group cursor-pointer" onClick={() => setIsExpanded(true)}>
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
            )}

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
                    {/* Handle Questionnaire Type via Wrapper or Conditional Logic */}
                    {(selectedItem.type === 'questionnaire' || selectedItem.questionnaire) ? (
                        // If it's a questionnaire, render the new Viewer. 
                        // Note: We need to adapt the 'selectedItem' to pass appropriate props.
                        // Check if details are in 'questionnaire' field (new logic) or root (legacy).
                        <QuestionnaireResultViewer
                            data={selectedItem.questionnaire || (selectedItem as any)} // Fallback if data structure varies
                            patientName={`${patient?.firstName} ${patient?.lastName}`}
                            onClose={() => setSelectedItem(null)}
                        />
                    ) : (
                        // Standard Modal for Evaluations/Sessions
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
                                                            <div key={idx} className="flex justify-between items-center bg-brand-50 text-brand-700 px-3 py-2 rounded-md text-sm border border-brand-100 shadow-sm">
                                                                <span className="font-medium">{act.description || act.name || "Actividad"}</span>
                                                                <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-brand-100">
                                                                    {act.frequency || act.duration || '-'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tasks List */}
                                            {selectedItem.raw.tasks && selectedItem.raw.tasks.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Tareas Asignadas</h4>
                                                    <ul className="space-y-2">
                                                        {selectedItem.raw.tasks.map((t: any, i: number) => {
                                                            const isActive = t.completed !== undefined ? t.completed : t.active;
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
                                                    </ul>
                                                </div>
                                            )}
                                            {(!selectedItem.raw.tasks || selectedItem.raw.tasks.length === 0) && (
                                                <div className="mt-4 text-sm text-gray-400 italic">Sin lista de tareas.</div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* --- PATIENT HOME SESSION LOG DETAILS --- */}
                                {selectedItem.type === 'patient_session' && (
                                    <>
                                        {/* Summary Stats */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-brand-50 p-4 rounded-xl text-center">
                                                <span className="text-xs font-bold text-brand-400 uppercase block mb-1">RPE (Esfuerzo)</span>
                                                <span className="text-3xl font-bold text-brand-700">{selectedItem.raw.feedback?.rpe ?? '-'}/10</span>
                                            </div>
                                            <div className="bg-red-50 p-4 rounded-xl text-center">
                                                <span className="text-xs font-bold text-red-400 uppercase block mb-1">Dolor</span>
                                                <span className="text-3xl font-bold text-red-700">{selectedItem.raw.feedback?.pain ?? '-'}/10</span>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-xl text-center">
                                                <span className="text-xs font-bold text-blue-400 uppercase block mb-1">Fatiga</span>
                                                <span className="text-3xl font-bold text-blue-700">{selectedItem.raw.feedback?.fatigue ?? '-'}/10</span>
                                            </div>
                                        </div>

                                        {/* Exercises List */}
                                        <div className="space-y-3">
                                            <h3 className="font-bold text-brand-800 text-sm uppercase border-b border-gray-100 pb-1 flex justify-between items-center">
                                                <span>Ejercicios Realizados</span>
                                                <span className="text-xs text-brand-400 font-normal">
                                                    {selectedItem.raw.exercises?.filter((e: any) => e.completed).length || 0} / {selectedItem.raw.exercises?.length || 0} Completados
                                                </span>
                                            </h3>

                                            <div className="space-y-2">
                                                {selectedItem.raw.exercises?.map((ex: any, idx: number) => (
                                                    <div key={idx} className={cn(
                                                        "flex items-start justify-between p-3 rounded-lg border",
                                                        ex.completed ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100 opacity-60"
                                                    )}>
                                                        <div>
                                                            <div className="font-medium text-gray-800 text-sm">{ex.name}</div>
                                                            {(ex.sets || ex.reps || ex.load) && (
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    {ex.sets ? `${ex.sets} series ` : ''}
                                                                    {ex.reps ? `x ${ex.reps} reps ` : ''}
                                                                    {ex.load ? `@ ${ex.load}` : ''}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {ex.rpe && (
                                                            <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                                                                RPE: {ex.rpe}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Symptoms & Notes */}
                                        {(selectedItem.raw.feedback?.symptoms?.length > 0 || selectedItem.raw.feedback?.notes) && (
                                            <div className="space-y-3 pt-2">
                                                {selectedItem.raw.feedback?.symptoms?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Síntomas Reportados</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedItem.raw.feedback.symptoms.map((sym: string, i: number) => (
                                                                <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">
                                                                    {sym}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedItem.raw.feedback?.notes && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Comentarios</h4>
                                                        <p className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded-lg">"{selectedItem.raw.feedback.notes}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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

                                        {/* [NEW] History Field Explicit Render */}
                                        {selectedItem.raw.details?.anamnesis?.history && (
                                            <div className="space-y-2">
                                                <h3 className="font-bold text-brand-800 text-sm uppercase border-b border-gray-100 pb-1">Historia Clínica</h3>
                                                <p className="text-gray-700 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                    {selectedItem.raw.details.anamnesis.history}
                                                </p>
                                            </div>
                                        )}

                                        {/* [NEW] Body Map Visualization */}
                                        {(selectedItem.raw.details?.pelvic?.painRegions?.length > 0 || selectedItem.raw.painMap) && (
                                            <div className="space-y-2">
                                                <h3 className="font-bold text-brand-800 text-sm uppercase border-b border-gray-100 pb-1">Mapa Corporal</h3>
                                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-slate-900/5 p-2">
                                                    <div className="scale-75 origin-top -mb-[150px]"> {/* Scale down to fit nicely */}
                                                        <BodyMap
                                                            value={{
                                                                painRegions: selectedItem.raw.details?.pelvic?.painRegions || selectedItem.raw.painMap?.painRegions || [],
                                                                painType: ''
                                                            }}
                                                            onChange={() => { }}
                                                            readOnly={true}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

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
                                    {selectedItem.type !== 'questionnaire' && (
                                        <Button
                                            onClick={() => {
                                                if (!selectedItem) return;
                                                if (selectedItem.type === 'session') {
                                                    // Assume we create a route /users/:patientId/sessions/:sessionId/edit OR query param
                                                    // Navigation to generic creator with edit param is easier for now
                                                    navigate(`/users/${id}/sessions/new?editId=${selectedItem.id}`);
                                                } else if (selectedItem.type !== 'questionnaire') {
                                                    const mode = selectedItem.type.includes('fast') ? 'fast' : 'complete';
                                                    navigate(`/eval/${mode}/${id}?editId=${selectedItem.id}`);
                                                }
                                            }}
                                            className="bg-brand-100 text-brand-700 hover:bg-brand-200"
                                        >
                                            Editar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
