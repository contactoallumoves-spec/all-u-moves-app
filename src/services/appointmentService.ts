import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, deleteDoc, doc, updateDoc, orderBy, getDoc } from 'firebase/firestore';
import { Appointment } from '../types/appointment';

const COLLECTION = 'appointments';

function toFirestore(appt: Omit<Appointment, 'id'>): any {
    const [year, month, day] = appt.date.split('-').map(Number);
    const [hours, minutes] = appt.time.split(':').map(Number);
    const dateObj = new Date(year, month - 1, day, hours, minutes);
    return { ...appt, createdAt: Timestamp.now(), dateTimestamp: Timestamp.fromDate(dateObj) };
}

export const AppointmentService = {
    async create(appt: Omit<Appointment, 'id'>): Promise<string> {
        const ref = await addDoc(collection(db, COLLECTION), toFirestore(appt));
        return ref.id;
    },

    async update(id: string, data: Partial<Appointment>): Promise<void> {
        await updateDoc(doc(db, COLLECTION, id), data);
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION, id));
    },

    async getById(id: string): Promise<Appointment | null> {
        const snap = await getDoc(doc(db, COLLECTION, id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as Appointment;
    },

    async getUpcoming(kineId?: string): Promise<Appointment[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const constraints: any[] = [
            where('dateTimestamp', '>=', Timestamp.fromDate(today)),
            orderBy('dateTimestamp', 'asc')
        ];
        if (kineId) constraints.unshift(where('kineId', '==', kineId));
        const q = query(collection(db, COLLECTION), ...constraints);
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
    },

    async getByPatient(patientId: string): Promise<Appointment[]> {
        const q = query(
            collection(db, COLLECTION),
            where('patientId', '==', patientId),
            orderBy('dateTimestamp', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
    }
};
