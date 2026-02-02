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
            // [FIX] Client-side sort to avoid "Missing Index" error
            const q = query(
                collection(db, COLLECTION_NAME),
                where('patientId', '==', patientId)
            );

            const snapshot = await getDocs(q);
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionLog));

            // Sort in memory (Newest first)
            return logs.sort((a, b) => {
                const dateA = (a.date as any)?.toDate ? (a.date as any).toDate() : new Date(a.date);
                const dateB = (b.date as any)?.toDate ? (b.date as any).toDate() : new Date(b.date);
                return dateB.getTime() - dateA.getTime();
            });
        } catch (error: any) {
            console.error("Error getting session logs", error);
            if (error?.message?.includes("index")) {
                alert("Error de Sistema: Falta un índice en la base de datos para ver el historial. Por favor avisa al administrador.");
            }
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

            // [FIX] Client-side filtering to avoid "Missing Index" error
            const q = query(
                collection(db, COLLECTION_NAME),
                where('patientId', '==', patientId)
            );

            const snapshot = await getDocs(q);
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionLog));

            return logs.filter(log => {
                const logDate = (log.date as any)?.toDate ? (log.date as any).toDate() : new Date(log.date);
                return logDate >= startOfDay && logDate <= endOfDay;
            });
        } catch (error) {
            console.error("Error getting session logs by date", error);
            return [];
        }
    },

    async getLastLog(patientId: string): Promise<SessionLog | null> {
        try {
            // [FIX] Client-side sort/limit
            const q = query(
                collection(db, COLLECTION_NAME),
                where('patientId', '==', patientId)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionLog));

            // Sort to find newest
            logs.sort((a, b) => {
                const dateA = (a.date as any)?.toDate ? (a.date as any).toDate() : new Date(a.date);
                const dateB = (b.date as any)?.toDate ? (b.date as any).toDate() : new Date(b.date);
                return dateB.getTime() - dateA.getTime();
            });

            return logs[0];
        } catch (error) {
            console.error("Error getting last session log", error);
            return null;
        }
    }
};
