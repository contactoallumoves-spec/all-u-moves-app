import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Exercise } from '../types/exercise';

const COLLECTION_NAME = 'exercises';

export const ExerciseService = {
    getAll: async (): Promise<Exercise[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Exercise));
        } catch (error) {
            console.error('Error fetching exercises:', error);
            return [];
        }
    },

    getById: async (id: string): Promise<Exercise | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Exercise;
            }
            return null;
        } catch (error) {
            console.error('Error fetching exercise:', error);
            return null;
        }
    },

    create: async (exercise: Omit<Exercise, 'id'>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...exercise,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating exercise:', error);
            throw error;
        }
    },

    update: async (id: string, exercise: Partial<Exercise>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...exercise,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Error updating exercise:', error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error('Error deleting exercise:', error);
            throw error;
        }
    },

    getByCategory: async (category: string): Promise<Exercise[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('category', '==', category),
                orderBy('name', 'asc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Exercise));
        } catch (error) {
            console.error('Error fetching exercises by category:', error);
            return [];
        }
    }
};
