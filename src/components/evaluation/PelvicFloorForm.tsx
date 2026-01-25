
import { Card, CardContent } from '../ui/Card';

export function PelvicFloorForm({ data, onChange }: { data: any, onChange: (data: any) => void }) {
    return (
        <div className="space-y-6">
            <h3 className="font-serif font-bold text-xl text-brand-800 border-b border-brand-100 pb-2">Suelo Pélvico</h3>

            {/* Inspection */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Inspección Visual</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Estado de Piel / Mucosa</span>
                            <select
                                className="mt-1 w-full p-2 border rounded-md"
                                value={data.skin || ''}
                                onChange={e => onChange({ ...data, skin: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="sana">Sana / Rosada</option>
                                <option value="atrofica">Atrófica / Pálida</option>
                                <option value="inflamada">Inflamada / Roja</option>
                                <option value="cicatriz">Cicatriz visible</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Apertura del Hiato</span>
                            <select
                                className="mt-1 w-full p-2 border rounded-md"
                                value={data.hiatus || ''}
                                onChange={e => onChange({ ...data, hiatus: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="cerrado">Cerrado (Normal)</option>
                                <option value="abierto">Abierto / Bostezante</option>
                            </select>
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Sexual Function [NEW] */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Salud Sexual</h4>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2 border rounded-lg">
                            <input
                                type="checkbox"
                                className="accent-brand-600 w-4 h-4"
                                checked={data.sexualActivity || false}
                                onChange={e => onChange({ ...data, sexualActivity: e.target.checked })}
                            />
                            <span className="text-sm text-brand-700">Activa sexualmente (con penetración)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2 border rounded-lg">
                            <input
                                type="checkbox"
                                className="accent-red-500 w-4 h-4"
                                checked={data.dyspareunia || false}
                                onChange={e => onChange({ ...data, dyspareunia: e.target.checked })}
                            />
                            <span className="text-sm text-brand-700 font-medium">Dispareunia (Dolor)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2 border rounded-lg">
                            <input
                                type="checkbox"
                                className="accent-brand-600 w-4 h-4"
                                checked={data.lubrication || false}
                                onChange={e => onChange({ ...data, lubrication: e.target.checked })}
                            />
                            <span className="text-sm text-brand-700">Dificultad de Lubricación</span>
                        </label>
                    </div>
                    {data.dyspareunia && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <span className="text-xs text-brand-500 font-bold block mb-1">Descripción del Dolor Sexual:</span>
                            <input
                                className="w-full p-2 border rounded-md text-sm"
                                placeholder="Ej: Al inicio, profundo, post-coital..."
                                value={data.dyspareuniaDetails || ''}
                                onChange={e => onChange({ ...data, dyspareuniaDetails: e.target.value })}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Functional */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Evaluación Funcional (Oxford)</h4>
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Fuerza Muscular (Escala Oxford 0-5)</span>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0" max="5"
                                    step="1"
                                    className="w-full mt-2 accent-brand-600"
                                    value={data.oxford || 0}
                                    onChange={e => onChange({ ...data, oxford: parseInt(e.target.value) })}
                                />
                                <span className="font-bold text-2xl text-brand-800 w-12 text-center">{data.oxford || 0}</span>
                            </div>
                            <div className="flex justify-between text-xs text-brand-400 mt-1 px-1">
                                <span>0 (Nula)</span>
                                <span>1</span>
                                <span>2</span>
                                <span>3</span>
                                <span>4</span>
                                <span>5 (Fuerte)</span>
                            </div>
                        </label>

                        <div className="grid md:grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-brand-50 cursor-pointer bg-white">
                                <input
                                    type="checkbox"
                                    className="accent-brand-600 w-4 h-4"
                                    checked={data.endurance || false}
                                    onChange={e => onChange({ ...data, endurance: e.target.checked })}
                                />
                                <span className="text-sm text-brand-700">Resistencia {'>'} 5 seg</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-brand-50 cursor-pointer bg-white">
                                <input
                                    type="checkbox"
                                    className="accent-brand-600 w-4 h-4"
                                    checked={data.coordination || false}
                                    onChange={e => onChange({ ...data, coordination: e.target.checked })}
                                />
                                <span className="text-sm text-brand-700">Knack (Pre-activación)</span>
                            </label>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-brand-700">Respuesta al Valsalva (Pujo)</span>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                {['normal', 'abombamiento', 'descenso'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => onChange({ ...data, valsalva: opt })}
                                        className={`px-3 py-2 rounded-lg text-sm border ${data.valsalva === opt ? 'bg-brand-100 border-brand-500 text-brand-800 font-bold' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {opt === 'normal' ? 'Normal (Contrae)' : opt === 'abombamiento' ? 'Abombamiento' : 'Descenso (POP)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Palpación y Dolor</h4>

                    <div>
                        <span className="text-sm font-medium text-brand-700 mb-2 block">Puntos Gatillo / Dolorosos</span>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {['Elevador Ani (I)', 'Elevador Ani (D)', 'Obturador Int (I)', 'Obturador Int (D)', 'Bulboesponjoso', 'Transverso Sup'].map(muscle => {
                                const currentMap = data.painPoints || [];
                                const isActive = currentMap.includes(muscle);
                                return (
                                    <button
                                        key={muscle}
                                        onClick={() => {
                                            const newPoints = isActive ? currentMap.filter((m: string) => m !== muscle) : [...currentMap, muscle];
                                            onChange({ ...data, painPoints: newPoints });
                                        }}
                                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${isActive ? 'bg-red-100 border-red-300 text-red-700 font-bold' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        {muscle}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <textarea
                        className="w-full p-2 border rounded-md text-sm"
                        rows={3}
                        placeholder="Notas adicionales sobre dolor o tono..."
                        value={data.painMap || ''}
                        onChange={e => onChange({ ...data, painMap: e.target.value })}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
