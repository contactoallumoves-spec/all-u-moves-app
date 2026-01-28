import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Activity, Baby, ArrowRight, ArrowLeft, Check,
    Calendar, User, Heart, Star, Clock, Zap
} from 'lucide-react';
import { PatientService } from '../../services/patientService';
import { ADMIN_PHOTO } from '../../assets/adminPhoto';
import { BodyMap } from '../../components/clinical/BodyMap';

// --- Schema Definition ---
const preAdmissionSchema = z.object({
    // 1. Identificación
    firstName: z.string().min(2, 'Tu nombre es importante'),
    lastName: z.string().min(2, 'Tu apellido es importante'),
    rut: z.string().min(8, 'RUT inválido'),
    phone: z.string().min(8, 'Teléfono de contacto'),
    email: z.string().email('Email inválido'),
    birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
    insurance: z.enum(['fonasa', 'isapre', 'particular'], { required_error: "Selecciona tu previsión" }),
    occupation: z.string().optional(),

    // 2. Motivo & Historia
    reason: z.string().min(5, 'Cuéntanos brevemente qué te pasa'),
    chronicity: z.string().optional(), // [NEW] Timeline
    story: z.string().optional(),
    symptoms: z.array(z.string()).optional(),

    // 3. Clinical - GynObs
    isMother: z.boolean().default(false),
    gynObs: z.object({
        gestations: z.number().min(0).default(0),
        births: z.number().min(0).default(0),
        cesareans: z.number().min(0).default(0),
        abortions: z.number().optional(),
        menopause: z.boolean().default(false),
        episiotomy: z.boolean().default(false),
        surgeries: z.string().optional(),
    }),

    // 4. Clinical - Habits
    habits: z.object({
        waterIntake: z.string().optional(),
        activityLevel: z.string().optional(),
        digestion: z.string().optional(),
        sleepQuality: z.string().optional(),
        stressLevel: z.number().min(0).max(10).default(5), // [NEW] Stress
    }),

    // 5. Clinical - Body Map
    bodyMap: z.object({
        painRegions: z.array(z.string()).default([]),
        painType: z.string().optional(),
    }),

    // 6. Clinical - Pain Level
    painLevel: z.number().min(0).max(10),
    redFlags: z.array(z.string()).optional(),

    // 7. Goals
    expectations: z.string().optional(),
});

type PreAdmissionData = z.infer<typeof preAdmissionSchema>;

