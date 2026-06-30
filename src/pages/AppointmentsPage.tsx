import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
    Calendar, Plus, MessageSquare, Trash2,
    CheckCircle, Clock, XCircle, Link2, Loader2,
    List, LayoutGrid, ChevronLeft, ChevronRight, X, Search, Send
} from 'lucide-react';
import { AppointmentService } from '../services/appointmentService';
import { calendarService } from '../services/calendarService';
import { PatientService } from '../services/patientService';
import { Appointment, APPOINTMENT_TYPES } from '../types/appointment';
import { Patient } from '../types/patient';
import { cn } from '../lib/utils';

const GCAL_DISMISS_KEY = 'gcal_banner_dismissed_until';

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

// ── Colores por tipo y lugar ──────────────────────────────────────────────────
function apptTypeBg(type: Appointment['type']): string {
    switch (type) {
        case 'evaluacion':   return 'bg-purple-100 text-purple-900';
        case 'sesion':       return 'bg-emerald-50 text-emerald-900';
        case 'reevaluacion': return 'bg-sky-100 text-sky-900';
        default:             return 'bg-gray-100 text-gray-800';
    }
}

function apptBorderColor(appt: Appointment): string {
    if (appt.place === 'domicilio') return 'border-orange-400';
    switch (appt.type) {
        case 'evaluacion':   return 'border-purple-500';
        case 'sesion':       return 'border-emerald-500';
        case 'reevaluacion': return 'border-sky-500';
        default:             return 'border-gray-400';
    }
}

function statusIcon(status: Appointment['status']): string {
    switch (status) {
        case 'confirmado': return '✅';
        case 'cancelado':  return '❌';
        case 'completado': return '✓';
        default:           return '';
    }
}

// ── Constantes grilla semanal ─────────────────────────────────────────────────
const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_HEIGHT = 64;
const TOTAL_HOURS = HOUR_END - HOUR_START;

