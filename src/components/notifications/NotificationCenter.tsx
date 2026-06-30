import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Clock, Check, CheckCircle2, XCircle } from 'lucide-react';
import { AppointmentService } from '../../services/appointmentService';
import { calendarService } from '../../services/calendarService';
import { Appointment } from '../../types/appointment';

const WINDOW_OPTIONS = [12, 24, 48];
const STORAGE_KEY = 'reminderWindowHours';
const ACK_KEY = 'ackedConfirmations';
const CONFIRMATION_FRESH_DAYS = 3;

function getWindowHours(): number {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return WINDOW_OPTIONS.includes(stored) ? stored : 24;
}

function getAcked(): Record<string, number> {
    try { return JSON.parse(localStorage.getItem(ACK_KEY) || '{}'); } catch { return {}; }
}

function apptDate(a: Appointment): Date {
    const ts = (a as any).dateTimestamp?.toDate?.();
    if (ts) return ts;
    return new Date(`${a.date}T${a.time}`);
}

function hoursUntil(a: Appointment): number {
    return (apptDate(a).getTime() - Date.now()) / 3600000;
}

function confirmedAtMillis(a: Appointment): number {
    const c = (a as any).confirmedAt;
    if (!c) return 0;
    if (c.toDate) return c.toDate().getTime();
    if (c.seconds) return c.seconds * 1000;
    const t = new Date(c).getTime();
    return isNaN(t) ? 0 : t;
}

function formatWhen(a: Appointment): string {
    const h = hoursUntil(a);
    if (h < 1 && h > 0) return `en ${Math.max(1, Math.round(h * 60))} min`;
    if (h < 24 && h > 0) return `en ${Math.round(h)} h`;
    const d = apptDate(a);
    return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }) + ` ${a.time}`;
}

