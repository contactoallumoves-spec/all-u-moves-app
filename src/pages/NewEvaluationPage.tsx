import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Zap, ClipboardList, ArrowLeft } from 'lucide-react';

export default function NewEvaluationPage() {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
                <h1 className="text-3xl font-serif font-bold text-brand-900">Nueva Evaluación</h1>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* MODO RÁPIDO */}
                <Card className="relative overflow-hidden group hover:border-brand-300 transition-all cursor-pointer" onClick={() => navigate('/eval/fast')}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-400 group-hover:bg-brand-600 transition-colors" />
                    <CardContent className="p-8 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 mb-4 group-hover:scale-110 transition-transform">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-900">Modo Rápido</h3>
                        <p className="text-brand-500 text-sm leading-relaxed">
                            Ideal para triaje inicial o sesiones cortas.
                            Enfocado en banderas rojas, decisión rápida y plan de emergencia.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-brand-400 mt-4">
                            <span>⏱ 10-15 min</span>
                            <span>•</span>
                            <span>Triaje</span>
                        </div>
                    </CardContent>
                </Card>

                {/* MODO COMPLETO */}
                <Card className="relative overflow-hidden group hover:border-brand-300 transition-all cursor-pointer opacity-70 hover:opacity-100" onClick={() => alert('Próximamente: Modo Completo')}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-800 group-hover:bg-brand-900 transition-colors" />
                    <CardContent className="p-8 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-800 mb-4 group-hover:scale-110 transition-transform">
                            <ClipboardList size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-900">Modo Completo</h3>
                        <p className="text-brand-500 text-sm leading-relaxed">
                            Evaluación integral profunda. Todos los módulos activados:
                            Pélvico, MSK, Fitness, Yoga y Estilo de Vida.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-brand-400 mt-4">
                            <span>⏱ 40+ min</span>
                            <span>•</span>
                            <span>Integral</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
