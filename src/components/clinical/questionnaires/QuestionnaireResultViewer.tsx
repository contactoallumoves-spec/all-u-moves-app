import { X, ExternalLink, RefreshCw, FileText, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuestionnaireResponse } from '../../services/evaluationService';

interface ViewerProps {
    data: QuestionnaireResponse;
    patientName: string;
    onClose: () => void;
}

export const QuestionnaireResultViewer = ({ data, patientName, onClose }: ViewerProps) => {
    // Determine Color Theme based on interpretation level
    const theme = data.interpretation?.includes('Severa')
        ? 'red'
        : data.interpretation?.includes('Moderada')
            ? 'orange'
            : data.interpretation?.includes('Leve')
                ? 'yellow'
                : 'green';

    const ThemeIcon = theme === 'red' ? AlertTriangle : theme === 'orange' ? AlertCircle : CheckCircle;

    const bgClass = theme === 'red' ? 'bg-red-50 border-red-100'
        : theme === 'orange' ? 'bg-orange-50 border-orange-100'
            : theme === 'yellow' ? 'bg-yellow-50 border-yellow-100'
                : 'bg-green-50 border-green-100';

    const textClass = theme === 'red' ? 'text-red-700'
        : theme === 'orange' ? 'text-orange-700'
            : theme === 'yellow' ? 'text-yellow-700'
                : 'text-green-700';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-brand-500" />
                            Reporte Clínico: {data.type === 'iciq-sf' ? 'ICIQ-SF' : 'UDI-6'}
                        </h2>
                        <p className="text-gray-500 text-sm">{patientName} • {new Date().toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-200">
                        <X className="w-5 h-5 text-gray-500" />
                    </Button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6">

                    {/* Result Card */}
                    <div className={`p-6 rounded-2xl border ${bgClass} flex items-center justify-between`}>
                        <div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${textClass} opacity-80`}>
                                Resultado del Análisis
                            </span>
                            <h3 className={`text-3xl font-bold ${textClass} mt-1`}>
                                {data.interpretation}
                            </h3>
                            <p className={`text-sm ${textClass} opacity-80 mt-1`}>
                                Puntaje Total: {data.score}
                            </p>
                        </div>
                        <div className={`p-4 rounded-full bg-white/50 border border-white/20 ${textClass}`}>
                            <ThemeIcon className="w-10 h-10" />
                        </div>
                    </div>

                    {/* Interpretation Detail */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
                            Interpretación Clínica
                        </h3>
                        {/* Placeholder for now if no advanced text is stored yet, relies on logic engine in future iterations to generate deep text */}
                        <p className="text-gray-600 leading-relaxed text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                            La paciente presenta un cuadro compatible con <strong>{data.interpretation}</strong>.
                            {data.type === 'iciq-sf' && " El impacto en la calidad de vida es correlativo al puntaje obtenido."}
                            {data.type === 'udi-6' && " Se sugiere evaluar el subtipo predominante (Urgencia vs Esfuerzo) para orientar el tratamiento."}
                        </p>
                    </div>

                    {/* Recommendations (Static for now, dynamic next step) */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
                            Recomendaciones Sugeridas
                        </h3>
                        <div className="grid gap-3">
                            <div className="p-3 bg-brand-50 rounded-lg flex gap-3 items-start border border-brand-100">
                                <CheckCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-brand-800 text-sm">Entrenamiento Muscular (PFMT)</h4>
                                    <p className="text-brand-600 text-xs mt-1">Sugerir protocolo de fortalecimiento y coordinación.</p>
                                </div>
                            </div>
                            <div className="p-3 bg-brand-50 rounded-lg flex gap-3 items-start border border-brand-100">
                                <CheckCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-brand-800 text-sm">Educación Conductual</h4>
                                    <p className="text-brand-600 text-xs mt-1">Manejo de ingesta de líquidos e irritantes.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Raw Answers Expander (Optional, maybe for V2) */}

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button className="bg-brand-600 hover:bg-brand-700 text-white gap-2">
                        <ExternalLink className="w-4 h-4" /> Exportar Informe
                    </Button>
                </div>
            </div>
        </div>
    );
};
