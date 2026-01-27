export type LifeStage = 'Nuligesta' | 'Embarazo' | 'Postparto' | 'Menopausia' | 'Deportista';

export interface Patient {
    id?: string;
    firstName: string;
    lastName: string;
    rut: string; // Chilean ID
    birthDate: string; // YYYY-MM-DD
    email?: string;
    phone?: string;
    occupation?: string;
    stage: LifeStage;
    createdAt?: any; // Firestore Timestamp
    notes?: string;
    insurance?: 'fonasa' | 'isapre' | 'particular';
    clinicalData?: {
        redFlags?: string[];
        // Premium Anamnesis Fields
        gynObs?: {
            gestations: number;
            births: number; // vaginal
            cesareans: number;
            abortions?: number;
            episiotomy?: boolean;
            menopause?: boolean;
            surgeries?: string;
        };
        habits?: {
            waterIntake?: string; // e.g. "Poca (<1L)", "Normal (1.5-2L)", "Mucha (>2L)"
            activityLevel?: string;
            digestion?: string; // e.g. "Estreñimiento", "Normal"
            sleepQuality?: string;
        };
        bodyMap?: {
            painRegions: string[]; // e.g. ["Lumbar", "Pélvico", "Cadera Izq"]
            painType?: string; // "Punzante", "Quemante", etc.
        };
    };
    nextSessionChecklist?: {
        label: string;
        checked: boolean;
    }[];
    activeTasks?: Task[];
}

export interface Task {
    id: string;
    description: string; // e.g., "Respiración Diafragmática"
    frequency: string;   // e.g., "3 series de 10 reps"
    duration?: string;   // e.g., "Mañana y Noche"
    completed?: boolean;
}
