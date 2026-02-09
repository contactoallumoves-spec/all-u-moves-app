import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientService } from '../../services/patientService';
import { Patient } from '../../types/patient';
import { Card } from '../../components/ui/Card';
import { Search, Calendar, ArrowRight } from 'lucide-react';

export default function PlannerSelectorPage() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            const all = await PatientService.getAll();
            // Filter only active? For now show all, maybe sort by recent
            setPatients(all);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        `${p.firstName} ${p.lastName} `.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rut?.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
                    <Calendar className="w-8 h-8 text-brand-600" />
                    Planificador Directo
                </h1>
                <p className="text-slate-500 max-w-lg mx-auto">
                    Selecciona una atleta para abrir su calendario de planificación inmediatamente.
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar atleta por nombre o nombre..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-slate-400 animate-pulse">Cargando atletas...</div>
                ) : filteredPatients.length > 0 ? (
                    filteredPatients.map(patient => (
                        <Card
                            key={patient.id}
                            className="group hover:shadow-md transition-all cursor-pointer border-slate-200 hover:border-brand-300"
                            onClick={() => navigate(`/users/${patient.id}/planning`)}
                        >
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                                        {patient.firstName[0]}{patient.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                                            {patient.firstName} {patient.lastName}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="capitalize">{patient.stage || 'General'}</span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Card >
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 text-slate-400">
                        No se encontraron atletas.
                    </div>
                )}
            </div >
        </div >
    );
}
