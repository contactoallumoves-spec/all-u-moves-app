import { Outlet } from 'react-router-dom';

export function PortalLayout() {
    return (
        <div className="min-h-screen bg-brand-50 font-sans text-brand-900">
            {/* Mobile Header */}
            <header className="bg-white border-b border-brand-100 p-4 sticky top-0 z-10 flex justify-center shadow-sm">
                <img src="/allumoves-logo.png" alt="All U Moves" className="h-8 w-auto" />
            </header>

            <main className="max-w-md mx-auto pb-20">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav (Optional, maybe for future) */}
            {/* <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-100 p-4 flex justify-around text-xs text-brand-400">
                <span>Inicio</span>
                <span>Progreso</span>
            </nav> */}
        </div>
    );
}
