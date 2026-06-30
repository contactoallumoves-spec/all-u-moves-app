import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Appointment } from '../../types/appointment';

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
    evaluacion: 'Evaluación Inicial',
    sesion: 'Sesión de Tratamiento',
    reevaluacion: 'Reevaluación',
    otro: 'Sesión',
};

export default function ConfirmAppointmentPage() {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const [appt, setAppt] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [result, setResult] = useState<'confirmado' | 'cancelado' | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!appointmentId) { setError('Link inválido.'); setLoading(false); return; }
        getDoc(doc(db, 'appointments', appointmentId))
            .then(snap => {
                if (!snap.exists()) { setError('No encontramos esta cita. Puede que haya sido eliminada.'); }
                else {
                    const data = { id: snap.id, ...snap.data() } as Appointment;
                    setAppt(data);
                    if (data.status === 'confirmado' || data.status === 'cancelado') setResult(data.status);
                }
                setLoading(false);
            })
            .catch(() => { setError('No pudimos cargar tu cita. Intenta nuevamente más tarde.'); setLoading(false); });
    }, [appointmentId]);

    const respond = async (status: 'confirmado' | 'cancelado') => {
        if (!appointmentId) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'appointments', appointmentId), { status, confirmedAt: Timestamp.now() });
            setResult(status);
        } catch (e) {
            setError('No se pudo guardar tu respuesta. Por favor avísale a tu kinesióloga directamente.');
        } finally {
            setSaving(false);
        }
    };

    const dateLabel = appt ? (() => {
        const [y, m, d] = appt.date.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    })() : '';

    return (
        <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-100 overflow-hidden">
                <div className="bg-brand-600 px-6 py-5 text-center">
                    <img src="/allumoves-logo.png" alt="All U Moves" className="h-9 w-auto mx-auto brightness-0 invert" />
                </div>

                <div className="p-7">
                    {loading && <p className="text-center text-brand-400 py-8">Cargando tu cita...</p>}

                    {error && !loading && (
                        <div className="text-center py-6">
                            <div className="text-4xl mb-3">😕</div>
                            <p className="text-brand-600 font-medium">{error}</p>
                        </div>
                    )}

                    {appt && !loading && !error && (
                        <>
                            <div className="text-center mb-6">
                                <p className="text-brand-400 text-sm font-medium uppercase tracking-wider mb-1">Tu cita de kinesiología</p>
                                <h1 className="text-2xl font-serif font-bold text-brand-900 capitalize">{dateLabel}</h1>
                                <p className="text-brand-600 text-lg font-bold mt-1">{appt.time} hrs</p>
                                <p className="text-brand-400 text-sm mt-2">{APPOINTMENT_TYPE_LABELS[appt.type] || 'Sesión'} · {appt.durationMinutes} min</p>
                            </div>

                            {!result ? (
                                <>
                                    <p className="text-center text-brand-700 font-medium mb-5">¿Podrás asistir a tu sesión?</p>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => respond('confirmado')}
                                            disabled={saving}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            ✅ Sí, confirmo mi asistencia
                                        </button>
                                        <button
                                            onClick={() => respond('cancelado')}
                                            disabled={saving}
                                            className="w-full bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 font-bold py-4 rounded-2xl text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            ❌ No podré asistir
                                        </button>
                                    </div>
                                </>
                            ) : result === 'confirmado' ? (
                                <div className="text-center py-6 animate-in fade-in zoom-in-95">
                                    <div className="text-5xl mb-4">🎉</div>
                                    <h2 className="text-xl font-bold text-green-600 mb-2">¡Asistencia confirmada!</h2>
                                    <p className="text-brand-500 text-sm">Te esperamos el <span className="capitalize font-medium">{dateLabel}</span> a las {appt.time} hrs. ¡Nos vemos pronto!</p>
                                </div>
                            ) : (
                                <div className="text-center py-6 animate-in fade-in zoom-in-95">
                                    <div className="text-5xl mb-4">📅</div>
                                    <h2 className="text-xl font-bold text-brand-700 mb-2">Registramos que no podrás asistir</h2>
                                    <p className="text-brand-500 text-sm">Gracias por avisarnos con tiempo. Tu kinesióloga te contactará para reagendar.</p>
                                </div>
                            )}

                            {result && (
                                <button
                                    onClick={() => setResult(null)}
                                    className="w-full mt-5 text-xs text-brand-400 hover:text-brand-600 font-medium"
                                >
                                    ¿Te equivocaste? Cambiar mi respuesta
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className="px-6 py-3 bg-brand-50/50 border-t border-brand-50 text-center">
                    <p className="text-[10px] text-brand-300">All U Moves · Kinesiología</p>
                </div>
            </div>
        </div>
    );
}
