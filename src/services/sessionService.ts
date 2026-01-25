import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, deleteDoc, doc, updateDoc, getDoc, orderBy, limit } from 'firebase/firestore';

export interface Session {
    id?: string;
    patientId: string;
    date: any; // Firestore Timestamp
    notes: string;
    interventions: string[]; // IDs of interventions
    interventionDetails?: Record<string, string>; // [NEW] Parameters details
    symptomsScore: number; // 0-10
    adherence: string; // low/medium/high
    tasks: { id: string; label: string; active: boolean }[];
    reassessment?: {
        oxford?: number;
        pain?: number;
        breating?: string;
        tonicity?: string;
    };
    status: 'completed';
}

const COLLECTION_NAME = 'sessions';

export const SessionService = {
    // [NEW] Get recent sessions for dashboard
    async getRecent(limitCount: number) {
        try {
            // In a real app we would check active=true or similar
            // For now just fetching all sorted by date desc
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy("date", "desc"),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate()
            })) as Session[];
        } catch (error) {
            console.error("Error getting recent sessions", error);
            return [];
        }
    },

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
            console.error("Error getting session count", error);
            return 0;
        }
    },

    async delete(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting session: ", error);
            throw error;
        }
    },

    async update(id: string, data: Partial<Session>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating session: ", error);
            throw error;
        }
    },

    async getById(id: string) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    date: data.date?.toDate()
                } as Session;
            }
            return null;
        } catch (error) {
            console.error("Error getting session:", error);
            throw error;
        }
    }
};
