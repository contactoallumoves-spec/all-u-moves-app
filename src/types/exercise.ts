export interface Exercise {
    id?: string;
    name: string;
    category: ExerciseCategory;
    videoUrl?: string;
    instructions?: string;
    defaultParams?: {
        sets?: string;
        reps?: string;
        duration?: string;
        frequency?: string;
    };
    tags?: string[];
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

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
    'Suelo Pélvico',
    'Fuerza',
    'Movilidad',
    'Respiración',
    'Relajación',
    'Educación',
    'Otro'
];
