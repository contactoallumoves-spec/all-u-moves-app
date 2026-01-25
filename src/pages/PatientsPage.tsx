import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlusCircle, Search, Loader2 } from 'lucide-react';
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
        firstName: '', lastName: '', stage: 'Nuligesta', birthDate: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        const data = await PatientService.getAll();
        setPatients(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.firstName || !formData.lastName) return;
        setSaving(true);
        try {
            await PatientService.create(formData as Patient);
            await loadPatients();
            setShowModal(false);
            setFormData({ firstName: '', lastName: '', stage: 'Nuligesta', birthDate: '' });
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-900">Directorio de Pacientes</h1>
                    <p className="text-brand-500 mt-1">Gestiona los historiales clínicos.</p>
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
                            placeholder="Buscar por nombre..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10"><Loader2 className="animate-spin h-8 w-8 mx-auto text-brand-400" /></div>
                    ) : patients.length === 0 ? (
                        <div className="text-center py-10 text-brand-400">No hay pacientes registradas aún.</div>
                    ) : (
                        <div className="divide-y divide-brand-50">
                            {patients.map(patient => (
                                <div key={patient.id} className="p-4 flex items-center justify-between hover:bg-brand-50/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                                            {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-brand-900">{patient.firstName} {patient.lastName}</p>
                                            <p className="text-xs text-brand-500">{patient.stage}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => navigate('/eval/new')}>
                                        Nueva Evaluación
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
                        <h2 className="text-xl font-bold text-brand-900">Registrar Nueva Paciente</h2>

                        <div className="space-y-3">
                            <input
                                className="w-full p-3 border rounded-xl"
                                placeholder="Nombre"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                            <input
                                className="w-full p-3 border rounded-xl"
                                placeholder="Apellido"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                            <input
                                type="date"
                                className="w-full p-3 border rounded-xl"
                                value={formData.birthDate}
                                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                            <select
                                className="w-full p-3 border rounded-xl bg-white"
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

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</Button>
                            <Button className="flex-1" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null} Guardar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
