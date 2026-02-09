
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Search, Calendar, Users, MoreVertical, Dumbbell, Loader2 } from 'lucide-react';
import { ProProgram } from '../../types/pro-plan';
import { ProgramService } from '../../services/programService'; // [NEW]
import { AssignProgramModal } from '../../components/programs/AssignProgramModal'; // [NEW]

export default function ProgramLibraryPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [programs, setPrograms] = useState<ProProgram[]>([]);
    const [loading, setLoading] = useState(true);

    // [NEW] Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<ProProgram | null>(null);

    useEffect(() => {
        loadPrograms();
    }, []);

    const loadPrograms = async () => {
        try {
            const data = await ProgramService.getAll();
            setPrograms(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssign = (program: ProProgram) => {
        setSelectedProgram(program);
        setAssignModalOpen(true);
    };

    const filteredPrograms = programs.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* ... Header & Filters ... */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Dumbbell className="w-6 h-6 text-brand-600" />
                        Biblioteca de Programas
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Crea, gestiona y asigna programas de entrenamiento.
                    </p>
                </div>
                <Button onClick={() => navigate('/programs/new')} size="lg" className="shadow-lg shadow-brand-500/20">
                    <Plus className="w-5 h-5 mr-2" />
                    Nuevo Programa
                </Button>
            </div>

            {/* Filters */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o etiqueta..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrograms.map(program => (
                        <ProgramCard
                            key={program.id}
                            program={program}
                            onClick={() => navigate(`/programs/${program.id}`)}
                            onAssign={() => handleOpenAssign(program)} // [NEW]
                        />
                    ))}
                </div>
            )}

            {filteredPrograms.length === 0 && !loading && (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No se encontraron programas</h3>
                    <p className="text-slate-500">Intenta con otra búsqueda o crea uno nuevo.</p>
                </div>
            )}

            {/* [NEW] Modal */}
            <AssignProgramModal
                program={selectedProgram}
                open={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
            />
        </div>
    );
}

function ProgramCard({ program, onClick, onAssign }: { program: ProProgram, onClick: () => void, onAssign: () => void }) {
    return (
        <Card className="group hover:shadow-md transition-all border-slate-200 hover:border-brand-300 overflow-hidden flex flex-col h-full">
            <div className="h-2 bg-gradient-to-r from-brand-400 to-brand-600" />
            <div className="p-5 space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start cursor-pointer" onClick={onClick}>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-700 transition-colors">
                            {program.name}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                            {program.description || "Sin descripción"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 cursor-pointer" onClick={onClick}>
                    {program.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded tracking-wide">
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {program.weeks.length} Semanas
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50" onClick={(e) => {
                            e.stopPropagation();
                            onAssign();
                        }}>
                            Asignar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700" onClick={(e) => {
                            e.stopPropagation();
                            // Optional: Open dropdown menu
                        }}>
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
