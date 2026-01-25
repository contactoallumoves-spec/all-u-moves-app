import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { SessionService } from '../services/sessionService'; // [NEW]
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Save, Plus, Trash2, CheckSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { Patient } from '../types/patient';

import { ITEMS_CATALOG } from '../data/catalog';

// Quick presets for session recording
const INTERVENTIONS_PRESETS = [
    { id: 'edu_pain', label: ITEMS_CATALOG['edu_pain'] },
    { id: 'manual_pf', label: ITEMS_CATALOG['manual_pf'] },
    { id: 'biofeedback', label: ITEMS_CATALOG['biofeedback'] },
    { id: 'electro', label: ITEMS_CATALOG['electro'] },
    { id: 'ex_core', label: ITEMS_CATALOG['ex_core'] },
    { id: 'ex_breat', label: ITEMS_CATALOG['ex_breat'] },
    { id: 'ex_str', label: ITEMS_CATALOG['ex_str'] },
    { id: 'ex_mob', label: ITEMS_CATALOG['ex_mob'] },
];

export default function EvolutionPage() {
    const { patientId } = useParams(); // Note: route uses :patientId usually, or :id. Let's align.
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('editId');

    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);

    // Session State
    const [notes, setNotes] = useState('');
    const [interventions, setInterventions] = useState<string[]>([]);
    const [interventionDetails, setInterventionDetails] = useState<Record<string, string>>({}); // [NEW]
    const [symptomsScore, setSymptomsScore] = useState(5); // 0-10
    const [adherence, setAdherence] = useState(''); // 'high', 'medium', 'low'

    // Re-assessment State
    const [oxford, setOxford] = useState<number | undefined>(undefined);
    const [tonicity, setTonicity] = useState<string>('');
    const [breathing, setBreathing] = useState<string>('');

    // Custom Activities [NEW]
    const [customActivities, setCustomActivities] = useState<{ category: string; name: string; params: string }[]>([]);

    // Tasks updates
    const [tasks, setTasks] = useState([
        { id: '1', label: 'Respiración Diafragmática', active: true },
        { id: '2', label: 'Knack Pre-esfuerzo', active: true },
        { id: '3', label: 'Caminata 15min', active: true },
    ]);

    useEffect(() => {
        const load = async () => {
            if (patientId) {
                const p = await PatientService.getById(patientId);
                setPatient(p);
            }
            if (editId) {
                const s = await SessionService.getById(editId);
                if (s) {
                    setNotes(s.notes || '');
                    setInterventions(s.interventions || []);
                    setInterventionDetails(s.interventionDetails || {});
                    setSymptomsScore(s.symptomsScore || 5);
                    setAdherence(s.adherence || '');
                    // [NEW] Load custom activities
                    setCustomActivities(s.customActivities || []);

                    if (s.reassessment) {
                        setOxford(s.reassessment.oxford);
                        setTonicity(s.reassessment.tonicity || '');
                        setBreathing(s.reassessment.breating || '');
                    }
                    if (s.tasks) {
                        setTasks(s.tasks);
                    }
                }
            }
            setLoading(false);
        };
        load();
    }, [patientId, editId]);

    const toggleIntervention = (id: string) => {
        setInterventions(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDetailChange = (id: string, value: string) => {
        setInterventionDetails(prev => ({ ...prev, [id]: value }));
    };

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
    };

    const handleSave = async () => {
        if (!patientId) return;

        try {
            const dataToSave = {
                notes,
                interventions,
                interventionDetails, // Save details
                customActivities, // [NEW] Save custom rows
                symptomsScore,
                adherence,
                reassessment: {
                    oxford,
                    tonicity,
                    breating: breathing,
                    pain: symptomsScore
                },
                tasks,
                status: 'completed'
            };

            if (editId) {
                await SessionService.update(editId, dataToSave as any);
            } else {
                await SessionService.create({
                    patientId,
                    date: new Date(),
                    ...dataToSave
                } as any);
            }
            navigate(`/users/${patientId}`);
        } catch (error) {
            console.error(error);
            alert("Error al guardar sesión");
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${patientId}`)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <div>
                    <h1 className="text-xl font-serif font-bold text-brand-900 text-center">Nueva Evolución</h1>
                    <p className="text-xs text-brand-500 text-center">{patient?.firstName} {patient?.lastName}</p>
                </div>
                <Button onClick={handleSave} className="bg-brand-800 text-white shadow-lg">
                    <Save className="w-4 h-4 mr-2" /> Guardar
                </Button>
            </div>

            {/* Subjective / Notes */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h3 className="font-bold text-sm uppercase text-brand-500">Subjetivo (Notas)</h3>
                    <textarea
                        className="w-full p-3 bg-brand-50/50 border border-brand-100 rounded-xl min-h-[100px] focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                        placeholder="¿Cómo se siente hoy? Comentarios de la usuaria..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />

                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-brand-700">Intensidad Síntomas (0-10):</label>
                        <input
                            type="range" min="0" max="10"
                            value={symptomsScore} onChange={e => setSymptomsScore(Number(e.target.value))}
                            className="w-full accent-brand-600"
                        />
                        <span className="font-bold text-brand-800 w-8">{symptomsScore}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-brand-700">Adherencia Tareas:</span>
                        <div className="flex gap-2">
                            {['Baja', 'Media', 'Alta'].map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setAdherence(lvl.toLowerCase())}
                                    className={cn(
                                        "px-3 py-1 rounded-lg text-xs border transition-all",
                                        adherence === lvl.toLowerCase() ? "bg-green-100 text-green-800 border-green-200 font-bold" : "bg-white text-gray-500 hover:bg-gray-50"
                                    )}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Objective / Physical Re-assessment [NEW] */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h3 className="font-bold text-sm uppercase text-brand-500">Objetivo (Re-evaluación Física)</h3>

                    {/* Oxford */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-700 block">Fuerza Suelo Pélvico (Oxford):</label>
                        <div className="flex gap-2 bg-gray-50 p-2 rounded-lg justify-between">
                            {[0, 1, 2, 3, 4, 5].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setOxford(val)}
                                    className={cn(
                                        "w-10 h-10 rounded-full font-bold text-sm transition-all",
                                        oxford === val
                                            ? "bg-brand-600 text-white shadow-md scale-110"
                                            : "bg-white text-gray-400 hover:bg-brand-50"
                                    )}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tonicity & Breathing */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-brand-700 block mb-2">Tonicidad:</label>
                            <select
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                value={tonicity}
                                onChange={(e) => setTonicity(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Normotono">Normotono</option>
                                <option value="Hipertono">Hipertono</option>
                                <option value="Hipotono">Hipotono</option>
                                <option value="Doloroso">Doloroso</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-700 block mb-2">Patrón Respiratorio:</label>
                            <select
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                value={breathing}
                                onChange={(e) => setBreathing(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Diafragmático">Diafragmático</option>
                                <option value="Costal Alto">Costal Alto</option>
                                <option value="Mixto">Mixto</option>
                                <option value="Invertido">Invertido</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Objective / Interventions (The "Clicks") */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h3 className="font-bold text-sm uppercase text-brand-500">Intervenciones Realizadas (Objetivo)</h3>
                    <div className="space-y-3">
                        {INTERVENTIONS_PRESETS.map(intv => {
                            const active = interventions.includes(intv.id);
                            return (
                                <div key={intv.id} className={cn(
                                    "rounded-xl border transition-all overflow-hidden",
                                    active ? "bg-brand-50 border-brand-500 shadow-sm" : "bg-white border-gray-100"
                                )}>
                                    <button
                                        onClick={() => toggleIntervention(intv.id)}
                                        className="w-full p-3 text-left text-sm flex items-center justify-between"
                                    >
                                        <span className={cn("font-medium", active ? "text-brand-800" : "text-gray-500")}>
                                            {intv.label}
                                        </span>
                                        {active && <CheckSquare className="w-4 h-4 text-brand-600" />}
                                    </button>

                                    {/* Parameter Input */}
                                    {active && (
                                        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2">
                                            <input
                                                type="text"
                                                placeholder="Parámetros (ej. 50Hz, 15min, serie 3x10)..."
                                                className="w-full text-xs p-2 bg-white border border-brand-200 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                                                value={interventionDetails[intv.id] || ''}
                                                onChange={(e) => handleDetailChange(intv.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* [NEW] Custom Activities / Flexible Exercises */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm uppercase text-brand-500">Actividades Específicas (Libre)</h3>
                        <Button variant="ghost" size="sm" className="text-brand-600 text-xs" onClick={() => {
                            setCustomActivities([...customActivities, { category: 'Ejercicio', name: '', params: '' }]);
                        }}>
                            <Plus className="w-3 h-3 mr-1" /> Añadir Fila
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {customActivities.length === 0 && <p className="text-sm text-gray-400 italic">No hay actividades libres registradas.</p>}

                        {customActivities.map((activity, idx) => (
                            <div key={idx} className="flex gap-2 items-start animate-in fade-in">
                                <select
                                    className="p-2 text-xs border rounded-lg w-24 bg-white"
                                    value={activity.category}
                                    onChange={e => {
                                        const newActs = [...customActivities];
                                        newActs[idx].category = e.target.value;
                                        setCustomActivities(newActs);
                                    }}
                                >
                                    <option value="Ejercicio">Ejercicio</option>
                                    <option value="Terapia Manual">T. Manual</option>
                                    <option value="Educación">Educación</option>
                                    <option value="Agentes">Agentes</option>
                                </select>
                                <input
                                    className="flex-1 p-2 text-xs border rounded-lg"
                                    placeholder="Nombre (ej. Sentadilla)"
                                    value={activity.name}
                                    onChange={e => {
                                        const newActs = [...customActivities];
                                        newActs[idx].name = e.target.value;
                                        setCustomActivities(newActs);
                                    }}
                                />
                                <input
                                    className="w-1/3 p-2 text-xs border rounded-lg"
                                    placeholder="Dosis (ej. 3x10)"
                                    value={activity.params}
                                    onChange={e => {
                                        const newActs = [...customActivities];
                                        newActs[idx].params = e.target.value;
                                        setCustomActivities(newActs);
                                    }}
                                />
                                <button
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    onClick={() => {
                                        const newActs = customActivities.filter((_, i) => i !== idx);
                                        setCustomActivities(newActs);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Plan / Tasks Update */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm uppercase text-brand-500">Ajuste de Plan (Tareas)</h3>
                        <Button variant="ghost" size="sm" className="text-brand-600 text-xs">
                            <Plus className="w-3 h-3 mr-1" /> Añadir Tarea
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {tasks.map(task => (
                            <div key={task.id} className={cn(
                                "flex items-center justify-between p-3 rounded-lg border transition-all",
                                task.active ? "bg-white border-brand-100" : "bg-gray-50 border-gray-100 opacity-60"
                            )}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={task.active}
                                        onChange={() => toggleTask(task.id)}
                                        className="rounded text-brand-600 focus:ring-brand-500"
                                    />
                                    <span className={cn("text-sm", task.active ? "text-brand-900" : "text-gray-400 line-through")}>{task.label}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-300 hover:text-red-500">
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

        </div >
    );
}
