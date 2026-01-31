export interface Exercise {
    id?: string;
    name: string;
    englishName?: string; // [NEW]
    aliases?: string[]; // [NEW]
    videoUrl?: string;
    instructions?: string;
    defaultParams?: {
        sets?: string;
        reps?: string;
        duration?: string;
        frequency?: string;
    };
    // Deep Taxonomy [NEW]
    system?: 'Musculoesquelético' | 'Suelo Pélvico' | 'Cardiorespiratorio' | 'Neuromuscular';
    function?: 'Fuerza' | 'Movilidad' | 'Estabilidad' | 'Potencia' | 'Resistencia' | 'Relajación' | 'Coordinación';
    equipment?: string[]; // e.g. ['Mat', 'Kettlebell']
    pattern?: string; // e.g. 'Squat', 'Hinge'
    clean_region?: 'Tren Superior' | 'Tren Inferior' | 'Core' | 'Full Body' | 'Suelo Pélvico';
    posture?: 'Bípedo' | 'Sedente' | 'Supino' | 'Prono' | 'Decúbito Lateral' | 'Cuadrupedia' | 'Invertida';
    impact_level?: 'Bajo' | 'Medio' | 'Alto';

    // Legacy mapping (optional, or we can deprecate 'category')
    category: ExerciseCategory;

    tags?: string[]; // Generic tags
    createdAt?: Date;
    updatedAt?: Date;
}

export type ExerciseCategory =
    | 'Fuerza'
    | 'Movilidad'
    | 'Suelo Pélvico'
    | 'Relajación'
    | 'Educación'
    | 'Respiración'
    | 'Otro';

export const TAXONOMY_OPTIONS = {
    systems: ['Musculoesquelético', 'Suelo Pélvico', 'Cardiorespiratorio', 'Neuromuscular'],
    functions: ['Fuerza', 'Movilidad', 'Estabilidad', 'Potencia', 'Resistencia', 'Relajación', 'Coordinación'],
    equipment: ['Mat', 'Balón Suizo', 'Banda', 'Kettlebell', 'Mancuerna', 'Barra', 'Silla', 'Pared', 'Biofeedback', 'Sin Implemento'],
    patterns: ['Squat', 'Hinge', 'Lunge', 'Push', 'Pull', 'Carry', 'Rotation', 'Anti-Rotation', 'Gait', 'Isolation'],
    regions: ['Tren Superior', 'Tren Inferior', 'Core', 'Full Body', 'Suelo Pélvico'],
    postures: ['Bípedo', 'Sedente', 'Supino', 'Prono', 'Decúbito Lateral', 'Cuadrupedia', 'Invertida'],
    impact: ['Bajo', 'Medio', 'Alto']
};

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
    'Suelo Pélvico',
    'Fuerza',
    'Movilidad',
    'Respiración',
    'Relajación',
    'Educación',
    'Otro'
];
