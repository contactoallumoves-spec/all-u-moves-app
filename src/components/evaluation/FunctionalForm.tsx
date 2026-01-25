
import { Card, CardContent } from '../ui/Card';

export function FunctionalForm({ data, onChange }: { data: any, onChange: (data: any) => void }) {

    const toggleArrayItem = (key: string, value: string) => {
        const currentList = data[key] || [];
        const newList = currentList.includes(value)
            ? currentList.filter((i: string) => i !== value)
            : [...currentList, value];
        onChange({ ...data, [key]: newList });
    };

    return (
        <div className="space-y-6">
            <h3 className="font-serif font-bold text-xl text-brand-800 border-b border-brand-100 pb-2">Evaluación Funcional / Fitness / Yoga</h3>

            {/* Modality Focus [NEW] */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Enfoque de Actividad</h4>
                    <select
                        className="w-full p-2 border rounded-md"
                        value={data.modality || ''}
                        onChange={e => onChange({ ...data, modality: e.target.value })}
                    >
                        <option value="">Seleccionar Enfoque...</option>
                        <option value="fitness">Fitness General (Inicial/Intermedio)</option>
                        <option value="yoga">Yoga</option>
                        <option value="pilates_mat">Pilates Mat</option>
                        <option value="pilates_reformer">Pilates Reformer</option>
                    </select>

                    {(data.modality === 'yoga' || data.modality?.includes('pilates')) && (
                        <div className="animate-in fade-in pt-2">
                            <h5 className="font-bold text-sm text-brand-700 mb-2">Screening de Tolerancia (Yoga/Pilates)</h5>
                            <div className="flex flex-wrap gap-2">
                                {['Extensión Muñeca (Apoyo)', 'Flexión Columna (Roll Up)', 'Extensión Columna (Cobra)', 'Inversiones'].map(test => {
                                    const isPainful = (data.toleranceTests || []).includes(test);
                                    return (
                                        <button
                                            key={test}
                                            onClick={() => toggleArrayItem('toleranceTests', test)}
                                            className={`px-3 py-2 rounded-lg text-sm border transition-all ${isPainful ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                        >
                                            {test}: {isPainful ? 'Dolor/Limitado' : 'OK'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Load Transfer */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Transferencia de Carga (ASLR)</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <span className="text-sm font-medium text-brand-700 block mb-2">ASLR Izquierdo</span>
                            <div className="flex gap-2">
                                {[0, 1, 2, 3, 4, 5].map(score => (
                                    <button
                                        key={score}
                                        onClick={() => onChange({ ...data, aslrLeft: score })}
                                        className={`w-8 h-8 rounded-full border text-sm flex items-center justify-center transition-all ${data.aslrLeft === score ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-brand-700 block mb-2">ASLR Derecho</span>
                            <div className="flex gap-2">
                                {[0, 1, 2, 3, 4, 5].map(score => (
                                    <button
                                        key={score}
                                        onClick={() => onChange({ ...data, aslrRight: score })}
                                        className={`w-8 h-8 rounded-full border text-sm flex items-center justify-center transition-all ${data.aslrRight === score ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <textarea
                        className="w-full p-2 border rounded-md text-sm mt-2"
                        rows={1}
                        placeholder="Notas sobre compensaciones (ej: rotación pélvica)..."
                        value={data.aslrNotes || ''}
                        onChange={e => onChange({ ...data, aslrNotes: e.target.value })}
                    />
                </CardContent>
            </Card>

            {/* Movement Patterns */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Patrones de Movimiento</h4>

                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Sentadilla (Squat)</span>
                            <select
                                className="mt-1 w-full p-2 border rounded-md text-sm"
                                value={data.squatQuality || ''}
                                onChange={e => onChange({ ...data, squatQuality: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="optimo">Óptimo</option>
                                <option value="valgo_rodilla">Valgo de Rodilla</option>
                                <option value="guiño_gluteo">Guiño Glúteo (Lumbar flex)</option>
                                <option value="limitado">Rango Limitado</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Puente Glúteo</span>
                            <select
                                className="mt-1 w-full p-2 border rounded-md text-sm"
                                value={data.bridgeQuality || ''}
                                onChange={e => onChange({ ...data, bridgeQuality: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="bueno">Buen control</option>
                                <option value="isquio_dominante">Dominancia Isquiotibial</option>
                                <option value="lumbar_dominante">Compensación Lumbar</option>
                            </select>
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Impact */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Tolerancia al Impacto</h4>
                    <div className="flex flex-wrap gap-2">
                        {['Salto Vertical', 'Trote en el lugar', 'Salto Tijera (Jumping Jack)', 'Tos Provocada de Pie'].map(test => {
                            const isPositive = (data.impactTests || []).includes(test);
                            return (
                                <button
                                    key={test}
                                    onClick={() => toggleArrayItem('impactTests', test)}
                                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${isPositive ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}
                                >
                                    {test}: {isPositive ? 'SÍntomas (+)' : 'Sin Síntomas (-)'}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-brand-400 mt-1">* Click para alternar estado (Verde: OK, Rojo: Síntomas)</p>
                </CardContent>
            </Card>
        </div>
    );
}
