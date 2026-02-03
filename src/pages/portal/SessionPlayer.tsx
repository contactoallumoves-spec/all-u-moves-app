import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { Patient } from '../../types/patient';
import { Button } from '../../components/ui/Button';
// import { useSession } from '../../context/SessionContext'; // DISABLED FOR DEBUGGING

export default function SessionPlayer() {
    // 1. Basic Context
    const { patient } = useOutletContext<{ patient: Patient }>();
    const navigate = useNavigate();
    const { dateStr } = useParams<{ dateStr: string }>();

    // 2. DEBUG STATE
    const [debugStep, setDebugStep] = useState(0);

    useEffect(() => {
        setDebugStep(1);
    }, []);

    // 3. SAFE RENDER
    return (
        <div className="min-h-screen bg-white p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">SAFE MODE 2: HOOKS DISABLED</h1>
            <div className="space-y-4">
                <p><strong>Patient:</strong> {patient?.firstName} {patient?.lastName}</p>
                <p><strong>Date:</strong> {dateStr}</p>
                <p><strong>Debug Step:</strong> {debugStep}</p>

                <div className="p-4 bg-zinc-100 rounded border border-zinc-200">
                    <p className="text-sm text-zinc-500">
                        Si ves esta pantalla, el problema era uno de los "Hooks" (probablemente useSession o PlanService).
                        He desactivado todo para confirmar que el componente puede "montarse".
                    </p>
                </div>

                <Button onClick={() => navigate('../home')}>Volver</Button>
            </div>
        </div>
    );
}
