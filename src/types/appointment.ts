export interface Appointment {
    id?: string;
    patientId: string;
    patientName: string;
    patientPhone?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    durationMinutes: number;
    type: 'evaluacion' | 'sesion' | 'reevaluacion' | 'otro';
    notes?: string;
    status: 'pendiente' | 'confirmado' | 'cancelado' | 'completado';
    googleCalendarEventId?: string;
    reminderSent?: boolean;
    confirmedAt?: any;
    kineId?: string;
    createdAt?: any;
}

export const APPOINTMENT_TYPES: Record<Appointment['type'], string> = {
    evaluacion: 'Evaluación Inicial',
    sesion: 'Sesión de Tratamiento',
    reevaluacion: 'Reevaluación',
    otro: 'Otro'
};
