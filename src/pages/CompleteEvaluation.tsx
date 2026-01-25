
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { EvaluationService } from '../services/evaluationService';
import { logicService } from '../services/logicService'; // [NEW]
import { Patient } from '../types/patient';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Save, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

// Import sub-forms
import { PelvicFloorForm } from '../components/evaluation/PelvicFloorForm';
import { MSKForm } from '../components/evaluation/MSKForm';
import { FunctionalForm } from '../components/evaluation/FunctionalForm'; // [NEW]
import { HistoryForm } from '../components/evaluation/HistoryForm'; // [NEW]
import { SymptomSelector } from '../components/evaluation/SymptomSelector'; // [NEW]


import { getLabel } from '../data/catalog';


export default function CompleteEvaluation() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'anamnesis' | 'pelvic' | 'msk' | 'functional' | 'plan'>('anamnesis');


    // Consolidated Form State
    const [evalData, setEvalData] = useState({
        anamnesis: { motive: '', history: '', gestations: 0, vaginalBirths: 0, cSections: 0, abortions: 0, comorbidities: [] as string[], surgeryDetails: '' },
        pelvic: { skin: '', hiatus: '', valsalva: '', oxford: 0, endurance: false, coordination: false, painMap: '', painPoints: [] as string[] },

        msk: { irdSupra: '', irdInfra: '', doming: false, posture: '', motorControl: '', breathing: '', beighton: 0 },
        functional: { aslrLeft: 0, aslrRight: 0, aslrNotes: '', squatQuality: '', bridgeQuality: '', impactTests: [] as string[] }, // [NEW]

        plan: { diagnosis: '', goals: '', frequency: '', tasks: [] as string[], education: [] as string[] },
        symptoms: [] as string[] // [NEW] Hybrid Input
    });

    useEffect(() => {
        if (patientId) {
            PatientService.getById(patientId).then(p => {
                setPatient(p);
                setLoading(false);
            });
        }
    }, [patientId]);

    // [NEW] Logic Brain
    const generateSuggestions = () => {
        // Also infer from metrics (Oxford < 3 etc)
        const inferredSymptoms = logicService.evaluateMetrics({ pelvic: evalData.pelvic, msk: evalData.msk });

        // Analyze combined symptoms (Manual + Inferred)
        const result = logicService.analyze([...evalData.symptoms, ...inferredSymptoms]);

        // Update Plan with Suggestions
        // Append to existing to avoid overwriting manual unless empty? 
        // For now, let's just ADD new ones.
        setEvalData(prev => ({
            ...prev,
            plan: {
                ...prev.plan,
                tasks: Array.from(new Set([...prev.plan.tasks, ...result.suggestions.tasks])),
                education: Array.from(new Set([...prev.plan.education, ...result.suggestions.education]))
            }
        }));

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

            const summaryText = findings.length > 0
                ? `Evaluación: ${findings.join(', ')}`
                : "Evaluación Completa (Sin hallazgos críticos)";

            await EvaluationService.create({
                patientId,
                type: 'complete',
                date: new Date(),
                patientData: { stage: patient?.stage || 'General', redFlags: [] },
                clusters: {
                    active: logicResult.activeClusters.map(c => c.id), // Save generated clusters
                    scores: {}
                },
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
                    symptoms: evalData.symptoms
                } as any
            } as any);

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
        { id: 'anamnesis', label: '1. Anamnesis & Síntomas' },
        { id: 'pelvic', label: '2. Suelo Pélvico' },
        { id: 'msk', label: '3. Físico / MSK' },
        { id: 'functional', label: '4. Funcional / Impacto' }, // [NEW]
        { id: 'plan', label: '5. Plan & Sugerencias' },

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
                            data={evalData.pelvic}
                            onChange={(d) => setEvalData({ ...evalData, pelvic: d })}
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

                {activeTab === 'functional' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <FunctionalForm
                            data={evalData.functional}
                            onChange={(d) => setEvalData({ ...evalData, functional: d })}
                        />
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
