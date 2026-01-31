import { X, ExternalLink, FileText, CheckCircle, AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../ui/Button';
import { QuestionnaireResponse } from '../../../services/evaluationService';
import { clinicalLogic } from '../../../utils/clinicalLogic';
import { useState } from 'react';

interface ViewerProps {
    data: QuestionnaireResponse;
    patientName: string;
    onClose: () => void;
}

export const QuestionnaireResultViewer = ({ data, patientName, onClose }: ViewerProps) => {
    const [showDetails, setShowDetails] = useState(false);

    // Determine Logic Module
    const logic = data.type === 'iciq-sf' ? clinicalLogic.iciq : clinicalLogic.udi6;

    // Get Recommendations dynamically
    const { recommendations, tasks } = logic.getRecommendations(data.score, data.answers);

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

    const progressColor = theme === 'red' ? 'bg-red-500'
        : theme === 'orange' ? 'bg-orange-500'
            : theme === 'yellow' ? 'bg-yellow-500'
                : 'bg-green-500';

    // Max score for gauge
    const maxScore = data.type === 'iciq-sf' ? 21 : 100;
    const percentage = Math.min((data.score / maxScore) * 100, 100);

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

                <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {/* Result Card */}
                    <div className={`p-6 rounded-2xl border ${bgClass} relative overflow-hidden`}>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${textClass} opacity-80`}>
                                    Resultado del Análisis
                                </span>
                                <h3 className={`text-3xl font-bold ${textClass} mt-1`}>
                                    {data.interpretation}
                                </h3>
                                <p className={`text-sm ${textClass} opacity-90 mt-1 font-medium`}>
                                    {data.type === 'iciq-sf' ? 'Incontinencia Urinaria' : 'Distrés Urogenital'}
                                </p>
                            </div>
                            <div className={`p-4 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 ${textClass}`}>
                                <ThemeIcon className="w-8 h-8" />
                            </div>
                        </div>

                        {/* Gauge / Progress Bar */}
                        <div className="mt-6 relative z-10">
                            <div className="flex justify-between text-xs font-bold mb-1 opacity-70">
                                <span>Puntaje: {data.score}</span>
                                <span>Máx: {maxScore}</span>
                            </div>
                            <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden border border-white/20">
                                <div
                                    className={`h-full ${progressColor} transition-all duration-1000 ease-out`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Interpretation Detail */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
                            Interpretación Clínica
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {data.type === 'iciq-sf' ? (
                                <>
                                    La usuaria presenta un cuadro compatible con <strong>{data.interpretation}</strong>.
                                    El puntaje de <strong>{data.score}/21</strong> indica un impacto {data.score > 12 ? 'significativo' : data.score > 5 ? 'moderado' : 'leve'} en la calidad de vida.
                                    {data.answers['amount'] > 4 && " Se observa una pérdida de orina de volumen considerable."}
                                    {data.answers['sit_urgency'] === 1 && " Existe un componente de urgencia importante."}
                                </>
                            ) : (
                                <>
                                    El puntaje de <strong>{data.score}/100</strong> en el UDI-6 sugiere un <strong>{data.interpretation}</strong>.
                                    Se recomienda correlacionar con hallazgos físicos.
                                </>
                            )}
                        </p>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
                            Recomendaciones Sugeridas
                        </h3>
                        {recommendations.length > 0 ? (
                            <div className="grid gap-2">
                                {recommendations.map((rec, i) => (
                                    <div key={i} className="p-3 bg-white rounded-lg flex gap-3 items-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <CheckCircle className="w-5 h-5 text-brand-600 shrink-0" />
                                        <span className="text-gray-700 text-sm font-medium">{rec}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No hay recomendaciones específicas para este puntaje.</p>
                        )}

                        {tasks.length > 0 && (
                            <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Tareas Sugeridas</h4>
                                <ul className="list-disc pl-4 space-y-1">
                                    {tasks.map((task, i) => (
                                        <li key={i} className="text-sm text-blue-700">{task}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Collapsible Detailed Results */}
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <span className="font-bold text-gray-700 text-sm">Ver Respuestas Detalladas</span>
                            {showDetails ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </button>

                        {showDetails && (
                            <div className="p-4 bg-white space-y-2">
                                {Object.entries(data.answers).map(([key, value]) => {
                                    // Filter out technical keys if needed, mainly sit_ which are 0 are boring
                                    if (key.startsWith('sit_') && value === 0) return null;

                                    return (
                                        <div key={key} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                                            <span className="text-xs text-gray-500 font-medium uppercase w-1/2 pr-2">
                                                {logic.getQuestionText(key)}
                                            </span>
                                            <span className="text-sm text-gray-800 font-bold w-1/2 text-right">
                                                {logic.getAnswerText(key, value)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    {/* Placeholder for export functionality */}
                    <Button disabled className="bg-brand-600 hover:bg-brand-700 text-white gap-2 opacity-50 cursor-not-allowed">
                        <ExternalLink className="w-4 h-4" /> Exportar Informe
                    </Button>
                </div>
            </div>
        </div>
    );
};
