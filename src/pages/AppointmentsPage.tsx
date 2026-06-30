import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
    Calendar, Plus, MessageSquare, RefreshCw, Trash2,
    CheckCircle, Clock, XCircle, Link2, Link2Off, Loader2
} from 'lucide-react';
import { AppointmentService } from '../services/appointmentService';
import { calendarService } from '../services/calendarService';
import { PatientService } from '../services/patientService';
import { Appointment, APPOINTMENT_TYPES } from '../types/appointment';
import { Patient } from '../types/patient';
import { cn } from '../lib/utils';

const STATUS_CONFIG = {
    pendiente:   { label: 'Pendiente',   color: 'bg-amber-100 text-amber-800',  icon: Clock },
    confirmado:  { label: 'Confirmado',  color: 'bg-green-100 text-green-800',  icon: CheckCircle },
    cancelado:   { label: 'Cancelado',   color: 'bg-red-100 text-red-800',      icon: XCircle },
    completado:  { label: 'Completado',  color: 'bg-brand-100 text-brand-800',  icon: CheckCircle }
};

const EMPTY_FORM: Omit<Appointment, 'id' | 'patientName' | 'patientPhone'> = {
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    durationMinutes: 60,
    type: 'sesion',
    notes: '',
    status: 'pendiente'
};

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [googleEvents, setGoogleEvents] = useState<any[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [calendarConnected, setCalendarConnected] = useState(false);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [syncingCalendar, setSyncingCalendar] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [appts, pts] = await Promise.all([
                AppointmentService.getUpcoming(),
                PatientService.getAll()
            ]);
            setAppointments(appts);
            setPatients(pts);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const connectGoogleCalendar = async () => {
        if (!calendarService.isConfigured()) {
            setError('Google Calendar no está configurado aún. Agrega VITE_GOOGLE_CLIENT_ID en .env.local y recarga la app.');
            return;
        }
        setCalendarLoading(true);
        setError('');
        try {
            await calendarService.connect();
            setCalendarConnected(true);
            await syncGoogleEvents();
        } catch (e: any) {
            setError(`Error al conectar Google Calendar: ${e.message}`);
        } finally {
            setCalendarLoading(false);
        }
    };

    const syncGoogleEvents = async () => {
        setSyncingCalendar(true);
        try {
            const events = await calendarService.fetchEvents(60);
            setGoogleEvents(events);
        } catch (e: any) {
            setError(`Error al leer Google Calendar: ${e.message}`);
        } finally {
            setSyncingCalendar(false);
        }
    };

    const handleSave = async () => {
        if (!form.patientId || !form.date || !form.time) {
            setError('Completa paciente, fecha y hora.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const patient = patients.find(p => p.id === form.patientId);
            const appt: Omit<Appointment, 'id'> = {
                ...form,
                patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
                patientPhone: patient?.phone || ''
            };

            const newId = await AppointmentService.create(appt);

            if (calendarConnected) {
                try {
                    const eventId = await calendarService.createEvent({ ...appt, id: newId });
                    await AppointmentService.update(newId, { googleCalendarEventId: eventId });
                } catch (calErr) {
                    console.warn('Turno creado, pero falló la sincronización con Google Calendar:', calErr);
                }
            }

            setShowForm(false);
            setForm(EMPTY_FORM);
            await load();
        } catch (e: any) {
            setError(e.message || 'Error al guardar el turno');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (appt: Appointment) => {
        if (!confirm(`¿Eliminar turno de ${appt.patientName}?`)) return;
        if (appt.googleCalendarEventId && calendarConnected) {
            await calendarService.deleteEvent(appt.googleCalendarEventId).catch(console.warn);
        }
        await AppointmentService.delete(appt.id!);
        await load();
    };

    const handleStatusChange = async (id: string, status: Appointment['status']) => {
        await AppointmentService.update(id, { status });
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('es-CL', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const googleEventsByDay = googleEvents.reduce((acc: Record<string, any[]>, ev) => {
        const day = (ev.start?.dateTime || ev.start?.date || '').split('T')[0];
        if (!acc[day]) acc[day] = [];
        acc[day].push(ev);
        return acc;
    }, {});

    const apptsByDay = appointments.reduce((acc: Record<string, Appointment[]>, a) => {
        if (!acc[a.date]) acc[a.date] = [];
        acc[a.date].push(a);
        return acc;
    }, {});

    const allDays = Array.from(new Set([...Object.keys(apptsByDay), ...Object.keys(googleEventsByDay)])).sort();

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-900">Agenda / Turnos</h1>
                    <p className="text-brand-500 text-sm mt-1">Gestiona los turnos y sincroniza con Google Calendar</p>
                </div>
                <div className="flex gap-3">
                    {calendarConnected ? (
                        <Button variant="outline" size="sm" onClick={syncGoogleEvents} disabled={syncingCalendar}>
                            {syncingCalendar ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            Sincronizar
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={connectGoogleCalendar}
                            disabled={calendarLoading}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                            {calendarLoading
                                ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                : <Link2 className="w-4 h-4 mr-2" />
                            }
                            Conectar Google Calendar
                        </Button>
                    )}
                    <Button onClick={() => { setShowForm(true); setError(''); }}>
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Turno
                    </Button>
                </div>
            </div>

            {/* Estado Google Calendar */}
            <div className={cn(
                "flex items-center gap-2 text-sm px-4 py-2 rounded-lg",
                calendarConnected ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
            )}>
                {calendarConnected ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
                {calendarConnected
                    ? `Google Calendar conectado — ${googleEvents.length} eventos importados`
                    : 'Google Calendar no conectado. Conecta para ver y sincronizar eventos bidireccional.'}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>
            )}

            {/* Formulario nuevo turno */}
            {showForm && (
                <Card className="border-brand-200 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="font-bold text-brand-900 text-lg">Nuevo Turno</h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Paciente</label>
                                <select
                                    className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.patientId}
                                    onChange={e => setForm({ ...form, patientId: e.target.value })}
                                >
                                    <option value="">Seleccionar paciente...</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.firstName} {p.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Tipo</label>
                                <select
                                    className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value as Appointment['type'] })}
                                >
                                    {Object.entries(APPOINTMENT_TYPES).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Fecha</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Hora</label>
                                <input
                                    type="time"
                                    className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.time}
                                    onChange={e => setForm({ ...form, time: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Duración (minutos)</label>
                                <select
                                    className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.durationMinutes}
                                    onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                                >
                                    {[30, 45, 60, 75, 90, 120].map(m => (
                                        <option key={m} value={m}>{m} min</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Estado</label>
                                <select
                                    className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.status}
                                    onChange={e => setForm({ ...form, status: e.target.value as Appointment['status'] })}
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="confirmado">Confirmado</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-brand-600">Notas</label>
                            <textarea
                                className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm min-h-[60px]"
                                placeholder="Observaciones para este turno..."
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                            />
                        </div>

                        {calendarConnected && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Este turno se agregará automáticamente a tu Google Calendar.
                            </p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Guardar Turno
                            </Button>
                            <Button variant="outline" onClick={() => { setShowForm(false); setError(''); }}>
                                Cancelar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lista de turnos */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
            ) : allDays.length === 0 ? (
                <div className="text-center py-16 text-brand-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No hay turnos próximos</p>
                    <p className="text-sm mt-1">Crea el primero con el botón "Nuevo Turno"</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {allDays.map(day => (
                        <div key={day}>
                            <h3 className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(day)}
                            </h3>

                            <div className="space-y-3">
                                {/* Turnos de la app */}
                                {(apptsByDay[day] || []).map(appt => {
                                    const statusCfg = STATUS_CONFIG[appt.status];
                                    const StatusIcon = statusCfg.icon;
                                    const waLink = calendarService.buildWhatsAppLink(appt, appt.patientPhone);
                                    const gcLink = calendarService.buildCalendarLink(appt);

                                    return (
                                        <Card key={appt.id} className="border-brand-100">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-brand-900">{appt.time}</span>
                                                            <span className="text-brand-700 font-medium">{appt.patientName}</span>
                                                            <Badge className={cn('text-xs', statusCfg.color)}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {statusCfg.label}
                                                            </Badge>
                                                            <span className="text-xs text-brand-400">
                                                                {APPOINTMENT_TYPES[appt.type]} · {appt.durationMinutes}min
                                                            </span>
                                                            {appt.googleCalendarEventId && (
                                                                <span className="text-xs text-green-600 flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" /> En Google Calendar
                                                                </span>
                                                            )}
                                                        </div>
                                                        {appt.notes && (
                                                            <p className="text-sm text-brand-500 mt-1 truncate">{appt.notes}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {/* Estado rápido */}
                                                        {appt.status === 'pendiente' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                                                                onClick={() => handleStatusChange(appt.id!, 'confirmado')}
                                                            >
                                                                <CheckCircle className="w-3 h-3 mr-1" /> Confirmar
                                                            </Button>
                                                        )}

                                                        {/* WhatsApp */}
                                                        {waLink ? (
                                                            <a href={waLink} target="_blank" rel="noopener noreferrer">
                                                                <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" title="Enviar recordatorio por WhatsApp">
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </Button>
                                                            </a>
                                                        ) : (
                                                            <Button size="sm" variant="outline" className="opacity-40 cursor-not-allowed" title="Sin teléfono registrado" disabled>
                                                                <MessageSquare className="w-4 h-4" />
                                                            </Button>
                                                        )}

                                                        {/* Google Calendar link (si no tiene evento ya) */}
                                                        {!appt.googleCalendarEventId && (
                                                            <a href={gcLink} target="_blank" rel="noopener noreferrer">
                                                                <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50" title="Agregar a Google Calendar">
                                                                    <Calendar className="w-4 h-4" />
                                                                </Button>
                                                            </a>
                                                        )}

                                                        {/* Eliminar */}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-500 border-red-200 hover:bg-red-50"
                                                            onClick={() => handleDelete(appt)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {/* Eventos importados de Google Calendar (que no son turnos de la app) */}
                                {(googleEventsByDay[day] || [])
                                    .filter(ev => !appointments.some(a => a.googleCalendarEventId === ev.id))
                                    .map(ev => (
                                        <Card key={ev.id} className="border-blue-100 bg-blue-50/30">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                                                    <span className="text-sm font-medium text-blue-800">
                                                        {ev.start?.dateTime
                                                            ? new Date(ev.start.dateTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                                                            : 'Todo el día'
                                                        }
                                                    </span>
                                                    <span className="text-sm text-blue-700">{ev.summary}</span>
                                                    <Badge className="text-xs bg-blue-100 text-blue-700">Google Calendar</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
