import { useEffect, useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { PatientService } from '../../services/patientService';
import { Patient } from '../../types/patient';
import { Loader2 } from 'lucide-react';

export function PortalGuard() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<Patient | null>(null);

    useEffect(() => {
        const validate = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            const p = await PatientService.validateMagicToken(token);
            if (p) {
                setPatient(p);
                // Store in local storage/context if needed, for now just pass via simple outlet context or re-fetch
                // Actually, for simplicity, we might just pass `patient` down via Outlet context
            }
            setLoading(false);
        };
        validate();
    }, [token]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-brand-50 space-y-4">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                <p className="text-brand-500 font-medium">Accediendo a tu espacio...</p>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-brand-50 p-6 text-center">
                <h2 className="text-xl font-bold text-brand-800 mb-2">Enlace Inválido</h2>
                <p className="text-brand-600">Este enlace ha expirado o no es correcto. Por favor solicita uno nuevo a tu kinesióloga.</p>
            </div>
        );
    }

    // Success: Render children (Dashboard etc)
    // We can use React Router Outlet context to pass patient data
    return <Outlet context={{ patient }} />;
}
