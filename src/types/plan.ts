import { PrescribedPlan } from './patient';

export type MacrocycleType = 'Pretemporada' | 'Competencia' | 'Transición' | 'Recuperación' | 'General';

export interface Macrocycle {
    id: string;
    name: string;
    type: MacrocycleType;
    startWeek: number; // 1-52
    endWeek: number;   // 1-52
    color: string;     // Hex code for UI
    goals?: string[];
}

export interface AnnualPlan {
    id: string;
    patientId: string;
    name: string; // e.g. "Temporada 2024"
    startDate: any; // Timestamp

    // High Level Structure
    macrocycles: Macrocycle[];

    // Weeks Data (The actual content)
    // Key is the week offset (e.g. 1, 2... 52)
    weeks: Record<number, PrescribedPlan>;

    createdAt: any;
    updatedAt: any;
    status: 'active' | 'archived' | 'draft';
}
