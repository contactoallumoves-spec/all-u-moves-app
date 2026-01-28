import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronLeft, Shield, Activity, Baby,
    ArrowRight, ArrowLeft, Check, Calendar, User, Heart, Star
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

    // 2. Motivo
    reason: z.string().min(5, 'Cuéntanos brevemente qué te pasa'),
    story: z.string().optional(),
    symptoms: z.array(z.string()).optional(), // Temporary field to be merged into reason

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

    const { control, register, handleSubmit, formState: { errors }, trigger, watch, setValue } = useForm<PreAdmissionData>({
        resolver: zodResolver(preAdmissionSchema),
        mode: 'onChange',
        defaultValues: {
            painLevel: 0,
            isMother: false,
            gynObs: { gestations: 0, births: 0, cesareans: 0, menopause: false },
            redFlags: [],
            symptoms: [],
            bodyMap: { painRegions: [] }
        }
    });

    const watchIsMother = watch('isMother');
    const watchSymptoms = watch('symptoms') || [];
    const watchRedFlags = watch('redFlags') || [];

    // --- Steps Configuration ---
    const steps = [
        { id: 'welcome', type: 'intro' },
        { id: 'name', type: 'question', fields: ['firstName', 'lastName'] },
        { id: 'rut_contact', type: 'question', fields: ['rut', 'phone', 'email'] },
        { id: 'insurance', type: 'question', fields: ['insurance', 'birthDate', 'occupation'] },
        { id: 'reason', type: 'question', fields: ['reason', 'story', 'symptoms'] },
        { id: 'gyn_obs', type: 'question', fields: ['isMother', 'gynObs.menopause', 'gynObs.surgeries'] }, // Conditional fields handled in validation
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
            // Special validation logic if needed
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
            // Merge symptoms into reason
            let finalReason = data.reason;
            if (data.symptoms && data.symptoms.length > 0) {
                finalReason += `\n\n[Síntomas Frecuentes Reportados]: ${data.symptoms.join(', ')}`;
            }

            const submissionData = {
                ...data,
                reason: finalReason
            };

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
        { id: 'Incontinencia de orina', label: 'Incontinencia (Escape) de orina' },
        { id: 'Dolor relaciones', label: 'Dolor en relaciones sexuales' },
        { id: 'Bulto vaginal', label: 'Sensación de peso o bulto vaginal' },
        { id: 'Estreñimiento', label: 'Estreñimiento frecuente' },
        { id: 'Dolor lumbar', label: 'Dolor Lumbar persistente' },
        { id: 'Diástasis', label: 'Diástasis (Separación abdominal)' },
        { id: 'Cicatriz dolorosa', label: 'Cicatriz dolorosa (Cesárea/Episiotomía)' }
    ];

    const RED_FLAGS_LIST = [
        { id: 'Anestesia silla de montar', label: 'Pérdida de sensibilidad en zona genital (Anestesia)' },
        { id: 'Perdida control esfinteres', label: 'Pérdida de control de esfínteres reciente e inexplicable' },
        { id: 'Sangrado post-menopausia', label: 'Sangrado vaginal post-menopausia' },
        { id: 'Fiebre dolor pelvico', label: 'Fiebre asociada al dolor pélvico' },
        { id: 'Perdida peso', label: 'Pérdida de peso inexplicable' }
    ];

    // --- Render ---
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-6 text-center font-sans">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-10 rounded-3xl shadow-xl max-w-lg space-y-6 relative overflow-hidden text-brand-900"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-brand-600"></div>
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-brand-100 shadow-sm">
                        <img src={ADMIN_PHOTO} alt="Admin" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-2">¡Gracias!</h2>
                        <p className="text-gray-600 text-lg">
                            "He recibido tus antecedentes. Estoy analizando tu caso para que lleguemos al diagnóstico exacto en nuestra primera sesión."
                        </p>
                    </div>
                    <div className="pt-4">
                        <p className="font-medium text-brand-700">- Fernanda Rojas Cruz</p>
                        <p className="text-sm text-gray-400">Kinesióloga Pélvica</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-800">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-100 z-50">
                <motion.div
                    className="h-full bg-brand-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <main className="flex-grow flex items-center justify-center p-4 sm:p-8 overflow-x-hidden relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full max-w-2xl"
                    >
                        {/* 0. WELCOME */}
                        {steps[step].id === 'welcome' && (
                            <div className="text-center space-y-8">
                                <h1 className="text-4xl md:text-6xl font-bold font-serif text-brand-900 leading-tight">
                                    Bienvenida a <br /><span className="text-brand-600">All U Moves</span>
                                </h1>
                                <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
                                    Para aprovechar al máximo nuestra primera sesión, necesito conocerte un poco mejor. Esto tomará solo 2 minutos.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={nextStep}
                                    className="px-10 py-5 bg-brand-600 text-white rounded-full text-xl font-medium shadow-xl hover:bg-brand-700 transition-colors flex items-center mx-auto gap-2"
                                >
                                    Comenzar <ArrowRight className="w-6 h-6" />
                                </motion.button>
                            </div>
                        )}

                        {/* 1. NAME */}
                        {steps[step].id === 'name' && (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-bold text-brand-900 font-serif">¿Cómo te llamas?</h2>
                                    <p className="text-gray-500 text-lg">Para dirigirme a ti correctamente.</p>
                                </div>
                                <div className="grid gap-6">
                                    <div className="relative">
                                        <User className="absolute left-0 top-1/2 transform -translate-y-1/2 text-brand-300 w-6 h-6" />
                                        <input {...register('firstName')} placeholder="Tu Nombre" className="w-full text-3xl pl-10 py-4 border-b-2 border-brand-100 focus:border-brand-600 outline-none bg-transparent placeholder-brand-200 transition-colors" autoFocus />
                                    </div>
                                    <div className="relative">
                                        <input {...register('lastName')} placeholder="Tu Apellido" className="w-full text-3xl pl-10 py-4 border-b-2 border-brand-100 focus:border-brand-600 outline-none bg-transparent placeholder-brand-200 transition-colors" />
                                    </div>
                                </div>
                                {errors.firstName && <p className="text-red-500 font-medium">{errors.firstName.message}</p>}
                            </div>
                        )}

                        {/* 2. CONTACT */}
                        {steps[step].id === 'rut_contact' && (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-bold text-brand-900 font-serif">Datos de Contacto</h2>
                                    <p className="text-gray-500 text-lg">Para crear tu ficha clínica segura.</p>
                                </div>
                                <div className="space-y-5">
                                    <input {...register('rut')} placeholder="RUT (12.345.678-9)" className="w-full text-xl p-5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all shadow-sm" />
                                    <input {...register('phone')} placeholder="Teléfono" type="tel" className="w-full text-xl p-5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all shadow-sm" />
                                    <input {...register('email')} placeholder="Email" type="email" className="w-full text-xl p-5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all shadow-sm" />
                                </div>
                            </div>
                        )}

                        {/* 3. PROFILE (Insurance, Birthday, Occupation) */}
                        {steps[step].id === 'insurance' && (
                            <div className="space-y-8">
                                <h2 className="text-4xl font-bold text-brand-900 font-serif">Tu Perfil</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-brand-800 uppercase tracking-widest mb-3">Previsión</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {['fonasa', 'isapre', 'particular'].map((opt) => (
                                                <button key={opt}
                                                    type="button"
                                                    className={`p-4 rounded-xl text-lg font-medium capitalize transition-all border-2 ${watch('insurance') === opt
                                                        ? 'border-brand-600 bg-brand-600 text-white shadow-lg transform scale-105'
                                                        : 'border-gray-200 text-gray-500 hover:border-brand-300 hover:bg-brand-50'}`}
                                                    onClick={() => setValue('insurance', opt as any)}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.insurance && <p className="text-red-500 mt-2 text-sm">Selecciona una opción</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-brand-800 uppercase tracking-widest mb-3">Fecha de Nacimiento</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-400 w-5 h-5 pointer-events-none" />
                                                <input {...register('birthDate')} type="date" className="w-full text-lg p-4 pl-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium text-gray-700" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-brand-800 uppercase tracking-widest mb-3">Ocupación</label>
                                            <input {...register('occupation')} placeholder="Ej. Abogada, Estudiante..." className="w-full text-lg p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. REASON & SYMPTOMS */}
                        {steps[step].id === 'reason' && (
                            <div className="space-y-8">
                                <h2 className="text-4xl font-bold text-brand-900 font-serif">¿Qué te trae por aquí?</h2>

                                <div className="space-y-4">
                                    <Controller
                                        name="reason"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea {...field} rows={2} placeholder="Cuéntame brevemente (Ej: Dolor en la espalda baja...)" className="w-full text-2xl p-4 border-none focus:ring-0 bg-transparent placeholder-brand-200 resize-none font-medium text-brand-900" autoFocus />
                                        )}
                                    />
                                    <div className="w-full h-px bg-brand-100"></div>
                                    <Controller
                                        name="story"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea {...field} rows={3} placeholder="Detalles adicionales (opcional)..." className="w-full text-lg p-4 rounded-xl bg-brand-50/50 border-none focus:ring-2 focus:ring-brand-200 text-gray-600" />
                                        )}
                                    />
                                </div>

                                {/* Common Symptoms Chips */}
                                <div>
                                    <label className="text-xs font-bold text-brand-800 uppercase tracking-widest mb-4 block">Síntomas Frecuentes (Selecciona si aplica)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {SPECIFIC_SYMPTOMS.map((symptom) => {
                                            const isSelected = watchSymptoms.includes(symptom.id);
                                            return (
                                                <button
                                                    key={symptom.id}
                                                    type="button"
                                                    onClick={() => toggleSelection('symptoms', symptom.id)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border ${isSelected
                                                            ? 'bg-brand-100 text-brand-800 border-brand-200 pl-3 pr-4 shadow-sm'
                                                            : 'bg-white text-gray-500 border-gray-200 hover:border-brand-200'
                                                        }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 text-brand-600" />}
                                                    {symptom.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. GYN OBS */}
                        {steps[step].id === 'gyn_obs' && (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-brand-900 font-serif flex items-center gap-3">
                                        <Baby className="w-8 h-8 text-brand-400" />
                                        Antecedentes de Maternidad
                                    </h2>
                                    <p className="text-gray-500">¿Tienes hijos o has estado embarazada?</p>
                                </div>

                                <div className="space-y-6 bg-brand-50/50 p-6 rounded-3xl border border-brand-100">
                                    {/* Is Mother Toggle */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-medium text-brand-900">¿Eres madre?</span>
                                        <div className="flex gap-2 bg-white p-1 rounded-lg border border-brand-100">
                                            <button
                                                type="button"
                                                onClick={() => setValue('isMother', false)}
                                                className={`px-6 py-2 rounded-md font-medium transition-all ${!watchIsMother ? 'bg-brand-600 text-white shadow-md' : 'text-gray-400 hover:text-brand-600'}`}
                                            >
                                                No
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setValue('isMother', true)}
                                                className={`px-6 py-2 rounded-md font-medium transition-all ${watchIsMother ? 'bg-brand-600 text-white shadow-md' : 'text-gray-400 hover:text-brand-600'}`}
                                            >
                                                Sí
                                            </button>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {watchIsMother && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden space-y-4 pt-4 border-t border-brand-100"
                                            >
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center">
                                                        <label className="block text-sm text-brand-800 font-bold mb-1">Partos</label>
                                                        <input {...register('gynObs.births', { valueAsNumber: true })} type="number" min="0" className="w-full text-center p-3 rounded-xl border border-brand-100 bg-white" />
                                                    </div>
                                                    <div className="text-center">
                                                        <label className="block text-sm text-brand-800 font-bold mb-1">Cesáreas</label>
                                                        <input {...register('gynObs.cesareans', { valueAsNumber: true })} type="number" min="0" className="w-full text-center p-3 rounded-xl border border-brand-100 bg-white" />
                                                    </div>
                                                    <div className="text-center">
                                                        <label className="block text-sm text-brand-800 font-bold mb-1">Pérdidas</label>
                                                        <input {...register('gynObs.abortions', { valueAsNumber: true })} type="number" min="0" className="w-full text-center p-3 rounded-xl border border-brand-100 bg-white" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                        <input type="checkbox" {...register('gynObs.menopause')} id="menops" className="w-5 h-5 text-brand-600 rounded bg-gray-100 border-gray-300 focus:ring-brand-500" />
                                        <label htmlFor="menops" className="text-gray-700 font-medium cursor-pointer flex-grow">Menopausia</label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Cirugías Previas</label>
                                        <input {...register('gynObs.surgeries')} placeholder="Ej: Apéndice, Vesícula, Histerectomía..." className="w-full text-lg p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6. HABITS */}
                        {steps[step].id === 'habits' && (
                            <div className="space-y-8">
                                <h2 className="text-4xl font-bold text-brand-900 font-serif">Estilo de Vida</h2>
                                <p className="text-gray-500">Hábitos que influyen en tu salud y recuperación.</p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Water */}
                                    <div className="space-y-2">
                                        <label className="font-bold text-brand-800 text-sm">Hidratación (Diaria)</label>
                                        <div className="flex flex-col gap-2">
                                            {['Baja (< 1L)', 'Normal (1.5-2L)', 'Alta (> 2L)'].map(opt => (
                                                <button key={opt} type="button"
                                                    onClick={() => setValue('habits.waterIntake', opt)}
                                                    className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${watch('habits.waterIntake') === opt ? 'bg-brand-100 text-brand-800 border-brand-300 ring-1 ring-brand-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Activity */}
                                    <div className="space-y-2">
                                        <label className="font-bold text-brand-800 text-sm">Actividad Física</label>
                                        <div className="flex flex-col gap-2">
                                            {['Sedentaria', 'Ligera (Caminatas)', 'Moderada (Gym 2-3x)', 'Intensa (Deportista)'].map(opt => (
                                                <button key={opt} type="button"
                                                    onClick={() => setValue('habits.activityLevel', opt)}
                                                    className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${watch('habits.activityLevel') === opt ? 'bg-brand-100 text-brand-800 border-brand-300 ring-1 ring-brand-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Digestion */}
                                    <div className="space-y-2">
                                        <label className="font-bold text-brand-800 text-sm">Digestión</label>
                                        <div className="flex flex-col gap-2">
                                            {['Normal (Diaria)', 'Estreñimiento ocasional', 'Estreñimiento crónico'].map(opt => (
                                                <button key={opt} type="button"
                                                    onClick={() => setValue('habits.digestion', opt)}
                                                    className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${watch('habits.digestion') === opt ? 'bg-brand-100 text-brand-800 border-brand-300 ring-1 ring-brand-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Sleep */}
                                    <div className="space-y-2">
                                        <label className="font-bold text-brand-800 text-sm">Sueño</label>
                                        <div className="flex flex-col gap-2">
                                            {['Bien (Descansado)', 'Regular', 'Mal (Insomnio)'].map(opt => (
                                                <button key={opt} type="button"
                                                    onClick={() => setValue('habits.sleepQuality', opt)}
                                                    className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${watch('habits.sleepQuality') === opt ? 'bg-brand-100 text-brand-800 border-brand-300 ring-1 ring-brand-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 7. BODY MAP */}
                        {steps[step].id === 'body_map' && (
                            <div className="space-y-4">
                                <div className="text-center mb-2">
                                    <h2 className="text-3xl font-bold text-brand-900 font-serif">Mapa Corporal</h2>
                                    <p className="text-gray-500">Toca las zonas donde sientes molestias.</p>
                                </div>
                                <Controller
                                    name="bodyMap"
                                    control={control}
                                    render={({ field }) => (
                                        <BodyMap
                                            value={field.value}
                                            onChange={(val) => field.onChange(val)}
                                            containerClassName="relative w-full overflow-hidden bg-brand-50 rounded-3xl border border-brand-100 shadow-inner flex items-center justify-center transition-all"
                                            bodyFill="#946353" // Brand-600 (Terracotta)
                                        />
                                    )}
                                />
                            </div>
                        )}

                        {/* 8. PAIN LEVEL */}
                        {steps[step].id === 'pain' && (
                            <div className="space-y-12 text-center">
                                <div>
                                    <h2 className="text-4xl font-bold text-brand-900 font-serif mb-4 flex items-center justify-center gap-3">
                                        <Activity className="w-10 h-10 text-brand-400" />
                                        Nivel de Molestia
                                    </h2>
                                    <p className="text-xl text-gray-500">Del 0 al 10, ¿qué tan intenso es?</p>
                                </div>

                                <div className="flex flex-col items-center space-y-8 max-w-md mx-auto relative">
                                    <div className="absolute -top-10 right-0 animate-bounce">
                                        {watch('painLevel') > 7 && <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold shadow-sm">¡Intenso!</span>}
                                    </div>
                                    <div className="text-8xl font-black text-brand-600 tracking-tighter shadow-brand-200 drop-shadow-sm">
                                        {watch('painLevel')}
                                    </div>
                                    <input
                                        type="range" min="0" max="10"
                                        {...register('painLevel', { valueAsNumber: true })}
                                        className="w-full h-4 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600 hover:accent-brand-500 transition-all"
                                    />
                                    <div className="flex justify-between w-full text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                                        <span>Sin Molestia</span>
                                        <span>Insuperable</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 9. RED FLAGS */}
                        {steps[step].id === 'red_flags' && (
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-bold text-red-800 font-serif flex items-center gap-3">
                                        <Shield className="w-8 h-8 text-red-600" />
                                        Atención Especial
                                    </h2>
                                    <p className="text-gray-600">Por favor, indícame si presentas alguna de estas condiciones. Es vital para tu seguridad.</p>
                                </div>

                                <div className="grid gap-4">
                                    {RED_FLAGS_LIST.map((flag) => {
                                        const isChecked = watchRedFlags.includes(flag.id);
                                        return (
                                            <div
                                                key={flag.id}
                                                onClick={() => toggleSelection('redFlags', flag.id)}
                                                className={`relative cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 ${isChecked
                                                        ? 'border-red-500 bg-red-50 text-red-900'
                                                        : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isChecked ? 'border-red-600 bg-red-600' : 'border-gray-300'
                                                        }`}>
                                                        {isChecked && <Check className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <span className="font-medium text-lg">{flag.label}</span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center italic">
                                        Si no presentas ninguna, simplemente continúa.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 10. EXPECTATIONS */}
                        {steps[step].id === 'expectations' && (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-bold text-brand-900 font-serif">Última pregunta...</h2>
                                    <p className="text-xl text-brand-700">¿Qué es lo más importante que esperas lograr?</p>
                                </div>
                                <div className="relative">
                                    <Star className="absolute top-5 left-5 text-yellow-500 w-6 h-6 animate-pulse" />
                                    <textarea
                                        {...register('expectations')}
                                        rows={4}
                                        className="w-full text-2xl p-6 pl-16 border-2 border-brand-100 rounded-3xl bg-white focus:outline-none focus:border-brand-500 focus:shadow-xl transition-all placeholder-brand-200 text-brand-900"
                                        placeholder="Ej: Volver a correr, reír sin miedo, dormir sin dolor..."
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {/* 11. FINISH */}
                        {steps[step].id === 'finish' && (
                            <div className="text-center space-y-10">
                                <div>
                                    <h2 className="text-5xl font-bold text-brand-900 font-serif mb-4">¡Todo listo!</h2>
                                    <p className="text-xl text-gray-600 max-w-lg mx-auto">
                                        Gracias por confiar en mí. <br />
                                        Al hacer clic en el botón, crearé tu ficha y me prepararé para nuestra sesión.
                                    </p>
                                </div>

                                <motion.button
                                    onClick={() => handleSubmit(onSubmit)()}
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full md:w-auto px-16 py-6 bg-brand-600 text-white rounded-full text-2xl font-bold shadow-2xl hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto block"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Procesando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-3 justify-center">
                                            Enviar Mis Datos <Heart className="w-6 h-6 fill-current" />
                                        </span>
                                    )}
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Styled Footer Navigation */}
            {step > 0 && !isSuccess && (
                <div className="p-6 fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-between items-center z-40">
                    <div className="w-full max-w-4xl mx-auto flex justify-between items-center">
                        <button
                            onClick={prevStep}
                            className="flex items-center text-gray-400 hover:text-brand-600 transition-colors font-medium px-4 py-2 hover:bg-brand-50 rounded-lg group"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Anterior
                        </button>

                        <div className="flex gap-1">
                            {steps.slice(0, -1).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 w-1.5 rounded-full transition-all ${i === step ? 'bg-brand-600 w-4' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>

                        {step < steps.length - 1 ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={nextStep}
                                className="flex items-center bg-brand-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-brand-700 transition-all group"
                            >
                                Siguiente <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        ) : <div className="w-[120px]"></div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreAdmissionPage;
