import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Patient } from '../types/patient';

const COLLECTION_NAME = 'patients';

export const PatientService = {
    async create(patient: Patient) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...patient,
                createdAt: Timestamp.now()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding patient: ", error);
            throw error;
        }
    },
    async getById(id: string): Promise<Patient | null> {
        try {
            const querySnapshot = await getDocs(query(collection(db, COLLECTION_NAME), where('__name__', '==', id)));
            if (querySnapshot.empty) return null;
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Patient;
        } catch (error) {
            console.error("Error getting patient by id: ", error);
            return null;
        }
    },

    async getAll() {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Patient[];
        } catch (error) {
            console.error("Error getting patients: ", error);
            return [];
        }
    }
};
