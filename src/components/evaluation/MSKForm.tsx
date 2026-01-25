
import { Card, CardContent } from '../ui/Card';

export function MSKForm({ data, onChange }: { data: any, onChange: (data: any) => void }) {
    return (
        <div className="space-y-6">
            <h3 className="font-serif font-bold text-xl text-brand-800 border-b border-brand-100 pb-2">Musculoesquelético (MSK)</h3>

            {/* Diastasis */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Pared Abdominal (Diástasis)</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Distancia Inter-rectos (Supra)</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    className="mt-1 w-full p-2 border rounded-md"
                                    placeholder="cm"
                                    value={data.irdSupra || ''}
                                    onChange={e => onChange({ ...data, irdSupra: e.target.value })}
                                />
                                <span className="text-sm text-brand-400">cm</span>
                            </div>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Distancia Inter-rectos (Infra)</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    className="mt-1 w-full p-2 border rounded-md"
                                    placeholder="cm"
                                    value={data.irdInfra || ''}
                                    onChange={e => onChange({ ...data, irdInfra: e.target.value })}
                                />
                                <span className="text-sm text-brand-400">cm</span>
                            </div>
                        </label>
                    </div>
                    <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-brand-50 cursor-pointer mt-2">
                        <input
                            type="checkbox"
                            checked={data.doming || false}
                            onChange={e => onChange({ ...data, doming: e.target.checked })}
                        />
                        <span className="text-sm text-brand-700">Presencia de Doming (Abombamiento) al esfuerzo</span>
                    </label>
                </CardContent>
            </Card>

            {/* Posture */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Postura y Control</h4>
                    <div className="space-y-3">
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Observaciones Posturales</span>
                            <textarea
                                className="w-full p-2 border rounded-md mt-1"
                                rows={2}
                                placeholder="Ej: Hiperlordosis lumbar, cabeza adelantada..."
                                value={data.posture || ''}
                                onChange={e => onChange({ ...data, posture: e.target.value })}
                            />
                        </label>

                        <div className="grid md:grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-sm font-medium text-brand-700">Control Motor Lumbopélvico</span>
                                <select
                                    className="mt-1 w-full p-2 border rounded-md"
                                    value={data.motorControl || ''}
                                    onChange={e => onChange({ ...data, motorControl: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="bueno">Bueno / Automatizado</option>
                                    <option value="regular">Regular / Requiere feedback</option>
                                    <option value="pobre">Pobre / No disocia</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="text-sm font-medium text-brand-700">Patrón Respiratorio</span>
                                <select
                                    className="mt-1 w-full p-2 border rounded-md"
                                    value={data.breathing || ''}
                                    onChange={e => onChange({ ...data, breathing: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="costal">Costal Alto (Apical)</option>
                                    <option value="diafragmatico">Diafragmático (Abdominal)</option>
                                    <option value="mixto">Mixto</option>
                                    <option value="paradojico">Paradójico</option>
                                </select>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Hyperlaxity */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Hiperlaxitud (Beighton)</h4>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-brand-700">Puntaje Total:</span>
                        <div className="flex gap-2">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(score => (
                                <button
                                    key={score}
                                    onClick={() => onChange({ ...data, beighton: score })}
                                    className={`w-8 h-8 rounded-full border text-sm flex items-center justify-center transition-all ${data.beighton === score ? 'bg-brand-600 text-white border-brand-600 font-bold' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {score}
                                </button>
                            ))}
                        </div>
                    </div>
                    {data.beighton >= 4 && (
                        <p className="text-xs text-amber-600 font-bold mt-1">⚠️ Posible Hiperlaxitud Generalizada</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