export function NotificationCenter() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [windowHours, setWindowHours] = useState<number>(getWindowHours());
    const [acked, setAcked] = useState<Record<string, number>>(getAcked);
    const [open, setOpen] = useState(false);
    const [toastDismissedSig, setToastDismissedSig] = useState('');
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'denied'
    );
    const panelRef = useRef<HTMLDivElement>(null);
    const notifiedRespRef = useRef<Set<string>>(new Set());
    const notifiedRemRef = useRef<Set<string>>(new Set());

    const requestBrowserNotifications = async () => {
        if (typeof Notification === 'undefined') return;
        const p = await Notification.requestPermission();
        setNotifPermission(p);
    };

    const load = useCallback(async () => {
        try {
            const appts = await AppointmentService.getUpcoming();
            setAppointments(appts);
        } catch (e) {
            console.warn('NotificationCenter: no se pudieron cargar turnos', e);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 5 * 60 * 1000);
        const onFocus = () => load();
        window.addEventListener('focus', onFocus);
        return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
    }, [load]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Recordatorios por enviar: pendientes, sin recordatorio, dentro de la ventana
    const pending = appointments.filter(a => {
        const h = hoursUntil(a);
        return a.status === 'pendiente' && !a.reminderSent && h > 0 && h <= windowHours;
    }).sort((a, b) => hoursUntil(a) - hoursUntil(b));

    // Respuestas recibidas recientes (confirmó o canceló)
    const recentResponses = appointments.filter(a => {
        const m = confirmedAtMillis(a);
        return (a.status === 'confirmado' || a.status === 'cancelado') && m > 0 &&
            (Date.now() - m) < CONFIRMATION_FRESH_DAYS * 86400000;
    }).sort((a, b) => confirmedAtMillis(b) - confirmedAtMillis(a));

    // Respuestas NUEVAS (aún no vistas por la kine)
    const newResponses = recentResponses.filter(a => acked[a.id!] !== confirmedAtMillis(a));

    const badgeCount = pending.length + newResponses.length;

    // Avisos del navegador (sistema operativo) — funciona con la app/pestaña abierta
    useEffect(() => {
        if (notifPermission !== 'granted' || typeof Notification === 'undefined') return;
        newResponses.forEach(a => {
            const key = `${a.id}:${confirmedAtMillis(a)}`;
            if (!notifiedRespRef.current.has(key)) {
                notifiedRespRef.current.add(key);
                new Notification('All U Moves', {
                    body: `${a.patientName} ${a.status === 'confirmado' ? 'confirmó' : 'canceló'} su sesión`,
                    icon: '/allumoves-logo.png',
                });
            }
        });
        pending.forEach(a => {
            if (a.id && !notifiedRemRef.current.has(a.id)) {
                notifiedRemRef.current.add(a.id);
                new Notification('Recordatorio por enviar', {
                    body: `${a.patientName} · sesión ${formatWhen(a)}`,
                    icon: '/allumoves-logo.png',
                });
            }
        });
    }, [appointments, notifPermission, acked, windowHours]); // eslint-disable-line

    // Marcar respuestas como vistas al abrir el panel
    const ackResponses = useCallback(() => {
        if (newResponses.length === 0) return;
        const next = { ...getAcked() };
        recentResponses.forEach(a => { if (a.id) next[a.id] = confirmedAtMillis(a); });
        localStorage.setItem(ACK_KEY, JSON.stringify(next));
        setAcked(next);
    }, [newResponses.length]); // eslint-disable-line

    const openPanel = () => { setOpen(true); ackResponses(); };

    const changeWindow = (h: number) => {
        setWindowHours(h);
        localStorage.setItem(STORAGE_KEY, String(h));
    };

    const sendReminder = async (appt: Appointment) => {
        if (!appt.patientPhone) {
            alert(`${appt.patientName} no tiene teléfono registrado. Agrégalo en su ficha para enviar recordatorios.`);
            return;
        }
        const link = calendarService.buildWhatsAppLink(appt, appt.patientPhone);
        window.open(link, '_blank');
        if (appt.id) {
            try {
                await AppointmentService.update(appt.id, { reminderSent: true });
                setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, reminderSent: true } : a));
            } catch (e) {
                console.warn('No se pudo marcar recordatorio como enviado', e);
            }
        }
    };

    // Toast: prioriza respuestas nuevas; si no, recordatorios pendientes
    const toastSig = `r${newResponses.map(a => a.id).join(',')}|p${pending.map(a => a.id).join(',')}`;
    const showToast = !open && toastDismissedSig !== toastSig && (newResponses.length > 0 || pending.length > 0);
    const toastIsResponse = newResponses.length > 0;
    const dismissToast = () => setToastDismissedSig(toastSig);

    return (
        <>
            {/* Campana flotante */}
            <div className="fixed top-4 right-4 md:top-6 md:right-8 z-40" ref={panelRef}>
                <button
                    onClick={() => { if (open) setOpen(false); else openPanel(); }}
                    className="relative bg-white border border-brand-200 hover:border-brand-300 shadow-md hover:shadow-lg rounded-full p-2.5 transition-all"
                    title="Notificaciones"
                >
                    <Bell className="w-5 h-5 text-brand-600" />
                    {badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                            {badgeCount}
                        </span>
                    )}
                </button>

                {/* Panel desplegable */}
                {open && (
                    <div className="absolute right-0 mt-2 w-[88vw] max-w-sm bg-white rounded-2xl shadow-2xl border border-brand-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-4 py-3 bg-brand-50 border-b border-brand-100 flex justify-between items-center">
                            <h3 className="font-bold text-brand-800 text-sm flex items-center gap-2">
                                <Bell className="w-4 h-4 text-brand-500" /> Notificaciones
                            </h3>
                            <button onClick={() => setOpen(false)} className="text-brand-400 hover:text-brand-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Activar avisos del navegador */}
                        {notifPermission === 'default' && (
                            <button
                                onClick={requestBrowserNotifications}
                                className="w-full px-4 py-2.5 bg-brand-600/5 hover:bg-brand-600/10 border-b border-brand-100 text-left flex items-center gap-2 transition-colors"
                            >
                                <Bell className="w-4 h-4 text-brand-500 shrink-0" />
                                <span className="text-xs text-brand-700 font-medium">Activar avisos del navegador para que te avisen aunque estés en otra pestaña</span>
                            </button>
                        )}
                        {notifPermission === 'granted' && (
                            <div className="px-4 py-2 border-b border-brand-50 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-[11px] text-brand-400">Avisos del navegador activados</span>
                            </div>
                        )}

                        <div className="max-h-[65vh] overflow-y-auto">
                            {/* Respuestas recibidas */}
                            {recentResponses.length > 0 && (
                                <div>
                                    <p className="px-4 pt-3 pb-1 text-[10px] font-black text-brand-400 uppercase tracking-wider">Respuestas recibidas</p>
                                    {recentResponses.map(a => {
                                        const confirmado = a.status === 'confirmado';
                                        return (
                                            <div key={a.id} className="px-4 py-2.5 border-b border-brand-50 last:border-0 flex items-start gap-3">
                                                {confirmado
                                                    ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                    : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                                                <div className="flex-1">
                                                    <p className="text-sm text-brand-900">
                                                        <span className="font-bold">{a.patientName}</span>{' '}
                                                        {confirmado ? 'confirmó su sesión' : 'no podrá realizar su sesión'}
                                                    </p>
                                                    <p className="text-xs text-brand-400 mt-0.5">{formatWhen(a)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Recordatorios por enviar */}
                            <div>
                                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                                    <p className="text-[10px] font-black text-brand-400 uppercase tracking-wider">Recordatorios por enviar</p>
                                    <div className="flex gap-1">
                                        {WINDOW_OPTIONS.map(h => (
                                            <button
                                                key={h}
                                                onClick={() => changeWindow(h)}
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${windowHours === h ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-500 hover:bg-brand-100'}`}
                                            >
                                                {h}h
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {pending.length === 0 ? (
                                    <div className="px-4 py-6 text-center">
                                        <p className="text-sm text-brand-400">No hay recordatorios pendientes en las próximas {windowHours} horas.</p>
                                    </div>
                                ) : (
                                    pending.map(appt => (
                                        <div key={appt.id} className="px-4 py-3 border-b border-brand-50 last:border-0 hover:bg-brand-50/40 transition-colors">
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <div>
                                                    <p className="font-bold text-brand-900 text-sm">{appt.patientName}</p>
                                                    <p className="text-xs text-brand-400 flex items-center gap-1 mt-0.5">
                                                        <Clock className="w-3 h-3" /> Sesión {formatWhen(appt)}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">Sin confirmar</span>
                                            </div>
                                            <button
                                                onClick={() => sendReminder(appt)}
                                                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.934 1.395 5.61L0 24l6.545-1.366A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.368l-.36-.214-3.733.979.995-3.638-.235-.374A9.818 9.818 0 1112 21.818z"/></svg>
                                                Enviar recordatorio
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {recentResponses.length === 0 && pending.length === 0 && (
                                <div className="px-4 py-8 text-center">
                                    <div className="text-3xl mb-2">🔔</div>
                                    <p className="text-sm text-brand-400">Todo al día. No hay notificaciones nuevas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Toast emergente */}
            {showToast && (
                <div className="fixed bottom-5 right-5 z-50 w-[88vw] max-w-xs bg-white rounded-2xl shadow-2xl border border-brand-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex items-start gap-3 p-4">
                        <div className={`rounded-full p-2 shrink-0 ${toastIsResponse ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {toastIsResponse ? <CheckCircle2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                            {toastIsResponse ? (
                                <>
                                    <p className="font-bold text-brand-900 text-sm">
                                        {newResponses.length === 1 ? 'Una paciente respondió' : `${newResponses.length} pacientes respondieron`}
                                    </p>
                                    <p className="text-xs text-brand-400 mt-0.5">
                                        {newResponses.length === 1
                                            ? `${newResponses[0].patientName} ${newResponses[0].status === 'confirmado' ? 'confirmó' : 'canceló'} su sesión`
                                            : 'Mira el detalle en notificaciones'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="font-bold text-brand-900 text-sm">
                                        {pending.length === 1 ? 'Tienes 1 recordatorio por enviar' : `Tienes ${pending.length} recordatorios por enviar`}
                                    </p>
                                    <p className="text-xs text-brand-400 mt-0.5">
                                        {pending.length === 1
                                            ? `${pending[0].patientName} · sesión ${formatWhen(pending[0])}`
                                            : `Sesiones sin confirmar en las próximas ${windowHours} h`}
                                    </p>
                                </>
                            )}
                            <div className="flex gap-2 mt-2.5">
                                <button onClick={openPanel} className="text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Ver detalle
                                </button>
                                <button onClick={dismissToast} className="text-xs font-medium text-brand-400 hover:text-brand-600 px-2">
                                    Más tarde
                                </button>
                            </div>
                        </div>
                        <button onClick={dismissToast} className="text-brand-300 hover:text-brand-500 shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
