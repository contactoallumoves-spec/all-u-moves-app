import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
    Calendar, Plus, MessageSquare, Trash2,
    CheckCircle, Clock, XCircle, Link2, Link2Off, Loader2,
    List, LayoutGrid, ChevronLeft, ChevronRight
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
    place: 'local',
    notes: '',
    status: 'pendiente'
};

// --- Constantes para la grilla semanal ---
const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_HEIGHT = 64; // px por hora
const TOTAL_HOURS = HOUR_END - HOUR_START;

function getWeekDays(referenceDate: Date): Date[] {
    const d = new Date(referenceDate);
    const day = d.getDay(); // 0=Dom, 1=Lun...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    return Array.from({ length: 7 }, (_, i) => {
        const dd = new Date(d);
        dd.setDate(d.getDate() + i);
        return dd;
    });
}

function dateToStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function apptTop(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return ((h - HOUR_START) + m / 60) * HOUR_HEIGHT;
}

function apptHeight(durationMinutes: number): number {
    return Math.max((durationMinutes / 60) * HOUR_HEIGHT, 28);
}

function statusBgColor(status: Appointment['status']): string {
    switch (status) {
        case 'confirmado': return 'bg-green-100 border-green-400 text-green-900';
        case 'cancelado':  return 'bg-red-100 border-red-400 text-red-900';
        case 'completado': return 'bg-brand-100 border-brand-400 text-brand-900';
        default:           return 'bg-amber-50 border-amber-400 text-amber-900';
    }
}

// --- Componente grilla semanal ---
interface WeekGridProps {
    weekDays: Date[];
    appointments: Appointment[];
    onNewAppt: (date: string) => void;
    onDelete: (appt: Appointment) => void;
    onStatusChange: (id: string, status: Appointment['status']) => void;
}

