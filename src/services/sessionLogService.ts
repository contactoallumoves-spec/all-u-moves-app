import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';

export interface SessionLog {
    id?: string;
    patientId: string;
    date: any; // Timestamp
    exercises: {
        exerciseId: string;
        name: string;
        completed: boolean;
        // Performed values
        sets?: string;
        reps?: string;
        load?: string;
        rpe?: number; // Per exercise RPE
        notes?: string;
    }[];
    feedback?: {
        rpe: number; // Session RPE (0-10)
        pain: number; // 0-10 (Global or Max)
        fatigue: number; // 0-10
        energyLevel?: number; // 1-5
        sleepQuality?: number; // 1-5
        symptoms?: string[]; // List of specific symptoms
        notes?: string;
    };
    createdAt: any;
}

const COLLECTION_NAME = 'sessionLogs';

export const SessionLogService = {
    async create(log: Omit<SessionLog, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...log,
                createdAt: Timestamp.now()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating session log", error);
            throw error;
        }
    },

    async getByPatientAndDate(patientId: string, date: Date) {
        // This is a bit tricky with timestamps, usually better to query by range or string YYYY-MM-DD
        // For simplicity, we might just fetch recent logs
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const q = query(
                collection(db, COLLECTION_NAME),
                where('patientId', '==', patientId),
                where('date', '>=', Timestamp.fromDate(startOfDay)),
                where('date', '<=', Timestamp.fromDate(endOfDay))
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionLog));
        } catch (error) {
            console.error("Error getting session logs", error);
            return [];
        }
    }
};
