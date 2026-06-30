import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Kinesiologist } from '../types/clinical';

const COLLECTION_NAME = 'kinesiologists';

export const KineService = {
    async getProfile(id: string): Promise<Kinesiologist | null> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as Kinesiologist;
            }
            return null;
        } catch (error) {
            console.error("Error getting kine profile: ", error);
            return null;
        }
    },

    async createProfile(id: string, data: Omit<Kinesiologist, 'id' | 'createdAt'>): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await setDoc(docRef, {
                id,
                ...data,
                createdAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error creating kine profile: ", error);
            throw error;
        }
    },

    async getAllKines(): Promise<Kinesiologist[]> {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            const list: Kinesiologist[] = [];
            querySnapshot.forEach((doc) => {
                list.push(doc.data() as Kinesiologist);
            });
            return list;
        } catch (error) {
            console.error("Error getting all kines: ", error);
            return [];
        }
    },

    async approveKine(id: string, role: 'admin' | 'kine'): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                status: 'active',
                role: role
            });
        } catch (error) {
            console.error("Error approving kine: ", error);
            throw error;
        }
    },

    async rejectOrDeleteKine(id: string): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting kine: ", error);
            throw error;
        }
    }
};
