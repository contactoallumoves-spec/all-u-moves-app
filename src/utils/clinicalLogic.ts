export const clinicalLogic = {
    // --- ICIQ-SF Logic ---
    iciq: {
        calculateScore: (answers: Record<string, number>) => {
            const freq = answers['frequency'] || 0;
            const amount = answers['amount'] || 0;
            const impact = answers['impact'] || 0;
            return freq + amount + impact;
        },

        interpret: (score: number) => {
            if (score === 0) return { level: 'Normal', text: "Continencia. No se reportan pérdidas significativas.", color: 'bg-green-100 text-green-800' };
            if (score <= 5) return { level: 'Leve', text: "Incontinencia Urinaria Leve. Impacto bajo en calidad de vida.", color: 'bg-yellow-100 text-yellow-800' };
            if (score <= 12) return { level: 'Moderada', text: "Incontinencia Urinaria Moderada. Se recomienda intervención conservadora.", color: 'bg-orange-100 text-orange-800' };
            if (score <= 18) return { level: 'Severa', text: "Incontinencia Urinaria Severa. Impacto significativo. Requiere tratamiento prioritario.", color: 'bg-red-100 text-red-800' };
            return { level: 'Muy Severa', text: "Incontinencia Urinaria Muy Severa. Afectación crítica de calidad de vida.", color: 'bg-red-200 text-red-900 border-red-300' };
        },

        getQuestionText: (key: string) => {
            const map: Record<string, string> = {
                frequency: "1. ¿Con qué frecuencia pierde orina?",
                amount: "2. Cantidad de orina que pierde",
                impact: "3. Afectación en vida diaria (0-10)",
                sit_urgency: "Pérdida antes de llegar al baño",
                sit_cough: "Pérdida al toser/estornudar",
                sit_sleep: "Pérdida mientras duerme",
                sit_exercise: "Pérdida al realizar esfuerzo físico",
                sit_after: "Pérdida al terminar de orinar",
                sit_unknown: "Pérdida sin motivo evidente",
                sit_constant: "Pérdida continua"
            };
            return map[key] || key;
        },

        getAnswerText: (key: string, value: any) => {
            if (key === 'frequency') {
                const map: Record<number, string> = { 0: 'Nunca', 1: '1 vez/semana o menos', 2: '2-3 veces/semana', 3: '1 vez al día', 4: 'Varias veces al día', 5: 'Continuamente' };
                return map[Number(value)] || value;
            }
            if (key === 'amount') {
                const map: Record<number, string> = { 0: 'Nada', 2: 'Muy poca', 4: 'Moderada', 6: 'Mucha' };
                return map[Number(value)] || value;
            }
            if (key === 'impact') return `${value} / 10`;
            if (key.startsWith('sit_')) return value ? 'Sí' : 'No';
            return value;
        },

        getRecommendations: (score: number, answers: Record<string, any>) => {
            const recs = [];
            const tasks = [];

            // General Thresholds
            if (score > 0) {
                recs.push("Educación sobre anatomía del piso pélvico.");
                tasks.push("Diario Miccional (3 días)");
            }

            if (score >= 6) {
                recs.push("Entrenamiento muscular del piso pélvico (PFMT) supervisado.");
                tasks.push("Ejercicios de Kegel (Serie Inicial)");
            }

            // Specific Item Triggers
            // Q4 Situations
            if (answers['sit_cough'] || answers['sit_exercise']) {
                recs.push("Manejo de presión intra-abdominal (Knack technique).");
                recs.push("Evaluación de competencia abdominal.");
            }
            if (answers['sit_urgency'] || answers['sit_after']) {
                recs.push("Entrenamiento vesical (Bladder Training).");
                recs.push("Técnicas de inhibición de urgencia.");
            }

            return { recommendations: recs, tasks };
        }
    },

    // --- UDI-6 Logic ---
    udi6: {
        calculateScore: (answers: Record<string, number>) => {
            // UDI-6 is mean of items * 25. Items are 0-3 scale usually?
            // Wait, existing UDI6Form uses 0-3 values? Let's assume standard scoring:
            // Items are scored 0 (not at all) to 3 (greatly).
            // Total = (Sum of items / 6) * 33.33 ?? Or (Sum / 18) * 100?
            // Standard UDI-6: Sum scores (0-3 scale). Multiply sum by 33.3? No.
            // Formula: (Sum of scores / 6) * 100 / 3? No.
            // Correct Formula UDI-6 (0-100 scale): (Mean score of items) x 33.33 approx.
            // Or: (Sum / 18) * 100. (Since max sum is 18).

            // Let's rely on sum first.
            let sum = 0;
            let count = 0;
            for (let i = 1; i <= 6; i++) {
                if (answers[`q${i}`] !== undefined) {
                    sum += Number(answers[`q${i}`]);
                    count++;
                }
            }
            if (count === 0) return 0;

            // Conversion to 0-100 scale
            // Max raw score = 18 (6 items * 3). 
            // 18 => 100.
            return Math.round((sum / 18) * 100);
        },

        interpret: (score: number, answers: Record<string, number>) => {
            // Subscale Analysis
            // Irritative: Q1, Q2
            // Stress: Q3, Q4
            // Obstructive: Q5, Q6

            const irritative = (Number(answers['q1'] || 0) + Number(answers['q2'] || 0));
            const stress = (Number(answers['q3'] || 0) + Number(answers['q4'] || 0));
            const obstructive = (Number(answers['q5'] || 0) + Number(answers['q6'] || 0));

            let dominant = 'Mixta / Balanceada';
            if (irritative > stress && irritative > obstructive) dominant = 'Predominio Urgencia/Irritativo';
            else if (stress > irritative && stress > obstructive) dominant = 'Predominio Esfuerzo (Stress)';
            else if (obstructive > irritative && obstructive > stress) dominant = 'Predominio Obstructivo/Dolor';

            return {
                score,
                text: `Puntaje Total: ${score}/100. Patrón clínico sugiere sintomatología de ${dominant}.`,
                subscales: { irritative, stress, obstructive },
                dominantType: dominant
            };
        },

        getRecommendations: (score: number, answers: Record<string, any>) => {
            const recs = [];

            // Analyze Subtypes based on questions
            const irritative = (Number(answers['q1'] || 0) + Number(answers['q2'] || 0)); // Urgency
            const stress = (Number(answers['q3'] || 0) + Number(answers['q4'] || 0)); // Stress
            const obstructive = (Number(answers['q5'] || 0) + Number(answers['q6'] || 0)); // Pain/Obstructive

            if (irritative > 2) {
                recs.push("Manejo conductual para síntomas de urgencia (Irritativo).");
                recs.push("Protocolo de Reentrenamiento Vesical.");
            }

            if (stress > 2) {
                recs.push("Entrenamiento muscular intensivo (Fuerza/Coordinación).");
                recs.push("Manejo de presión intra-abdominal (Knack).");
            }

            if (obstructive > 2) {
                recs.push("Evaluación de vaciamiento incompleto (Residuo miccional).");
                recs.push("Técnicas de relajación de piso pélvico (Down-training).");
            }

            if (score > 33 && recs.length === 0) {
                recs.push("Evaluación kinesiológica completa de piso pélvico.");
            }

            return { recommendations: recs, tasks: [] };
        },

        getQuestionText: (key: string) => {
            const map: Record<string, string> = {
                q1: "Micción frecuente",
                q2: "Urgencia miccional",
                q3: "Escape al esfuerzo físico",
                q4: "Pequeños escapes (gotas)",
                q5: "Dificultad de vaciado",
                q6: "Dolor abdominal/genital"
            };
            return map[key] || key;
        },

        getAnswerText: (key: string, value: any) => {
            const val = Number(value);
            if (val === 0) return "No";
            if (val === 1) return "Un poco";
            if (val === 2) return "Moderadamente";
            if (val === 3) return "Mucho";
            return value;
        }
                recs.push("Neuromodulación del tibial posterior (Sugerencia clínica).");
    }
            if(subscales.obstructive >= 2) {
        recs.push("Evaluación de prolapso (POP-Q simplificado).");
recs.push("Técnicas de vaciado vesical (doble micción).");
            }

return recs;
        }
    }
};
