import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlusCircle, Search, Loader2, User as UserIcon, Phone, Mail, FileText } from 'lucide-react';
import { PatientService } from '../services/patientService';
import { Patient } from '../types/patient';
import { useNavigate } from 'react-router-dom';

export default function PatientsPage() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Patient>>({
        firstName: '', lastName: '', rut: '', stage: 'Nuligesta', birthDate: '', phone: '', email: '', occupation: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        const data = await PatientService.getAll();
        setPatients(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.firstName || !formData.lastName || !formData.rut) {
            setError('Faltan campos obligatorios (Nombre, Apellido, RUT)');
            return;
        }
        setError('');
        setSaving(true);
        try {
            await PatientService.create(formData as Patient);
            await loadPatients();
            setShowModal(false);
            setFormData({ firstName: '', lastName: '', rut: '', stage: 'Nuligesta', birthDate: '', phone: '', email: '', occupation: '' });
        } catch (error) {
            console.error(error);
            setError('Error al guardar en base de datos. Verifica tu conexión.');
        } finally {
            setSaving(false);
        }
    };

    // Simple RUT formatter (12.345.678-9)
    const formatRut = (value: string) => {
        // Basic cleanup
        let v = value.replace(/[^0-9kK]/g, '');
        if (v.length > 1) {
            v = v.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + '-' + v.slice(-1);
        }
        return v.toUpperCase();
    };

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, rut: formatRut(e.target.value) });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-900">Directorio de Pacientes</h1>
                    <p className="text-brand-500 mt-1">Gestión de fichas clínicas y contactos.</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Nueva Paciente
                </Button>
            </div>

            {/* List */}
            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RUT..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10"><Loader2 className="animate-spin h-8 w-8 mx-auto text-brand-400" /></div>
                    ) : patients.length === 0 ? (
                        <div className="text-center py-16 bg-brand-50/30 rounded-xl border-dashed border-2 border-brand-100 m-4">
                            <UserIcon className="h-12 w-12 text-brand-300 mx-auto mb-3" />
                            <p className="text-brand-500 font-medium">No hay pacientes registradas</p>
                            <p className="text-sm text-brand-400 mt-1">Comienza agregando la primera ficha.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-brand-50">
                            {patients.map(patient => (
                                <div key={patient.id} className="p-4 flex items-center justify-between hover:bg-brand-50/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                                            {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-brand-900 text-lg">{patient.firstName} {patient.lastName}</p>
                                            <div className="flex items-center gap-3 text-xs text-brand-500">
                                                <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">{patient.stage}</span>
                                                <span className="flex items-center gap-1"><FileText size={12} /> {patient.rut}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {patient.phone && (
                                            <a href={`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="p-2 text-brand-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors" title="Whatsapp">
                                                <Phone size={18} />
                                            </a>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => navigate('/eval/new')} className="hidden md:flex">
                                            Nueva Evaluación
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif font-bold text-brand-900">Nueva Ficha Clínica</h2>
                            <button onClick={() => setShowModal(false)} className="text-brand-400 hover:text-brand-600">✕</button>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center gap-2">
                                <span className="font-bold">Error:</span> {error}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-brand-800 text-sm uppercase tracking-wide border-b border-brand-100 pb-2">Datos Personales</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-brand-500">Nombre *</label>
                                        <input
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500/20 outline-none"
                                            placeholder="Ej: Fernanda"
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-brand-500">Apellido *</label>
                                        <input
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500/20 outline-none"
                                            placeholder="Ej: Perez"
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-brand-500">RUT (ID Chileno) *</label>
                                    <input
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500/20 outline-none font-mono"
                                        placeholder="12.345.678-9"
                                        value={formData.rut}
                                        onChange={handleRutChange}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-brand-500">Fecha Nacimiento</label>
                                        <input
                                            type="date"
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500/20 outline-none"
                                            value={formData.birthDate}
                                            onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-brand-500">Ocupación</label>
                                        <input
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500/20 outline-none"
                                            placeholder="Ej: Abogada"
                                            value={formData.occupation}
                                            onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Stage */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-brand-800 text-sm uppercase tracking-wide border-b border-brand-100 pb-2">Contacto & Clínica</h3>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-brand-500">Etapa Vital Actual</label>
                                    <select
                                        className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-brand-500/20 outline-none"
                                        value={formData.stage}
                                        onChange={e => setFormData({ ...formData, stage: e.target.value as any })}
                                    >
                                        <option value="Nuligesta">Nuligesta</option>
                                        <option value="Embarazo">Embarazo</option>
                                        <option value="Postparto">Postparto</option>
                                        <option value="Menopausia">Menopausia</option>
                                        <option value="Deportista">Deportista</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-brand-500">Teléfono / WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500/20 outline-none"
                                            placeholder="+56 9..."
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-brand-500">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500/20 outline-none"
                                            placeholder="correo@ejemplo.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-gray-100 mt-4">
                            <Button variant="ghost" className="flex-1 text-brand-500 hover:bg-brand-50 hover:text-brand-700" onClick={() => setShowModal(false)} disabled={saving}>
                                Cancelar
                            </Button>
                            <Button className="flex-[2]" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Crear Ficha
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
