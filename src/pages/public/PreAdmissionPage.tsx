import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Shield, Activity, Baby } from 'lucide-react';
import { PatientService } from '../../services/patientService';
import { ADMIN_PHOTO } from '../../assets/adminPhoto';

// --- Schema Definition ---
const preAdmissionSchema = z.object({
    // 1. Identificación
    firstName: z.string().min(2, 'Tu nombre es importante'),
    lastName: z.string().min(2, 'Tu apellido es importante'),
    rut: z.string().min(8, 'RUT inválido'),
    phone: z.string().min(8, 'Teléfono de contacto'),
    email: z.string().email('Email inválido'),
    birthDate: z.string().min(1, 'Fecha requerida'),
    insurance: z.enum(['fonasa', 'isapre', 'particular'], { required_error: "Selecciona tu previsión" }),
    occupation: z.string().optional(),

    // 2. Motivo
    reason: z.string().min(5, 'Cuéntanos brevemente qué te pasa'),
    story: z.string().optional(),

    // 3. Clinical - GynObs
    gynObs: z.object({
        gestations: z.number().min(0),
        births: z.number().min(0),
        cesareans: z.number().min(0),
        abortions: z.number().optional(),
        menopause: z.boolean(),
        episiotomy: z.boolean().optional(),
    }),

    // 4. Clinical - Habits & Pain
    painLevel: z.number().min(0).max(10),
    redFlags: z.array(z.string()).optional(), // e.g. "incontinencia", "dolor_relaciones"

    // 5. Goals
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
            gynObs: { gestations: 0, births: 0, cesareans: 0, menopause: false },
            redFlags: []
        }
    });

    // --- Steps Configuration ---
    const steps = [
        { id: 'welcome', type: 'intro' },
        { id: 'name', type: 'question', fields: ['firstName', 'lastName'] },
        { id: 'rut_contact', type: 'question', fields: ['rut', 'phone', 'email'] },
        { id: 'insurance', type: 'question', fields: ['insurance', 'birthDate', 'occupation'] },
        { id: 'reason', type: 'question', fields: ['reason', 'story'] },
        { id: 'gyn_obs', type: 'question', fields: ['gynObs.gestations', 'gynObs.births', 'gynObs.cesareans'] },
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
            await PatientService.createProspective(data);
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            alert('Hubo un error al guardar. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Components ---

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-10 rounded-3xl shadow-xl max-w-lg space-y-6 relative overflow-hidden"
                >
                    {/* Confetti effect could go here */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-brand-600"></div>

                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-brand-100 shadow-sm">
                        <img src={ADMIN_PHOTO} alt="Admin" className="w-full h-full object-cover" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-serif font-bold text-brand-900 mb-2">¡Gracias!</h2>
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

    // --- Main Form Render ---
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-800">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 bg-gray-100 z-50">
                <motion.div
                    className="h-full bg-brand-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <main className="flex-grow flex items-center justify-center p-4 sm:p-8 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-2xl"
                    >
                        {/* 0. WELCOME */}
                        {steps[step].id === 'welcome' && (
                            <div className="text-center space-y-8">
                                <h1 className="text-4xl md:text-5xl font-bold font-serif text-brand-900 leading-tight">
                                    Bienvenida a <br /><span className="text-brand-600">All U Moves</span>
                                </h1>
                                <p className="text-xl text-gray-600 max-w-lg mx-auto">
                                    Para aprovechar al máximo nuestra primera sesión, necesito conocerte un poco mejor. Esto tomará solo 2 minutos.
                                </p>
                                <button onClick={nextStep} className="px-8 py-4 bg-brand-600 text-white rounded-full text-xl font-medium shadow-lg hover:bg-brand-700 transition-colors">
                                    Comenzar
                                </button>
                            </div>
                        )}

                        {/* 1. NAME */}
                        {steps[step].id === 'name' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900">¿Cómo te llamas?</h2>
                                <div className="grid gap-4">
                                    <input {...register('firstName')} placeholder="Nombre" className="text-2xl p-4 border-b-2 border-brand-200 focus:border-brand-600 outline-none bg-transparent placeholder-brand-200" autoFocus />
                                    <input {...register('lastName')} placeholder="Apellido" className="text-2xl p-4 border-b-2 border-brand-200 focus:border-brand-600 outline-none bg-transparent placeholder-brand-200" />
                                </div>
                                {errors.firstName && <p className="text-red-500">{errors.firstName.message}</p>}
                            </div>
                        )}

                        {/* 2. CONTACT */}
                        {steps[step].id === 'rut_contact' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900">Datos de Contacto</h2>
                                <p className="text-gray-500">Para crear tu ficha clínica.</p>
                                <div className="space-y-4">
                                    <input {...register('rut')} placeholder="RUT (12.345.678-9)" className="w-full text-xl p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none" />
                                    <input {...register('phone')} placeholder="Teléfono" type="tel" className="w-full text-xl p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none" />
                                    <input {...register('email')} placeholder="Email" type="email" className="w-full text-xl p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none" />
                                </div>
                            </div>
                        )}

                        {/* 3. INSURANCE */}
                        {steps[step].id === 'insurance' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900">Tu Perfil</h2>
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide">Previsión</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {['fonasa', 'isapre', 'particular'].map((opt) => (
                                            <div key={opt}
                                                className={`cursor-pointer border-2 rounded-xl p-4 text-center capitalize transition-all ${watch('insurance') === opt ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-300'}`}
                                                onClick={() => setValue('insurance', opt as any)}
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                    <input {...register('insurance')} type="hidden" />
                                    {errors.insurance && <p className="text-red-500">Selecciona una opción</p>}

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide">Cumpleaños</label>
                                            <input {...register('birthDate')} type="date" className="w-full text-lg p-3 rounded-lg border border-gray-200" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide">Ocupación</label>
                                            <input {...register('occupation')} placeholder="Ej. Abogada" className="w-full text-lg p-3 rounded-lg border border-gray-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. REASON */}
                        {steps[step].id === 'reason' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900">¿Qué te trae por aquí?</h2>
                                <Controller
                                    name="reason"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea {...field} rows={2} placeholder="Motivo principal..." className="w-full text-2xl p-4 border-none focus:ring-0 bg-transparent placeholder-gray-300 resize-none" autoFocus />
                                    )}
                                />
                                <div className="h-px bg-gray-200 w-full mb-4"></div>
                                <Controller
                                    name="story"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea {...field} rows={3} placeholder="Cuéntame un poco más (opcional)..." className="w-full text-lg p-4 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-200" />
                                    )}
                                />
                            </div>
                        )}

                        {/* 5. GYN OBS */}
                        {steps[step].id === 'gyn_obs' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900 flex items-center gap-3">
                                    <Baby className="w-8 h-8 text-brand-500" />
                                    Antecedentes
                                </h2>
                                <p className="text-gray-500">Información gineco-obstétrica básica.</p>

                                <div className="grid grid-cols-3 gap-6 text-center">
                                    <div className="space-y-2">
                                        <label className="block font-bold text-gray-700">Gestaciones</label>
                                        <input {...register('gynObs.gestations', { valueAsNumber: true })} type="number" min="0" className="w-20 mx-auto text-center text-2xl p-2 rounded-lg border border-gray-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block font-bold text-gray-700">Partos</label>
                                        <input {...register('gynObs.births', { valueAsNumber: true })} type="number" min="0" className="w-20 mx-auto text-center text-2xl p-2 rounded-lg border border-gray-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block font-bold text-gray-700">Cesáreas</label>
                                        <input {...register('gynObs.cesareans', { valueAsNumber: true })} type="number" min="0" className="w-20 mx-auto text-center text-2xl p-2 rounded-lg border border-gray-300" />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl">
                                    <input type="checkbox" {...register('gynObs.menopause')} id="menopause" className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500" />
                                    <label htmlFor="menopause" className="text-lg text-gray-700">Estoy en etapa de Menopausia</label>
                                </div>
                            </div>
                        )}

                        {/* 6. PAIN */}
                        {steps[step].id === 'pain' && (
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold text-brand-900 flex items-center gap-3">
                                    <Activity className="w-8 h-8 text-red-500" />
                                    Nivel de Molestia
                                </h2>
                                <p className="text-gray-500 text-lg">Del 0 al 10, ¿cuánto te molesta tu síntoma principal?</p>

                                <div className="flex flex-col items-center space-y-4">
                                    <div className="text-6xl font-bold text-brand-600">{watch('painLevel')}</div>
                                    <input
                                        type="range" min="0" max="10"
                                        {...register('painLevel', { valueAsNumber: true })}
                                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                    />
                                    <div className="flex justify-between w-full text-sm text-gray-400 font-medium uppercase">
                                        <span>Nada</span>
                                        <span>Insuperable</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 7. RED FLAGS */}
                        {steps[step].id === 'red_flags' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900 flex items-center gap-3">
                                    <Shield className="w-8 h-8 text-yellow-500" />
                                    Síntomas Específicos
                                </h2>
                                <p className="text-gray-500">¿Experimentas alguno de estos? (Selecciona los que apliquen)</p>

                                <div className="grid md:grid-cols-2 gap-3">
                                    {[
                                        { id: 'incontinence', label: 'Incontinencia (Escape) de orina' },
                                        { id: 'dyspareunia', label: 'Dolor en relaciones sexuales' },
                                        { id: 'prolapse', label: 'Sensación de peso o bulto vaginal' },
                                        { id: 'constipation', label: 'Estreñimiento frecuente' },
                                        { id: 'backpain', label: 'Dolor Lumbar persistente' }
                                    ].map((flag) => (
                                        <div key={flag.id} className="relative">
                                            <input
                                                type="checkbox"
                                                value={flag.id}
                                                {...register('redFlags')}
                                                id={flag.id}
                                                className="peer sr-only"
                                            />
                                            <label
                                                htmlFor={flag.id}
                                                className="flex items-center p-4 bg-white border-2 border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 peer-checked:border-brand-500 peer-checked:bg-brand-50 transition-all font-medium text-gray-700"
                                            >
                                                {flag.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 8. EXPECTATIONS */}
                        {steps[step].id === 'expectations' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-brand-900">Última pregunta...</h2>
                                <p className="text-xl text-gray-600">¿Qué es lo más importante que esperas lograr con el tratamiento?</p>
                                <textarea
                                    {...register('expectations')}
                                    rows={4}
                                    className="w-full text-2xl p-4 border-l-4 border-brand-500 bg-gray-50 focus:outline-none focus:bg-white transition-colors"
                                    placeholder="Ej: Volver a correr, reír sin miedo..."
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* 9. FINISH */}
                        {steps[step].id === 'finish' && (
                            <div className="text-center space-y-8">
                                <h2 className="text-4xl font-bold text-brand-900">¡Todo listo!</h2>
                                <p className="text-xl text-gray-600 max-w-lg mx-auto">
                                    Gracias por tomarte el tiempo. <br />
                                    Al hacer clic en "Enviar", tu ficha segura será creada.
                                </p>
                                <button
                                    onClick={() => handleSubmit(onSubmit)()}
                                    disabled={isSubmitting}
                                    className="w-full md:w-auto px-12 py-4 bg-brand-600 text-white rounded-full text-xl font-bold shadow-xl hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Mis Datos'}
                                </button>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer Navigation */}
            {step > 0 && !isSuccess && (
                <div className="p-6 flex justify-between items-center max-w-4xl mx-auto w-full text-gray-400">
                    <button onClick={prevStep} className="flex items-center hover:text-brand-600 transition-colors">
                        <ChevronLeft className="w-6 h-6 mr-1" /> Anterior
                    </button>
                    <div className="text-xs font-medium uppercase tracking-widest">
                        {step} / {steps.length - 1}
                    </div>
                    {step < steps.length - 1 && (
                        <button onClick={nextStep} className="flex items-center hover:text-brand-600 transition-colors">
                            Siguiente <ChevronRight className="w-6 h-6 ml-1" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PreAdmissionPage;
