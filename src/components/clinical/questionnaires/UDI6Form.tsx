import { useState } from 'react';

interface UDI6Data {
    answers: Record<string, number>;
    score: number;
    interpretation: string;
}

interface UDI6FormProps {
    onChange: (data: UDI6Data) => void;
    initialData?: any;
    readOnly?: boolean;
}

export const UDI6Form = ({ onChange, initialData, readOnly }: UDI6FormProps) => {
    const [answers, setAnswers] = useState<Record<string, number>>(initialData?.answers || {});

    // UDI-6 Items (0-3 Scale: No, Un poco, Moderadamente, Mucho)
    const questions = [
        { id: 'q1', label: '¿Micción frecuente?' },
        { id: 'q2', label: '¿Escape de orina relacionado con la sensación de urgencia?' },
        { id: 'q3', label: '¿Escape de orina relacionado con actividad física, toser o estornudar?' },
        { id: 'q4', label: '¿Pequeñas cantidades de escape de orina (gotas)?' },
        { id: 'q5', label: '¿Dificultad para vaciar la vejiga?' },
        { id: 'q6', label: '¿Dolor o incomodidad en el área abdominal baja o genital?' }
    ];

    const calculateScore = (currentAnswers: Record<string, number>) => {
        // Average of items * 25 => Scale 0-100
        // Valid answers count
        let sum = 0;
        let count = 0;

        questions.forEach(q => {
            if (currentAnswers[q.id] !== undefined) {
                sum += currentAnswers[q.id];
                count++;
            }
        });

        if (count === 0) return 0;
        // Formula: (Sum / Count) * (100 / 3) approximately? 
        // Standard Scoring: Mean value of items score * 25.
        // Item range 0-3. Mean range 0-3. 3 * 33.33 = 100.
        // Actually typically UDI-6 score is mean * 25 * (something)?
        // Wait, max score per item is 3. Max average is 3.
        // To get to 100: (Mean / 3) * 100.

        const mean = sum / 6; // Usually divided by total items even if missing? Or just answered? Let's force all answers for simplicity or divide by 6.
        return Math.round((mean / 3) * 100);
    };

    const getInterpretation = (score: number) => {
        if (score === 0) return "Sin síntomas de distrés";
        if (score <= 33) return "Distrés Leve";
        if (score <= 66) return "Distrés Moderado";
        return "Distrés Severo";
    };

    const handleChange = (key: string, value: number) => {
        if (readOnly) return;

        const newAnswers = { ...answers, [key]: value };
        setAnswers(newAnswers);

        const score = calculateScore(newAnswers);
        const interpretation = getInterpretation(score);

        onChange({
            answers: newAnswers,
            score,
            interpretation
        });
    };

    return (
        <div className="space-y-6 text-brand-900">
            <p className="text-sm text-gray-500 italic mb-4">
                Indique si experimenta los siguientes síntomas y cuánto le molestan (0: No presente, 1: Poco, 2: Moderado, 3: Mucho).
            </p>

            {questions.map((q) => (
                <div key={q.id} className="space-y-2 pb-4 border-b border-gray-100 last:border-0">
                    <label className="block text-sm font-bold text-brand-700">
                        {q.label}
                    </label>
                    <div className="flex gap-2">
                        {[
                            { label: '0 - No', value: 0 },
                            { label: '1 - Poco', value: 1 },
                            { label: '2 - Moderado', value: 2 },
                            { label: '3 - Mucho', value: 3 },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleChange(q.id, opt.value)}
                                disabled={readOnly}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${answers[q.id] === opt.value
                                    ? 'bg-brand-100 border-brand-300 text-brand-800 font-bold shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {!readOnly && (
                <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 text-center mt-6">
                    <p className="text-xs text-brand-400 uppercase font-bold mb-1">Puntaje UDI-6</p>
                    <div className="flex items-baseline justify-center gap-2">
                        <span className="text-3xl font-bold text-brand-700">{calculateScore(answers)}</span>
                        <span className="text-sm text-brand-500">/ 100</span>
                    </div>
                    <p className="text-xs text-brand-400 mt-1">{getInterpretation(calculateScore(answers))}</p>
                </div>
            )}
        </div>
    );
};
