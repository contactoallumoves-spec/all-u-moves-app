import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, updateDoc, doc, limit } from 'firebase/firestore';
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
    },

    async getRecent(limitCount: number = 5) {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(limitCount));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Patient[];
        } catch (error) {
            console.error("Error getting recent patients: ", error);
            return [];
        }
    },

    async getCount() {
        try {
            // For small datasets, getting all docs is fine. For larger, use getCountFromServer (requires newer SDK)
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            return snapshot.size;
        } catch (error) {
            return 0;
        }
    },

    async update(id: string, data: Partial<Patient>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating patient: ", error);
            throw error;
        }
    }
};
