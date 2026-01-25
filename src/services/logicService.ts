
import { CLUSTERS } from '../data/clusters';
import { Cluster } from '../types/clinical';

export interface LogicResult {
    activeClusters: Cluster[];
    suggestions: {
        tasks: string[];
        education: string[];
        tests: string[];
        cif: { code: string; description: string }[]; // [NEW]
    };
    redFlags: string[]; // IDs
}

export const logicService = {
    /**
     * Analyzes a list of collected symptom IDs and returns active clusters and suggestions.
     * @param symptomIds List of symptom IDs collected from chips/inputs
     */
    analyze(symptomIds: string[]): LogicResult {
        const activeClusters: Cluster[] = [];
        const uniqueTasks = new Set<string>();
        const uniqueEducation = new Set<string>();
        const uniqueTests = new Set<string>();
        const uniqueCif = new Map<string, string>(); // Code -> Description

        // 1. Match Clusters
        CLUSTERS.forEach(cluster => {
            // Check if ANY of the cluster triggers are present in the user's symptoms
            // (Simple OR logic for now, can be upgraded to AND/Complex later)
            const hasTrigger = cluster.triggers.symptoms.some(s => symptomIds.includes(s));

            if (hasTrigger) {
                activeClusters.push(cluster);

                // Aggregate Suggestions
                cluster.suggestions.tasks.forEach(t => uniqueTasks.add(t));
                cluster.suggestions.education.forEach(e => uniqueEducation.add(e));
                cluster.suggestions.tests.forEach(t => uniqueTests.add(t));

                // Aggregate CIF [NEW]
                if (cluster.suggestions.cif) {
                    cluster.suggestions.cif.forEach(c => uniqueCif.set(c.code, c.description));
                }
            }
        });

        // 2. Return Result
        return {
            activeClusters,
            suggestions: {
                tasks: Array.from(uniqueTasks),
                education: Array.from(uniqueEducation),
                tests: Array.from(uniqueTests),
                cif: Array.from(uniqueCif.entries()).map(([code, description]) => ({ code, description }))
            },
            redFlags: [] // To be implemented with RedFlag logic
        };
    },

    /**
     * Smart Matcher: Checks specific conditions beyond simple ID matching.
     * E.g., Oxford < 3 -> "weaker_floor"
     */
    evaluateMetrics(data: any): string[] {
        const inferredSymptoms: string[] = [];

        // Pelvic Floor Logic
        if (data.pelvic) {
            if (data.pelvic.oxford !== undefined && data.pelvic.oxford < 3) {
                inferredSymptoms.push('debilidad_pelvica');
            }
            if (data.pelvic.hiatus === 'abierto') {
                inferredSymptoms.push('hiato_abierto');
            }
            // Sexual Health [NEW]
            if (data.pelvic.dyspareunia) {
                inferredSymptoms.push('dispareunia');
            }
        }

        // MSK Logic
        if (data.msk) {
            if (data.msk.doming) {
                inferredSymptoms.push('control_abdominal_deficiente');
            }
        }

        // Anamnesis Logic [NEW]
        if (data.anamnesis) {
            // C-Section Logic
            if (data.anamnesis.cSections > 0) {
                inferredSymptoms.push('cesarea_previa');
            }

            // Comorbidities Mapping
            const conditions = data.anamnesis.comorbidities || [];
            if (conditions.includes('constipation')) inferredSymptoms.push('estrenimiento');
            if (conditions.includes('chronic_cough')) inferredSymptoms.push('tos_cronica');
            if (conditions.includes('smoking')) inferredSymptoms.push('tos_cronica'); // Risk factor
            if (conditions.includes('smoking')) inferredSymptoms.push('tos_cronica'); // Risk factor
        }

        // Questionnaire Logic [NEW]
        if (data.questionnaire) {
            const { score, q1_freq, q2_vol } = data.questionnaire;
            // High Score -> General Incontinence trigger
            if (score > 0) inferredSymptoms.push('incontinencia_general');
            // High Frequency -> Urgency hint? (Needs refinement, but good trigger)
            if (q1_freq >= 3) inferredSymptoms.push('frecuencia_alta');
            // High Volume -> Effort/Sev hint
            if (q2_vol >= 4) inferredSymptoms.push('escape_severo');
        }

        return inferredSymptoms;
    },

    /**
     * Extracts Red Flags from evaluation data to be highlighted
     */
    extractRedFlags(data: any): string[] {
        return data.redFlags || [];
    },

    /**
     * Generates SMART Goals based on active clusters and symptoms
     */
    generateSmartGoals(activeClusters: Cluster[], data: any): string[] {
        const goals: string[] = [];

        // 1. Incontinence Relationship
        if (data.questionnaire?.score > 0 || activeClusters.some(c => c.id === 'cluster_iue' || c.id === 'cluster_ium')) {
            goals.push("Reducir la frecuencia de escapes de orina en un 50% en 4 semanas (SMART: Específico, Medible, Alcanzable).");
            goals.push("Lograr mantener la continencia ante esfuerzos moderados (tos, estornudo) en 6 semanas.");
        }

        // 2. Pelvic Floor Strength (Oxford)
        if (data.pelvic?.oxford !== undefined) {
            if (data.pelvic.oxford < 3) {
                goals.push(`Aumentar la fuerza muscular del suelo pélvico de Oxford ${data.pelvic.oxford} a ${data.pelvic.oxford + 1} en 4 semanas mediante entrenamiento de fuerza.`);
            } else if (data.pelvic.oxford >= 3 && data.pelvic.oxford < 5) {
                goals.push(`Mejorar la resistencia muscular del suelo pélvico manteniendo contracción Oxford ${data.pelvic.oxford} por 10 segundos en 4 semanas.`);
            }
        }

        // 3. Coordination / Knack (Always beneficial)
        goals.push("Automatizar la contracción anticipatoria (Knack) en el 80% de los eventos de tos/esfuerzo en 3 semanas.");

        // 4. Prolapse / Hiatus
        if (activeClusters.some(c => c.id === 'cluster_pop') || data.pelvic?.hiatus === 'abierto') {
            goals.push("Disminuir la sensación de peso/bulto vaginal (VAS) en 2 puntos en 5 semanas mediante ejercicios hipopresivos y pautas posturales.");
        }

        // 5. Sexual Health
        if (data.pelvic?.dyspareunia) {
            goals.push("Lograr relaciones sexuales sin dolor (VAS 0) en 8 semanas mediante terapia manual y dilatadores.");
        }

        // 6. Educational / Adherence (General)
        goals.push("Lograr una adherencia >80% a la pauta de ejercicios domiciliarios en el primer mes.");

        return goals;
    }
};
