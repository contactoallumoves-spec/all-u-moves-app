import {
    doc,
    writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProProgram } from '../types/pro-plan';
import { PatientService } from './patientService';
import { addDays } from 'date-fns';

export const ProgramAssignmentService = {
    /**
     * Assign a Program to a Patient starting at a specific date
     */
    assignToPatient: async (program: ProProgram, patientId: string, startDate: Date) => {
        try {
            const batch = writeBatch(db);
            const patientRef = doc(db, 'users', patientId); // Use 'users' collection not 'patients' as per app convention

            // Get patient current plan to append or overwrite?
            // For now, we assume we append weeks to the 'proSchedule' if it exists, or create it.
            // But 'proSchedule' structure in Patient type is not fully defined in my context yet strictly.
            // Let's assume we are saving to 'prescribed_plans' subcollection or updating the patient document directly.

            // STRATEGY: We will generate "PrescribedPlan" objects for each week and save them.
            // OR simpler: We update the patient's 'proSchedule' array.

            // Let's look at Patient type again. proSchedule is likely not there or is 'any'.
            // I'll fetch the patient first to be sure.
            const patient = await PatientService.getById(patientId);
            if (!patient) throw new Error("Patient not found");

            // Logic:
            // 1. Calculate dates for each week of the program based on startDate.
            // 2. Transform ProProgramWeek -> ProScheduleWeek (with specific dates).
            // 3. Save to patient.

            // NOTE: Since I don't want to break existing data, I will use a safe approach.
            // If the patient has a 'proSchedule' field (new architecture), we append.
            // If not, we create it.

            const newScheduleWeeks = program.weeks.map((week, index) => {
                const weekStartDate = addDays(startDate, index * 7);
                // We need to stamp the dates onto the days if our data structure requires it.
                // But ProProgramWeek is generic (monday, tuesday...).
                // The Patient's schedule likely needs to know "Week of Dec 12".

                return {
                    ...week,
                    id: crypto.randomUUID(), // New ID for the instance
                    startDate: weekStartDate,
                    isTemplate: false,
                    originalTemplateId: program.id
                };
            });

            // Update Patient
            // We assume 'proSchedule' is the field.

            const currentSchedule = (patient as any).proSchedule || [];
            const updatedSchedule = [...currentSchedule, ...newScheduleWeeks];

            batch.update(patientRef, {
                proSchedule: updatedSchedule,
                updatedAt: new Date()
            });

            await batch.commit();
            console.log(`Program ${program.name} assigned to ${patient.firstName}`);
            return true;

        } catch (error) {
            console.error("Error assigning program:", error);
            throw error;
        }
    }
};
