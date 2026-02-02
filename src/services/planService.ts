import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    Timestamp,
    addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase'; // Adjust path if needed
import { AnnualPlan, Macrocycle } from '../types/plan';
import { PrescribedPlan } from '../types/patient';

const COLLECTION_NAME = 'annualPlans';

export const PlanService = {

    // Create a new Annual Plan (e.g. for a new year/season)
    async create(patientId: string, name: string, startDate: Date): Promise<string> {
        const newPlan: Omit<AnnualPlan, 'id'> = {
            patientId,
            name,
            startDate: Timestamp.fromDate(startDate),
            macrocycles: [],
            weeks: {}, // Empty start
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            status: 'active'
        };

        // If there's another active plan, maybe archive it? For now just create.
        const docRef = await addDoc(collection(db, COLLECTION_NAME), newPlan);
        return docRef.id;
    },

    // Get the Active plan for a patient
    async getActivePlan(patientId: string): Promise<AnnualPlan | null> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('patientId', '==', patientId),
            where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        // Return the first active one
        const docData = snapshot.docs[0].data() as AnnualPlan;
        return { ...docData, id: snapshot.docs[0].id };
    },

    // Update specific week data within the plan
    async updateWeek(planId: string, weekNumber: number, weekData: PrescribedPlan): Promise<void> {
        const planRef = doc(db, COLLECTION_NAME, planId);

        // Update specific key in the map
        await updateDoc(planRef, {
            [`weeks.${weekNumber}`]: weekData,
            updatedAt: Timestamp.now()
        });
    },

    // Add a Macrocycle (Block)
    async addMacrocycle(planId: string, macrocycle: Macrocycle, currentMacros: Macrocycle[]): Promise<void> {
        const planRef = doc(db, COLLECTION_NAME, planId);
        const updatedMacros = [...currentMacros, macrocycle];

        await updateDoc(planRef, {
            macrocycles: updatedMacros,
            updatedAt: Timestamp.now()
        });
    }
};
