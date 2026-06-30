import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { KineService } from '../services/kineService';
import { Kinesiologist } from '../types/clinical';
import { Button } from '../components/ui/Button';
import { Loader2, UserCheck, Shield, Trash2, Check, X } from 'lucide-react';

export default function SettingsPage() {
    const [currentUserProfile, setCurrentUserProfile] = useState<Kinesiologist | null>(null);
    const [allKines, setAllKines] = useState<Kinesiologist[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch profile and all kines if admin
    const loadData = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (user) {
                const profile = await KineService.getProfile(user.uid);
                setCurrentUserProfile(profile);

                if (profile && profile.role === 'admin') {
                    const list = await KineService.getAllKines();
                    setAllKines(list);
                }
            }
        } catch (error) {
            console.error("Error loading settings data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApprove = async (kineId: string, role: 'admin' | 'kine') => {
        setActionLoading(kineId);
        try {
            await KineService.approveKine(kineId, role);
            alert("Kinesiólogo aprobado exitosamente.");
            // Reload
            const list = await KineService.getAllKines();
            setAllKines(list);
        } catch (error) {
            console.error(error);
            alert("Error al aprobar");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateRole = async (kineId: string, newRole: 'admin' | 'kine') => {
        setActionLoading(kineId);
        try {
            await KineService.approveKine(kineId, newRole); // UpdateRole is the same as approve (updates status/role)
            alert("Rol actualizado exitosamente.");
            // Reload
            const list = await KineService.getAllKines();
            setAllKines(list);
        } catch (error) {
            console.error(error);
            alert("Error al actualizar rol");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (kineId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
        setActionLoading(kineId);
        try {
            await KineService.rejectOrDeleteKine(kineId);
            alert("Usuario eliminado.");
            // Reload
            const list = await KineService.getAllKines();
            setAllKines(list);
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="p-10 flex justify-center">
                <Loader2 className="animate-spin text-brand-600 w-8 h-8" />
            </div>
        );
    }

    const isAdmin = currentUserProfile?.role === 'admin';
    const pendingKines = allKines.filter(k => k.status === 'pending');
    const activeKines = allKines.filter(k => k.status === 'active' && k.id !== currentUserProfile?.id);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-serif font-bold text-brand-900">Configuración del Sistema</h1>
                <p className="text-brand-500 text-sm">Gestiona tu perfil y el acceso al centro clínico</p>
            </div>

            {/* Profile Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 space-y-4">
                <h2 className="text-lg font-serif font-bold text-brand-800">Mi Perfil</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-brand-400 font-medium">Nombre</p>
                        <p className="text-brand-900 font-semibold">{currentUserProfile?.firstName} {currentUserProfile?.lastName}</p>
                    </div>
                    <div>
                        <p className="text-brand-400 font-medium">Correo Electrónico</p>
                        <p className="text-brand-900 font-semibold">{currentUserProfile?.email}</p>
                    </div>
                    <div>
                        <p className="text-brand-400 font-medium">Rol de Acceso</p>
                        <p className="text-brand-900 font-bold capitalize flex items-center gap-1.5 mt-1">
                            {currentUserProfile?.role === 'admin' ? (
                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                                    <Shield className="w-3.5 h-3.5" /> Administrador
                                </span>
                            ) : (
                                <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                                    <UserCheck className="w-3.5 h-3.5" /> Kinesiólogo
                                </span>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-brand-400 font-medium">Estado de Cuenta</p>
                        <p className="text-green-600 font-semibold mt-1">✓ Activo</p>
                    </div>
                </div>
            </div>

            {/* Admin Panel */}
            {isAdmin && (
                <div className="space-y-6">
                    {/* Pending Requests */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-serif font-bold text-brand-800">Solicitudes de Acceso Pendientes</h2>
                            <span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                {pendingKines.length} Esperando
                            </span>
                        </div>

                        {pendingKines.length === 0 ? (
                            <p className="text-sm text-brand-400 italic">No hay solicitudes de registro pendientes.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-brand-100 text-brand-500 font-medium">
                                            <th className="py-2">Nombre</th>
                                            <th className="py-2">Email</th>
                                            <th className="py-2 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingKines.map(kine => (
                                            <tr key={kine.id} className="border-b border-brand-50 hover:bg-brand-50/20">
                                                <td className="py-3 font-semibold text-brand-900">
                                                    {kine.firstName} {kine.lastName}
                                                </td>
                                                <td className="py-3 text-brand-600">{kine.email}</td>
                                                <td className="py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(kine.id, 'kine')}
                                                            className="bg-brand-600 text-white hover:bg-brand-700"
                                                            disabled={actionLoading !== null}
                                                        >
                                                            {actionLoading === kine.id ? (
                                                                <Loader2 className="animate-spin w-3.5 h-3.5" />
                                                            ) : (
                                                                <>
                                                                    <Check className="w-3.5 h-3.5 mr-1" /> Aprobar Kine
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(kine.id, 'admin')}
                                                            className="bg-purple-600 text-white hover:bg-purple-700"
                                                            disabled={actionLoading !== null}
                                                        >
                                                            {actionLoading === kine.id ? (
                                                                <Loader2 className="animate-spin w-3.5 h-3.5" />
                                                            ) : (
                                                                <>
                                                                    <Shield className="w-3.5 h-3.5 mr-1" /> Aprobar Admin
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(kine.id)}
                                                            className="text-red-500 border-red-200 hover:bg-red-50"
                                                            disabled={actionLoading !== null}
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Active Kinesiologists */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 space-y-4">
                        <h2 className="text-lg font-serif font-bold text-brand-800">Kinesiólogos y Personal Activo</h2>

                        {activeKines.length === 0 ? (
                            <p className="text-sm text-brand-400 italic">No hay otros kinesiólogos activos registrados.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-brand-100 text-brand-500 font-medium">
                                            <th className="py-2">Nombre</th>
                                            <th className="py-2">Email</th>
                                            <th className="py-2">Rol de Acceso</th>
                                            <th className="py-2 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeKines.map(kine => (
                                            <tr key={kine.id} className="border-b border-brand-50 hover:bg-brand-50/20">
                                                <td className="py-3 font-semibold text-brand-900">
                                                    {kine.firstName} {kine.lastName}
                                                </td>
                                                <td className="py-3 text-brand-600">{kine.email}</td>
                                                <td className="py-3">
                                                    <select
                                                        value={kine.role}
                                                        onChange={(e) => handleUpdateRole(kine.id, e.target.value as 'admin' | 'kine')}
                                                        className="text-xs font-semibold p-1.5 rounded-lg border border-brand-200 text-brand-700 bg-white outline-none"
                                                        disabled={actionLoading === kine.id}
                                                    >
                                                        <option value="kine">Kinesiólogo(a)</option>
                                                        <option value="admin">Administrador(a)</option>
                                                    </select>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex justify-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(kine.id)}
                                                            className="text-red-500 border-red-200 hover:bg-red-50"
                                                            disabled={actionLoading !== null}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
