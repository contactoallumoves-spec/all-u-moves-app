import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FastEvaluationWizard() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const steps = [
        { id: 1, title: 'Datos Básicos' },
        { id: 2, title: 'Banderas' },
        { id: 3, title: 'Eval. Física' },
        { id: 4, title: 'Plan' },
    ];

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" size="sm" onClick={() => navigate('/eval/new')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <div className="flex gap-2">
                    {steps.map((s) => (
                        <div
                            key={s.id}
                            className={cn(
                                "h-2 w-12 rounded-full transition-colors",
                                step >= s.id ? "bg-brand-600" : "bg-brand-200"
                            )}
                        />
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
                                    <button key={tag} className="p-4 rounded-xl border border-brand-200 hover:border-brand-600 hover:bg-brand-50 text-left transition-all">
                                        <span className="font-medium text-brand-900">{tag}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-brand-900">Screening de Banderas</h2>
                            <p className="text-brand-500">Marca solo si están presentes.</p>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-4 rounded-xl bg-red-50/50 border border-red-100 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300" />
                                    <span className="text-red-900 font-medium">Dolor nocturno persistente</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 rounded-xl bg-brand-50/50 border border-brand-100 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 border-gray-300" />
                                    <span className="text-brand-900">Incontinencia de urgencia</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-brand-900">Evaluación Física (Breve)</h2>

                            {/* Consentimiento Checkbox Simplificado */}
                            <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" className="mt-1 w-5 h-5 text-brand-600 rounded focus:ring-brand-500" />
                                    <div className="space-y-1">
                                        <span className="font-medium text-brand-900">Consentimiento de Evaluación</span>
                                        <p className="text-xs text-brand-500">Confirmo que se ha explicado el procedimiento y la usuaria acepta.</p>
                                    </div>
                                </label>
                            </div>

                            <p className="text-brand-500 text-sm">Formulario de hallazgos simplificado...</p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-brand-900">Evaluación Completa</h2>
                            <p className="text-brand-500">Se ha generado un plan sugerido de 3 tareas.</p>

                            <div className="bg-brand-50 p-6 rounded-xl text-left space-y-3">
                                <h4 className="font-bold text-brand-800 text-sm uppercase tracking-wide">Plan Sugerido</h4>
                                <ul className="space-y-2 text-sm text-brand-700">
                                    <li>• Respiración Diafragmática (Edu)</li>
                                    <li>• Movilidad pélvica básica (Video)</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardContent className="p-8 pt-0 flex justify-between">
                    <Button variant="outline" onClick={prevStep} disabled={step === 1}>Atrás</Button>
                    {step < 4 ? (
                        <Button onClick={nextStep}>Siguiente <ArrowRight className="ml-2 w-4 h-4" /></Button>
                    ) : (
                        <Button onClick={() => navigate('/')}>Finalizar y Guardar</Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
