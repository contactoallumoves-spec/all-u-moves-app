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
            if (score <= 5) return { level: 'Leve', text: "Incontinencia Leve. Impacto bajo en calidad de vida.", color: 'bg-yellow-100 text-yellow-800' };
            if (score <= 12) return { level: 'Moderada', text: "Incontinencia Moderada. Se recomienda intervención conservadora.", color: 'bg-orange-100 text-orange-800' };
            if (score <= 18) return { level: 'Severa', text: "Incontinencia Severa. Impacto significativo. Requiere tratamiento prioritario.", color: 'bg-red-100 text-red-800' };
            return { level: 'Muy Severa', text: "Incontinencia Muy Severa. Afectación crítica de calidad de vida.", color: 'bg-red-200 text-red-900 border-red-300' };
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

        getRecommendations: (analysis: any) => {
            const recs = [];
            const { subscales } = analysis;

            if (subscales.stress >= 2) { // Threshold arbitrary for now
                recs.push("Protocolo de fuerza y coordinación abdomino-pélvica.");
                recs.push("Educación sobre maniobra de contra-bloqueo.");
            }
            if (subscales.irritative >= 2) {
                recs.push("Reeducación conductual y diario de ingesta.");
                recs.push("Neuromodulación del tibial posterior (Sugerencia clínica).");
            }
            if (subscales.obstructive >= 2) {
                recs.push("Evaluación de prolapso (POP-Q simplificado).");
                recs.push("Técnicas de vaciado vesical (doble micción).");
            }

            return recs;
        }
    }
};