const PreAdmissionPage: React.FC = () => {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Aurora Background Logic
    const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setBgPos({
                x: (e.clientX / window.innerWidth) * 20,
                y: (e.clientY / window.innerHeight) * 20
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const { control, register, handleSubmit, formState: { errors }, trigger, watch, setValue } = useForm<PreAdmissionData>({
        resolver: zodResolver(preAdmissionSchema),
        mode: 'onChange',
        defaultValues: {
            painLevel: 0,
            isMother: false,
            gynObs: { gestations: 0, births: 0, cesareans: 0, menopause: false },
            redFlags: [],
            symptoms: [],
            bodyMap: { painRegions: [] },
            habits: { stressLevel: 5 }
        }
    });

    const watchIsMother = watch('isMother');
    const watchSymptoms = watch('symptoms') || [];
    const watchRedFlags = watch('redFlags') || [];
    const watchStress = watch('habits.stressLevel');

    // --- Steps Configuration ---
    const steps = [
        { id: 'welcome', type: 'intro' },
        { id: 'name', type: 'question', fields: ['firstName', 'lastName'] },
        { id: 'rut_contact', type: 'question', fields: ['rut', 'phone', 'email'] },
        { id: 'insurance', type: 'question', fields: ['insurance', 'birthDate', 'occupation'] },
        { id: 'reason', type: 'question', fields: ['reason', 'story', 'symptoms'] },
        { id: 'chronicity', type: 'question', fields: ['chronicity'] }, // [NEW]
        { id: 'gyn_obs', type: 'question', fields: ['isMother', 'gynObs.menopause', 'gynObs.surgeries'] },
        { id: 'habits', type: 'question', fields: ['habits'] },
        { id: 'body_map', type: 'question', fields: ['bodyMap'] },
        { id: 'pain', type: 'question', fields: ['painLevel'] },
        { id: 'red_flags', type: 'question', fields: ['redFlags'] },
        { id: 'expectations', type: 'question', fields: ['expectations'] },
        { id: 'finish', type: 'outro' }
    ];

    const currentStepObj = steps[step];
    const progress = ((step + 1) / steps.length) * 100;

    const nextStep = async () => {
        if (currentStepObj.fields) {
            const isValid = await trigger(currentStepObj.fields as any);
            if (!isValid) return;
        }
        if (step < steps.length - 1) setStep(s => s + 1);
        else handleSubmit(onSubmit)();
    };

    const prevStep = () => {
        if (step > 0) setStep(s => s - 1);
    };

    const onSubmit = async (data: PreAdmissionData) => {
        setIsSubmitting(true);
        try {
            let finalReason = data.reason;
            if (data.symptoms && data.symptoms.length > 0) {
                finalReason += `\n\n[Síntomas Frecuentes]: ${data.symptoms.join(', ')}`;
            }

            // Map data to preserve new fields
            const submissionData = {
                ...data,
                reason: finalReason,
                clinicalData: {
                    painChronicity: data.chronicity,
                    gynObs: data.gynObs,
                    habits: data.habits,
                    bodyMap: data.bodyMap,
                    redFlags: data.redFlags
                }
            };

            // Note: PatientService handles mapping internally, but passing structured clinicalData helps 
            // if we update PatientService to simply spread it. For now, it might be lost if PatientService 
            // strictly picks known fields only. I'm relying on PatientService mapping `data.habits` etc.

            await PatientService.createProspective(submissionData);
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            alert('Hubo un error al guardar. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSelection = (field: 'symptoms' | 'redFlags', value: string) => {
        const current = field === 'symptoms' ? watchSymptoms : watchRedFlags;
        const newSelection = current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value];
        setValue(field, newSelection);
    };

    // --- Options Support ---
    const SPECIFIC_SYMPTOMS = [
        { id: 'Incontinencia de orina', label: 'Incontinencia (Escape)' },
        { id: 'Dolor relaciones', label: 'Dolor en relaciones' },
        { id: 'Bulto vaginal', label: 'Sensación de peso/bulto' },
        { id: 'Estreñimiento', label: 'Estreñimiento' },
        { id: 'Dolor lumbar', label: 'Dolor Lumbar' },
        { id: 'Diástasis', label: 'Diástasis' },
        { id: 'Cicatriz dolorosa', label: 'Cicatriz dolorosa' }
    ];

    const RED_FLAGS_LIST = [
        { id: 'Anestesia silla de montar', label: 'Pérdida de sensibilidad genital' },
        { id: 'Perdida control esfinteres', label: 'Pérdida de control esfínteres reciente' },
        { id: 'Sangrado post-menopausia', label: 'Sangrado vaginal post-menopausia' },
        { id: 'Fiebre dolor pelvico', label: 'Fiebre asociada al dolor' },
        { id: 'Perdida peso', label: 'Pérdida de peso inexplicable' }
    ];

    const CHRONICITY_OPTIONS = [
        { value: 'agudo_re', label: 'Empezó hace poco', sub: 'Unos días o semanas' },
        { value: 'agudo_per', label: 'Lleva un tiempo', sub: '1 a 3 meses' },
        { value: 'cronico', label: 'Es crónico', sub: 'Más de 3 meses' },
        { value: 'recurrente', label: 'Va y viene', sub: 'Desde hace años' },
    ];

    if (isSuccess) return (
        <div className="min-h-screen bg-brand-50/50 flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden relative">
            {/* Success Aurora */}
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none overflow-hidden blur-3xl z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-200 animate-pulse mix-blend-multiply filter blur-3xl opacity-70"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-100 animate-pulse mix-blend-multiply filter blur-3xl opacity-70 delay-1000"></div>
            </div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-xl max-w-lg space-y-6 relative overflow-hidden text-brand-900 border border-white/50 z-10"
            >
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-brand-100 shadow-sm relative z-10">
                    <img src={ADMIN_PHOTO} alt="Admin" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-3xl font-serif font-bold mb-2">¡Gracias!</h2>
                    <p className="text-gray-600 text-lg">
                        "He recibido tus antecedentes. Estoy analizando tu caso para preparar nuestra primera sesión."
                    </p>
                </div>
                <div className="pt-4">
                    <p className="font-medium text-brand-700">- Fernanda Rojas Cruz</p>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-50/30 flex flex-col font-sans text-gray-800 overflow-hidden relative">
            {/* Dynamic Aurora Background */}
            <div
                className="fixed top-0 left-0 w-[120%] h-[120%] opacity-40 pointer-events-none overflow-hidden blur-3xl -z-10 transition-transform duration-[2000ms] ease-out will-change-transform"
                style={{ transform: `translate(-${bgPos.x}px, -${bgPos.y}px)` }}
            >
                <div className="absolute top-[-10%] right-[-10%] w-[80vh] h-[80vh] rounded-full bg-brand-200/50 mix-blend-multiply"></div>
                <div className="absolute bottom-[10%] left-[-20%] w-[70vh] h-[70vh] rounded-full bg-brand-100/60 mix-blend-multiply"></div>
                <div className="absolute top-[40%] left-[30%] w-[50vh] h-[50vh] rounded-full bg-pink-50/50 mix-blend-multiply"></div>
            </div>

            {/* Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-100/50 z-50 backdrop-blur-sm">
                <motion.div className="h-full bg-gradient-to-r from-brand-400 to-brand-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <main className="flex-grow flex items-center justify-center p-4 sm:p-8 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Custom easing
                        className="w-full max-w-2xl"
                    >
                        {/* 0. WELCOME */}
                        {steps[step].id === 'welcome' && (
                            <div className="text-center space-y-8">
                                <h1 className="text-4xl md:text-7xl font-bold font-serif text-brand-900 leading-tight drop-shadow-sm">
                                    All U Moves
                                </h1>
                                <p className="text-xl md:text-2xl text-gray-600 max-w-lg mx-auto font-light leading-relaxed">
                                    Experiencia clínica de alto nivel, diseñada para ti.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={nextStep}
                                    className="px-10 py-5 bg-brand-900 text-white rounded-full text-xl font-medium shadow-2xl hover:shadow-brand-900/30 transition-all flex items-center mx-auto gap-2 group"
                                >
                                    Comenzar <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </div>
                        )}

                        {/* NAME */}
                        {steps[step].id === 'name' && (
                            <div className="space-y-10 text-center md:text-left">
                                <div className="space-y-2">
                                    <h2 className="text-4xl md:text-5xl font-bold text-brand-900 font-serif">Hola.</h2>
                                    <p className="text-gray-500 text-xl font-light">¿Cuál es tu nombre?</p>
                                </div>
                                <div className="space-y-6">
                                    <input {...register('firstName')} placeholder="Nombre" className="w-full text-3xl md:text-4xl p-4 border-b-2 border-brand-100 focus:border-brand-600 outline-none bg-transparent placeholder-brand-200 transition-colors font-serif text-brand-800" autoFocus />
                                    <input {...register('lastName')} placeholder="Apellido" className="w-full text-3xl md:text-4xl p-4 border-b-2 border-brand-100 focus:border-brand-600 outline-none bg-transparent placeholder-brand-200 transition-colors font-serif text-brand-800" />
                                </div>
                            </div>
                        )}

                        {/* INSURANCE (PROFILE) */}
                        {steps[step].id === 'insurance' && (
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold text-brand-900 font-serif">Tu Perfil</h2>
                                <div className="space-y-6 bg-white/60 p-6 rounded-3xl border border-white shadow-lg backdrop-blur-sm">
                                    <div>
                                        <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">Previsión</label>
                                        <div className="flex gap-4">
                                            {['fonasa', 'isapre', 'particular'].map((opt) => (
                                                <button key={opt} type="button"
                                                    className={`flex-1 p-4 rounded-2xl text-lg font-medium capitalize transition-all border ${watch('insurance') === opt
                                                        ? 'bg-brand-900 text-white border-brand-900 shadow-xl scale-105'
                                                        : 'bg-white text-gray-400 border-gray-100 hover:border-brand-200'}`}
                                                    onClick={() => setValue('insurance', opt as any)}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">Nacimiento</label>
                                            <input {...register('birthDate')} type="date" className="w-full text-lg p-4 rounded-xl border border-gray-100 bg-white/80 focus:ring-2 focus:ring-brand-200 outline-none text-brand-900" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">Ocupación</label>
                                            <input {...register('occupation')} placeholder="Ej. Abogada..." className="w-full text-lg p-4 rounded-xl border border-gray-100 bg-white/80 focus:ring-2 focus:ring-brand-200 outline-none text-brand-900" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONTACT */}
                        {steps[step].id === 'rut_contact' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900 font-serif">Contacto</h2>
                                <div className="space-y-4 bg-white/60 p-6 rounded-3xl border border-white shadow-lg backdrop-blur-sm">
                                    <input {...register('rut')} placeholder="RUT (12.345.678-9)" className="w-full text-lg p-4 rounded-xl border border-gray-100 bg-white/80 focus:ring-2 focus:ring-brand-200 outline-none" />
                                    <input {...register('phone')} placeholder="Teléfono (+569...)" type="tel" className="w-full text-lg p-4 rounded-xl border border-gray-100 bg-white/80 focus:ring-2 focus:ring-brand-200 outline-none" />
                                    <input {...register('email')} placeholder="Email" type="email" className="w-full text-lg p-4 rounded-xl border border-gray-100 bg-white/80 focus:ring-2 focus:ring-brand-200 outline-none" />
                                </div>
                            </div>
                        )}

                        {/* REASON */}
                        {steps[step].id === 'reason' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900 font-serif">¿Qué sientes?</h2>
                                <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-lg backdrop-blur-sm space-y-4">
                                    <textarea {...register('reason')} rows={2} placeholder="Descríbelo en tus palabras..." className="w-full text-2xl p-0 border-none bg-transparent placeholder-brand-200/70 focus:ring-0 resize-none font-serif text-brand-900" autoFocus />
                                    <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent"></div>

                                    {/* Specific Symptoms Chips */}
                                    <div>
                                        <label className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-3 block">Accesos Rápidos</label>
                                        <div className="flex flex-wrap gap-2">
                                            {SPECIFIC_SYMPTOMS.map((symptom) => {
                                                const isSelected = watchSymptoms.includes(symptom.id);
                                                return (
                                                    <button key={symptom.id} type="button"
                                                        onClick={() => toggleSelection('symptoms', symptom.id)}
                                                        className={`px-3 py-2 rounded-lg text-sm transition-all border ${isSelected ? 'bg-brand-100/50 text-brand-800 border-brand-200' : 'bg-white/50 text-gray-500 border-transparent hover:bg-white'
                                                            }`}
                                                    >
                                                        {symptom.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CHRONICITY [NEW] */}
                        {steps[step].id === 'chronicity' && (
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold text-brand-900 font-serif flex items-center gap-2">
                                    <Clock className="w-8 h-8 text-brand-400" />
                                    Cronología
                                </h2>
                                <p className="text-xl text-gray-500">¿Hace cuánto tiempo sientes esto?</p>

                                <div className="grid gap-4">
                                    {CHRONICITY_OPTIONS.map((opt) => (
                                        <button key={opt.value} type="button"
                                            onClick={() => setValue('chronicity', opt.value)}
                                            className={`p-5 rounded-2xl text-left transition-all border group relative overflow-hidden ${watch('chronicity') === opt.value
                                                    ? 'bg-brand-900 text-white border-brand-900 shadow-2xl scale-[1.02]'
                                                    : 'bg-white text-gray-500 border-gray-100 hover:bg-brand-50'
                                                }`}
                                        >
                                            <div className="relative z-10 flex justify-between items-center">
                                                <div>
                                                    <div className={`text-lg font-bold ${watch('chronicity') === opt.value ? 'text-white' : 'text-brand-900'}`}>{opt.label}</div>
                                                    <div className={`text-sm ${watch('chronicity') === opt.value ? 'text-brand-200' : 'text-gray-400'}`}>{opt.sub}</div>
                                                </div>
                                                {watch('chronicity') === opt.value && <Check className="w-6 h-6 text-brand-200" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* GYNOBS */}
                        {steps[step].id === 'gyn_obs' && (
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold text-brand-900 font-serif flex items-center gap-2">
                                    <Baby className="w-8 h-8 text-brand-400" />
                                    Maternidad
                                </h2>
                                <div className="bg-white/60 p-8 rounded-3xl border border-white shadow-lg backdrop-blur-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-medium text-brand-900">¿Eres madre?</span>
                                        <div className="flex bg-gray-100/50 p-1 rounded-xl">
                                            <button type="button" onClick={() => setValue('isMother', false)} className={`px-6 py-2 rounded-lg font-bold transition-all ${!watchIsMother ? 'bg-white shadow text-brand-900' : 'text-gray-400'}`}>No</button>
                                            <button type="button" onClick={() => setValue('isMother', true)} className={`px-6 py-2 rounded-lg font-bold transition-all ${watchIsMother ? 'bg-white shadow text-brand-900' : 'text-gray-400'}`}>Sí</button>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {watchIsMother && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 pt-4 border-t border-gray-100 overflow-hidden">
                                                <div className="grid grid-cols-3 gap-3">
                                                    {['Partos', 'Cesáreas', 'Pérdidas'].map((label, i) => {
                                                        const field = i === 0 ? 'gynObs.births' : i === 1 ? 'gynObs.cesareans' : 'gynObs.abortions';
                                                        return (
                                                            <div key={label} className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
                                                                <input {...register(field as any, { valueAsNumber: true })} type="number" min="0" className="w-full text-center font-bold text-xl text-brand-900 outline-none bg-transparent" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div className="flex items-center gap-3 pt-2">
                                        <input type="checkbox" {...register('gynObs.menopause')} className="w-5 h-5 accent-brand-600" />
                                        <span className="text-gray-600">Menopausia</span>
                                    </div>
                                    <input {...register('gynObs.surgeries')} placeholder="Cirugías Previas (Opcional)" className="w-full p-4 rounded-xl bg-gray-50/50 border-none outline-none focus:bg-white transition-colors" />
                                </div>
                            </div>
                        )}

                        {/* HABITS & STRESS */}
                        {steps[step].id === 'habits' && (
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold text-brand-900 font-serif">Estilo de Vida</h2>
                                <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-lg backdrop-blur-sm space-y-6">
                                    {/* Stress Slider [NEW] */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="font-bold text-brand-800 text-sm flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-brand-400" /> Nivel de Estrés / Cansancio
                                            </label>
                                            <span className="text-2xl font-black text-brand-600">{watchStress}</span>
                                        </div>
                                        <input type="range" min="0" max="10"
                                            {...register('habits.stressLevel', { valueAsNumber: true })}
                                            className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 font-medium">
                                            <span>Zen</span>
                                            <span>Burnout</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-gray-100"></div>
                                    {/* Simple Selects for others */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Agua', 'Actividad', 'Digestión', 'Sueño'].map((label, i) => {
                                            const field = i === 0 ? 'habits.waterIntake' : i === 1 ? 'habits.activityLevel' : i === 2 ? 'habits.digestion' : 'habits.sleepQuality';
                                            const options = i === 0 ? ['Baja', 'Normal', 'Alta'] : i === 1 ? ['Sedentaria', 'Ligera', 'Activa'] : i === 2 ? ['Normal', 'Estreñimiento'] : ['Bien', 'Regular', 'Mal'];
                                            return (
                                                <div key={label} className="space-y-1">
                                                    <label className="text-xs font-bold text-gray-400 uppercase">{label}</label>
                                                    <select {...register(field as any)} className="w-full p-2 rounded-lg bg-white border border-gray-100 text-sm font-medium text-brand-900 outline-none">
                                                        <option value="">...</option>
                                                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BODY MAP */}
                        {steps[step].id === 'body_map' && (
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold text-brand-900 font-serif text-center">Mapa Corporal</h2>
                                <div className="transform scale-90 sm:scale-100 transition-transform">
                                    <Controller
                                        name="bodyMap"
                                        control={control}
                                        render={({ field }) => (
                                            <BodyMap
                                                value={field.value}
                                                onChange={(val) => field.onChange(val)}
                                                containerClassName="relative w-full overflow-hidden bg-brand-50/50 rounded-3xl border border-white shadow-xl flex items-center justify-center transition-all backdrop-blur-sm"
                                                bodyFill="#946353"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {/* PAIN */}
                        {steps[step].id === 'pain' && (
                            <div className="space-y-8 text-center">
                                <h2 className="text-4xl font-bold text-brand-900 font-serif flex items-center justify-center gap-2">
                                    <Activity className="w-8 h-8 text-brand-400" /> Molestia
                                </h2>
                                <div className="space-y-6 max-w-sm mx-auto p-8 rounded-full bg-white/50 border border-white shadow-xl backdrop-blur-sm">
                                    <div className="text-9xl font-black text-brand-900 tracking-tighter">
                                        {watch('painLevel')}
                                    </div>
                                    <input
                                        type="range" min="0" max="10"
                                        {...register('painLevel', { valueAsNumber: true })}
                                        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-900"
                                    />
                                </div>
                            </div>
                        )}

                        {/* RED FLAGS */}
                        {steps[step].id === 'red_flags' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900 font-serif flex items-center gap-2">
                                    <Shield className="w-8 h-8 text-brand-400" /> Importante
                                </h2>
                                <p className="text-gray-500">Selecciona si presentas alguna de estas condiciones.</p>
                                <div className="grid gap-3">
                                    {RED_FLAGS_LIST.map((flag) => {
                                        const isChecked = watchRedFlags.includes(flag.id);
                                        return (
                                            <div key={flag.id} onClick={() => toggleSelection('redFlags', flag.id)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${isChecked ? 'bg-red-50 border-red-200 text-red-900' : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isChecked ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                                                    {isChecked && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className="font-medium">{flag.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* EXPECTATIONS */}
                        {steps[step].id === 'expectations' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900 font-serif">Objetivo</h2>
                                <div className="relative">
                                    <Star className="absolute top-6 left-6 text-brand-300 w-6 h-6" />
                                    <textarea {...register('expectations')} rows={4} className="w-full text-2xl p-6 pl-16 border-none rounded-3xl bg-white/60 shadow-xl backdrop-blur-sm focus:bg-white transition-all placeholder-brand-200/50 text-brand-900 resize-none outline-none" placeholder="¿Qué esperas lograr?" autoFocus />
                                </div>
                            </div>
                        )}

                        {/* FINISH */}
                        {steps[step].id === 'finish' && (
                            <div className="text-center space-y-10">
                                <h2 className="text-5xl font-bold text-brand-900 font-serif">Todo Listo.</h2>
                                <motion.button
                                    onClick={() => handleSubmit(onSubmit)()}
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-12 py-6 bg-brand-900 text-white rounded-full text-2xl font-bold shadow-2xl hover:shadow-brand-900/50 transition-all flex items-center gap-3 mx-auto"
                                >
                                    {isSubmitting ? 'Enviando...' : (
                                        <>Enviar Ficha <Heart className="w-6 h-6 fill-brand-400 text-brand-400" /></>
                                    )}
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer Nav */}
            {step > 0 && !isSuccess && (
                <div className="fixed bottom-0 left-0 w-full p-6 flex justify-between items-center z-40 max-w-4xl mx-auto left-0 right-0">
                    <button onClick={prevStep} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-brand-900 hover:bg-white/40 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex gap-1.5 opacity-50">
                        {steps.slice(0, -1).map((_, i) => (
                            <motion.div key={i} className={`h-1.5 rounded-full ${i === step ? 'bg-brand-900 w-6' : 'bg-brand-900/20 w-1.5'}`} layout />
                        ))}
                    </div>
                    {step < steps.length - 1 ? (
                        <button onClick={nextStep} className="p-3 bg-brand-900 text-white rounded-full shadow-lg hover:bg-brand-800 transition-colors">
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    ) : <div className="w-12"></div>}
                </div>
            )}
        </div>
    );
};

export default PreAdmissionPage;
