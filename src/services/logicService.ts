
import { CLUSTERS } from '../data/clusters';
import { Cluster } from '../types/clinical';

export interface LogicResult {
    activeClusters: Cluster[];
    suggestions: {
        tasks: string[];
        education: string[];
        tests: string[];
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
            }
        });

        // 2. Return Result
        return {
            activeClusters,
            suggestions: {
                tasks: Array.from(uniqueTasks),
                education: Array.from(uniqueEducation),
                tests: Array.from(uniqueTests)
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
        }

        return inferredSymptoms;
    }
};
