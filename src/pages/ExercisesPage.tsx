import { useState, useEffect } from 'react';
import { ExerciseService } from '../services/exerciseService';
import { Exercise, EXERCISE_CATEGORIES, ExerciseCategory } from '../types/exercise';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Plus, Search, Filter, Youtube, Edit, Trash2, X } from 'lucide-react';

export default function ExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'All'>('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [formData, setFormData] = useState<Partial<Exercise>>({
        name: '',
        category: 'Fuerza',
        videoUrl: '',
        instructions: ''
    });

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
            setFormData(exercise);
        } else {
            setEditingExercise(null);
            setFormData({
                name: '',
                category: 'Fuerza',
                videoUrl: '',
                instructions: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingExercise && editingExercise.id) {
                await ExerciseService.update(editingExercise.id, formData);
            } else {
                await ExerciseService.create(formData as Exercise);
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
        const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
        return matchesSearch && matchesCategory;
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

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-brand-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar ejercicio..."
                        className="pl-10 pr-4 py-2 w-full bg-brand-50 border-none rounded-lg focus:ring-2 focus:ring-brand-200 outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${selectedCategory === 'All' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600 hover:bg-brand-100'}`}
                    >
                        Todos
                    </button>
                    {EXERCISE_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600 hover:bg-brand-100'}`}
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
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
                            <h3 className="font-bold text-lg text-brand-900">
                                {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-brand-400 hover:text-brand-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-brand-700 mb-1">Nombre</label>
                                <input
                                    className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                                    placeholder="Ej: Puente Glúteo"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-brand-700 mb-1">Categoría</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as ExerciseCategory })}
                                    >
                                        {EXERCISE_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-700 mb-1">Link de Video (YouTube)</label>
                                    <input
                                        className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                                        placeholder="https://youtube.com/..."
                                        value={formData.videoUrl}
                                        onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-brand-700 mb-1">Instrucciones</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm h-24 resize-none"
                                    placeholder="Describe cómo realizar el ejercicio..."
                                    value={formData.instructions}
                                    onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-brand-100 flex justify-end gap-2 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave}>Guardar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
