
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface PsfsData {
    activity: string;
    score: number;
}

interface FunctionalScalesData {
    psfs?: PsfsData[];
    sane?: number;
}

interface FunctionalScalesFormProps {
    data: FunctionalScalesData;
    onChange: (data: FunctionalScalesData) => void;
}

export function FunctionalScalesForm({ data, onChange }: FunctionalScalesFormProps) {
    const psfs = data.psfs || [];
    const sane = data.sane || 0;

    const updatePsfs = (index: number, field: keyof PsfsData, value: any) => {
        const newPsfs = [...psfs];
        newPsfs[index] = { ...newPsfs[index], [field]: value };
        onChange({ ...data, psfs: newPsfs });
    };

    const addPsfsRow = () => {
        if (psfs.length >= 5) return;
        onChange({ ...data, psfs: [...psfs, { activity: '', score: 0 }] });
    };

    const removePsfsRow = (index: number) => {
        onChange({ ...data, psfs: psfs.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* PSFS Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-brand-900">PSFS (Escala Funcional Específica)</h3>
                        <p className="text-sm text-gray-500">Identifica actividades importantes para la paciente que tiene dificultad para realizar.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addPsfsRow} disabled={psfs.length >= 5}>
                        <Plus className="w-4 h-4 mr-2" /> Agregar Actividad
                    </Button>
                </div>

                <div className="space-y-3">
                    {psfs.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No hay actividades registradas.</p>}
                    {psfs.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Actividad {idx + 1}</label>
                                <input
                                    className="w-full p-2 border rounded-md text-sm"
                                    placeholder="Ej: Caminar 20 minutos, Levantarse de la silla..."
                                    value={item.activity}
                                    onChange={(e) => updatePsfs(idx, 'activity', e.target.value)}
                                />
                            </div>
                            <div className="w-24">
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nota (0-10)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    className="w-full p-2 border rounded-md text-sm text-center font-bold text-brand-700"
                                    value={item.score}
                                    onChange={(e) => updatePsfs(idx, 'score', Number(e.target.value))}
                                />
                            </div>
                            <button
                                onClick={() => removePsfsRow(idx)}
                                className="mt-6 text-gray-400 hover:text-red-500"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SANE Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-brand-900">SANE (Single Assessment Numeric Evaluation)</h3>
                    <p className="text-sm text-gray-500">¿Qué porcentaje de normalidad siente en su zona afectada hoy? (0% = Nada normal, 100% = Totalmente normal)</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex-1">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                            value={sane}
                            onChange={(e) => onChange({ ...data, sane: Number(e.target.value) })}
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>0% (Peor)</span>
                            <span>50%</span>
                            <span>100% (Mejor)</span>
                        </div>
                    </div>
                    <div className="w-24 text-center">
                        <div className="text-3xl font-bold text-brand-700">{sane}%</div>
                        <span className="text-xs text-brand-400 font-medium uppercase">Normalidad</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
