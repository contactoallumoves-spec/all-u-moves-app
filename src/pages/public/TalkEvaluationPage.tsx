import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Check, Loader2, ArrowRight } from 'lucide-react';

type Step = 'intro' | 'q1' | 'symptoms' | 'risks' | 'result' | 'contact' | 'success';

type Classification = 'TRATAMIENTO_KINESICO' | 'PREVENCION_ACTIVA' | 'ASESORIA';

interface FormData {
    q1_incomodidad: boolean | null;
    symptoms: string[];
    risk_factors: string[];
    classification: Classification | null;
    name: string;
    email: string;
    phone: string;
}

const SYMPTOMS_LIST = [
    "Pérdida de pipí",
    "Sensación de peso (prolapso)",
    "Estreñimiento",
    "Idas al baño con urgencias",
    "Te cuesta hacer pipí",
    "Dolor en tu zona vaginal o vulvar (al usar copita o tener relaciones)"
];

const RISK_FACTORS_LIST = [
    "Embarazo",
    "Postparto",
    "Menopausia",
    "Práctica deporte o ejercicio regular"
];

const TalkEvaluationPage = () => {
    const [currentStep, setCurrentStep] = useState<Step>('intro');
    const [formData, setFormData] = useState<FormData>({
        q1_incomodidad: null,
        symptoms: [],
        risk_factors: [],
        classification: null,
        name: '',
        email: '',
        phone: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleNextStep = (next: Step) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentStep(next);
    };

    const toggleSymptom = (s: string) => {
        setFormData(prev => ({
            ...prev,
            symptoms: prev.symptoms.includes(s)
                ? prev.symptoms.filter(item => item !== s)
                : [...prev.symptoms, s]
        }));
    };

    const toggleRiskFactor = (r: string) => {
        setFormData(prev => ({
            ...prev,
            risk_factors: prev.risk_factors.includes(r)
                ? prev.risk_factors.filter(item => item !== r)
                : [...prev.risk_factors, r]
        }));
    };

    const determineClassificationAndProceed = () => {
        let result: Classification;
        if (formData.q1_incomodidad === true && formData.symptoms.length > 0) {
            result = 'TRATAMIENTO_KINESICO';
        } else if (formData.q1_incomodidad === false && formData.risk_factors.length > 0) {
            result = 'PREVENCION_ACTIVA';
        } else if (formData.q1_incomodidad === false && formData.risk_factors.length === 0) {
            result = 'ASESORIA';
        } else {
             // Fallback if they said Yes to incomodidad but selected 0 symptoms
            result = 'TRATAMIENTO_KINESICO';
        }

        setFormData(prev => ({ ...prev, classification: result }));
        handleNextStep('result');
    };

    const submitData = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await addDoc(collection(db, 'talk_evaluations'), {
                ...formData,
                createdAt: serverTimestamp(),
                source: 'charla_qr'
            });
            handleNextStep('success');
        } catch (err: any) {
            console.error("Error saving evaluation:", err);
            setError("Hubo un error al guardar tus datos. Por favor, intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Componentes visuales de clasificación
    const ResultCard = () => {
        if (!formData.classification) return null;

        const config = {
            TRATAMIENTO_KINESICO: {
                title: 'TRATAMIENTO KINÉSICO',
                subtitle: '(Rehabilitación Directa)',
                color: 'bg-rose-100 text-rose-800 border-rose-200',
                message: 'Recomendación: No tienes por qué acostumbrarte a vivir con molestias, dolor o usar protectores diarios. Lo que sientes es muy común, pero se puede tratar.'
            },
            PREVENCION_ACTIVA: {
                title: 'PREVENCIÓN ACTIVA',
                subtitle: '(Entrenamiento Kine Dirigido)',
                color: 'bg-pink-100 text-pink-800 border-pink-200',
                message: '¡Tu cuerpo está respondiendo muy bien! Para que siga así a pesar del embarazo, parto, menopausia o el deporte de impacto, tu camino es la Prevención.'
            },
            ASESORIA: {
                title: 'ASESORÍA',
                subtitle: 'Entrenamiento y Prevención',
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                message: 'No presentas síntomas ni factores de riesgo evidentes. Te sugerimos una asesoría para optimizar tu bienestar y prevenir a futuro.'
            }
        }[formData.classification];

        return (
            <div className={`p-8 rounded-3xl border-2 ${config.color} text-center space-y-4 shadow-lg`}>
                <h3 className="text-2xl font-black">{config.title}</h3>
                <p className="font-semibold">{config.subtitle}</p>
                <div className="w-16 h-1 bg-current mx-auto opacity-30 my-4 rounded"></div>
                <p className="text-lg leading-relaxed">{config.message}</p>
            </div>
        );
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
        exit: { opacity: 0, y: -30, transition: { duration: 0.3 } }
    };

    return (
        <div className="min-h-screen bg-brand-50 font-sans text-brand-900 flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-2xl">
                
                {/* Header Logo */}
                <div className="flex justify-center mb-8">
                    <img src="/allumoves-logo.png" alt="All U Moves" className="h-16 w-auto" />
                </div>

                <AnimatePresence mode="wait">
                    {currentStep === 'intro' && (
                        <motion.div key="intro" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="text-center space-y-8 mt-12">
                            <h1 className="text-4xl sm:text-5xl font-black text-brand-600 tracking-tight leading-tight">
                                ¿Rehabilitación o <br className="hidden sm:block"/> Prevención?
                            </h1>
                            <p className="text-xl text-brand-500 font-medium">Autoevaluación rápida para tu salud pélvica.</p>
                            <button 
                                onClick={() => handleNextStep('q1')}
                                className="inline-flex items-center px-8 py-4 bg-brand-600 text-white rounded-full text-xl font-bold hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                            >
                                Iniciar Evaluación <ArrowRight className="ml-2 w-6 h-6" />
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 'q1' && (
                        <motion.div key="q1" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                            <h2 className="text-3xl sm:text-4xl font-bold text-center leading-tight">¿Sientes incomodidades en tu zona pélvica?</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => {
                                        setFormData(p => ({ ...p, q1_incomodidad: true }));
                                        handleNextStep('symptoms');
                                    }}
                                    className="p-8 text-2xl font-bold border-2 border-brand-200 rounded-3xl hover:bg-brand-100 hover:border-brand-500 transition-all"
                                >
                                    SÍ
                                </button>
                                <button 
                                    onClick={() => {
                                        setFormData(p => ({ ...p, q1_incomodidad: false }));
                                        handleNextStep('risks');
                                    }}
                                    className="p-8 text-2xl font-bold border-2 border-brand-200 rounded-3xl hover:bg-brand-100 hover:border-brand-500 transition-all"
                                >
                                    NO
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'symptoms' && (
                        <motion.div key="symptoms" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold">¿Tienes alguno de estos síntomas?</h2>
                                <p className="text-brand-500">Selecciona todos los que apliquen</p>
                            </div>
                            <div className="space-y-3">
                                {SYMPTOMS_LIST.map((symptom, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => toggleSymptom(symptom)}
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${formData.symptoms.includes(symptom) ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white hover:border-brand-300'}`}
                                    >
                                        <div className={`w-6 h-6 rounded border flex items-center justify-center ${formData.symptoms.includes(symptom) ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300'}`}>
                                            {formData.symptoms.includes(symptom) && <Check size={16} strokeWidth={3} />}
                                        </div>
                                        <span className="text-lg font-medium">{symptom}</span>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={determineClassificationAndProceed}
                                className="w-full py-4 bg-brand-600 text-white rounded-2xl text-xl font-bold hover:bg-brand-700 transition-all shadow-md mt-8"
                            >
                                Continuar
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 'risks' && (
                        <motion.div key="risks" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold">Factores de Riesgo</h2>
                                <p className="text-brand-500">Indica si aplica alguna de estas situaciones actuales o pasadas</p>
                            </div>
                            <div className="space-y-3">
                                {RISK_FACTORS_LIST.map((risk, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => toggleRiskFactor(risk)}
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${formData.risk_factors.includes(risk) ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white hover:border-brand-300'}`}
                                    >
                                        <div className={`w-6 h-6 rounded border flex items-center justify-center ${formData.risk_factors.includes(risk) ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300'}`}>
                                            {formData.risk_factors.includes(risk) && <Check size={16} strokeWidth={3} />}
                                        </div>
                                        <span className="text-lg font-medium">{risk}</span>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={determineClassificationAndProceed}
                                className="w-full py-4 bg-brand-600 text-white rounded-2xl text-xl font-bold hover:bg-brand-700 transition-all shadow-md mt-8"
                            >
                                Continuar
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 'result' && (
                        <motion.div key="result" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                            <h2 className="text-3xl font-bold text-center">Tu Resultado</h2>
                            <ResultCard />
                            <div className="text-center pt-8 border-t border-brand-200">
                                <p className="text-lg text-brand-600 font-medium mb-6">Déjanos tus datos para enviarte más información y contactarte.</p>
                                <button 
                                    onClick={() => handleNextStep('contact')}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-brand-600 text-white rounded-full text-xl font-bold hover:bg-brand-700 transition-all shadow-lg"
                                >
                                    Dejar mis datos <ArrowRight className="ml-2 w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'contact' && (
                        <motion.form key="contact" onSubmit={submitData} variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-brand-100">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-3xl font-bold">Registro de Contacto</h2>
                                <p className="text-brand-500">Comenzaremos a ayudarte de inmediato</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-700 mb-1">Nombre Completo *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-5 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-brand-50 font-medium text-lg"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-700 mb-1">Celular / WhatsApp *</label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full px-5 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-brand-50 font-medium text-lg"
                                        placeholder="+56 9 XXXXXXXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-700 mb-1">Correo Electrónico (Opcional)</label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-5 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-brand-50 font-medium text-lg"
                                        placeholder="tu@correo.com"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-brand-600 text-white rounded-2xl text-xl font-bold hover:bg-brand-700 transition-all shadow-md mt-4 flex items-center justify-center disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin mr-2" /> Guardando...</>
                                ) : (
                                    'Enviar y Finalizar'
                                )}
                            </button>
                        </motion.form>
                    )}

                    {currentStep === 'success' && (
                        <motion.div key="success" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="text-center space-y-6 bg-white p-10 rounded-3xl shadow-xl border border-brand-100">
                            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check size={48} strokeWidth={3} />
                            </div>
                            <h2 className="text-3xl font-bold text-brand-900">¡Muchas gracias!</h2>
                            <p className="text-xl text-brand-600">
                                Hemos guardado tu información exitosamente. Nos pondremos en contacto contigo pronto.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

               {/* Progress indicator (optional, simplified) */}
               {['q1', 'symptoms', 'risks', 'result', 'contact'].includes(currentStep) && (
                   <div className="flex justify-center gap-2 mt-12">
                       {['q1', 'symptoms', 'risks', 'result', 'contact'].map(s => (
                           <div key={s} className={`w-2 h-2 rounded-full ${s === currentStep ? 'bg-brand-600' : 'bg-brand-200'}`} />
                       ))}
                   </div>
               )}

            </div>
        </div>
    );
};

export default TalkEvaluationPage;