function WeekGrid({ weekDays, appointments, onNewAppt, onDelete, onStatusChange }: WeekGridProps) {
    const [selected, setSelected] = useState<Appointment | null>(null);
    const todayStr = dateToStr(new Date());

    const apptsByDay = useMemo(() => {
        const map: Record<string, Appointment[]> = {};
        for (const a of appointments) {
            if (!map[a.date]) map[a.date] = [];
            map[a.date].push(a);
        }
        return map;
    }, [appointments]);

    const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i);
    const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden shadow-sm">
            {/* Cabecera días */}
            <div className="grid border-b border-brand-100" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
                <div className="border-r border-brand-50" />
                {weekDays.map(day => {
                    const str = dateToStr(day);
                    const isToday = str === todayStr;
                    return (
                        <div
                            key={str}
                            className={cn(
                                'py-3 text-center border-r border-brand-50 last:border-r-0 cursor-pointer hover:bg-brand-50 transition-colors',
                                isToday ? 'bg-brand-50' : ''
                            )}
                            onClick={() => onNewAppt(str)}
                            title={`Nuevo turno el ${str}`}
                        >
                            <div className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest">
                                {DAY_NAMES[day.getDay()]}
                            </div>
                            <div className={cn(
                                'text-lg font-bold mt-0.5',
                                isToday ? 'text-brand-700' : 'text-brand-900'
                            )}>
                                {isToday ? (
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white text-base">
                                        {day.getDate()}
                                    </span>
                                ) : day.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grilla de horas */}
            <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
                <div className="grid relative" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
                    {/* Columna de horas */}
                    <div className="relative">
                        {hours.map(h => (
                            <div
                                key={h}
                                className="border-b border-brand-50 text-right pr-2 text-[10px] text-brand-300 font-medium flex items-start justify-end pt-1"
                                style={{ height: HOUR_HEIGHT }}
                            >
                                {String(h).padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    {/* Columnas de días */}
                    {weekDays.map(day => {
                        const str = dateToStr(day);
                        const dayAppts = apptsByDay[str] || [];
                        const isToday = str === todayStr;

                        return (
                            <div
                                key={str}
                                className={cn(
                                    'relative border-r border-brand-50 last:border-r-0',
                                    isToday ? 'bg-brand-50/30' : ''
                                )}
                                style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
                            >
                                {/* Líneas de hora */}
                                {hours.map(h => (
                                    <div
                                        key={h}
                                        className="absolute w-full border-b border-brand-50"
                                        style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
                                    />
                                ))}

                                {/* Línea de mitad de hora */}
                                {hours.map(h => (
                                    <div
                                        key={`${h}-half`}
                                        className="absolute w-full border-b border-brand-50/50"
                                        style={{ top: (h - HOUR_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                                    />
                                ))}

                                {/* Turnos de la app */}
                                {dayAppts.map(appt => {
                                    const top = apptTop(appt.time);
                                    const height = apptHeight(appt.durationMinutes);
                                    const isOutOfRange = top < 0 || top > TOTAL_HOURS * HOUR_HEIGHT;
                                    if (isOutOfRange) return null;

                                    return (
                                        <div
                                            key={appt.id}
                                            className={cn(
                                                'absolute left-0.5 right-0.5 rounded-lg border-l-4 px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm',
                                                statusBgColor(appt.status)
                                            )}
                                            style={{ top, height: Math.max(height, 30), zIndex: 10 }}
                                            onClick={() => setSelected(selected?.id === appt.id ? null : appt)}
                                        >
                                            <p className="text-[11px] font-bold leading-tight truncate">{appt.time} {appt.patientName}</p>
                                            {height > 38 && (
                                                <p className="text-[10px] opacity-70 leading-tight truncate">{APPOINTMENT_TYPES[appt.type]}</p>
                                            )}
                                        </div>
                                    );
                                })}

                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Panel de detalle del turno seleccionado */}
            {selected && (
                <div className="border-t border-brand-100 p-4 bg-brand-50/50">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-brand-900 text-lg">{selected.patientName}</span>
                                <Badge className={cn('text-xs', STATUS_CONFIG[selected.status].color)}>
                                    {STATUS_CONFIG[selected.status].label}
                                </Badge>
                                {selected.place && (
                                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', selected.place === 'domicilio' ? 'bg-orange-100 text-orange-700' : 'bg-brand-100 text-brand-700')}>
                                        {selected.place === 'domicilio' ? '🏠 Domicilio' : '🏥 Local'}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-brand-500 mt-1">
                                {APPOINTMENT_TYPES[selected.type]} · {selected.time} hrs · {selected.durationMinutes} min
                            </p>
                            {selected.notes && <p className="text-sm text-brand-600 mt-1">{selected.notes}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                            {selected.status === 'pendiente' && (
                                <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                                    onClick={() => { onStatusChange(selected.id!, 'confirmado'); setSelected({ ...selected, status: 'confirmado' }); }}>
                                    <CheckCircle className="w-3 h-3 mr-1" /> Confirmar
                                </Button>
                            )}
                            {selected.patientPhone && (
                                <a href={calendarService.buildWhatsAppLink(selected, selected.patientPhone)} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 text-xs">
                                        <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
                                    </Button>
                                </a>
                            )}
                            <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 text-xs"
                                onClick={() => { onDelete(selected); setSelected(null); }}>
                                <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                            </Button>
                            <Button size="sm" variant="outline" className="text-brand-400 text-xs" onClick={() => setSelected(null)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Página principal ---
export default function AppointmentsPage() {
    const [searchParams] = useSearchParams();
    const prefilledPatientId = searchParams.get('patientId') || '';

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(!!prefilledPatientId);
    const [form, setForm] = useState({ ...EMPTY_FORM, patientId: prefilledPatientId });
    const [saving, setSaving] = useState(false);
    const [calendarConnected, setCalendarConnected] = useState(() => calendarService.isConnected());
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'week'>('week');
    const [weekRef, setWeekRef] = useState(new Date());

    const weekDays = useMemo(() => getWeekDays(weekRef), [weekRef]);

    const load = useCallback(async () => {
        setLoading(true);
        const [appts, pts] = await Promise.allSettled([
            AppointmentService.getUpcoming(),
            PatientService.getAll()
        ]);
        if (appts.status === 'fulfilled') setAppointments(appts.value);
        else console.warn('Error cargando turnos:', appts.reason);
        if (pts.status === 'fulfilled') setPatients(pts.value);
        else console.warn('Error cargando pacientes:', pts.reason);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const connectGoogleCalendar = async () => {
        if (!calendarService.isConfigured()) {
            setError('Google Calendar no está configurado aún. Agrega VITE_GOOGLE_CLIENT_ID en Vercel y recarga la app.');
            return;
        }
        setCalendarLoading(true);
        setError('');
        try {
            await calendarService.connect();
            setCalendarConnected(true);
            await syncStatusesToCalendar(appointments);
        } catch (e: any) {
            setError(`Error al conectar Google Calendar: ${e.message}`);
        } finally {
            setCalendarLoading(false);
        }
    };

    const openNewApptForDate = (date: string) => {
        setForm({ ...EMPTY_FORM, patientId: prefilledPatientId, date });
        setShowForm(true);
        setError('');
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
        if (calendarConnected) {
            const appt = appointments.find(a => a.id === id);
            if (appt?.googleCalendarEventId) {
                calendarService.updateEventStatus(appt.googleCalendarEventId, status, appt.patientName, appt.place).catch(console.warn);
            }
        }
    };

    const syncStatusesToCalendar = useCallback(async (appts: Appointment[]) => {
        const toSync = appts.filter(a => a.googleCalendarEventId && (a.status === 'confirmado' || a.status === 'cancelado' || a.status === 'completado'));
        for (const appt of toSync) {
            await calendarService.updateEventStatus(appt.googleCalendarEventId!, appt.status, appt.patientName, appt.place).catch(console.warn);
        }
    }, []);

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('es-CL', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const apptsByDay = appointments.reduce((acc: Record<string, Appointment[]>, a) => {
        if (!acc[a.date]) acc[a.date] = [];
        acc[a.date].push(a);
        return acc;
    }, {});

    const allDays = Object.keys(apptsByDay).sort();

    const weekLabel = (() => {
        const start = weekDays[0];
        const end = weekDays[6];
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        if (start.getMonth() === end.getMonth()) {
            return `${start.getDate()} – ${end.getDate()} de ${months[start.getMonth()]} ${start.getFullYear()}`;
        }
        return `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
    })();

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-900">Agenda / Turnos</h1>
                    <p className="text-brand-500 text-sm mt-1">Gestiona los turnos y sincroniza con Google Calendar</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {/* Toggle vista */}
                    <div className="flex border border-brand-200 rounded-xl overflow-hidden">
                        <button
                            className={cn('px-3 py-2 text-sm flex items-center gap-1.5 transition-colors', viewMode === 'week' ? 'bg-brand-600 text-white' : 'bg-white text-brand-600 hover:bg-brand-50')}
                            onClick={() => setViewMode('week')}
                        >
                            <LayoutGrid className="w-4 h-4" /> Semana
                        </button>
                        <button
                            className={cn('px-3 py-2 text-sm flex items-center gap-1.5 transition-colors border-l border-brand-200', viewMode === 'list' ? 'bg-brand-600 text-white' : 'bg-white text-brand-600 hover:bg-brand-50')}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4" /> Lista
                        </button>
                    </div>

                    {!calendarConnected && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={connectGoogleCalendar}
                            disabled={calendarLoading}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                            {calendarLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                            Conectar Google Calendar
                        </Button>
                    )}
                    <Button onClick={() => { openNewApptForDate(new Date().toISOString().split('T')[0]); }}>
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Turno
                    </Button>
                </div>
            </div>

            {/* Estado Google Calendar */}
            <div className={cn(
                'flex items-center gap-2 text-sm px-4 py-2 rounded-lg',
                calendarConnected ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
            )}>
                {calendarConnected ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
                {calendarConnected
                    ? 'Google Calendar conectado — los turnos que crees aquí se guardarán en tu calendario automáticamente.'
                    : 'Google Calendar no conectado. Conecta para que los turnos se guarden en tu calendario.'}
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

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Lugar de atención <span className="text-brand-300">(solo interno)</span></label>
                                <select
                                    className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.place}
                                    onChange={e => setForm({ ...form, place: e.target.value as Appointment['place'] })}
                                >
                                    <option value="local">🏥 En consulta / local</option>
                                    <option value="domicilio">🏠 A domicilio</option>
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

            {/* Vista semanal */}
            {viewMode === 'week' && !loading && (
                <div>
                    {/* Navegación semana */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-900 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                            onClick={() => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d); }}
                        >
                            <ChevronLeft className="w-4 h-4" /> Anterior
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-brand-700 capitalize">{weekLabel}</span>
                            <button
                                className="text-xs text-brand-400 hover:text-brand-700 underline"
                                onClick={() => setWeekRef(new Date())}
                            >
                                Hoy
                            </button>
                        </div>
                        <button
                            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-900 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                            onClick={() => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d); }}
                        >
                            Siguiente <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <WeekGrid
                        weekDays={weekDays}
                        appointments={appointments}
                        onNewAppt={openNewApptForDate}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                    />
                    <p className="text-xs text-brand-300 text-center mt-2">Hacé clic en un día para crear un turno · Hacé clic en un turno para ver opciones</p>
                </div>
            )}

            {/* Vista lista */}
            {viewMode === 'list' && (
                loading ? (
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
                                                                {appt.place && (
                                                                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', appt.place === 'domicilio' ? 'bg-orange-100 text-orange-700' : 'bg-brand-100 text-brand-700')}>
                                                                        {appt.place === 'domicilio' ? '🏠 Domicilio' : '🏥 Local'}
                                                                    </span>
                                                                )}
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
                                                            {appt.status === 'pendiente' && (
                                                                <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                                                                    onClick={() => handleStatusChange(appt.id!, 'confirmado')}>
                                                                    <CheckCircle className="w-3 h-3 mr-1" /> Confirmar
                                                                </Button>
                                                            )}
                                                            {waLink ? (
                                                                <a href={waLink} target="_blank" rel="noopener noreferrer">
                                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" title="Enviar recordatorio por WhatsApp">
                                                                        <MessageSquare className="w-4 h-4" />
                                                                    </Button>
                                                                </a>
                                                            ) : (
                                                                <Button size="sm" variant="outline" className="opacity-40 cursor-not-allowed" disabled>
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                            {!appt.googleCalendarEventId && (
                                                                <a href={gcLink} target="_blank" rel="noopener noreferrer">
                                                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50" title="Agregar a Google Calendar">
                                                                        <Calendar className="w-4 h-4" />
                                                                    </Button>
                                                                </a>
                                                            )}
                                                            <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50"
                                                                onClick={() => handleDelete(appt)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}

                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {viewMode === 'week' && loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
            )}
        </div>
    );
}
