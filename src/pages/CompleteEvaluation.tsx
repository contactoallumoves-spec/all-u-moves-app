
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { EvaluationService } from '../services/evaluationService';
import { Patient } from '../types/patient';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

// Import sub-forms
import { PelvicFloorForm } from '../components/evaluation/PelvicFloorForm';
import { MSKForm } from '../components/evaluation/MSKForm';

export default function CompleteEvaluation() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'anamnesis' | 'pelvic' | 'msk' | 'plan'>('anamnesis');

    // Consolidated Form State
    const [evalData, setEvalData] = useState({
        anamnesis: { motive: '', history: '' },
        pelvic: { skin: '', hiatus: '', oxford: 0, endurance: false, coordination: false, painMap: '' },
        msk: { irdSupra: '', irdInfra: '', doming: false, posture: '', motorControl: '' },
        plan: { diagnosis: '', goals: '', frequency: '' }
    });

    useEffect(() => {
        if (patientId) {
            PatientService.getById(patientId).then(p => {
                setPatient(p);
                setLoading(false);
            });
        }
    }, [patientId]);

    const handleSave = async () => {
        if (!patientId) return;
        setSaving(true);
        try {
            // Build summary string based on findings
            const findings = [];
            if (evalData.pelvic.oxford < 3) findings.push("Debilidad SP");
            if (evalData.pelvic.hiatus === 'abierto') findings.push("Hiato Abierto");
            if (evalData.msk.doming) findings.push("Doming Abdominal");

            const summaryText = findings.length > 0
                ? `Evaluación Kine: ${findings.join(', ')}`
                : "Evaluación Kine Completa (Sin hallazgos críticos)";

            await EvaluationService.create({
                patientId,
                type: 'complete',
                date: new Date(),
                patientData: { stage: patient?.stage || 'General', redFlags: [] },
                clusters: { active: [], scores: {} }, // Could infer clusters from data later
                summary: summaryText,
                plan: { education: [], tasks: [] }, // Advanced: Auto-populate based on plan tab
                status: 'completed',
                // save raw detailed data in a flexible 'details' field if we update the interface, 
                // for now we might lose some granularity if Evaluation interface isn't updated. 
                // *Important*: We should update Evaluation interface to support 'details' blob.
                // extending the service on the fly here with 'any' cast or we update the type definition.
                details: evalData
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
        { id: 'anamnesis', label: 'Anamnesis' },
        { id: 'pelvic', label: 'Suelo Pélvico' },
        { id: 'msk', label: 'Musculoesquelético' },
        { id: 'plan', label: 'Diagnóstico & Plan' },
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
                    <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100 space-y-4">
                            <h3 className="font-bold text-brand-800">Motivo de Consulta</h3>
                            <textarea
                                className="w-full p-3 border rounded-xl min-h-[100px] focus:ring-2 focus:ring-brand-500/20 outline-none"
                                placeholder="¿Por qué viene hoy? (Sus palabras)"
                                value={evalData.anamnesis.motive}
                                onChange={e => setEvalData({ ...evalData, anamnesis: { ...evalData.anamnesis, motive: e.target.value } })}
                            />

                            <h3 className="font-bold text-brand-800 pt-4">Historia Actual</h3>
                            <textarea
                                className="w-full p-3 border rounded-xl min-h-[150px] focus:ring-2 focus:ring-brand-500/20 outline-none"
                                placeholder="Evolución del síntoma, tratamientos previos, etc."
                                value={evalData.anamnesis.history}
                                onChange={e => setEvalData({ ...evalData, anamnesis: { ...evalData.anamnesis, history: e.target.value } })}
                            />
                        </div>
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

                {activeTab === 'plan' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100 space-y-4">
                            <h3 className="font-bold text-brand-800">Diagnóstico Kinesiológico</h3>
                            <textarea
                                className="w-full p-3 border rounded-xl min-h-[80px]"
                                placeholder="Diagnóstico funcional (CIF)..."
                                value={evalData.plan.diagnosis}
                                onChange={e => setEvalData({ ...evalData, plan: { ...evalData.plan, diagnosis: e.target.value } })}
                            />

                            <h3 className="font-bold text-brand-800 pt-4">Objetivos y Plan</h3>
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
