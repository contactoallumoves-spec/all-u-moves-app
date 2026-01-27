import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { PatientService } from '../../services/patientService';

// --- Schema Definition ---
const preAdmissionSchema = z.object({
    firstName: z.string().min(2, 'El nombre es obligatorio'),
    lastName: z.string().min(2, 'El apellido es obligatorio'),
    rut: z.string().min(8, 'RUT inválido').regex(/^(\d{1,3}(\.?\d{3}){2}-[\dkK])$|^(\d{7,8}-[\dkK])$/, 'Formato inválido (Ej: 12.345.678-9)'),
    phone: z.string().min(8, 'Teléfono obligatorio'),
    email: z.string().email('Email inválido'),
    birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
    occupation: z.string().optional(),

    // Motive
    reason: z.string().min(5, 'Por favor cuéntanos brevemente el motivo'),
    story: z.string().optional(),

    // Screening
    painLevel: z.number().min(0).max(10).optional(),
    hasRedFlags: z.boolean().optional(), // e.g. bleeding, severe rapid changes

    // Goals
    expectations: z.string().optional(),
});

type PreAdmissionData = z.infer<typeof preAdmissionSchema>;

const PreAdmissionPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm<PreAdmissionData>({
        resolver: zodResolver(preAdmissionSchema),
        mode: 'onChange'
    });

    const totalSteps = 3;

    const nextStep = async () => {
        let fieldsToValidate: (keyof PreAdmissionData)[] = [];
        if (step === 1) fieldsToValidate = ['firstName', 'lastName', 'rut', 'phone', 'email', 'birthDate'];
        if (step === 2) fieldsToValidate = ['reason'];

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const onSubmit = async (data: PreAdmissionData) => {
        setIsSubmitting(true);
        try {
            const result = await PatientService.createProspective(data);
            console.log('Patient processed:', result);
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            alert('Hubo un error al enviar el formulario. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center py-10 space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">¡Registro Exitoso!</h2>
                <p className="text-gray-600">
                    Tus datos han sido recibidos correctamente. <br />
                    Te contactaremos pronto para confirmar tu hora.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div
                    className="bg-brand-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {step === 1 && 'Datos Personales'}
                {step === 2 && 'Motivo de Consulta'}
                {step === 3 && 'Salud y Expectativas'}
            </h2>

            {/* Step 1: Identification */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input {...register('firstName')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                            {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input {...register('lastName')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                            {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">RUT</label>
                        <input
                            {...register('rut')}
                            placeholder="12.345.678-9"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                        />
                        {errors.rut && <span className="text-xs text-red-500">{errors.rut.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                            <input {...register('phone')} type="tel" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                            {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha Nacimiento</label>
                            <input {...register('birthDate')} type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                            {errors.birthDate && <span className="text-xs text-red-500">{errors.birthDate.message}</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input {...register('email')} type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                        {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ocupación / Actividad (Opcional)</label>
                        <input {...register('occupation')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                    </div>
                </div>
            )}

            {/* Step 2: Motive */}
            {step === 2 && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Motivo Principal</label>
                        <p className="text-xs text-gray-500 mb-1">¿Qué te trae a consultar hoy?</p>
                        <textarea
                            {...register('reason')}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                            placeholder="Ej: Dolor lumbar, Incontinencia..."
                        />
                        {errors.reason && <span className="text-xs text-red-500">{errors.reason.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cuéntanos un poco más (Opcional)</label>
                        <p className="text-xs text-gray-500 mb-1">¿Desde cuándo te pasa? ¿Qué lo mejora o empeora?</p>
                        <textarea
                            {...register('story')}
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                        />
                    </div>
                </div>
            )}

            {/* Step 3: Screening & Goals */}
            {step === 3 && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de Dolor o Molestia (0-10)</label>
                        <div className="flex items-center space-x-4">
                            <input
                                type="range"
                                min="0" max="10"
                                {...register('painLevel', { valueAsNumber: true })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="font-bold text-brand-700 text-lg">{watch('painLevel') || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Sin dolor</span>
                            <span>Peor dolor posible</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué esperas lograr con el tratamiento?</label>
                        <textarea
                            {...register('expectations')}
                            rows={3}
                            placeholder="Ej: Volver a correr sin dolor, dormir mejor..."
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-100">
                {step > 1 ? (
                    <button
                        type="button"
                        onClick={prevStep}
                        className="flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Atrás
                    </button>
                ) : (
                    <div></div> // Spacer
                )}

                {step < totalSteps ? (
                    <button
                        type="button"
                        onClick={nextStep}
                        className="flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
                    >
                        Siguiente
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Enviando...' : 'Finalizar y Enviar'}
                    </button>
                )}
            </div>
        </form>
    );
};

export default PreAdmissionPage;
