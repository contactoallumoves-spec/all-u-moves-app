import { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Search, Dumbbell, Activity, Wind, Timer } from 'lucide-react';
import { Exercise } from '../../types/exercise';
import { ExerciseService } from '../../services/exerciseService';

interface ExerciseSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (exercise: Exercise) => void;
}

export function ExerciseSelectorModal({ isOpen, onClose, onSelect }: ExerciseSelectorModalProps) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    useEffect(() => {
        if (isOpen && exercises.length === 0) {
            loadExercises();
        }
    }, [isOpen]);

    const loadExercises = async () => {
        setLoading(true);
        try {
            const data = await ExerciseService.getAll();
            setExercises(data);
        } catch (error) {
            console.error("Error loading exercises", error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = exercises.filter(ex =>
        (selectedCategory === 'All' || ex.category === selectedCategory) &&
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = Array.from(new Set(exercises.map(e => e.category)));

    const getIcon = (cat: string) => {
        if (cat === 'Strength') return <Dumbbell className="w-3 h-3" />;
        if (cat === 'Cardio') return <Activity className="w-3 h-3" />;
        if (cat === 'Breathing') return <Wind className="w-3 h-3" />;
        return <Timer className="w-3 h-3" />;
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Seleccionar Ejercicio" className="max-w-2xl">
            <div className="space-y-4">
                {/* Search Header */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedCategory === 'All' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedCategory === cat ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="h-[400px] overflow-y-auto border border-gray-100 rounded-lg bg-gray-50/50 p-2 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400 text-sm">Cargando biblioteca...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">No se encontraron resultados</div>
                    ) : (
                        filtered.map(ex => (
                            <button
                                key={ex.id}
                                onClick={() => onSelect(ex)}
                                className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-brand-400 hover:shadow-sm transition-all flex justify-between items-center group"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{ex.name}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 font-medium border border-gray-200">
                                            {getIcon(ex.category)} {ex.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 text-brand-600 text-xs font-bold transition-opacity">
                                    Seleccionar →
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                </div>
            </div>
        </Dialog>
    );
}
