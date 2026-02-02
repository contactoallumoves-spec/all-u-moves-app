import { useState, useEffect } from 'react';
import { ExerciseService } from '../services/exerciseService';
import { Exercise, EXERCISE_CATEGORIES, ExerciseCategory } from '../types/exercise';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Plus, Search, Youtube, Edit, Trash2 } from 'lucide-react';
import { ExerciseCreatorModal } from '../components/clinical/ExerciseCreatorModal'; // [NEW]

export default function ExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'All'>('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

    // [CLEANUP] Removed detailed form state, now handled by modal

    // Advanced Filters State
    const [contractionFilter, setContractionFilter] = useState<string>('All');
    const [equipmentFilter, setEquipmentFilter] = useState<string>('All');

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        setLoading(true);
        const data = await ExerciseService.getAll();
        setExercises(data);
        setLoading(false);
    };

    const handleOpenModal = (exercise?: Exercise) => {
        if (exercise) {
            setEditingExercise(exercise);
        } else {
            setEditingExercise(null);
        }
        setIsModalOpen(true);
    };

    const handleSave = async (data: Omit<Exercise, 'id'>) => {
        try {
            if (editingExercise && editingExercise.id) {
                await ExerciseService.update(editingExercise.id, data);
            } else {
                await ExerciseService.create(data as Exercise);
            }
            setIsModalOpen(false);
            loadExercises();
        } catch (error) {
            console.error(error);
            alert("Error al guardar ejercicio");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Seguro que deseas eliminar este ejercicio?')) {
            await ExerciseService.delete(id);
            loadExercises();
        }
    };

    const filteredExercises = exercises.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Category Logic: Match if selected is 'All', OR if existing legacy matches, OR if new array includes it
        const matchesCategory = selectedCategory === 'All'
            || ex.category === selectedCategory
            || (ex.categories && ex.categories.includes(selectedCategory as any));

        // Advanced Filters
        const matchesContraction = contractionFilter === 'All' || ex.contractionType === contractionFilter;
        // Equipment: check if the exercises' equipment array includes the selected filter
        const matchesEquipment = equipmentFilter === 'All'
            || (ex.equipment && ex.equipment.includes(equipmentFilter));

        return matchesSearch && matchesCategory && matchesContraction && matchesEquipment;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-brand-900">Biblioteca de Ejercicios</h1>
                    <p className="text-brand-500">Gestiona los recursos para tus planes de tratamiento</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-brand-500/20">
                    <Plus className="w-5 h-5 mr-2" /> Nuevo Ejercicio
                </Button>
            </div>

            {/* Filters Area */}
            <div className="space-y-4">
                {/* Search & Basic Tags */}
                <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-brand-100 shadow-sm flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, tags..."
                            className="pl-10 pr-4 py-2 w-full bg-brand-50 border-none rounded-lg focus:ring-2 focus:ring-brand-200 outline-none text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Advanced Dropdowns */}
                    <select
                        className="px-3 py-2 bg-brand-50 rounded-lg text-sm text-brand-700 border-none outline-none focus:ring-2 focus:ring-brand-200"
                        value={contractionFilter}
                        onChange={(e) => setContractionFilter(e.target.value)}
                    >
                        <option value="All">Cualquier Contracción</option>
                        <option value="Isométrico">Isométrico</option>
                        <option value="Concéntrico">Concéntrico</option>
                        <option value="Excéntrico">Excéntrico</option>
                        <option value="Pliométrico">Pliométrico</option>
                    </select>

                    <select
                        className="px-3 py-2 bg-brand-50 rounded-lg text-sm text-brand-700 border-none outline-none focus:ring-2 focus:ring-brand-200"
                        value={equipmentFilter}
                        onChange={(e) => setEquipmentFilter(e.target.value)}
                    >
                        <option value="All">Cualquier Implemento</option>
                        <option value="Mat">Mat</option>
                        <option value="Banda">Banda</option>
                        <option value="Kettlebell">Kettlebell</option>
                        <option value="Mancuerna">Mancuerna</option>
                        <option value="Sin Implemento">Sin Implemento</option>
                    </select>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === 'All' ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-brand-600 border border-brand-100 hover:bg-brand-50'}`}
                    >
                        Todas las Categorías
                    </button>
                    {EXERCISE_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-brand-600 border border-brand-100 hover:bg-brand-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-brand-400">Cargando biblioteca...</div>
                ) : filteredExercises.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-brand-400 bg-brand-50/50 rounded-2xl border border-dashed border-brand-200">
                        <p>No se encontraron ejercicios.</p>
                    </div>
                ) : (
                    filteredExercises.map(ex => (
                        <Card key={ex.id} className="group hover:shadow-md transition-all border-brand-100">
                            <CardContent className="p-0">
                                <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-t-xl">
                                    {ex.videoUrl ? (
                                        <div className="w-full h-full flex items-center justify-center bg-black/5">
                                            {/* Ideally we'd show a thumbnail here */}
                                            <Youtube className="w-12 h-12 text-red-500 opacity-80" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-brand-200">
                                            <span className="text-4xl">🏋️‍♀️</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(ex)} className="p-1.5 bg-white rounded-full shadow-sm hover:bg-brand-50 text-brand-600">
                                            <Edit className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => ex.id && handleDelete(ex.id)} className="p-1.5 bg-white rounded-full shadow-sm hover:bg-red-50 text-red-500">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full backdrop-blur-sm">
                                        {ex.category}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-brand-900 line-clamp-1" title={ex.name}>{ex.name}</h3>
                                    <p className="text-xs text-brand-500 mt-1 line-clamp-2 min-h-[2.5em]">{ex.instructions || 'Sin instrucciones detalladas.'}</p>
                                    {/* Show tags/badges for new taxonomy if available */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {ex.categories?.map(c => (
                                            <span key={c} className="text-[10px] px-1.5 py-0.5 bg-brand-50 text-brand-600 rounded-full border border-brand-100">{c}</span>
                                        ))}
                                        {ex.contractionType && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">{ex.contractionType}</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            <ExerciseCreatorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                existingExercise={editingExercise} // Pass the exercise being edited
                onSave={handleSave} // Reuse handleSave which now just needs to accept the object
            />
        </div>
    );
}
