import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, updateDoc, deleteDoc, doc, limit } from 'firebase/firestore';
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
    },

    async findByRut(rut: string): Promise<Patient | null> {
        try {
            const q = query(collection(db, COLLECTION_NAME), where('rut', '==', rut));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return null;
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Patient;
        } catch (error) {
            console.error("Error finding patient by RUT: ", error);
            return null;
        }
    },

    async createProspective(data: any) {
        try {
            // Check if patient exists
            const rut = data.rut as string;
            if (!rut) throw new Error("RUT is required");

            const existing = await this.findByRut(rut);

            if (existing) {
                // If exists, perform a "smart update" or just log a new request
                // For now, let's update contact info if missing and add a label
                const updates: any = {};
                if (!existing.email) updates.email = data.email;
                if (!existing.phone) updates.phone = data.phone;

                // Add a "prospective_update" field or similar to notify admin
                updates.lastProspectiveUpdate = Timestamp.now();
                updates.prospectiveReason = data.reason; // Overwrite or append? Overwrite for now as "latest motive"

                if (existing.id) {
                    await this.update(existing.id, updates);
                    return { id: existing.id, status: 'updated' };
                } else {
                    console.error("Found patient without ID, cannot update");
                    throw new Error("Found patient without ID");
                }
            } else {
                // Create new
                // Map form data to Patient structure
                const newPatient = {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    rut: data.rut,
                    birthDate: data.birthDate, // Keep as string or convert if needed. The form sends string YYYY-MM-DD
                    phone: data.phone,
                    email: data.email,
                    occupation: data.occupation,
                    admissionDate: Timestamp.now(),
                    status: 'prospective', // New status

                    // Clinical snippet (Legacy + Premium)
                    prospectiveData: {
                        reason: data.reason,
                        story: data.story,
                        painLevel: data.painLevel,
                        expectations: data.expectations,
                        submittedAt: Timestamp.now()
                    },
                    // Populate main clinical data from form
                    insurance: data.insurance,
                    clinicalData: {
                        redFlags: data.redFlags || [],
                        gynObs: data.gynObs,
                        habits: data.habits,
                        bodyMap: data.bodyMap
                    }
                };

                const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                    ...newPatient,
                    createdAt: Timestamp.now()
                });
                return { id: docRef.id, status: 'created' };
            }
        } catch (error) {
            console.error("Error creating prospective patient: ", error);
            throw error;
        }
    },

    async deletePatient(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting patient: ", error);
            throw error;
        }
    }
};
