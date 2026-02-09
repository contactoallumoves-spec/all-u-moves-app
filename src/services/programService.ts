import {
    addDoc,
    updateDoc,
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProProgram } from '../types/pro-plan';

const COLLECTION = 'programs';

export const ProgramService = {
    /**
     * Create a new Program Template
     */
    create: async (program: Omit<ProProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION), {
                ...program,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating program template:", error);
            throw error;
        }
    },

    /**
     * Get all Program Templates (optionally filtered by author)
     */
    getAll: async (): Promise<ProProgram[]> => {
        try {
            // For now get all, later filter by author/org
            const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ProProgram));
        } catch (error) {
            console.error("Error fetching programs:", error);
            return [];
        }
    },

    /**
     * Get a specific Program by ID
     */
    getById: async (id: string): Promise<ProProgram | null> => {
        try {
            const docRef = doc(db, COLLECTION, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as ProProgram;
            }
            return null;
        } catch (error) {
            console.error("Error fetching program:", error);
            return null;
        }
    },

    /**
     * Update an existing Program
     */
    update: async (id: string, updates: Partial<ProProgram>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION, id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating program:", error);
            throw error;
        }
    }
};
