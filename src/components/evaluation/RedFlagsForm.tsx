
import { Card, CardContent } from '../ui/Card';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function RedFlagsForm({ data, onChange }: { data: string[], onChange: (d: string[]) => void }) {

    const toggleFlag = (flagId: string) => {
        const current = data || [];
        const updated = current.includes(flagId)
            ? current.filter(id => id !== flagId)
            : [...current, flagId];
        onChange(updated);
    };

    const RED_FLAGS_LIST = [
        { id: 'cauda_equina', label: 'Síndrome Cauda Equina (Anestesia silla montar)', severity: 'red' },
        { id: 'bleeding_postmeno', label: 'Sangrado Post-Menopáusico', severity: 'red' },
        { id: 'weight_loss', label: 'Pérdida de peso inexplicable', severity: 'red' },
        { id: 'severe_night_pain', label: 'Dolor nocturno severo constante', severity: 'yellow' },
        { id: 'recent_trauma', label: 'Trauma reciente no evaluado', severity: 'yellow' },
        { id: 'infection_signs', label: 'Signos de infección (Fiebre, etc)', severity: 'red' },
    ];

    const hasRedFlags = (data || []).some(id => RED_FLAGS_LIST.find(f => f.id === id)?.severity === 'red');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-brand-100 pb-2">
                <ShieldAlert className="w-6 h-6 text-brand-600" />
                <h3 className="font-serif font-bold text-xl text-brand-800">Seguridad & Banderas Clínicas</h3>
            </div>

            <Card className={`${hasRedFlags ? 'border-red-500 bg-red-50' : 'border-green-200 bg-white'} transition-colors duration-500`}>
                <CardContent className="p-6">
                    <div className="mb-4">
                        <h4 className="font-bold text-brand-900">Checklist de Seguridad</h4>
                        <p className="text-sm text-brand-600">Marcar si está PRESENTE. Si todo está normal, dejar sin marcar.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                        {RED_FLAGS_LIST.map(flag => (
                            <button
                                key={flag.id}
                                onClick={() => toggleFlag(flag.id)}
                                className={`text-left p-3 rounded-lg border flex items-start gap-3 transition-all ${(data || []).includes(flag.id)
                                        ? flag.severity === 'red'
                                            ? 'bg-red-100 border-red-300 text-red-900 shadow-md'
                                            : 'bg-yellow-50 border-yellow-300 text-yellow-900 shadow-md'
                                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${(data || []).includes(flag.id) ? 'opacity-100' : 'opacity-20'
                                    }`} />
                                <span className="text-sm font-medium">{flag.label}</span>
                            </button>
                        ))}
                    </div>

                    {hasRedFlags ? (
                        <div className="mt-6 p-4 bg-red-100 border border-red-200 rounded-xl flex items-center gap-4 animate-pulse">
                            <ShieldAlert className="w-8 h-8 text-red-600" />
                            <div>
                                <h5 className="font-bold text-red-900">¡ATENCIÓN! Banderas Rojas Detectadas</h5>
                                <p className="text-sm text-red-800">Se sugiere derivación médica urgente o descartar patología grave antes de tratar.</p>
                            </div>
                        </div>
                    ) : (data && data.length === 0) && (
                        <div className="mt-6 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-800">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Paciente seguro para evaluar (Sin banderas rojas reportadas)</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
