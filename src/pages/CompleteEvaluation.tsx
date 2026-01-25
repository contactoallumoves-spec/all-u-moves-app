
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { EvaluationService } from '../services/evaluationService';
import { logicService } from '../services/logicService'; // [NEW]
import { Patient } from '../types/patient';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Save, Loader2, CheckCircle2, Sparkles, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

// Import sub-forms
import { PelvicFloorForm } from '../components/evaluation/PelvicFloorForm';
import { MSKForm } from '../components/evaluation/MSKForm';
import { FunctionalForm } from '../components/evaluation/FunctionalForm'; // [NEW]
import { HistoryForm } from '../components/evaluation/HistoryForm';
import { QuestionnaireForm } from '../components/evaluation/QuestionnaireForm'; // [NEW]
import { FunctionalScalesForm } from '../components/evaluation/FunctionalScalesForm'; // [NEW]
import { RedFlagsForm } from '../components/evaluation/RedFlagsForm'; // [NEW]
import { SymptomSelector } from '../components/evaluation/SymptomSelector';



import { getLabel } from '../data/catalog';
import { CIE10_CODES, CIF_CODES } from '../data/clinicalCodes'; // [NEW]


export default function CompleteEvaluation() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const editId = searchParams.get('editId');

    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // Added 'diagnosis' to valid tabs
    const [activeTab, setActiveTab] = useState<'safety' | 'anamnesis' | 'pelvic' | 'msk' | 'functional_scales' | 'functional' | 'questionnaires' | 'diagnosis' | 'plan'>('anamnesis');

    // Location State
    const [location, setLocation] = useState('Consulta Kinesiológica');
    const [manualLocation, setManualLocation] = useState('');

    // Consolidated Form State
    const [evalData, setEvalData] = useState({
        anamnesis: { motive: '', history: '', gestations: 0, vaginalBirths: 0, cSections: 0, abortions: 0, comorbidities: [] as string[], surgeryDetails: '' },
        pelvic: { skin: '', hiatus: '', valsalva: '', oxford: 0, endurance: false, coordination: false, painMap: '', painPoints: [] as string[], dyspareunia: false }, // Added dyspareunia default
        msk: { irdSupra: '', irdInfra: '', doming: false, posture: '', motorControl: '', breathing: '', beighton: 0 },
        functional: {
            aslrLeft: 0, aslrRight: 0, aslrNotes: '', squatQuality: '', bridgeQuality: '', impactTests: [] as string[],
            modality: '', toleranceTests: [] as string[]
        },
        questionnaire: { q1_freq: 0, q2_vol: 0, q3_impact: 0, score: 0 }, // [NEW]
        plan: { diagnosis: '', goals: '', frequency: '', tasks: [] as string[], education: [] as string[] },
        // [NEW] Clinical Codes
        diagnosisCodes: [] as string[], // CIE-10 IDs
        cifCodes: [] as string[], // CIF IDs
        smartGoals: [] as string[], // Auto-generated

        symptoms: [] as string[], // [NEW] Hybrid Input
        redFlags: [] as string[], // [NEW]

        // [NEW] Functional Scales State
        functionalScales: { psfs: [], sane: 0 } as any
    });

    useEffect(() => {
        const load = async () => {
            if (patientId) {
                const p = await PatientService.getById(patientId);
                setPatient(p);
            }
            if (editId) {
                const ev = await EvaluationService.getById(editId);
                if (ev && ev.details) {
                    setEvalData({
                        ...ev.details,
                        // Ensure defaults for new fields if old record
                        diagnosisCodes: ev.details.diagnosisCodes || [],
                        cifCodes: ev.details.cifCodes || [],
                        smartGoals: ev.details.smartGoals || [],
                        functionalScales: ev.details.functional || { psfs: [], sane: 0 }, // [NEW] Load
                        pelvic: { ...ev.details.pelvic, dyspareunia: ev.details.pelvic?.dyspareunia || false }
                    });

                    if (ev.location) {
                        if (['Consulta Kinesiológica', 'Online'].includes(ev.location)) {
                            setLocation(ev.location);
                        } else if (ev.location.startsWith('Domicilio')) {
                            setLocation('Domicilio');
                            const detail = ev.location.includes(':') ? ev.location.split(':')[1]?.trim() : '';
                            setManualLocation(detail || '');
                        } else {
                            setLocation('manual');
                            setManualLocation(ev.location);
                        }
                    }
                }
            }
            setLoading(false);
        };
        load();
    }, [patientId, editId]);

    // Store the brain result to display suggestions (CIF etc)
    const [activeLogicResult, setActiveLogicResult] = useState<any>(null);

    // [NEW] Logic Brain & Shortcuts
    const generateSmartGoals = () => {
        // Infer status first
        const inferredSymptoms = logicService.evaluateMetrics({ pelvic: evalData.pelvic, msk: evalData.msk, questionnaire: evalData.questionnaire });
        const logicResult = logicService.analyze([...evalData.symptoms, ...inferredSymptoms]);

        const goals = logicService.generateSmartGoals(logicResult.activeClusters, {
            pelvic: evalData.pelvic,
            questionnaire: evalData.questionnaire
        });

        setEvalData(prev => ({
            ...prev,
            smartGoals: goals,
            plan: { ...prev.plan, goals: goals.join('\n\n') } // Auto-fill text area too
        }));

        alert("Objetivos SMART Generados");
    };

    // [NEW] Logic Brain
    const generateSuggestions = () => {
        // Also infer from metrics (Oxford < 3 etc)
        const inferredSymptoms = logicService.evaluateMetrics({ pelvic: evalData.pelvic, msk: evalData.msk });

        // Analyze combined symptoms (Manual + Inferred)
        const result = logicService.analyze([...evalData.symptoms, ...inferredSymptoms]);

        // Update Plan with Suggestions
        setEvalData(prev => ({
            ...prev,
            plan: {
                ...prev.plan,
                tasks: Array.from(new Set([...prev.plan.tasks, ...result.suggestions.tasks])),
                education: Array.from(new Set([...prev.plan.education, ...result.suggestions.education]))
            }
        }));

        setActiveLogicResult(result); // [NEW] Save for display

        alert(`¡Cerebro activado! 🧠\nSe detectaron ${result.activeClusters.length} clusters activos.\nPlan sugerido actualizado.`);
    };

    const handleSave = async () => {
        if (!patientId) return;
        setSaving(true);
        try {
            // Logic Analysis for final save
            const logicResult = logicService.analyze(evalData.symptoms);

            // Build summary string based on findings
            const findings = [];
            if (evalData.pelvic.oxford < 3) findings.push("Debilidad SP");
            if (evalData.pelvic.hiatus === 'abierto') findings.push("Hiato Abierto");
            if (evalData.msk.doming) findings.push("Doming Abdominal");
            logicResult.activeClusters.forEach(c => findings.push(c.label));

            // Add Diagnoses to summary
            evalData.diagnosisCodes.forEach(code => {
                const label = CIE10_CODES.find(c => c.code === code)?.label;
                if (label) findings.push(label);
            });

            const summaryText = findings.length > 0
                ? `Evaluación: ${findings.join(', ')}`
                : "Evaluación Completa (Sin hallazgos críticos)";

            const dataToSave = {
                patientData: { stage: patient?.stage || 'General', redFlags: [] },
                clusters: {
                    active: logicResult.activeClusters.map(c => c.id), // Save generated clusters
                    scores: {}
                },
                location: location === 'manual' ? manualLocation : (location === 'Domicilio' && manualLocation ? `Domicilio: ${manualLocation}` : location),
                summary: summaryText,
                plan: {
                    education: evalData.plan.education,
                    tasks: evalData.plan.tasks,
                    diagnosis: evalData.plan.diagnosis, // Save text diagnosis too
                    goals: evalData.plan.goals
                },
                status: 'completed',
                details: {
                    ...evalData,
                    // Ensure we save the symptoms explicitely in details too
                    symptoms: evalData.symptoms,
                    functional: evalData.functionalScales // [NEW] Map to types/clinical.ts structure
                } as any
            };

            if (editId) {
                await EvaluationService.update(editId, dataToSave as any);
            } else {
                await EvaluationService.create({
                    patientId,
                    type: 'complete',
                    date: new Date(),
                    ...dataToSave
                } as any);
            }

            navigate('/users');
        } catch (error) {
            console.error(error);
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;

    const tabs = [
        { id: 'safety', label: '0. Seguridad (Flags)' },
        { id: 'anamnesis', label: '1. Anamnesis' },
        { id: 'questionnaires', label: '1.5. Cuestionarios' },
        { id: 'pelvic', label: '2. Suelo Pélvico' },
        { id: 'msk', label: '3. Físico / MSK' },
        { id: 'functional_scales', label: '3.5. Escalas (PSFS/SANE)' }, // [NEW]
        { id: 'functional', label: '4. Funcional / Impacto' },
        { id: 'diagnosis', label: '5. Diagnóstico' }, // [NEW] Added back
        { id: 'plan', label: '6. Plan & Sugerencias' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-brand-900">Evaluación Kinesiológica</h1>
                        <p className="text-brand-500">Paciente: {patient?.firstName} {patient?.lastName}</p>

                        {/* Location Selector */}
                        <div className="flex gap-2 mt-2 items-center">
                            <select
                                className="text-sm p-1 bg-white border border-brand-200 rounded-lg outline-none text-brand-700"
                                value={location}
                                onChange={(e) => {
                                    setLocation(e.target.value);
                                    setManualLocation('');
                                }}
                            >
                                <option value="Consulta Kinesiológica">Consulta Kinesiológica</option>
                                <option value="Domicilio">Domicilio</option>
                                <option value="Online">Online</option>
                                <option value="manual">Otro (Escribir)...</option>
                            </select>
                            {(location === 'manual' || location === 'Domicilio') && (
                                <input
                                    className="text-sm p-1 border-b border-brand-300 outline-none w-48"
                                    placeholder={location === 'Domicilio' ? "Dirección del domicilio..." : "Escribir lugar..."}
                                    value={manualLocation}
                                    onChange={(e) => setManualLocation(e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-brand-800 text-white shadow-lg shadow-brand-200/50">
                    {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Ficha
                </Button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-brand-100">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all",
                            activeTab === tab.id
                                ? "bg-brand-100 text-brand-800 ring-2 ring-brand-500/20"
                                : "text-brand-400 hover:text-brand-600 hover:bg-brand-50"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Form Content */}
            <div className="min-h-[400px]">

                {activeTab === 'safety' && (
                    <div className="animate-in slide-in-from-left-4 duration-300">
                        <RedFlagsForm
                            data={evalData.redFlags}
                            onChange={(d) => setEvalData({ ...evalData, redFlags: d })}
                        />
                    </div>
                )}

                {activeTab === 'questionnaires' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <QuestionnaireForm
                            data={evalData.questionnaire}
                            onChange={(d) => setEvalData({ ...evalData, questionnaire: d })}
                        />
                    </div>
                )}

                {activeTab === 'anamnesis' && (
                    <div className="animate-in slide-in-from-left-4 duration-300">
                        {/* Hybrid Input Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100 space-y-4 mb-6">
                            <SymptomSelector
                                selectedSymptoms={evalData.symptoms}
                                onChange={(s) => setEvalData({ ...evalData, symptoms: s })}
                            />
                        </div>

                        <HistoryForm
                            data={evalData.anamnesis}
                            onChange={(d) => setEvalData({ ...evalData, anamnesis: d })}
                        />
                    </div>
                )}

                {activeTab === 'pelvic' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <PelvicFloorForm
                            data={evalData.pelvic as any}
                            onChange={(d) => setEvalData({ ...evalData, pelvic: d as any })}
                        />
                    </div>
                )}

                {activeTab === 'msk' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <MSKForm
                            data={evalData.msk}
                            onChange={(d) => setEvalData({ ...evalData, msk: d })}
                        />
                    </div>
                )}

                {/* [NEW] Functional Scales Tab */}
                {activeTab === 'functional_scales' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <FunctionalScalesForm
                            data={evalData.functionalScales}
                            onChange={(d) => setEvalData({ ...evalData, functionalScales: d })}
                        />
                    </div>
                )}

                {activeTab === 'functional' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <FunctionalForm
                            data={evalData.functional}
                            onChange={(d) => setEvalData({ ...evalData, functional: d })}
                        />
                    </div>
                )}

                {/* [NEW] Diagnosis Tab */}
                {activeTab === 'diagnosis' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100 space-y-6">
                            <h2 className="text-xl font-bold font-serif text-brand-900">Diagnóstico Kinesiológico</h2>

                            {/* CIE-10 Selector */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-sm text-brand-600">Diagnóstico Médico (CIE-10)</h3>
                                <div className="flex flex-wrap gap-2">
                                    {CIE10_CODES.map(code => (
                                        <button
                                            key={code.code}
                                            className={cn(
                                                "px-3 py-2 rounded-lg text-sm border transition-all text-left",
                                                evalData.diagnosisCodes.includes(code.code)
                                                    ? 'bg-brand-100 border-brand-500 text-brand-900 font-bold'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            )}
                                            onClick={() => {
                                                const exists = evalData.diagnosisCodes.includes(code.code);
                                                setEvalData(prev => ({
                                                    ...prev,
                                                    diagnosisCodes: exists
                                                        ? prev.diagnosisCodes.filter(c => c !== code.code)
                                                        : [...prev.diagnosisCodes, code.code]
                                                }));
                                            }}
                                        >
                                            <span className="font-mono text-xs text-brand-500 mr-2">{code.code}</span>
                                            {code.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CIF Selector */}
                            <div className="space-y-3 pt-4 border-t border-dashed">
                                <h3 className="font-bold text-sm text-brand-600">Clasificación CIF</h3>
                                <div className="flex flex-wrap gap-2">
                                    {CIF_CODES.map(code => (
                                        <button
                                            key={code.code}
                                            className={cn(
                                                "px-3 py-2 rounded-lg text-sm border transition-all text-left",
                                                evalData.cifCodes.includes(code.code)
                                                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            )}
                                            onClick={() => {
                                                const exists = evalData.cifCodes.includes(code.code);
                                                setEvalData(prev => ({
                                                    ...prev,
                                                    cifCodes: exists
                                                        ? prev.cifCodes.filter(c => c !== code.code)
                                                        : [...prev.cifCodes, code.code]
                                                }));
                                            }}
                                        >
                                            <span className="font-mono text-xs text-blue-500 mr-2">{code.code}</span>
                                            {code.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SMART Goals Generator */}
                            <div className="space-y-3 pt-4 border-t border-dashed">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm text-brand-600">Objetivos SMART</h3>
                                    <Button onClick={generateSmartGoals} size="sm" className="bg-gradient-to-r from-purple-600 to-brand-600 text-white">
                                        <Brain className="w-4 h-4 mr-2" /> Generar con IA
                                    </Button>
                                </div>
                                {evalData.smartGoals.length > 0 ? (
                                    <ul className="space-y-2 bg-brand-50/50 p-4 rounded-xl">
                                        {evalData.smartGoals.map((goal, idx) => (
                                            <li key={idx} className="flex gap-2 text-sm text-brand-800">
                                                <span className="font-bold text-brand-400">{idx + 1}.</span> {goal}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No se han generado objetivos aún.</p>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        {/* Logic Engine Trigger */}
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <Sparkles className="w-8 h-8 text-purple-600" />
                                <h3 className="font-bold text-purple-900">Asistente Inteligente</h3>
                                <p className="text-sm text-purple-700 max-w-md">
                                    Analiza los síntomas marcados y tus hallazgos para sugerir un plan basado en los protocolos.
                                </p>
                                <Button onClick={generateSuggestions} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                                    Generar Sugerencias Automáticas
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100 space-y-4">
                            <h3 className="font-bold text-brand-800">Diagnóstico Kinesiológico</h3>
                            <textarea
                                className="w-full p-3 border rounded-xl min-h-[80px]"
                                placeholder="Diagnóstico funcional (CIF)..."
                                value={evalData.plan.diagnosis}
                                onChange={e => setEvalData({ ...evalData, plan: { ...evalData.plan, diagnosis: e.target.value } })}
                            />

                            {/* CIF Suggestions [NEW] */}
                            {activeLogicResult?.suggestions?.cif && activeLogicResult.suggestions.cif.length > 0 && (
                                <div className="mt-2 text-xs bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100">
                                    <span className="font-bold block mb-1">Sugerencias CIF (Clasificación):</span>
                                    <div className="flex flex-wrap gap-2">
                                        {activeLogicResult.suggestions.cif.map((c: any) => (
                                            <span key={c.code} className="bg-white border border-blue-200 px-2 py-1 rounded shadow-sm">
                                                <strong>{c.code}</strong>: {c.description}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h3 className="font-bold text-brand-800 pt-4">Plan Sugerido (Editable)</h3>


                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-sm text-gray-700 mb-2">Tareas / Ejercicios</h4>
                                    {evalData.plan.tasks.length === 0 && <p className="text-xs text-gray-400 italic">Sin tareas. Usa el Asistente para sugerir.</p>}
                                    <ul className="list-disc pl-4 space-y-1">
                                        {evalData.plan.tasks.map((t, i) => (
                                            <li key={i} className="text-sm text-gray-700">{getLabel(t)}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-sm text-gray-700 mb-2">Educación</h4>
                                    {evalData.plan.education.length === 0 && <p className="text-xs text-gray-400 italic">Sin educación. Usa el Asistente para sugerir.</p>}
                                    <ul className="list-disc pl-4 space-y-1">
                                        {evalData.plan.education.map((t, i) => (
                                            <li key={i} className="text-sm text-gray-700">{getLabel(t)}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <h3 className="font-bold text-brand-800 pt-4">Detalles Administrativos</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-brand-700">Objetivos (SMART)</span>
                                    <textarea
                                        className="w-full mt-1 p-2 border rounded-md"
                                        rows={4}
                                        value={evalData.plan.goals}
                                        onChange={e => setEvalData({ ...evalData, plan: { ...evalData.plan, goals: e.target.value } })}
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-brand-700">Frecuencia Sugerida</span>
                                    <input
                                        className="w-full mt-1 p-2 border rounded-md"
                                        placeholder="Ej: 1 vez por semana x 8 sesiones"
                                        value={evalData.plan.frequency}
                                        onChange={e => setEvalData({ ...evalData, plan: { ...evalData.plan, frequency: e.target.value } })}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-center pt-8">
                            <Button size="lg" className="w-full md:w-auto px-12 bg-green-600 hover:bg-green-700 text-white" onClick={handleSave}>
                                <CheckCircle2 className="mr-2" /> Finalizar Evaluación Completa
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
