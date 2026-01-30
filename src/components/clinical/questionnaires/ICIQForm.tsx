import { useEffect, useState } from 'react';

interface ICIQData {
    answers: Record<string, any>;
    score: number;
    interpretation: string;
}

interface ICIQFormProps {
    onChange: (data: ICIQData) => void;
    initialData?: any;
    readOnly?: boolean;
}

export const ICIQForm = ({ onChange, initialData, readOnly }: ICIQFormProps) => {
    const [answers, setAnswers] = useState<Record<string, number>>(initialData?.answers || {});

    // Q1: Frequency
    // Q2: Amount
    // Q3: Impact

    // Score = Q3 + Q4 + Q5 (Technical naming usually Q1, Q2 are demo, but ICIQ-SF sum is Freq + Amount + Impact)
    // Actually typically:
    // 1. Frecuencia (0-5)
    // 2. Cantidad (0, 2, 4, 6)
    // 3. Afectación (0-10)
    // Sum = Score (0-21)

    const calculateScore = (currentAnswers: Record<string, number>) => {
        const freq = currentAnswers['frequency'] || 0;
        const amount = currentAnswers['amount'] || 0;
        const impact = currentAnswers['impact'] || 0;
        return freq + amount + impact;
    };

    const getInterpretation = (score: number) => {
        if (score === 0) return "Continencia";
        if (score <= 5) return "Leve";
        if (score <= 12) return "Moderada";
        if (score <= 18) return "Severa";
        return "Muy Severa";
    };

    const handleChange = (key: string, value: any) => {
        if (readOnly) return;

        const newAnswers = { ...answers, [key]: Number(value) };
        setAnswers(newAnswers);

        const score = calculateScore(newAnswers);
        const interpretation = getInterpretation(score);

        onChange({
            answers: newAnswers,
            score,
            interpretation
        });
    };

    // Initialize if data provided, typically triggered on mount if initialData exists
    // But since we lift state up, we just render provided values or local state

    return (
        <div className="space-y-8 text-brand-900">
            {/* Q1 Frequency */}
            <div className="space-y-3">
                <label className="block text-sm font-bold uppercase text-brand-500">
                    1. ¿Con qué frecuencia pierde orina?
                </label>
                <div className="space-y-2">
                    {[
                        { label: 'Nunca', value: 0 },
                        { label: 'Una vez a la semana o menos', value: 1 },
                        { label: 'Dos o tres veces a la semana', value: 2 },
                        { label: 'Una vez al día', value: 3 },
                        { label: 'Varias veces al día', value: 4 },
                        { label: 'Continuamente', value: 5 },
                    ].map((opt) => (
                        <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers['frequency'] === opt.value ? 'bg-brand-50 border-brand-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                            <input
                                type="radio"
                                name="frequency"
                                value={opt.value}
                                checked={answers['frequency'] === opt.value}
                                onChange={() => handleChange('frequency', opt.value)}
                                disabled={readOnly}
                                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Q2 Amount */}
            <div className="space-y-3">
                <label className="block text-sm font-bold uppercase text-brand-500">
                    2. Indique la cantidad de orina que cree que se le escapa
                </label>
                <div className="space-y-2">
                    {[
                        { label: 'No se me escapa nada', value: 0 },
                        { label: 'Muy poca cantidad', value: 2 },
                        { label: 'Una cantidad moderada', value: 4 },
                        { label: 'Mucha cantidad', value: 6 },
                    ].map((opt) => (
                        <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers['amount'] === opt.value ? 'bg-brand-50 border-brand-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                            <input
                                type="radio"
                                name="amount"
                                value={opt.value}
                                checked={answers['amount'] === opt.value}
                                onChange={() => handleChange('amount', opt.value)}
                                disabled={readOnly}
                                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Q3 Impact */}
            <div className="space-y-3">
                <label className="block text-sm font-bold uppercase text-brand-500">
                    3. ¿En qué medida afectan estos escapes a su vida diaria?
                </label>
                <div className="px-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>0 (Nada)</span>
                        <span>10 (Mucho)</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={answers['impact'] || 0}
                        onChange={(e) => handleChange('impact', e.target.value)}
                        disabled={readOnly}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                    <div className="text-center font-bold text-brand-600 mt-2 text-lg">
                        {answers['impact'] || 0} / 10
                    </div>
                </div>
            </div>

            {/* Q4 Situations (Not scored but important context) */}
            <div className="space-y-3 pt-4 border-t border-dashed border-gray-200">
                <label className="block text-sm font-bold uppercase text-brand-500">
                    4. ¿Cuándo pierde orina? (Seleccione todas las que apliquen)
                </label>
                <div className="grid gap-2">
                    {[
                        { label: 'Nunca', key: 'sit_never' },
                        { label: 'Antes de llegar al baño', key: 'sit_urgency' },
                        { label: 'Al toser o estornudar', key: 'sit_cough' },
                        { label: 'Mientras duerme', key: 'sit_sleep' },
                        { label: 'Al realizar esfuerzos físicos / ejercicio', key: 'sit_exercise' },
                        { label: 'Cuando termina de orinar y se viste', key: 'sit_after' },
                        { label: 'Sin motivo evidente', key: 'sit_unknown' },
                        { label: 'De forma continua', key: 'sit_constant' },
                    ].map((opt) => (
                        <label key={opt.key} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!answers[opt.key]}
                                onChange={(e) => handleChange(opt.key, e.target.checked ? 1 : 0)}
                                disabled={readOnly}
                                className="rounded text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {!readOnly && (
                <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 text-center">
                    <p className="text-xs text-brand-400 uppercase font-bold mb-1">Puntaje Actual</p>
                    <p className="text-3xl font-bold text-brand-700">{calculateScore(answers)} <span className="text-sm font-normal text-brand-400">/ 21</span></p>
                </div>
            )}
        </div>
    );
};
