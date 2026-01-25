
import { Card, CardContent } from '../ui/Card';

export function HistoryForm({ data, onChange }: { data: any, onChange: (data: any) => void }) {

    const toggleCondition = (condition: string) => {
        const current = data.comorbidities || [];
        const updated = current.includes(condition)
            ? current.filter((c: string) => c !== condition)
            : [...current, condition];
        onChange({ ...data, comorbidities: updated });
    };

    return (
        <div className="space-y-6">
            <h3 className="font-serif font-bold text-xl text-brand-800 border-b border-brand-100 pb-2">Anamnesis Remota & Antecedentes</h3>

            {/* Obstetric History */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Antecedentes Obstétricos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Gestaciones</span>
                            <input
                                type="number"
                                min="0"
                                className="mt-1 w-full p-2 border rounded-md"
                                value={data.gestations || 0}
                                onChange={e => onChange({ ...data, gestations: parseInt(e.target.value) })}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Partos Vaginales</span>
                            <input
                                type="number"
                                min="0"
                                className="mt-1 w-full p-2 border rounded-md"
                                value={data.vaginalBirths || 0}
                                onChange={e => onChange({ ...data, vaginalBirths: parseInt(e.target.value) })}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Cesáreas</span>
                            <input
                                type="number"
                                min="0"
                                className="mt-1 w-full p-2 border rounded-md"
                                value={data.cSections || 0}
                                onChange={e => onChange({ ...data, cSections: parseInt(e.target.value) })}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Abortos</span>
                            <input
                                type="number"
                                min="0"
                                className="mt-1 w-full p-2 border rounded-md"
                                value={data.abortions || 0}
                                onChange={e => onChange({ ...data, abortions: parseInt(e.target.value) })}
                            />
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Lifestyle & Comorbidities */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Comorbilidades y Hábitos</h4>
                    <p className="text-xs text-gray-500 mb-2">Selecciona condiciones que impactan el suelo pélvico:</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'constipation', label: 'Estreñimiento Crónico' },
                            { id: 'chronic_cough', label: 'Tos Crónica / Alergia' },
                            { id: 'smoking', label: 'Tabaquismo' },
                            { id: 'high_impact', label: 'Deporte Alto Impacto' },
                            { id: 'obesity', label: 'Sobrepeso / Obesidad' },
                            { id: 'surgeries', label: 'Cirugías Abdomino-Pélvicas Previas' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => toggleCondition(item.id)}
                                className={`px-3 py-2 rounded-lg text-sm border transition-all ${(data.comorbidities || []).includes(item.id)
                                        ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {(data.comorbidities || []).includes('surgeries') && (
                        <div className="animate-in fade-in slide-in-from-top-2 mt-2">
                            <span className="text-sm font-medium text-brand-700">Detalles cirugías:</span>
                            <input
                                className="w-full mt-1 p-2 border rounded-md text-sm"
                                placeholder="Ej: Histerectomía 2018..."
                                value={data.surgeryDetails || ''}
                                onChange={e => onChange({ ...data, surgeryDetails: e.target.value })}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Manual Notes (Existing) */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h3 className="font-bold text-brand-800">Historia Clínica Manual</h3>

                    <div>
                        <h4 className="text-sm font-bold text-brand-700">Motivo de Consulta</h4>
                        <textarea
                            className="w-full p-3 border rounded-xl min-h-[80px] mt-1 focus:ring-2 focus:ring-brand-500/20 outline-none"
                            placeholder="Relato de la paciente..."
                            value={data.motive || ''}
                            onChange={e => onChange({ ...data, motive: e.target.value })}
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-brand-700">Historia de la Condición Actual</h4>
                        <textarea
                            className="w-full p-3 border rounded-xl min-h-[120px] mt-1 focus:ring-2 focus:ring-brand-500/20 outline-none"
                            placeholder="Evolución, tratamientos previos, dolor..."
                            value={data.history || ''}
                            onChange={e => onChange({ ...data, history: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
