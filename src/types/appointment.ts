export interface Appointment {
    id?: string;
    patientId: string;
    patientName: string;
    patientPhone?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    durationMinutes: number;
    type: 'evaluacion' | 'sesion' | 'reevaluacion' | 'otro';
    place?: 'local' | 'domicilio'; // Interno: NO se envía a la paciente
    notes?: string;
    status: 'pendiente' | 'confirmado' | 'cancelado' | 'completado';
    googleCalendarEventId?: string;
    reminderSent?: boolean;
    confirmedAt?: any;
    kineId?: string;
    createdAt?: any;
    recurrenceId?: string; // [NEW] Agrupa turnos creados como serie recurrente
}

export const APPOINTMENT_TYPES: Record<Appointment['type'], string> = {
    evaluacion: 'Evaluación Inicial',
    sesion: 'Sesión de Tratamiento',
    reevaluacion: 'Reevaluación',
    otro: 'Otro'
};
