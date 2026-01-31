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
    status?: 'active' | 'inactive' | 'archived' | 'prospective';
    prospectiveData?: {
        reason: string;
        story: string; // Historia/Relato
        expectations: string;
    };
    clinicalData?: {
        redFlags?: string[];
        prospectiveReason?: string;
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
        painChronicity?: string; // e.g. "Agudo (<3 meses)", "Crónico (>3 meses)"
        habits?: {
            waterIntake?: string;
            activityLevel?: string;
            digestion?: string;
            sleepQuality?: string;
            stressLevel?: number; // 0-10
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
    activePlan?: PrescribedPlan; // [NEW] Structured Weekly Plan
    magicLinkToken?: string; // [NEW] For Public Portal Access
}


export interface PrescribedPlan {
    startDate: any; // Timestamp
    endDate?: any;
    schedule: {
        monday: PlanExercise[];
        tuesday: PlanExercise[];
        wednesday: PlanExercise[];
        thursday: PlanExercise[];
        friday: PlanExercise[];
        saturday: PlanExercise[];
        sunday: PlanExercise[];
    };
}

export interface ExerciseParameters {
    sets?: string;
    reps?: string;
    load?: string; // e.g. "10kg"
    rpe?: string; // Target RPE
    rest?: string; // e.g. "90s"
    tempo?: string; // e.g. "3010"
    holdTime?: string; // e.g. "5s" (Isometrics/Pelvic)
    unilateral?: boolean;
    side?: 'left' | 'right' | 'alternating' | 'bilateral';
    notes?: string; // Specific instructions per exercise instance
    // Pro Fields
    rir?: string; // Reps in Reserve (e.g. "2 RIR")
    percent1rm?: string; // % 1RM (e.g. "75%")
    techniqueTags?: string[]; // e.g. ["Explosive", "Slow Eccentric"]
}

export interface PlanExercise {
    id: string; // unique instance ID
    exerciseId: string; // ref to Exercise Library
    name: string; // snapshot of name
    // params: string; // DEPRECATED: usage of simple string
    details?: ExerciseParameters; // [NEW] Structured params
    completed?: boolean;
}

export interface SessionFeedback {
    rpe?: number; // 0-10
    pain?: number; // 0-10
    fatigue?: number; // 0-10
    symptoms?: string[]; // e.g. ["Pérdida de orina", "Dolor lumbar"]
    comments?: string;
}

export interface Task {
    id: string;
    description: string; // e.g., "Respiración Diafragmática"
    frequency: string;   // e.g., "3 series de 10 reps"
    duration?: string;   // e.g., "Mañana y Noche"
    completed?: boolean;
}
