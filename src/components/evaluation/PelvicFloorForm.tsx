
import { useState } from 'react';
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

            {/* Functional */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Evaluación Funcional (Oxford)</h4>
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-brand-700">Fuerza Muscular (Escala Oxford 0-5)</span>
                            <input
                                type="range"
                                min="0" max="5"
                                step="1"
                                className="w-full mt-2"
                                value={data.oxford || 0}
                                onChange={e => onChange({ ...data, oxford: parseInt(e.target.value) })}
                            />
                            <div className="flex justify-between text-xs text-brand-400 mt-1">
                                <span>0 (Nula)</span>
                                <span>1</span>
                                <span>2</span>
                                <span>3</span>
                                <span>4</span>
                                <span>5 (Fuerte)</span>
                            </div>
                            <p className="text-center font-bold text-brand-800 mt-1">Grado: {data.oxford || 0} / 5</p>
                        </label>

                        <div className="grid md:grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-brand-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.endurance || false}
                                    onChange={e => onChange({ ...data, endurance: e.target.checked })}
                                />
                                <span className="text-sm text-brand-700">Mantiene contracción {'>'} 5 seg (Resistencia)</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-brand-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.coordination || false}
                                    onChange={e => onChange({ ...data, coordination: e.target.checked })}
                                />
                                <span className="text-sm text-brand-700">Pre-activación correcta al toser (Knack)</span>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h4 className="font-bold text-sm uppercase text-brand-500">Palpación Dolorosa</h4>
                    <textarea
                        className="w-full p-2 border rounded-md"
                        rows={3}
                        placeholder="Describir puntos gatillo o zonas dolorosas (ej: obturador interno derecho, elevador izquierdo...)"
                        value={data.painMap || ''}
                        onChange={e => onChange({ ...data, painMap: e.target.value })}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
