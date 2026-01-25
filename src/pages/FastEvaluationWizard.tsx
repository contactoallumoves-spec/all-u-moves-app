import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { CLUSTERS, RED_FLAGS } from '../data/clusters';
import { EvaluationService } from '../services/evaluationService';

export default function FastEvaluationWizard() {
    const navigate = useNavigate();
    const { patientId } = useParams();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [selectedStage, setSelectedStage] = useState<string>('');

    const [selectedClusters, setSelectedClusters] = useState<string[]>([]);

    // Derived state: Suggestions based on selected clusters
    const activeSuggestions = {
        tests: Array.from(new Set(selectedClusters.flatMap(cid => CLUSTERS.find(c => c.id === cid)?.suggestions.tests || []))),
        education: Array.from(new Set(selectedClusters.flatMap(cid => CLUSTERS.find(c => c.id === cid)?.suggestions.education || []))),
        tasks: Array.from(new Set(selectedClusters.flatMap(cid => CLUSTERS.find(c => c.id === cid)?.suggestions.tasks || []))),
    };

    const steps = [
        { id: 1, title: 'Datos Básicos' },
        { id: 2, title: 'Síntomas (Clusters)' },
        { id: 3, title: 'Banderas' },
        { id: 4, title: 'Plan Automático' },
    ];

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSave = async () => {
        if (!patientId) {
            alert("Error: No hay paciente seleccionado");
            return;
        }
        setSaving(true);
        try {
            await EvaluationService.create({
                patientId,
                type: 'fast',
                date: new Date(),
                patientData: { stage: selectedStage || 'Nuligesta', redFlags: [] },
                clusters: { active: selectedClusters },
                summary: `Evaluación Rápida (${selectedStage || 'General'}) con ${selectedClusters.length} clusters activos.`,
                plan: activeSuggestions,
                status: 'completed'
            });
            navigate('/users'); // Go back to patient list (or patient detail eventually)
        } catch (error) {
            console.error(error);
            alert("Error al guardar evaluación");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <div className="flex gap-2">
                    {steps.map((s) => (
                        <div key={s.id} className={cn("h-2 w-12 rounded-full transition-colors", step >= s.id ? "bg-brand-600" : "bg-brand-200")} />
                    ))}
                </div>
                <span className="text-sm font-medium text-brand-500">Paso {step} de 4</span>
            </div>

            <Card className="min-h-[400px] flex flex-col">
                <CardContent className="p-8 flex-1">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-brand-900">Identificación Inicial</h2>
                            <p className="text-brand-500">Selecciona la etapa vital para activar los clusters correspondientes.</p>
                            <div className="grid grid-cols-2 gap-4">
                                {['Nuligesta', 'Embarazo', 'Postparto', 'Menopausia', 'Deportista'].map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            console.log("Setting stage to:", tag);
                                            setSelectedStage(tag);
                                        }}
                                        className={cn(
                                            "p-4 rounded-xl text-left transition-all border-2",
                                            selectedStage === tag
                                                ? "border-brand-600 bg-brand-50 shadow-md ring-2 ring-brand-500/20"
                                                : "border-brand-200 hover:border-brand-400 bg-white"
                                        )}
                                    >
                                        <span className="font-medium text-brand-900">{tag}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-brand-900">¿Qué sintomas presenta?</h2>
                            <p className="text-brand-500">Selecciona para activar los "Clusters" de decisión clínica.</p>
                            <div className="grid md:grid-cols-2 gap-3">
                                {CLUSTERS.map(cluster => {
                                    const isSelected = selectedClusters.includes(cluster.id);
                                    return (
                                        <button
                                            key={cluster.id}
                                            onClick={() => setSelectedClusters(prev => isSelected ? prev.filter(id => id !== cluster.id) : [...prev, cluster.id])}
                                            className={cn("p-4 rounded-xl text-left transition-all border-2", isSelected ? "border-brand-600 bg-brand-50 shadow-md" : "border-transparent bg-white shadow-sm hover:border-brand-200")}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={cn("font-bold text-lg", isSelected ? "text-brand-800" : "text-brand-600")}>{cluster.label}</span>
                                                {isSelected && <CheckCircle2 className="text-brand-600 w-5 h-5 pointer-events-none" />}
                                            </div>
                                            <p className="text-xs text-brand-400 leading-relaxed">{cluster.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-brand-900">Screening de Banderas</h2>
                            <div className="space-y-3">
                                {RED_FLAGS.map(flag => (
                                    <label key={flag.id} className={cn("flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors", flag.severity === 'red_flag' ? "bg-red-50/50 border-red-100 hover:bg-red-100" : "bg-orange-50/50 border-orange-100 hover:bg-orange-100")}>
                                        <input type="checkbox" className="w-5 h-5 rounded text-red-600 focus:ring-red-500 border-gray-300" />
                                        <div className="flex-1">
                                            <span className="text-ink-900 font-medium">{flag.label}</span>
                                            {flag.severity === 'red_flag' && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">URGENTE</span>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} /></div>
                            <h2 className="text-2xl font-bold text-brand-900">Plan Generado Automáticamente</h2>
                            <p className="text-brand-500">Basado en {selectedClusters.length} clusters activos.</p>

                            <div className="text-left grid gap-4">
                                {activeSuggestions.education.length > 0 && (
                                    <div className="bg-brand-50 p-5 rounded-xl border border-brand-100">
                                        <h4 className="font-bold text-brand-800 text-xs uppercase tracking-wide mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-500" /> Educación Sugerida</h4>
                                        <ul className="space-y-2 text-sm text-brand-700">
                                            {activeSuggestions.education.map(ed => <li key={ed} className="flex gap-2">• {ed.replace(/_/g, ' ').replace('edu', '')}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {activeSuggestions.tasks.length > 0 && (
                                    <div className="bg-white p-5 rounded-xl border border-brand-200 shadow-sm">
                                        <h4 className="font-bold text-brand-800 text-xs uppercase tracking-wide mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> Tareas para Casa</h4>
                                        <ul className="space-y-2 text-sm text-brand-700">
                                            {activeSuggestions.tasks.map(t => <li key={t} className="flex gap-2"><input type="checkbox" defaultChecked className="mt-1" />{t.replace(/_/g, ' ').replace('task', '')}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardContent className="p-8 pt-0 flex justify-between">
                    <Button variant="outline" onClick={prevStep} disabled={step === 1 || saving}>Atrás</Button>
                    {step < 4 ? (
                        <Button onClick={nextStep}>Siguiente <ArrowRight className="ml-2 w-4 h-4" /></Button>
                    ) : (
                        <Button onClick={handleSave} disabled={saving} className="bg-brand-800 hover:bg-brand-900 text-white shadow-xl shadow-brand-200">
                            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            Finalizar y Guardar Historia
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
