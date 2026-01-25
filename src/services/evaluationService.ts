import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface Evaluation {
    id?: string;
    patientId: string;
    type: 'fast' | 'complete';
    date: any; // Firestore Timestamp
    patientData: {
        stage: string;
        redFlags: string[];
    };
    clusters: {
        active: string[];
        scores?: Record<string, number>;
    };
    summary: string;
    plan: {
        education: string[];
        tasks: string[];
    };
    status: 'draft' | 'completed';
}

const COLLECTION_NAME = 'evaluations';

export const EvaluationService = {
    async create(evaluation: Omit<Evaluation, 'id'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...evaluation,
                date: Timestamp.now()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating evaluation: ", error);
            throw error;
        }
    }
};
