
export type SetType = 'warmup' | 'working' | 'failure' | 'drop' | 'cluster' | 'amrap';

// --- Granular Set Definitions ---

export interface BaseSet {
    id: string;
    type: SetType;
    completed: boolean;
    // Feedback at the SET level (optional, for very high detail)
    feedback?: {
        rpe?: number;
        pain?: boolean;
        notes?: string;
    };
}

// 1. Strength / Hypertrophy (Standard Gym)
export interface StrengthSet extends BaseSet {
    reps: number;
    loadKg: number;
    rpeTarget?: number;
    rirTarget?: number; // Reps In Reserve
    restSec?: number;
}

// 2. Duration / Pelvic / Isometric / Breath
export interface DurationSet extends BaseSet {
    workSec: number;      // Contraction / Inhale time
    restSec: number;      // Relaxation / Exhale time
    reps: number;         // Number of cycles/reps
    holdSec?: number;     // Specific hold time if different from work
    tempo?: string;       // e.g. "3-1-3"
}

// 3. Cardio / Distance / Interval
export interface DistanceSet extends BaseSet {
    distanceMeters: number;
    timeSec: number;
    intensity: string;    // e.g. "Zone 2", "Sprint", "RPE 6"
    restSec?: number;     // For intervals
}

// Polymorphic Union
export type ProSet = StrengthSet | DurationSet | DistanceSet;

// --- Pro Exercise Configuration ---

export interface ProPlanExercise {
    id: string; // Instance ID
    exerciseId: string; // Ref to Exercise Library
    name: string; // Snapshot Name

    // UI Logic: Determines which Grid/Builder to show
    cardType: 'strength' | 'pelvic' | 'timer' | 'breathing' | 'cardio';

    // Monitoring Configuration (Clinician decides what to ask)
    monitoring: {
        askRpe: boolean;      // Slider 1-10
        askPain: boolean;     // Yes/No + Intensity
        askTechniqueVideo: boolean; // Upload capability
        askNotes: boolean;    // Text input
    };

    // The Recipe
    sets: ProSet[];

    notes?: string; // General instructions for this exercise
}

// --- High Level Plan Structure ---

export interface ProSectionBlock {
    id: string;
    name: string; // e.g. "Warmup", "Plyometrics", "Main Lift"
    type: 'warmup' | 'strength' | 'power' | 'cardio' | 'other';
    order: number;
    exercises: ProPlanExercise[];
}

// Replaces the flat array of exercises for a day
export interface ProDayPlan {
    id: string; // Day ID or Date String
    sections: ProSectionBlock[];
}
