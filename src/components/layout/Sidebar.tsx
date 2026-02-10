import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    PlusCircle,
    Dumbbell,
    Calendar, // [NEW]
    Library   // [NEW] Using Library icon for Programs
} from 'lucide-react';
import { Button } from '../ui/Button';

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false); // [NEW] Collapsible State

    const links = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/planner', label: 'Planificador', icon: Calendar },
        { href: '/programs', label: 'Biblioteca', icon: Library },
        { href: '/users', label: 'Usuarias', icon: Users },
        { href: '/exercises', label: 'Ejercicios', icon: Dumbbell },
        { href: '/reports', label: 'Reportes', icon: FileText },
        { href: '/settings', label: 'Configuración', icon: Settings },
    ];

    return (
        <aside className={cn(
            "bg-white border-r border-brand-100 hidden md:flex flex-col h-full shadow-[2px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 transition-all duration-300 ease-in-out relative",
            isCollapsed ? "w-20" : "w-72"
        )}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-9 bg-white border border-brand-100 rounded-full p-1 text-brand-400 hover:text-brand-600 shadow-sm z-50 hover:bg-brand-50 transition-colors"
                title={isCollapsed ? "Expandir menú" : "Contraer menú"}
            >
                {isCollapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                )}
            </button>

            <div className={cn("p-8 pb-4 transition-all duration-300", isCollapsed ? "px-4" : "px-8")}>
                <div className={cn("flex items-center transition-all duration-300", isCollapsed ? "justify-center" : "justify-start")}>
                    <img src="/allumoves-logo.png" alt="All U Moves" className={cn("transition-all duration-300", isCollapsed ? "h-6 w-auto" : "h-8 w-auto")} />
                </div>
                <p className={cn(
                    "text-xs text-brand-400 font-medium tracking-widest uppercase mt-1 whitespace-nowrap overflow-hidden transition-all duration-300",
                    isCollapsed ? "opacity-0 h-0" : "opacity-100 h-auto"
                )}>
                    Matriz Maestra
                </p>
            </div>

            <div className="px-4 mb-6">
                <Button
                    className={cn(
                        "w-full gap-2 shadow-brand-200/50 transition-all duration-300",
                        isCollapsed ? "justify-center px-0" : "justify-start"
                    )}
                    size="lg"
                    onClick={() => navigate('/users')}
                    title="Nueva Evaluación"
                >
                    <PlusCircle size={20} />
                    <span className={cn(
                        "whitespace-nowrap overflow-hidden transition-all duration-300",
                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}>
                        Nueva Evaluación
                    </span>
                </Button>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-brand-50 text-brand-900 shadow-sm"
                                    : "text-brand-500 hover:bg-brand-50/50 hover:text-brand-700",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? link.label : undefined}
                        >
                            <Icon size={18} className={cn(isActive ? "text-brand-600" : "text-brand-400")} />
                            <span className={cn(
                                "whitespace-nowrap overflow-hidden transition-all duration-300",
                                isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                            )}>
                                {link.label}
                            </span>

                            {/* Tooltip on hover when collapsed */}
                            {isCollapsed && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                    {link.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-brand-50">
                <button
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-500 hover:text-brand-700 w-full rounded-xl hover:bg-red-50/50 transition-colors",
                        isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? "Cerrar Sesión" : undefined}
                >
                    <LogOut size={18} />
                    <span className={cn(
                        "whitespace-nowrap overflow-hidden transition-all duration-300",
                        isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                    )}>
                        Cerrar Sesión
                    </span>
                </button>
            </div>
        </aside>
    );
}
