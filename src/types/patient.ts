export type LifeStage = 'Nuligesta' | 'Embarazo' | 'Postparto' | 'Menopausia' | 'Deportista';

export interface Patient {
    id?: string;
    firstName: string;
    lastName: string;
    birthDate: string; // YYYY-MM-DD
    email?: string;
    phone?: string;
    stage: LifeStage;
    createdAt?: any; // Firestore Timestamp
    notes?: string;
}
