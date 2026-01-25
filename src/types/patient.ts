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
}