function getWeekDays(ref: Date): Date[] {
    const d = new Date(ref);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
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

// ── Componente grilla semanal ─────────────────────────────────────────────────
interface WeekGridProps {
    weekDays: Date[];
    appointments: Appointment[];
    onNewAppt: (date: string) => void;
    onDelete: (appt: Appointment) => void;
    onStatusChange: (id: string, status: Appointment['status']) => void;
}

function WeekGrid({ weekDays, appointments, onNewAppt, onDelete, onStatusChange }: WeekGridProps) {
    const [selected, setSelected] = useState<Appointment | null>(null);
    const [nowTime, setNowTime] = useState(new Date());
    const scrollRef = useRef<HTMLDivElement>(null);
    const todayStr = dateToStr(new Date());

    useEffect(() => {
        const id = setInterval(() => setNowTime(new Date()), 60000);
        return () => clearInterval(id);
    }, []);

    // Auto-scroll to current time on mount
    useEffect(() => {
        if (scrollRef.current) {
            const now = new Date();
            const top = apptTop(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
            scrollRef.current.scrollTop = Math.max(0, top - 80);
        }
    }, []);

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

    const nowTop = (() => {
        const h = nowTime.getHours();
        const m = nowTime.getMinutes();
        if (h < HOUR_START || h >= HOUR_END) return null;
        return apptTop(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    })();

    return (
        <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden shadow-sm">
            {/* Cabecera días */}
            <div className="grid border-b border-brand-100" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
                <div className="border-r border-brand-50 bg-white" />
                {weekDays.map(day => {
                    const str = dateToStr(day);
                    const isToday = str === todayStr;
                    const dayCount = (apptsByDay[str] || []).length;
                    return (
                        <div
                            key={str}
                            className={cn(
                                'py-2.5 text-center border-r border-brand-50 last:border-r-0 cursor-pointer hover:bg-brand-50 transition-colors',
                                isToday ? 'bg-brand-50' : ''
                            )}
                            onClick={() => onNewAppt(str)}
                            title="Nuevo turno en este día"
                        >
                            <div className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest">
                                {DAY_NAMES[day.getDay()]}
                            </div>
                            <div className="text-lg font-bold mt-0.5">
                                {isToday ? (
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white text-base">
                                        {day.getDate()}
                                    </span>
                                ) : (
                                    <span className="text-brand-900">{day.getDate()}</span>
                                )}
                            </div>
                            {dayCount > 0 && (
                                <div className="flex justify-center gap-0.5 mt-1">
                                    {Array.from({ length: Math.min(dayCount, 4) }).map((_, i) => (
                                        <div key={i} className="w-1 h-1 rounded-full bg-brand-400" />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Grilla de horas */}
            <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '68vh' }}>
                <div className="grid" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
                    {/* Columna de horas */}
                    <div>
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
                                    isToday ? 'bg-amber-50/20' : ''
                                )}
                                style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
                            >
                                {hours.map(h => (
                                    <div key={h} className="absolute w-full border-b border-brand-50"
                                        style={{ top: (h - HOUR_START) * HOUR_HEIGHT }} />
                                ))}
                                {hours.map(h => (
                                    <div key={`${h}-h`} className="absolute w-full border-b border-brand-50/40"
                                        style={{ top: (h - HOUR_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }} />
                                ))}

                                {/* Línea de hora actual */}
                                {isToday && nowTop !== null && (
                                    <div className="absolute w-full flex items-center z-20 pointer-events-none" style={{ top: nowTop }}>
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shrink-0" />
                                        <div className="flex-1 h-0.5 bg-red-400 opacity-80" />
                                    </div>
                                )}

                                {/* Turnos */}
                                {dayAppts.map(appt => {
                                    const top = apptTop(appt.time);
                                    const height = apptHeight(appt.durationMinutes);
                                    if (top < 0 || top > TOTAL_HOURS * HOUR_HEIGHT) return null;
                                    const icon = statusIcon(appt.status);

                                    return (
                                        <div
                                            key={appt.id}
                                            className={cn(
                                                'absolute left-0.5 right-0.5 rounded-lg border-l-4 px-1.5 py-1 overflow-hidden cursor-pointer hover:brightness-95 transition-all shadow-sm',
                                                apptTypeBg(appt.type),
                                                apptBorderColor(appt),
                                                appt.status === 'cancelado' ? 'opacity-50' : '',
                                                selected?.id === appt.id ? 'ring-2 ring-brand-400' : ''
                                            )}
                                            style={{ top, height: Math.max(height, 30), zIndex: 10 }}
                                            onClick={() => setSelected(selected?.id === appt.id ? null : appt)}
                                        >
                                            <p className="text-[11px] font-bold leading-tight truncate">
                                                {icon && <span className="mr-0.5">{icon}</span>}
                                                {appt.place === 'domicilio' && <span className="mr-0.5">🏠</span>}
                                                {appt.time} {appt.patientName}
                                            </p>
                                            {height > 38 && (
                                                <p className="text-[10px] opacity-60 leading-tight truncate">
                                                    {APPOINTMENT_TYPES[appt.type]}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Leyenda de colores */}
            <div className="border-t border-brand-50 px-4 py-2 flex items-center gap-4 flex-wrap bg-gray-50/50">
                {([
                    { type: 'evaluacion', label: 'Evaluación' },
                    { type: 'sesion', label: 'Sesión' },
                    { type: 'reevaluacion', label: 'Reevaluación' },
                ] as const).map(({ type, label }) => (
                    <div key={type} className="flex items-center gap-1.5">
                        <div className={cn('w-2.5 h-2.5 rounded-sm border-l-2', apptTypeBg(type), 'border-l-current')} />
                        <span className="text-[10px] text-brand-500">{label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-3 rounded-sm border-l-2 border-orange-400 bg-emerald-50" />
                    <span className="text-[10px] text-brand-500">🏠 Domicilio</span>
                </div>
            </div>

            {/* Panel de detalle del turno seleccionado */}
            {selected && (
                <div className="border-t border-brand-100 p-4 bg-brand-50/50">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-brand-900 text-lg">{selected.patientName}</span>
                                <Badge className={cn('text-xs', STATUS_CONFIG[selected.status].color)}>
                                    {STATUS_CONFIG[selected.status].label}
                                </Badge>
                                {selected.place && (
                                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                                        selected.place === 'domicilio' ? 'bg-orange-100 text-orange-700' : 'bg-brand-100 text-brand-700')}>
                                        {selected.place === 'domicilio' ? '🏠 Domicilio' : '🏥 Local'}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-brand-500 mt-1">
                                {APPOINTMENT_TYPES[selected.type]} · {selected.time} hrs · {selected.durationMinutes} min
                            </p>
                            {selected.notes && <p className="text-sm text-brand-600 mt-1 italic">{selected.notes}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                            {selected.status === 'pendiente' && (
                                <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                                    onClick={() => { onStatusChange(selected.id!, 'confirmado'); setSelected({ ...selected, status: 'confirmado' }); }}>
                                    <CheckCircle className="w-3 h-3 mr-1" /> Confirmar
                                </Button>
                            )}
                            {selected.status !== 'completado' && selected.status !== 'cancelado' && (
                                <Button size="sm" variant="outline" className="text-brand-700 border-brand-300 hover:bg-brand-50 text-xs"
                                    onClick={() => { onStatusChange(selected.id!, 'completado'); setSelected({ ...selected, status: 'completado' }); }}>
                                    ✓ Completar
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
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────
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
    const [search, setSearch] = useState('');
    const [showBulk, setShowBulk] = useState(false);
    const [showCalBanner, setShowCalBanner] = useState(() => {
        if (calendarService.isConnected()) return false;
        return Date.now() > Number(localStorage.getItem(GCAL_DISMISS_KEY) || 0);
    });

    const weekDays = useMemo(() => getWeekDays(weekRef), [weekRef]);

    const filteredAppointments = useMemo(() => {
        if (!search.trim()) return appointments;
        const q = search.toLowerCase();
        return appointments.filter(a => a.patientName.toLowerCase().includes(q));
    }, [appointments, search]);

    const weekStats = useMemo(() => {
        const weekStrs = new Set(weekDays.map(d => dateToStr(d)));
        const wa = appointments.filter(a => weekStrs.has(a.date));
        return {
            total: wa.length,
            confirmado: wa.filter(a => a.status === 'confirmado').length,
            pendiente: wa.filter(a => a.status === 'pendiente').length,
            cancelado: wa.filter(a => a.status === 'cancelado').length,
            completado: wa.filter(a => a.status === 'completado').length,
        };
    }, [appointments, weekDays]);

    const weekPending = useMemo(() => {
        const weekStrs = new Set(weekDays.map(d => dateToStr(d)));
        return appointments.filter(a => weekStrs.has(a.date) && a.status === 'pendiente' && a.patientPhone);
    }, [appointments, weekDays]);

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
            setShowCalBanner(false);
            await syncStatusesToCalendar(appointments);
        } catch (e: any) {
            setError(`Error al conectar Google Calendar: ${e.message}`);
        } finally {
            setCalendarLoading(false);
        }
    };

    const dismissCalBanner = () => {
        localStorage.setItem(GCAL_DISMISS_KEY, String(Date.now() + 3 * 86400000));
        setShowCalBanner(false);
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
                calendarService.createEvent({ ...appt, id: newId })
                    .then(eventId => AppointmentService.update(newId, { googleCalendarEventId: eventId }))
                    .catch(console.warn);
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
            calendarService.deleteEvent(appt.googleCalendarEventId).catch(console.warn);
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
        const toSync = appts.filter(a => a.googleCalendarEventId &&
            (a.status === 'confirmado' || a.status === 'cancelado' || a.status === 'completado'));
        for (const appt of toSync) {
            await calendarService.updateEventStatus(appt.googleCalendarEventId!, appt.status, appt.patientName, appt.place).catch(console.warn);
        }
    }, []);

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('es-CL', {
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
        const s = weekDays[0], e = weekDays[6];
        const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
        if (s.getMonth() === e.getMonth())
            return `${s.getDate()} – ${e.getDate()} de ${months[s.getMonth()]} ${s.getFullYear()}`;
        return `${s.getDate()} ${months[s.getMonth()]} – ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
    })();

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-900">Agenda / Turnos</h1>
                    <p className="text-brand-500 text-sm mt-1">Gestiona los turnos y sincroniza con Google Calendar</p>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    {/* Buscador */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400" />
                        <input
                            type="text"
                            placeholder="Buscar paciente..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-2 text-sm border border-brand-200 rounded-xl w-44 focus:outline-none focus:ring-2 focus:ring-brand-300"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

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

                    {/* Envío masivo */}
                    {weekPending.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setShowBulk(true)}
                            className="border-green-300 text-green-700 hover:bg-green-50">
                            <Send className="w-4 h-4 mr-1.5" />
                            Recordatorios ({weekPending.length})
                        </Button>
                    )}

                    {!calendarConnected && (
                        <Button variant="outline" size="sm" onClick={connectGoogleCalendar} disabled={calendarLoading}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50">
                            {calendarLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                            Conectar Calendar
                        </Button>
                    )}
                    <Button onClick={() => openNewApptForDate(new Date().toISOString().split('T')[0])}>
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Turno
                    </Button>
                </div>
            </div>

            {/* Banner conectar Google Calendar */}
            {showCalBanner && !calendarConnected && (
                <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
                    <div className="text-2xl">📅</div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-blue-900 text-sm">Conecta tu Google Calendar</p>
                        <p className="text-blue-600 text-xs mt-0.5">Los turnos que crees aquí se guardarán automáticamente. Solo necesitás configurarlo una vez.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" onClick={connectGoogleCalendar} disabled={calendarLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs">
                            {calendarLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                            Conectar ahora
                        </Button>
                        <button onClick={dismissCalBanner} className="text-blue-400 hover:text-blue-700 p-1 rounded-lg hover:bg-blue-100 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Estado Google Calendar */}
            {calendarConnected && (
                <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-green-50 text-green-700">
                    <Link2 className="w-4 h-4" />
                    Google Calendar conectado — los turnos nuevos se guardan en tu calendario automáticamente.
                    <button onClick={() => { calendarService.disconnect(); setCalendarConnected(false); setShowCalBanner(true); }}
                        className="ml-auto text-green-500 hover:text-green-800 text-xs underline">
                        Desconectar
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>
            )}

            {/* Modal envío masivo de recordatorios */}
            {showBulk && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-100">
                            <div>
                                <h2 className="font-bold text-brand-900 text-lg">Recordatorios esta semana</h2>
                                <p className="text-brand-500 text-xs mt-0.5">{weekPending.length} turnos pendientes con teléfono registrado</p>
                            </div>
                            <button onClick={() => setShowBulk(false)} className="text-brand-400 hover:text-brand-700 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="divide-y divide-brand-50 max-h-96 overflow-y-auto">
                            {weekPending.map(appt => (
                                <div key={appt.id} className="flex items-center justify-between px-6 py-3 gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-brand-900 text-sm truncate">{appt.patientName}</p>
                                        <p className="text-brand-400 text-xs">{formatDate(appt.date)} · {appt.time} hrs</p>
                                    </div>
                                    <a href={calendarService.buildWhatsAppLink(appt, appt.patientPhone)} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white border-0 text-xs shrink-0">
                                            <MessageSquare className="w-3 h-3 mr-1" /> Enviar
                                        </Button>
                                    </a>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-3 bg-brand-50/50 border-t border-brand-100">
                            <p className="text-[11px] text-brand-400">Cada botón abre WhatsApp con el mensaje de recordatorio listo para enviar.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulario nuevo turno */}
            {showForm && (
                <Card className="border-brand-200 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="font-bold text-brand-900 text-lg">Nuevo Turno</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Paciente</label>
                                <select className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
                                    <option value="">Seleccionar paciente...</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Tipo</label>
                                <select className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Appointment['type'] })}>
                                    {Object.entries(APPOINTMENT_TYPES).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Fecha</label>
                                <input type="date" className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Hora</label>
                                <input type="time" className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Duración</label>
                                <select className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })}>
                                    {[30, 45, 60, 75, 90, 120].map(m => (
                                        <option key={m} value={m}>{m} min</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-brand-600">Lugar <span className="text-brand-300">(solo interno)</span></label>
                                <select className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm"
                                    value={form.place} onChange={e => setForm({ ...form, place: e.target.value as Appointment['place'] })}>
                                    <option value="local">🏥 En consulta / local</option>
                                    <option value="domicilio">🏠 A domicilio</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-brand-600">Notas</label>
                            <textarea className="w-full px-3 py-2 border border-brand-200 rounded-xl text-sm min-h-[60px]"
                                placeholder="Observaciones para este turno..."
                                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
                            <Button variant="outline" onClick={() => { setShowForm(false); setError(''); }}>Cancelar</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Vista semanal */}
            {viewMode === 'week' && (
                loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
                ) : (
                    <div>
                        {/* Navegación + resumen */}
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <button className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-900 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                                onClick={() => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d); }}>
                                <ChevronLeft className="w-4 h-4" /> Anterior
                            </button>

                            <div className="flex items-center gap-3 flex-wrap justify-center">
                                <span className="text-sm font-semibold text-brand-700 capitalize">{weekLabel}</span>
                                <button className="text-xs text-brand-400 hover:text-brand-700 underline" onClick={() => setWeekRef(new Date())}>
                                    Hoy
                                </button>
                                {weekStats.total > 0 && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">{weekStats.total} turnos</span>
                                        {weekStats.confirmado > 0 && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ {weekStats.confirmado}</span>}
                                        {weekStats.pendiente > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⏳ {weekStats.pendiente}</span>}
                                        {weekStats.cancelado > 0 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">❌ {weekStats.cancelado}</span>}
                                        {weekStats.completado > 0 && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">✓ {weekStats.completado}</span>}
                                    </div>
                                )}
                            </div>

                            <button className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-900 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                                onClick={() => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d); }}>
                                Siguiente <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {search && filteredAppointments.length !== appointments.length && (
                            <p className="text-xs text-brand-500 mb-2">
                                Mostrando {filteredAppointments.length} resultado{filteredAppointments.length !== 1 ? 's' : ''} para "{search}"
                            </p>
                        )}

                        <WeekGrid
                            weekDays={weekDays}
                            appointments={filteredAppointments}
                            onNewAppt={openNewApptForDate}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                        />
                        <p className="text-xs text-brand-300 text-center mt-2">
                            Clic en el encabezado de un día para crear turno · Clic en un turno para ver opciones
                        </p>
                    </div>
                )
            )}

            {/* Vista lista */}
            {viewMode === 'list' && (
                loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
                ) : allDays.length === 0 ? (
                    <div className="text-center py-16 text-brand-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No hay turnos próximos</p>
                        <p className="text-sm mt-1">Crea el primero con el botón "Nuevo Turno"</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {allDays.map(day => {
                            const dayAppts = (apptsByDay[day] || []).filter(a =>
                                !search.trim() || a.patientName.toLowerCase().includes(search.toLowerCase())
                            );
                            if (dayAppts.length === 0) return null;
                            return (
                                <div key={day}>
                                    <h3 className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> {formatDate(day)}
                                    </h3>
                                    <div className="space-y-3">
                                        {dayAppts.map(appt => {
                                            const statusCfg = STATUS_CONFIG[appt.status];
                                            const StatusIcon = statusCfg.icon;
                                            const waLink = calendarService.buildWhatsAppLink(appt, appt.patientPhone);

                                            return (
                                                <Card key={appt.id} className={cn('border-l-4', apptBorderColor(appt), 'border-brand-100')}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-bold text-brand-900">{appt.time}</span>
                                                                    <span className="text-brand-700 font-medium">{appt.patientName}</span>
                                                                    <Badge className={cn('text-xs', statusCfg.color)}>
                                                                        <StatusIcon className="w-3 h-3 mr-1" />{statusCfg.label}
                                                                    </Badge>
                                                                    <span className="text-xs text-brand-400">{APPOINTMENT_TYPES[appt.type]} · {appt.durationMinutes}min</span>
                                                                    {appt.place && (
                                                                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                                                                            appt.place === 'domicilio' ? 'bg-orange-100 text-orange-700' : 'bg-brand-100 text-brand-700')}>
                                                                            {appt.place === 'domicilio' ? '🏠 Domicilio' : '🏥 Local'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {appt.notes && <p className="text-sm text-brand-500 mt-1 truncate">{appt.notes}</p>}
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                                                {appt.status === 'pendiente' && (
                                                                    <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                                                                        onClick={() => handleStatusChange(appt.id!, 'confirmado')}>
                                                                        <CheckCircle className="w-3 h-3 mr-1" /> Confirmar
                                                                    </Button>
                                                                )}
                                                                {appt.status !== 'completado' && appt.status !== 'cancelado' && (
                                                                    <Button size="sm" variant="outline" className="text-brand-700 border-brand-300 text-xs"
                                                                        onClick={() => handleStatusChange(appt.id!, 'completado')}>
                                                                        ✓ Completar
                                                                    </Button>
                                                                )}
                                                                {waLink ? (
                                                                    <a href={waLink} target="_blank" rel="noopener noreferrer">
                                                                        <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                                                                            <MessageSquare className="w-4 h-4" />
                                                                        </Button>
                                                                    </a>
                                                                ) : (
                                                                    <Button size="sm" variant="outline" className="opacity-40 cursor-not-allowed" disabled>
                                                                        <MessageSquare className="w-4 h-4" />
                                                                    </Button>
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
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
}
