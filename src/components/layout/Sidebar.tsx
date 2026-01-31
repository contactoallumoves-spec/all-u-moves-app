import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    PlusCircle,
    Dumbbell // [NEW]
} from 'lucide-react';
import { Button } from '../ui/Button';

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const links = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/users', label: 'Usuarias', icon: Users },
        { href: '/exercises', label: 'Biblioteca', icon: Dumbbell }, // [NEW]
        { href: '/reports', label: 'Reportes', icon: FileText },
        { href: '/settings', label: 'Configuración', icon: Settings },
    ];

    return (
        <aside className="w-72 bg-white border-r border-brand-100 hidden md:flex flex-col h-full shadow-[2px_0_24px_-12px_rgba(0,0,0,0.1)] z-10">
            <div className="p-8 pb-4">
                <img src="/allumoves-logo.png" alt="All U Moves" className="h-8 w-auto mb-2" />
                <p className="text-xs text-brand-400 font-medium tracking-widest uppercase mt-1">Matriz Maestra</p>
            </div>

            <div className="px-6 mb-6">
                <Button className="w-full justify-start gap-2 shadow-brand-200/50" size="lg" onClick={() => navigate('/users')}>
                    <PlusCircle size={20} />
                    Nueva Evaluación
                </Button>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-brand-50 text-brand-900 shadow-sm"
                                    : "text-brand-500 hover:bg-brand-50/50 hover:text-brand-700"
                            )}
                        >
                            <Icon size={18} className={cn(isActive ? "text-brand-600" : "text-brand-400")} />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-brand-50">
                <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-500 hover:text-brand-700 w-full rounded-xl hover:bg-red-50/50 transition-colors">
                    <LogOut size={18} />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}
