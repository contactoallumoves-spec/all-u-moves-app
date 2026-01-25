import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';

export interface Session {
    id?: string;
    patientId: string;
    date: any; // Firestore Timestamp
    notes: string;
    interventions: string[]; // IDs of interventions
    symptomsScore: number; // 0-10
    adherence: string; // low/medium/high
    tasks: { id: string; label: string; active: boolean }[];
    status: 'completed';
}

const COLLECTION_NAME = 'sessions';

export const SessionService = {
    async create(session: Omit<Session, 'id'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...session,
                date: Timestamp.now()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating session: ", error);
            throw error;
        }
    },

    async getByPatientId(patientId: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("patientId", "==", patientId)
                // orderBy("date", "desc") // Requires index
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate() // Convert Firestore Timestamp to Date
            })) as Session[];
        } catch (error) {
            console.error("Error fetching sessions: ", error);
            return [];
        }
    }
};
