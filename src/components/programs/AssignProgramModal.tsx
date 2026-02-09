import { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Search, Calendar, User, Loader2, Check } from 'lucide-react';
import { PatientService } from '../../services/patientService';
import { Patient } from '../../types/patient';
import { ProProgram } from '../../types/pro-plan';
import { ProgramAssignmentService } from '../../services/ProgramAssignmentService';
import { cn } from '../../lib/utils';

interface AssignProgramModalProps {
    program: ProProgram | null;
    open: boolean;
    onClose: () => void;
}

export function AssignProgramModal({ program, open, onClose }: AssignProgramModalProps) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filter, setFilter] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            loadPatients();
        }
    }, [open]);

    const loadPatients = async () => {
        setLoading(true);
        try {
            const data = await PatientService.getAll();
            setPatients(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!program || !selectedPatientId) return;

        setSaving(true);
        try {
            const safeDate = new Date(startDate + 'T12:00:00');

            await ProgramAssignmentService.assignToPatient(program, selectedPatientId, safeDate);

            // Success
            alert(`Programa "${program.name}" asignado correctamente.`);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al asignar el programa.");
        } finally {
            setSaving(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(filter.toLowerCase())
    );

    const footer = (
        <>
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={!selectedPatientId || saving} className="bg-brand-600 hover:bg-brand-700 text-white">
                {saving ? <Loader2 className="animate-spin mr-2" /> : null}
                Confirmar Asignación
            </Button>
        </>
    );

    return (
        <Dialog
            isOpen={open}
            onClose={onClose}
            title={`Asignar Programa: ${program?.name || ''}`}
            footer={footer}
        >
            <div className="space-y-6 py-2">
                {/* Date Selector */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 block">Fecha de Inicio</label>
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400">La semana 1 del programa comenzará en esta fecha.</p>
                </div>

                {/* Patient Selector */}
                <div className="space-y-2 h-[300px] flex flex-col">
                    <label className="text-sm font-medium text-slate-700 block">Seleccionar Atleta</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg mt-2 bg-slate-50/50">
                        {loading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredPatients.map(patient => (
                                    <button
                                        key={patient.id}
                                        onClick={() => setSelectedPatientId(patient.id || '')}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 transition-colors text-left text-sm",
                                            selectedPatientId === patient.id ? "bg-brand-50 text-brand-900" : "hover:bg-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {patient.firstName[0]}{patient.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                                                <p className="text-xs text-slate-400 capitalize">{patient.stage || 'General'}</p>
                                            </div>
                                        </div>
                                        {selectedPatientId === patient.id && (
                                            <Check className="w-4 h-4 text-brand-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
