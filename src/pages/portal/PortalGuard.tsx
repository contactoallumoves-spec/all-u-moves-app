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
        if (!token) {
            setLoading(false);
            return;
        }

        // Use onSnapshot for real-time updates
        const q = query(collection(db, 'patients'), where('magicLinkToken', '==', token));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setPatient({ id: doc.id, ...doc.data() } as Patient);
            } else {
                setPatient(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error connecting to patient portal:", error);
            setLoading(false);
        });

        return () => unsubscribe();
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
