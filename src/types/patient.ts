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
    clinicalData?: {
        redFlags?: string[];
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
