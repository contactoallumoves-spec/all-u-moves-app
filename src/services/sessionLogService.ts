import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy, deleteDoc, doc, limit } from 'firebase/firestore';

import { SessionLog } from '../types/patient';

const COLLECTION_NAME = 'sessionLogs';

export const SessionLogService = {
    async create(log: Omit<SessionLog, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...log,
                createdAt: Timestamp.now()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating session log", error);
            throw error;
        }
    },

    async getByPatientId(patientId: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('patientId', '==', patientId),
                orderBy('date', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionLog));
        } catch (error: any) {
            console.error("Error getting session logs", error);
            if (error?.message?.includes("index")) {
                alert("Error de Sistema: Falta un índice en la base de datos para ver el historial. Por favor avisa al administrador.");
            }
            // Fallback for missing index or other errors
            return [];
        }
    },

    async delete(id: string) {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    },

    async getByPatientAndDate(patientId: string, date: Date) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const q = query(
                collection(db, COLLECTION_NAME),
                where('patientId', '==', patientId),
                where('date', '>=', Timestamp.fromDate(startOfDay)),
                where('date', '<=', Timestamp.fromDate(endOfDay))
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionLog));
        } catch (error) {
            console.error("Error getting session logs by date", error);
            return [];
        }
    },

    async getLastLog(patientId: string): Promise<SessionLog | null> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('patientId', '==', patientId),
                orderBy('date', 'desc'),
                limit(1)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;
            return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SessionLog;
        } catch (error) {
            console.error("Error getting last session log", error);
            return null;
        }
    }
};
