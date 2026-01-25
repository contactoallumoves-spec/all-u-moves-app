import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

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
    details?: any; // To store full form data
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
    },

    async getByPatientId(patientId: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("patientId", "==", patientId)
                // orderBy("date", "desc") // Commenting out to avoid index requirements for now
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate() // Convert Firestore Timestamp to Date
            })) as Evaluation[];
        } catch (error) {
            console.error("Error fetching evaluations: ", error);
            return [];
        }
    },

    async getThisMonthCount() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const q = query(
                collection(db, COLLECTION_NAME),
                where('date', '>=', Timestamp.fromDate(startOfMonth))
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error("Error getting eval count", error);
            return 0;
        }
    },

    async delete(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting evaluation: ", error);
            throw error;
        }
    }
};
