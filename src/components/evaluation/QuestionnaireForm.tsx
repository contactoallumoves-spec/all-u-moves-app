
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';

export interface ICIQData {
    q1_freq: number;
    q2_vol: number;
    q3_impact: number;
    score: number;
}

export function QuestionnaireForm({ data, onChange }: { data: ICIQData, onChange: (d: ICIQData) => void }) {

    useEffect(() => {
        // Auto-calculate score whenever inputs change
        const score = (data.q1_freq || 0) + (data.q2_vol || 0) + (data.q3_impact || 0);
        if (score !== data.score) {
            onChange({ ...data, score });
        }
    }, [data.q1_freq, data.q2_vol, data.q3_impact]);

    const getInterpretation = (score: number) => {
        if (score === 0) return { text: "Continencia Normal", color: "text-green-600" };
        if (score <= 5) return { text: "Incontinencia Leve", color: "text-yellow-600" };
        if (score <= 12) return { text: "Incontinencia Moderada", color: "text-orange-600" };
        if (score <= 18) return { text: "Incontinencia Severa", color: "text-red-600" };
        return { text: "Incontinencia Muy Severa", color: "text-red-800 font-bold" };
    };

    const interpretation = getInterpretation(data.score || 0);

    return (
        <div className="space-y-6">
            <h3 className="font-serif font-bold text-xl text-brand-800 border-b border-brand-100 pb-2">Cuestionarios Estandarizados</h3>

            <Card className="border-l-4 border-l-brand-600">
                <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-lg text-brand-900">ICIQ-UI SF</h4>
                            <p className="text-sm text-brand-500">Consulta Internacional de Incontinencia Urinaria (Forma Corta)</p>
                        </div>
                        <div className="text-right bg-brand-50 p-3 rounded-lg">
                            <span className="block text-xs uppercase text-brand-400 font-bold">Puntaje Total</span>
                            <span className="text-3xl font-bold text-brand-800">{data.score || 0}</span>
                            <span className="text-xs text-brand-300">/ 21</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Q1 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">1. ¿Con qué frecuencia pierde orina?</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={data.q1_freq || 0}
                                onChange={e => onChange({ ...data, q1_freq: parseInt(e.target.value) })}
                            >
                                <option value={0}>Nunca (0)</option>
                                <option value={1}>Una vez a la semana o menos (1)</option>
                                <option value={2}>Dos o tres veces a la semana (2)</option>
                                <option value={3}>Una vez al día (3)</option>
                                <option value={4}>Varias veces al día (4)</option>
                                <option value={5}>Continuamente (5)</option>
                            </select>
                        </div>

                        {/* Q2 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">2. ¿Qué cantidad de orina cree que se le escapa?</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={data.q2_vol || 0}
                                onChange={e => onChange({ ...data, q2_vol: parseInt(e.target.value) })}
                            >
                                <option value={0}>No se me escapa nada (0)</option>
                                <option value={2}>Una pequeña cantidad (2)</option>
                                <option value={4}>Una cantidad moderada (4)</option>
                                <option value={6}>Mucha cantidad (6)</option>
                            </select>
                        </div>

                        {/* Q3 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                3. ¿En qué medida estos escapes afectan su vida diaria? (0-10)
                            </label>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-400">Nada</span>
                                <input
                                    type="range"
                                    min="0" max="10"
                                    className="flex-1 h-2 bg-brand-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                    value={data.q3_impact || 0}
                                    onChange={e => onChange({ ...data, q3_impact: parseInt(e.target.value) })}
                                />
                                <span className="text-sm font-bold w-6 text-center">{data.q3_impact || 0}</span>
                                <span className="text-xs text-gray-400">Mucho</span>
                            </div>
                        </div>
                    </div>

                    {/* Result */}
                    <div className={`mt-4 p-3 rounded-lg bg-gray-50 border text-center ${interpretation.color}`}>
                        <span className="font-bold text-sm uppercase">Interpretación:</span>
                        <span className="block text-lg font-bold">{interpretation.text}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-brand-300 italic">
                * Se pueden agregar más cuestionarios (UDI-6, IIQ-7) en futuras actualizaciones.
            </div>
        </div>
    );
}
