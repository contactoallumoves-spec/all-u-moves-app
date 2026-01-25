import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
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
