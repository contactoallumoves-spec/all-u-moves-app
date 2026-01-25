export type Severity = 'low' | 'medium' | 'high' | 'red_flag';

export interface Cluster {
    id: string;
    label: string;
    category: 'pelvic' | 'msk' | 'fitness' | 'lifestyle';
    description?: string;
    triggers: {
        symptoms: string[]; // IDs of symptoms that activate this cluster
    };
    suggestions: {
        tests: string[]; // IDs of recommended tests
        education: string[]; // IDs of educational content
        tasks: string[]; // IDs of suggested tasks
        cif?: {
            code: string;
            description: string;
        }[];
        referral?: string; // If validation/referral is needed
    }
}

export interface EvaluationData {
    id?: string;
    patientId: string;
    date: Date;
    mode: 'fast' | 'complete';
    selectedClusters: string[];
    redFlags: string[];
    notes: string;
    plan: {
        tasks: string[];
        education: string[];
    };
    functional?: {
        psfs?: { activity: string; score: number }[]; // 0-10
        sane?: number; // 0-100
    };
}
