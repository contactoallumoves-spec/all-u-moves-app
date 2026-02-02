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
    // [NEW] Persisted structure for Manual Block Selection
    activeBlocks?: {
        monday: string[];
        tuesday: string[];
        wednesday: string[];
        thursday: string[];
        friday: string[];
        saturday: string[];
        sunday: string[];
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

    // Cardio / Endurance
    duration?: string; // e.g. "20 min"
    distance?: string; // e.g. "5km"
    heartRateZone?: string; // e.g. "Zone 2"
    incline?: string; // e.g. "1.5%"

    // Yoga / Pilates / Breath
    breathPattern?: string; // e.g. "In 4 / Out 6"

    // Pelvic Floor (Advanced)
    contractionTime?: string; // e.g. "5s" (Work)
    relaxationTime?: string; // e.g. "10s" (Rest)
}

export interface PlanExercise {
    id: string; // unique instance ID
    exerciseId: string; // ref to Exercise Library
    name: string; // snapshot of name
    // params: string; // DEPRECATED: usage of simple string
    details?: ExerciseParameters; // [NEW] Structured params
    block?: string; // [NEW] Session Block (e.g. "Preparación", "Fuerza")
    completed?: boolean;
}

// [NEW] Expanded "High Performance" Taxonomy
export const SESSION_BLOCKS = {
    PREHAB: 'Pre-Habilitación',
    WARMUP: 'Calentamiento (General)',
    MOBILITY: 'Movilidad & Rango',
    ACTIVATION: 'Activación / Correctivos',
    SKILLS: 'Técnica / Habilidades',
    POWER: 'Potencia / Pliometría',
    MAIN: 'Trabajo Principal',
    STRENGTH_MAX: 'Fuerza Máxima',
    STRENGTH_HYPERTROPHY: 'Fuerza / Hipertrofia',
    METABOLIC: 'Metabólico (ESD)',
    CORE: 'Núcleo / Pillar',
    PELVIC: 'Suelo Pélvico',
    RECOVERY: 'Regenerativo',
    EDUCATION: 'Educación / Tareas'
} as const;

export type SessionBlockType = typeof SESSION_BLOCKS[keyof typeof SESSION_BLOCKS];

export interface SessionFeedback {
    rpe?: number; // 0-10 or 1-10
    pain?: number; // 0-10
    fatigue?: number; // 0-10
    symptoms?: string[]; // e.g. ["Pérdida de orina", "Dolor lumbar"]
    comments?: string;
}

// [NEW] Actual execution log
export interface SessionExerciseLog {
    exerciseId: string;
    sets: {
        reps?: string;
        load?: string;
        rpe?: string;
        completed: boolean;
    }[];
    skipped?: boolean;
    skipReason?: string;
    notes?: string;
}

export interface SessionLog {
    id: string; // date string YYYY-MM-DD
    date: any; // Timestamp
    patientId: string;
    dayKey: string; // 'monday', 'tuesday' etc.
    exercises: SessionExerciseLog[];
    feedback?: SessionFeedback;
    status: 'completed' | 'partial' | 'skipped';
    completedAt?: any;
    durationSeconds?: number;
}

export interface Task {
    id: string;
    description: string; // e.g., "Respiración Diafragmática"
    frequency: string;   // e.g., "3 series de 10 reps"
    duration?: string;   // e.g., "Mañana y Noche"
    completed?: boolean;
}
