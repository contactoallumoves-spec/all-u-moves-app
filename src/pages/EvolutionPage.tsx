import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PatientService } from '../services/patientService';
import { SessionService } from '../services/sessionService'; // [NEW]
import { EvaluationService } from '../services/evaluationService'; // [NEW]
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Save, Plus, Trash2, CheckSquare, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { Patient, Task } from '../types/patient';

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
    const [location, setLocation] = useState('Consulta Kinesiológica');
    const [manualLocation, setManualLocation] = useState('');

    // Re-assessment State
    const [oxford, setOxford] = useState<number | undefined>(undefined);
    const [tonicity, setTonicity] = useState<string>('');
    const [breathing, setBreathing] = useState<string>('');

    // [NEW] PROMs State
    const [groc, setGroc] = useState<number>(0); // -7 to +7
    const [sane, setSane] = useState<number | ''>(''); // 0-100
    const [psfs, setPsfs] = useState<{ activity: string; score: number }[]>([]);

    // [NEW] PERFECT Scheme State
    const [perfectEndurance, setPerfectEndurance] = useState<number | ''>('');
    const [perfectRepetitions, setPerfectRepetitions] = useState<number | ''>('');
    const [perfectFast, setPerfectFast] = useState<number | ''>('');
    const [perfectElevation, setPerfectElevation] = useState<boolean>(false);
    const [perfectCoContraction, setPerfectCoContraction] = useState<boolean>(false);
    const [perfectTiming, setPerfectTiming] = useState<boolean>(false);

    // Custom Activities [NEW]
    const [customActivities, setCustomActivities] = useState<{ category: string; name: string; params: string }[]>([]);

    // Tasks updates
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        const load = async () => {
            if (patientId) {
                const p = await PatientService.getById(patientId);
                setPatient(p);
                // Load active tasks from patient if not editing an old session
                if (!editId && p?.activeTasks) {
                    setTasks(p.activeTasks);
                }

                // [NEW] Load PSFS activities from last Complete Evaluation
                if (!editId) {
                    try {
                        const evals = await EvaluationService.getByPatientId(patientId);
                        const lastComplete = evals.find(e => e.type === 'complete');
                        if (lastComplete && lastComplete.details?.functional?.psfs) {
                            // Initialize with previous activities but score 0 (or empty?)
                            setPsfs(lastComplete.details.functional.psfs.map((item: any) => ({
                                activity: item.activity,
                                score: item.score // Start with last score as reference? Or 0? Let's use last score as reference
                            })));
                        } else if (lastComplete && lastComplete.details?.functionalScales?.psfs) {
                            // Fallback for new structure
                            setPsfs(lastComplete.details.functionalScales.psfs.map((item: any) => ({
                                activity: item.activity,
                                score: item.score
                            })));
                        }
                    } catch (err) {
                        console.error("Error loading previous evaluation metrics", err);
                    }
                }
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
                    if (s.location) {
                        if (['Consulta Kinesiológica', 'Online'].includes(s.location)) {
                            setLocation(s.location);
                        } else if (s.location.startsWith('Domicilio')) {
                            setLocation('Domicilio');
                            // Parse "Domicilio: Address" or just "Domicilio"
                            const detail = s.location.includes(':') ? s.location.split(':')[1]?.trim() : '';
                            setManualLocation(detail || '');
                        } else {
                            setLocation('manual');
                            setManualLocation(s.location);
                        }
                    }

                    if (s.reassessment) {
                        setOxford(s.reassessment.oxford);
                        setTonicity(s.reassessment.tonicity || '');
                        setBreathing(s.reassessment.breating || '');
                        if (s.reassessment.psfs) setPsfs(s.reassessment.psfs);
                    }
                    if (s.proms) {
                        setGroc(s.proms.groc || 0);
                        setSane(s.proms.sane ?? '');
                    }
                    if (s.perfectScheme) {
                        setOxford(s.perfectScheme.power);
                        setPerfectEndurance(s.perfectScheme.endurance || '');
                        setPerfectRepetitions(s.perfectScheme.repetitions || '');
                        setPerfectFast(s.perfectScheme.fast || '');
                        setPerfectElevation(s.perfectScheme.elevation || false);
                        setPerfectCoContraction(s.perfectScheme.coContraction || false);
                        setPerfectTiming(s.perfectScheme.timing || false);
                    }
                    if (s.tasks) {
                        // Map legacy tasks to new format if needed
                        const formattedTasks = s.tasks.map((t: any) => ({
                            id: t.id,
                            description: t.description || t.label || '',
                            frequency: t.frequency || '',
                            completed: t.completed || t.active || false
                        }));
                        setTasks(formattedTasks);
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

    // Task Handlers
    const handleAddTask = () => {
        setTasks([...tasks, {
            id: Date.now().toString(),
            description: '',
            frequency: '',
            completed: false
        }]);
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handleUpdateTask = (taskId: string, field: keyof Task, value: any) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, [field]: value } : t
        ));
    };

    const handleSave = async () => {
        if (!patientId) return;

        try {
            // 1. Update Patient's Active Plan
            await PatientService.update(patientId, {
                activeTasks: tasks
            });

            // 2. Save Session
            const dataToSave = {
                notes,
                interventions,
                interventionDetails, // Save details
                customActivities, // [NEW] Save custom rows
                symptomsScore,
                adherence,
                location: location === 'manual' ? manualLocation : (location === 'Domicilio' && manualLocation ? `Domicilio: ${manualLocation}` : location),
                reassessment: {
                    oxford,
                    tonicity,
                    breating: breathing,
                    pain: symptomsScore,
                    psfs // [NEW]
                },
                proms: { // [NEW]
                    groc,
                    sane: sane === '' ? undefined : Number(sane)
                },
                perfectScheme: {
                    power: oxford || 0,
                    endurance: Number(perfectEndurance) || 0,
                    repetitions: Number(perfectRepetitions) || 0,
                    fast: Number(perfectFast) || 0,
                    elevation: perfectElevation,
                    coContraction: perfectCoContraction,
                    timing: perfectTiming
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

    const handleCopyLastSession = async () => {
        if (!patientId) return;
        try {
            const sessions = await SessionService.getByPatientId(patientId);
            if (sessions.length === 0) {
                alert("No hay sesiones anteriores para copiar.");
                return;
            }
            // Sort to find latest
            const sorted = sessions.sort((a, b) => {
                const dateA = a.date instanceof Date ? a.date : new Date(a.date.seconds * 1000);
                const dateB = b.date instanceof Date ? b.date : new Date(b.date.seconds * 1000);
                return dateB.getTime() - dateA.getTime();
            });
            const last = sorted[0];

            // Copy Interventions
            setInterventions(last.interventions || []);
            setInterventionDetails(last.interventionDetails || {});

            // Copy Custom Activities
            setCustomActivities(last.customActivities || []);

            // Copy Location
            if (last.location) {
                if (['Consulta Kinesiológica', 'Online'].includes(last.location)) {
                    setLocation(last.location);
                } else if (last.location.startsWith('Domicilio')) {
                    setLocation('Domicilio');
                    const detail = last.location.includes(':') ? last.location.split(':')[1]?.trim() : '';
                    setManualLocation(detail || '');
                } else {
                    setLocation('manual');
                    setManualLocation(last.location);
                }
            }

            // Copy PERFECT Scheme
            if (last.perfectScheme) {
                setOxford(last.perfectScheme.power);
                setPerfectEndurance(last.perfectScheme.endurance || '');
                setPerfectRepetitions(last.perfectScheme.repetitions || '');
                setPerfectFast(last.perfectScheme.fast || '');
                setPerfectElevation(last.perfectScheme.elevation || false);
                setPerfectCoContraction(last.perfectScheme.coContraction || false);
                setPerfectTiming(last.perfectScheme.timing || false);
            }

            alert(`✅ Datos cargados de la sesión del ${last.date instanceof Date ? last.date.toLocaleDateString() : 'fecha desconocida'}`);

        } catch (error) {
            console.error(error);
            alert("Error al copiar sesión anterior");
        }
    };

    const handleCopyHomePlan = async () => {
        if (!patientId) return;
        try {
            const sessions = await SessionService.getByPatientId(patientId);
            if (sessions.length === 0) {
                alert("No hay sesiones anteriores para copiar el plan.");
                return;
            }
            // Sort to find latest
            const sorted = sessions.sort((a, b) => {
                const dateA = a.date instanceof Date ? a.date : new Date(a.date.seconds * 1000);
                const dateB = b.date instanceof Date ? b.date : new Date(b.date.seconds * 1000);
                return dateB.getTime() - dateA.getTime();
            });
            const last = sorted[0];

            if (last.tasks && last.tasks.length > 0) {
                const formattedTasks = last.tasks.map((t: any) => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // New IDs to avoid conflict
                    description: t.description || t.label || '',
                    frequency: t.frequency || '',
                    completed: false
                }));
                setTasks(formattedTasks);
                alert(`✅ Plan de hogar copiado (${formattedTasks.length} tareas)`);
            } else {
                alert("La última sesión no tenía tareas de hogar asignadas.");
            }

        } catch (error) {
            console.error(error);
            alert("Error al copiar plan de hogar");
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

                    {/* Quick Action: Copy Last Session */}
                    {!editId && (
                        <div className="flex justify-center mt-2 gap-2">
                            <button
                                onClick={handleCopyLastSession}
                                className="flex items-center gap-1 text-[10px] bg-brand-50 text-brand-600 px-2 py-1 rounded-full border border-brand-100 hover:bg-brand-100 transition-colors"
                            >
                                <Copy className="w-3 h-3" /> Repetir Última Sesión
                            </button>
                        </div>
                    )}

                    {/* Location Selector */}
                    <div className="flex justify-center gap-2 mt-2">
                        <select
                            className="text-xs p-1 bg-white border border-brand-200 rounded-lg outline-none text-brand-700"
                            value={location}
                            onChange={(e) => {
                                setLocation(e.target.value);
                                setManualLocation('');
                            }}
                        >
                            <option value="Consulta Kinesiológica">Consulta Kinesiológica</option>
                            <option value="Domicilio">Domicilio</option>
                            <option value="Online">Online</option>
                            <option value="manual">Otro (Escribir)...</option>
                        </select>
                        {(location === 'manual' || location === 'Domicilio') && (
                            <input
                                className="text-xs p-1 border-b border-brand-300 outline-none w-48"
                                placeholder={location === 'Domicilio' ? "Dirección del domicilio..." : "Escribir lugar..."}
                                value={manualLocation}
                                onChange={(e) => setManualLocation(e.target.value)}
                            />
                        )}
                    </div>
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

            {/* [NEW] PROMs Card */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h3 className="font-bold text-sm uppercase text-brand-500">Resultados Reportados (PROMs)</h3>

                    {/* GROC */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-700 block">Cambio Global (GROC):</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range" min="-7" max="7" step="1"
                                className="w-full accent-brand-600"
                                value={groc} onChange={e => setGroc(Number(e.target.value))}
                            />
                            <div className="w-16 text-center">
                                <span className={cn(
                                    "text-lg font-bold block",
                                    groc > 0 ? "text-green-600" : groc < 0 ? "text-red-600" : "text-gray-500"
                                )}>
                                    {groc > 0 ? `+${groc}` : groc}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 italic">
                            {groc === -7 ? "Muchísimo peor" :
                                groc === -3 ? "Algo peor" :
                                    groc === 0 ? "Sin cambios" :
                                        groc === 3 ? "Algo mejor" :
                                            groc === 7 ? "Muchísimo mejor" : ""}
                        </p>
                    </div>

                    {/* SANE */}
                    <div className="flex items-center gap-4 pt-2 border-t border-dashed">
                        <label className="text-sm font-medium text-brand-700 w-1/3">SANE (% Normalidad):</label>
                        <input
                            type="number" min="0" max="100"
                            className="w-24 p-2 text-center border rounded-lg font-bold text-brand-800"
                            placeholder="%"
                            value={sane}
                            onChange={e => setSane(Number(e.target.value))}
                        />
                        <span className="text-xs text-gray-400">(0% Peor - 100% Mejor)</span>
                    </div>

                    {/* PSFS Re-eval */}
                    {psfs.length > 0 && (
                        <div className="pt-2 border-t border-dashed">
                            <h4 className="font-bold text-sm text-brand-600 mb-2">Re-evaluación PSFS</h4>
                            <div className="space-y-2">
                                {psfs.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-brand-50 p-2 rounded-lg">
                                        <span className="text-sm text-brand-900 flex-1">{item.activity}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">Nota:</span>
                                            <input
                                                type="number" min="0" max="10"
                                                className="w-16 p-1 text-center border rounded font-bold"
                                                value={item.score}
                                                onChange={(e) => {
                                                    const newPsfs = [...psfs];
                                                    newPsfs[idx].score = Number(e.target.value);
                                                    setPsfs(newPsfs);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                    {/* PERFECT Scheme Section */}
                    <div className="pt-4 border-t border-dashed mt-4">
                        <h3 className="font-bold text-sm uppercase text-brand-600 mb-3">Evaluación PERFECT</h3>
                        <div className="bg-brand-50/50 p-4 rounded-xl border border-brand-100 space-y-4">
                            {/* P = Oxide (Already above, maybe link visually?) */}
                            <div className="flex items-center justify-between text-xs text-brand-400 uppercase tracking-widest font-bold mb-2">
                                <span>Esquema Completo</span>
                                <span>P: {oxford || '-'} / 5</span>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {/* Endurance */}
                                <div>
                                    <label className="text-xs font-bold text-brand-700 block mb-1">E (Resistencia)</label>
                                    <div className="relative">
                                        <input
                                            type="number" min="0" max="99"
                                            className="w-full p-2 pl-3 pr-8 text-sm border rounded-lg font-bold text-center"
                                            value={perfectEndurance}
                                            onChange={(e) => setPerfectEndurance(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                        <span className="absolute right-2 top-2 text-xs text-gray-400">seg</span>
                                    </div>
                                </div>
                                {/* Repetitions */}
                                <div>
                                    <label className="text-xs font-bold text-brand-700 block mb-1">R (Repeticiones)</label>
                                    <input
                                        type="number" min="0" max="99"
                                        className="w-full p-2 text-sm border rounded-lg font-bold text-center"
                                        value={perfectRepetitions}
                                        onChange={(e) => setPerfectRepetitions(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                </div>
                                {/* Fast */}
                                <div>
                                    <label className="text-xs font-bold text-brand-700 block mb-1">F (Rápidas)</label>
                                    <input
                                        type="number" min="0" max="99"
                                        className="w-full p-2 text-sm border rounded-lg font-bold text-center"
                                        value={perfectFast}
                                        onChange={(e) => setPerfectFast(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* ECT Switches */}
                            <div className="flex justify-between gap-2 pt-2">
                                {/* Elevation */}
                                <button
                                    onClick={() => setPerfectElevation(!perfectElevation)}
                                    className={cn(
                                        "flex-1 p-2 rounded-lg border text-xs font-bold transition-all",
                                        perfectElevation ? "bg-green-100 border-green-300 text-green-800" : "bg-white border-gray-200 text-gray-400"
                                    )}
                                >
                                    E (Elevación)
                                </button>
                                {/* Co-contraction */}
                                <button
                                    onClick={() => setPerfectCoContraction(!perfectCoContraction)}
                                    className={cn(
                                        "flex-1 p-2 rounded-lg border text-xs font-bold transition-all",
                                        perfectCoContraction ? "bg-green-100 border-green-300 text-green-800" : "bg-white border-gray-200 text-gray-400"
                                    )}
                                >
                                    C (Co-cont.)
                                </button>
                                {/* Timing */}
                                <button
                                    onClick={() => setPerfectTiming(!perfectTiming)}
                                    className={cn(
                                        "flex-1 p-2 rounded-lg border text-xs font-bold transition-all",
                                        perfectTiming ? "bg-green-100 border-green-300 text-green-800" : "bg-white border-gray-200 text-gray-400"
                                    )}
                                >
                                    T (Timing)
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent >
            </Card >

            {/* Objective / Interventions (The "Clicks") */}
            < Card >
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
            </Card >

            {/* [NEW] Custom Activities / Flexible Exercises */}
            < Card >
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
            </Card >

            {/* Plan / Tasks Update */}
            < Card >
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm uppercase text-brand-500">Ajuste de Plan (Hogar)</h3>
                        <div className="flex gap-2">
                            {/* Copy Home Plan Button */}
                            {!editId && (
                                <button
                                    onClick={handleCopyHomePlan}
                                    className="px-2 py-1 text-[10px] bg-brand-50 text-brand-600 rounded-full border border-brand-100 hover:bg-brand-100 transition-colors flex items-center gap-1"
                                    title="Copiar tareas de hogar de la última sesión"
                                >
                                    <Copy className="w-3 h-3" /> Repetir Último Plan
                                </button>
                            )}
                            <Button variant="ghost" size="sm" className="text-brand-600 text-xs" onClick={handleAddTask}>
                                <Plus className="w-3 h-3 mr-1" /> Añadir Tarea
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {tasks.length === 0 && <p className="text-sm text-gray-400 italic">No hay tareas asignadas.</p>}

                        {tasks.map(task => (
                            <div key={task.id} className="flex flex-col gap-2 p-3 rounded-lg border bg-white border-brand-100 shadow-sm animate-in fade-in">
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 p-2 text-sm font-medium border-b border-gray-100 focus:border-brand-500 outline-none"
                                        placeholder="Descripción de la tarea (ej. Ejercicio de Kegel)"
                                        value={task.description}
                                        onChange={(e) => handleUpdateTask(task.id, 'description', e.target.value)}
                                    />
                                    <Button variant="ghost" size="sm" className="text-red-300 hover:text-red-500" onClick={() => handleDeleteTask(task.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className="text-xs text-brand-400">Frecuencia:</span>
                                    <input
                                        className="flex-1 p-1 text-xs bg-gray-50 rounded border border-transparent focus:bg-white focus:border-brand-200 outline-none transition-all"
                                        placeholder="Ej. 3 veces al día, 10 reps"
                                        value={task.frequency}
                                        onChange={(e) => handleUpdateTask(task.id, 'frequency', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card >

        </div >
    );
}
