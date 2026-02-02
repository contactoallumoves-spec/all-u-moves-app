import { Outlet, useOutletContext } from 'react-router-dom';
import { SessionProvider } from '../../context/SessionContext';
import { Patient } from '../../types/patient';

export function PortalLayout() {
    const context = useOutletContext<{ patient: Patient }>();

    return (
        <SessionProvider>
            <div className="min-h-screen bg-brand-50/30">
                <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden relative">
                    <Outlet context={context} />
                </main>
            </div>
        </SessionProvider>
    );
}
