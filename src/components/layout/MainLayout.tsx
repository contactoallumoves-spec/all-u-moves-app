import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex h-screen bg-[#FDFCFB] overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto relative w-full">
                <header className="md:hidden h-16 bg-white border-b border-brand-100 flex items-center px-4">
                    {/* Mobile Header placeholder */}
                    <img src="/allumoves-logo.png" alt="All U Moves" className="h-8 w-auto" />
                </header>
                <div className="p-4 md:p-8 lg:p-10 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
