import { useState } from 'react';
import { Exercise, TAXONOMY_OPTIONS, ExerciseCategory } from '../../types/exercise';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ChevronDown, ChevronRight, Video, Tag, Activity, Info } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming you have this utility

interface ExerciseCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialName?: string;
    onSave: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
}

export function ExerciseCreatorModal({ isOpen, onClose, initialName, onSave }: ExerciseCreatorModalProps) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState(initialName || '');
    const [englishName, setEnglishName] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [categories, setCategories] = useState<ExerciseCategory[]>(['Fuerza']); // Default

    // Taxonomy State
    const [taxonomy, setTaxonomy] = useState({
        system: '',
        function: '',
        equipment: [] as string[],
        pattern: '',
        region: '',
        posture: '',
        impact: '',
        contractionType: '',
        isometricType: ''
    });

    const [instructions, setInstructions] = useState('');
    const [activeSection, setActiveSection] = useState<'basic' | 'taxonomy' | 'clinical'>('basic');

    const handleSave = async () => {
        if (!name) return;
        setLoading(true);
        try {
            const exerciseData: Omit<Exercise, 'id'> = {
                name,
                englishName,
                videoUrl,
                category: categories[0], // Main legacy category
                categories: categories, // New multi-category
                instructions,
                defaultParams: {},
                // Map taxonomy fields
                system: taxonomy.system as any,
                function: taxonomy.function as any,
                equipment: taxonomy.equipment,
                pattern: taxonomy.pattern,
                clean_region: taxonomy.region as any,
                posture: taxonomy.posture as any,
                impact_level: taxonomy.impact as any,
                contractionType: taxonomy.contractionType as any,
                isometricType: taxonomy.isometricType as any,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await onSave(exerciseData);
            onClose();
        } catch (error) {
            console.error("Error creating exercise", error);
            alert("Error al guardar ejercicio");
        } finally {
            setLoading(false);
        }
    };

    const toggleEquipment = (eq: string) => {
        setTaxonomy(prev => ({
            ...prev,
            equipment: prev.equipment.includes(eq)
                ? prev.equipment.filter(e => e !== eq)
                : [...prev.equipment, eq]
        }));
    };

    const toggleCategory = (cat: ExerciseCategory) => {
        setCategories(prev => {
            if (prev.includes(cat)) {
                return prev.length > 1 ? prev.filter(c => c !== cat) : prev; // Prevent empty
            }
            return [...prev, cat];
        });
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Nuevo Ejercicio Maestro"
            className="max-w-4xl"
            footer={(
                <Button onClick={handleSave} disabled={loading || !name} className="w-full bg-brand-600 text-white font-bold">
                    {loading ? 'Guardando...' : 'Guardar en Biblioteca'}
                </Button>
            )}
        >
            <div className="flex flex-col md:flex-row gap-6 h-[60vh]">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-48 flex-shrink-0 space-y-1 border-r border-zinc-100 pr-4">
                    <NavButton
                        active={activeSection === 'basic'}
                        onClick={() => setActiveSection('basic')}
                        icon={<Info className="w-4 h-4" />}
                        label="Básicos"
                    />
                    <NavButton
                        active={activeSection === 'taxonomy'}
                        onClick={() => setActiveSection('taxonomy')}
                        icon={<Tag className="w-4 h-4" />}
                        label="Taxonomía"
                    />
                    <NavButton
                        active={activeSection === 'clinical'}
                        onClick={() => setActiveSection('clinical')}
                        icon={<Activity className="w-4 h-4" />}
                        label="Clínica"
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">

                    {/* SECTION: BASIC */}
                    {activeSection === 'basic' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormGroup label="Nombre (Español) *">
                                    <input
                                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 outline-none"
                                        placeholder="Ej: Sentadilla Goblet"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        autoFocus
                                    />
                                </FormGroup>
                                <FormGroup label="Nombre (Inglés - Opcional)">
                                    <input
                                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 outline-none"
                                        placeholder="Ej: Goblet Squat"
                                        value={englishName}
                                        onChange={e => setEnglishName(e.target.value)}
                                    />
                                </FormGroup>
                            </div>

                            <FormGroup label="Video YouTube">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Video className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                                        <input
                                            className="w-full pl-9 p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 outline-none"
                                            placeholder="https://youtube.com/watch?v=..."
                                            value={videoUrl}
                                            onChange={e => setVideoUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {videoUrl && (
                                    <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                                        ✓ Video enlazado
                                    </p>
                                )}
                            </FormGroup>

                            <FormGroup label="Instrucciones Base">
                                <textarea
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg h-24 resize-none focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    placeholder="Instrucciones técnicas generales..."
                                    value={instructions}
                                    onChange={e => setInstructions(e.target.value)}
                                />
                            </FormGroup>

                            {/* Multi-Category Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Categorías (Múltiple)</label>
                                <div className="flex flex-wrap gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                                    {['Fuerza', 'Movilidad', 'Suelo Pélvico', 'Respiración', 'Educación', 'Otro'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => toggleCategory(c as ExerciseCategory)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs rounded-full border transition-all",
                                                categories.includes(c as ExerciseCategory)
                                                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                                                    : "bg-white text-zinc-600 border-zinc-200 hover:border-brand-300"
                                            )}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: TAXONOMY */}
                    {activeSection === 'taxonomy' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <SelectGroup
                                    label="Patrón de Movimiento"
                                    value={taxonomy.pattern}
                                    options={TAXONOMY_OPTIONS.patterns}
                                    onChange={(val) => setTaxonomy({ ...taxonomy, pattern: val })}
                                />
                                <SelectGroup
                                    label="Región / Zona"
                                    value={taxonomy.region}
                                    options={TAXONOMY_OPTIONS.regions}
                                    onChange={(val) => setTaxonomy({ ...taxonomy, region: val })}
                                />
                                <SelectGroup
                                    label="Postura"
                                    value={taxonomy.posture}
                                    options={TAXONOMY_OPTIONS.postures}
                                    onChange={(val) => setTaxonomy({ ...taxonomy, posture: val })}
                                />
                                <SelectGroup
                                    label="Función Principal"
                                    value={taxonomy.function}
                                    options={TAXONOMY_OPTIONS.functions}
                                    onChange={(val) => setTaxonomy({ ...taxonomy, function: val })}
                                />
                                {/* [NEW] Advanced Physiology */}
                                <SelectGroup
                                    label="Tipo de Contracción"
                                    value={taxonomy.contractionType}
                                    options={TAXONOMY_OPTIONS.contractionTypes || []}
                                    onChange={(val) => setTaxonomy({ ...taxonomy, contractionType: val })}
                                />
                                {taxonomy.contractionType === 'Isométrico' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <SelectGroup
                                            label="Tipo Isométrico (Natera)"
                                            value={taxonomy.isometricType}
                                            options={TAXONOMY_OPTIONS.isometricTypes || []}
                                            onChange={(val) => setTaxonomy({ ...taxonomy, isometricType: val })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-600 uppercase">Implementos</label>
                                <div className="flex flex-wrap gap-2">
                                    {TAXONOMY_OPTIONS.equipment.map(eq => (
                                        <button
                                            key={eq}
                                            onClick={() => toggleEquipment(eq)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs rounded-full border transition-all",
                                                taxonomy.equipment.includes(eq)
                                                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                                                    : "bg-white text-zinc-600 border-zinc-200 hover:border-brand-300"
                                            )}
                                        >
                                            {eq}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: CLINICAL */}
                    {activeSection === 'clinical' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <SelectGroup
                                    label="Sistema"
                                    value={taxonomy.system}
                                    options={TAXONOMY_OPTIONS.systems}
                                    onChange={(val) => setTaxonomy({ ...taxonomy, system: val })}
                                />
                                <SelectGroup
                                    label="Nivel de Impacto (Pélvico)"
                                    value={taxonomy.impact}
                                    options={TAXONOMY_OPTIONS.impact}
                                    onChange={(val) => setTaxonomy({ ...taxonomy, impact: val })}
                                />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </Dialog>
    );
}

// Sub-components
function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-brand-50 text-brand-700" : "text-zinc-500 hover:bg-zinc-50"
            )}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span>{label}</span>
            </div>
            {active && <ChevronRight className="w-4 h-4" />}
        </button>
    )
}

function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-1.5 has-[:focus]:text-brand-600 group">
            <label className="text-xs font-bold text-zinc-500 uppercase group-focus-within:text-brand-600 transition-colors">{label}</label>
            {children}
        </div>
    )
}

function SelectGroup({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (val: string) => void }) {
    return (
        <FormGroup label={label}>
            <div className="relative">
                <select
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg appearance-none outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                >
                    <option value="">-- Seleccionar --</option>
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
        </FormGroup>
    )
}
