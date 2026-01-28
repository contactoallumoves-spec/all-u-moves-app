import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Activity, Baby, ArrowRight, ArrowLeft, Check,
    Heart, Star, Clock, Zap
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



    const { control, register, handleSubmit, trigger, watch, setValue } = useForm<PreAdmissionData>({
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
        <div className="min-h-[90vh] flex flex-col font-sans text-[#4A4A4A] overflow-hidden relative bg-[#FDFBF9]">
            {/* Dynamic Aurora Background - Subtle Monochromatic Rose */}
            <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-40 mix-blend-overlay"></div>
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FADADD] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#FBE7E9] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-[#FADADD] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#FBE7E9] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
            </div>

            {/* Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 bg-[#E8E0DC] z-50">
                <motion.div className="h-full bg-[#8C7063]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <main className="flex-grow flex flex-col px-6 pt-16 pb-24 relative z-10 max-w-lg mx-auto w-full justify-center min-h-[600px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        {/* 0. WELCOME */}
                        {steps[step].id === 'welcome' && (
                            <div className="text-center space-y-6">
                                <h1 className="text-5xl font-bold font-serif text-[#4A4A4A] leading-tight">
                                    Hola.
                                </h1>
                                <p className="text-xl text-[#6D6D6D] font-light leading-relaxed">
                                    Experiencia clínica diseñada para ti.
                                </p>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={nextStep}
                                    className="px-8 py-4 bg-[#8C7063] text-white rounded-full text-lg font-medium shadow-lg hover:bg-[#7A6156] transition-all flex items-center mx-auto gap-2 mt-8"
                                >
                                    Comenzar <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        )}

                        {/* NAME */}
                        {steps[step].id === 'name' && (
                            <div className="space-y-8">
                                <div className="space-y-2 text-center">
                                    <h2 className="text-4xl font-bold text-[#4A4A4A] font-serif">Hola.</h2>
                                    <p className="text-[#6D6D6D] text-lg font-light">¿Cuál es tu nombre?</p>
                                </div>
                                <div className="space-y-6 bg-white/70 p-6 rounded-3xl backdrop-blur-md border border-white shadow-sm">
                                    <input {...register('firstName')} placeholder="Nombre" className="w-full text-2xl p-3 border-b border-[#D1D1D1] focus:border-[#8C7063] outline-none bg-transparent placeholder-[#A0A0A0] text-[#4A4A4A]" autoFocus />
                                    <input {...register('lastName')} placeholder="Apellido" className="w-full text-2xl p-3 border-b border-[#D1D1D1] focus:border-[#8C7063] outline-none bg-transparent placeholder-[#A0A0A0] text-[#4A4A4A]" />
                                </div>
                            </div>
                        )}

                        {/* INSURANCE (PROFILE) */}
                        {steps[step].id === 'insurance' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-[#4A4A4A] font-serif mb-2 text-center">Tu Perfil</h2>
                                <div className="space-y-5 bg-white/70 p-6 rounded-3xl border border-white shadow-sm backdrop-blur-md">
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7063] uppercase tracking-widest mb-3 ml-1">Previsión</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['fonasa', 'isapre', 'particular'].map((opt) => (
                                                <button key={opt} type="button"
                                                    className={`p-2.5 rounded-xl text-sm font-medium capitalize transition-all border shadow-sm ${watch('insurance') === opt
                                                        ? 'bg-[#8C7063] text-white border-[#8C7063] shadow-md transform scale-[1.02]'
                                                        : 'bg-white text-[#6D6D6D] border-gray-100 hover:border-[#E0D0C8] hover:bg-[#FAF8F6]'}`}
                                                    onClick={() => setValue('insurance', opt as any)}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-[#8C7063] uppercase tracking-widest mb-3">Nacimiento</label>
                                            <input {...register('birthDate')} type="date" className="w-full text-lg p-4 rounded-xl border border-[#D1D1D1] bg-white/80 focus:ring-2 focus:ring-[#8C7063]/20 outline-none text-[#4A4A4A]" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#8C7063] uppercase tracking-widest mb-3">Ocupación</label>
                                            <input {...register('occupation')} placeholder="Ej. Abogada..." className="w-full text-lg p-4 rounded-xl border border-[#D1D1D1] bg-white/80 focus:ring-2 focus:ring-[#8C7063]/20 outline-none text-[#4A4A4A] placeholder-[#A0A0A0]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONTACT */}
                        {steps[step].id === 'rut_contact' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-[#4A4A4A] font-serif text-center">Contacto</h2>
                                <div className="space-y-4 bg-white/70 p-6 rounded-3xl border border-white shadow-lg backdrop-blur-md">
                                    <input {...register('rut')} placeholder="RUT (12.345.678-9)" className="w-full text-lg p-4 rounded-xl border border-[#D1D1D1] bg-white/80 focus:ring-2 focus:ring-[#8C7063]/20 outline-none text-[#4A4A4A] placeholder-[#A0A0A0]" />
                                    <input {...register('phone')} placeholder="Teléfono (+569...)" type="tel" className="w-full text-lg p-4 rounded-xl border border-[#D1D1D1] bg-white/80 focus:ring-2 focus:ring-[#8C7063]/20 outline-none text-[#4A4A4A] placeholder-[#A0A0A0]" />
                                    <input {...register('email')} placeholder="Email" type="email" className="w-full text-lg p-4 rounded-xl border border-[#D1D1D1] bg-white/80 focus:ring-2 focus:ring-[#8C7063]/20 outline-none text-[#4A4A4A] placeholder-[#A0A0A0]" />
                                </div>
                            </div>
                        )}

                        {/* REASON */}
                        {steps[step].id === 'reason' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-[#4A4A4A] font-serif text-center">¿Qué sientes?</h2>
                                <div className="bg-white/70 p-6 rounded-3xl border border-white shadow-lg backdrop-blur-md space-y-4">
                                    <textarea {...register('reason')} rows={3} placeholder="Descríbelo en tus palabras..." className="w-full text-xl p-4 border border-[#F0EAE6] rounded-xl bg-white/50 placeholder-[#A0A0A0] focus:ring-2 focus:ring-[#8C7063]/20 focus:border-[#8C7063] resize-none font-sans text-[#4A4A4A] outline-none transition-all" autoFocus />

                                    <div className="pt-2">
                                        <label className="text-xs font-bold text-[#8C7063] uppercase tracking-widest mb-3 block ml-1">Accesos Rápidos</label>
                                        <div className="flex flex-wrap gap-2">
                                            {SPECIFIC_SYMPTOMS.map((symptom) => {
                                                const isSelected = watchSymptoms.includes(symptom.id);
                                                return (
                                                    <button key={symptom.id} type="button"
                                                        onClick={() => toggleSelection('symptoms', symptom.id)}
                                                        className={`px-3 py-2 rounded-lg text-sm transition-all border shadow-sm ${isSelected ? 'bg-[#8C7063] text-white border-[#8C7063]' : 'bg-white text-[#6D6D6D] border-gray-100 hover:border-[#E0D0C8] hover:bg-[#FAF8F6]'}`}
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

                        {/* CHRONICITY */}
                        {steps[step].id === 'chronicity' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-[#4A4A4A] font-serif text-center flex items-center justify-center gap-2">
                                    <Clock className="w-8 h-8 text-[#8C7063]" /> Cronología
                                </h2>
                                <p className="text-center text-[#6D6D6D]">¿Hace cuánto tiempo sientes esto?</p>

                                <div className="grid gap-3">
                                    {CHRONICITY_OPTIONS.map((opt) => (
                                        <button key={opt.value} type="button"
                                            onClick={() => setValue('chronicity', opt.value)}
                                            className={`p-4 rounded-2xl text-left transition-all border shadow-sm group ${watch('chronicity') === opt.value
                                                ? 'bg-[#8C7063] text-white border-[#8C7063] shadow-md transform scale-[1.01]'
                                                : 'bg-white text-[#4A4A4A] border-gray-100 hover:bg-[#FAF8F6] hover:border-[#E0D0C8]'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-lg">{opt.label}</div>
                                                    <div className={`text-sm ${watch('chronicity') === opt.value ? 'text-white/80' : 'text-gray-400'}`}>{opt.sub}</div>
                                                </div>
                                                {watch('chronicity') === opt.value && <Check className="w-5 h-5 text-white" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* GYNOBS */}
                        {steps[step].id === 'gyn_obs' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-[#4A4A4A] font-serif text-center flex items-center justify-center gap-2">
                                    <Baby className="w-8 h-8 text-[#8C7063]" /> Maternidad
                                </h2>
                                <div className="bg-white/70 p-6 rounded-3xl border border-white shadow-lg backdrop-blur-md space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-medium text-[#4A4A4A]">¿Eres madre?</span>
                                        <div className="flex bg-[#F0EAE6] p-1 rounded-xl">
                                            <button type="button" onClick={() => setValue('isMother', false)} className={`px-5 py-2 rounded-lg font-bold transition-all ${!watchIsMother ? 'bg-white shadow text-[#8C7063]' : 'text-[#A0A0A0]'}`}>No</button>
                                            <button type="button" onClick={() => setValue('isMother', true)} className={`px-5 py-2 rounded-lg font-bold transition-all ${watchIsMother ? 'bg-white shadow text-[#8C7063]' : 'text-[#A0A0A0]'}`}>Sí</button>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {watchIsMother && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 pt-4 border-t border-[#E8E0DC] overflow-hidden">
                                                <div className="grid grid-cols-3 gap-3">
                                                    {['Partos', 'Cesáreas', 'Pérdidas'].map((label, i) => {
                                                        const field = i === 0 ? 'gynObs.births' : i === 1 ? 'gynObs.cesareans' : 'gynObs.abortions';
                                                        return (
                                                            <div key={label} className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                                                                <label className="block text-xs font-bold text-[#8C7063] uppercase mb-1">{label}</label>
                                                                <input {...register(field as any, { valueAsNumber: true })} type="number" min="0" className="w-full text-center font-bold text-xl text-[#4A4A4A] outline-none bg-transparent" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div className="flex items-center gap-3 pt-2">
                                        <input type="checkbox" {...register('gynObs.menopause')} className="w-5 h-5 accent-[#8C7063]" />
                                        <span className="text-[#6D6D6D]">Menopausia</span>
                                    </div>
                                    <input {...register('gynObs.surgeries')} placeholder="Cirugías Previas (Opcional)" className="w-full p-4 rounded-xl bg-white border border-[#E8E0DC] text-[#4A4A4A] placeholder-[#A0A0A0] outline-none focus:border-[#8C7063] transition-colors" />
                                </div>
                            </div>
                        )}

                        {/* HABITS */}
                        {steps[step].id === 'habits' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-[#4A4A4A] font-serif text-center">Estilo de Vida</h2>
                                <div className="bg-white/70 p-6 rounded-3xl border border-white shadow-lg backdrop-blur-md space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="font-bold text-[#4A4A4A] text-sm flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-[#8C7063]" /> Nivel de Estrés
                                            </label>
                                            <span className="text-2xl font-black text-[#8C7063]">{watchStress}</span>
                                        </div>
                                        <input type="range" min="0" max="10"
                                            {...register('habits.stressLevel', { valueAsNumber: true })}
                                            className="w-full h-2 bg-[#E8E0DC] rounded-full appearance-none cursor-pointer accent-[#8C7063]"
                                        />
                                        <div className="flex justify-between text-xs text-[#A0A0A0] font-medium">
                                            <span>Zen</span>
                                            <span>Burnout</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-[#E8E0DC]"></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Agua', 'Actividad', 'Digestión', 'Sueño'].map((label, i) => {
                                            const field = i === 0 ? 'habits.waterIntake' : i === 1 ? 'habits.activityLevel' : i === 2 ? 'habits.digestion' : 'habits.sleepQuality';
                                            const options = i === 0 ? ['Baja', 'Normal', 'Alta'] : i === 1 ? ['Sedentaria', 'Ligera', 'Activa'] : i === 2 ? ['Normal', 'Estreñimiento'] : ['Bien', 'Regular', 'Mal'];
                                            return (
                                                <div key={label} className="space-y-1">
                                                    <label className="text-xs font-bold text-[#8C7063] uppercase">{label}</label>
                                                    <select {...register(field as any)} className="w-full p-2 rounded-lg bg-white border border-[#E8E0DC] text-sm font-medium text-[#4A4A4A] outline-none">
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
                                <h2 className="text-3xl font-bold text-[#4A4A4A] font-serif text-center">Mapa Corporal</h2>
                                <div className="transform scale-95 sm:scale-100 transition-transform">
                                    <Controller
                                        name="bodyMap"
                                        control={control}
                                        render={({ field }) => (
                                            <BodyMap
                                                value={field.value}
                                                onChange={(val) => field.onChange(val)}
                                                containerClassName="relative w-full overflow-hidden flex items-center justify-center transition-all bg-transparent"
                                                bodyFill="#D4A59A"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {/* PAIN */}
                        {steps[step].id === 'pain' && (
                            <div className="space-y-8 text-center">
                                <h2 className="text-4xl font-bold text-[#4A4A4A] font-serif flex items-center justify-center gap-2">
                                    <Activity className="w-8 h-8 text-[#8C7063]" /> Molestia
                                </h2>
                                <p className="text-[#6D6D6D] text-lg">Del 1 al 10, ¿cuánto te duele hoy?</p>

                                <div className="space-y-8 max-w-sm mx-auto p-10 rounded-[3rem] bg-white border border-white shadow-2xl backdrop-blur-sm relative overflow-hidden">
                                    <div className={`text-9xl font-black tracking-tighter transition-colors duration-300 ${watch('painLevel') < 4 ? 'text-green-500' : watch('painLevel') < 8 ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {watch('painLevel')}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="range" min="0" max="10"
                                            {...register('painLevel', { valueAsNumber: true })}
                                            className="w-full h-3 bg-[#E8E0DC] rounded-full appearance-none cursor-pointer accent-[#8C7063]"
                                        />
                                        <div className="flex justify-between text-xs font-bold text-[#A0A0A0] mt-2 uppercase tracking-wider">
                                            <span>Nada</span>
                                            <span>Mucho</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* RED FLAGS */}
                        {steps[step].id === 'red_flags' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-[#4A4A4A] font-serif flex items-center gap-2">
                                    <Shield className="w-8 h-8 text-[#8C7063]" /> Importante
                                </h2>
                                <p className="text-[#6D6D6D]">Selecciona si presentas alguna de estas condiciones.</p>
                                <div className="grid gap-3">
                                    {RED_FLAGS_LIST.map((flag) => {
                                        const isChecked = watchRedFlags.includes(flag.id);
                                        return (
                                            <div key={flag.id} onClick={() => toggleSelection('redFlags', flag.id)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${isChecked ? 'bg-[#FADADD]/30 border-red-200 text-red-900' : 'bg-white border-gray-100 hover:bg-[#FAF8F6] text-[#4A4A4A]'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isChecked ? 'bg-red-500 border-red-500' : 'border-[#D1D1D1] bg-white'}`}>
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
                                <h2 className="text-3xl font-bold text-[#4A4A4A] font-serif text-center">Objetivo</h2>
                                <div className="relative">
                                    <Star className="absolute top-6 left-6 text-[#8C7063] w-6 h-6" />
                                    <textarea {...register('expectations')} rows={4} className="w-full text-xl p-6 pl-16 border-none rounded-3xl bg-white/70 shadow-lg backdrop-blur-sm focus:bg-white transition-all placeholder-[#A0A0A0] text-[#4A4A4A] resize-none outline-none" placeholder="¿Qué esperas lograr?" autoFocus />
                                </div>
                            </div>
                        )}

                        {/* FINISH */}
                        {steps[step].id === 'finish' && (
                            <div className="text-center space-y-10 mt-10">
                                <h2 className="text-5xl font-bold text-[#4A4A4A] font-serif">Todo Listo.</h2>
                                <motion.button
                                    onClick={() => handleSubmit(onSubmit)()}
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-12 py-6 bg-[#8C7063] text-white rounded-full text-2xl font-bold shadow-2xl hover:shadow-lg transition-all flex items-center gap-3 mx-auto"
                                >
                                    {isSubmitting ? 'Enviando...' : (
                                        <>Enviar Ficha <Heart className="w-6 h-6 fill-white text-white" /></>
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
                    <button onClick={prevStep} className="p-3 bg-white/50 backdrop-blur-md rounded-full text-[#4A4A4A] hover:bg-white transition-colors shadow-sm">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex gap-1.5 opacity-50">
                        {steps.slice(0, -1).map((_, i) => (
                            <motion.div key={i} className={`h-1.5 rounded-full ${i === step ? 'bg-[#8C7063] w-6' : 'bg-[#E8E0DC] w-1.5'}`} layout />
                        ))}
                    </div>
                    {step < steps.length - 1 ? (
                        <button onClick={nextStep} className="p-3 bg-[#8C7063] text-white rounded-full shadow-lg hover:bg-[#7A6156] transition-colors">
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    ) : <div className="w-12"></div>}
                </div>
            )}
        </div>
    );
};

export default PreAdmissionPage;

