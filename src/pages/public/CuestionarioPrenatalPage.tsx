import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { prenatalQuestions } from '../../data/cuestionarioPrenatal';
import { Button } from '../../components/ui/Button';
import { Check, ChevronRight, Loader2, Award } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type Step = 'intro' | 'question' | 'results';

export default function CuestionarioPrenatalPage() {
    const [step, setStep] = useState<Step>('intro');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [userInfo, setUserInfo] = useState({ name: '', email: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [score, setScore] = useState(0);

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (userInfo.name.trim() && userInfo.email.trim()) {
            setStep('question');
        }
    };

    const handleOptionSelect = (optionId: string) => {
        const questionId = prenatalQuestions[currentQuestionIndex].id;
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleNext = async () => {
        if (currentQuestionIndex < prenatalQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            await handleSubmit();
        }
    };

    const calculateScore = () => {
        let correctAnswers = 0;
        prenatalQuestions.forEach(q => {
            const selectedOptionId = answers[q.id];
            const correctOption = q.options.find(opt => opt.isCorrect);
            if (correctOption && selectedOptionId === correctOption.id) {
                correctAnswers += 1;
            }
        });
        return correctAnswers;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const finalScore = calculateScore();
        setScore(finalScore);

        try {
            await addDoc(collection(db, 'cuestionarios_respuestas'), {
                userInfo,
                answers,
                score: finalScore,
                totalQuestions: prenatalQuestions.length,
                submittedAt: serverTimestamp(),
                type: 'prenatal_certification'
            });
            setStep('results');
        } catch (error) {
            console.error("Error saving to Firebase:", error);
            alert("Hubo un error al guardar tus respuestas. Por favor, intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Variantes para animación Typeform
    const slideVariants = {
        enter: { y: 50, opacity: 0 },
        center: { y: 0, opacity: 1 },
        exit: { y: -50, opacity: 0 }
    };

    return (
        <div className="min-h-screen bg-brand-50 flex flex-col font-sans text-brand-900 overflow-hidden">
            {/* Header simple */}
            <div className="p-6 md:p-8 flex items-center justify-between z-10">
                <div className="font-bold text-xl text-brand-600">Escuela Ilumina Yoga</div>
                {step === 'question' && (
                    <div className="text-sm font-medium text-brand-400 bg-brand-100 px-3 py-1 rounded-full">
                        {currentQuestionIndex + 1} / {prenatalQuestions.length}
                    </div>
                )}
            </div>

            {/* Barra de progreso Typeform style */}
            {step === 'question' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-100 z-20">
                    <motion.div 
                        className="h-full bg-brand-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestionIndex) / prenatalQuestions.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            )}

            <main className="flex-grow flex items-center justify-center p-4 md:p-8 w-full max-w-4xl mx-auto relative">
                <AnimatePresence mode="wait">
                    
                    {/* PANTALLA 1: INTRO */}
                    {step === 'intro' && (
                        <motion.div
                            key="intro"
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-full max-w-lg bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-brand-100"
                        >
                            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight text-brand-800">
                                Examen de Certificación
                            </h1>
                            <p className="text-lg text-brand-600 mb-8 leading-relaxed">
                                Formación de Yoga Prenatal. Completa tus datos para comenzar el cuestionario oficial.
                            </p>

                            <form onSubmit={handleStart} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-brand-700 ml-1">Nombre Completo</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Escribe tu nombre y apellido..."
                                        value={userInfo.name}
                                        onChange={e => setUserInfo({ ...userInfo, name: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-brand-200 bg-brand-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-brand-700 ml-1">Correo Electrónico</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="tu@correo.com"
                                        value={userInfo.email}
                                        onChange={e => setUserInfo({ ...userInfo, email: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-brand-200 bg-brand-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-lg"
                                    />
                                </div>

                                <Button type="submit" size="lg" className="w-full group mt-4 h-14 text-lg">
                                    Comenzar Cuestionario
                                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {/* PANTALLA 2: PREGUNTAS */}
                    {step === 'question' && (
                        <motion.div
                            key={`question-${currentQuestionIndex}`}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="w-full"
                        >
                            <div className="max-w-3xl mx-auto space-y-8">
                                
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-brand-500">
                                        {prenatalQuestions[currentQuestionIndex].module}
                                    </h3>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                                        {currentQuestionIndex + 1}. {prenatalQuestions[currentQuestionIndex].text}
                                    </h2>
                                </div>

                                <div className="space-y-3 mt-8">
                                    {prenatalQuestions[currentQuestionIndex].options.map((option) => {
                                        const isSelected = answers[prenatalQuestions[currentQuestionIndex].id] === option.id;
                                        
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleOptionSelect(option.id)}
                                                className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center group
                                                    ${isSelected 
                                                        ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' 
                                                        : 'border-transparent bg-white shadow-sm hover:bg-brand-50/80 hover:border-brand-200'
                                                    }
                                                `}
                                            >
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 transition-colors font-bold
                                                    ${isSelected 
                                                        ? 'bg-brand-600 border-brand-600 text-white' 
                                                        : 'border-brand-200 text-brand-400 group-hover:border-brand-300'
                                                    }
                                                `}>
                                                    {isSelected ? <Check className="w-5 h-5" /> : option.id}
                                                </div>
                                                <span className={`text-lg ${isSelected ? 'font-medium text-brand-900' : 'text-brand-700'}`}>
                                                    {option.text}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="pt-8 flex justify-end">
                                    <Button 
                                        size="lg" 
                                        onClick={handleNext}
                                        disabled={!answers[prenatalQuestions[currentQuestionIndex].id] || isSubmitting}
                                        className="min-w-[160px] h-14"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="animate-spin w-6 h-6" />
                                        ) : currentQuestionIndex === prenatalQuestions.length - 1 ? (
                                            'Finalizar Examen'
                                        ) : (
                                            <>
                                                Siguiente
                                                <ChevronRight className="ml-2 w-5 h-5" />
                                            </>
                                        )}
                                    </Button>
                                </div>

                            </div>
                        </motion.div>
                    )}

                    {/* PANTALLA 3: RESULTADOS */}
                    {step === 'results' && (
                        <motion.div
                            key="results"
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            className="w-full max-w-lg bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-brand-100 text-center"
                        >
                            <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Award className="w-10 h-10" />
                            </div>
                            
                            <h2 className="text-3xl font-extrabold mb-2 text-brand-900">
                                ¡Examen Completado!
                            </h2>
                            <p className="text-brand-600 mb-8 text-lg">
                                Gracias por tu participación, {userInfo.name.split(' ')[0]}.
                            </p>

                            <div className="bg-brand-50 p-6 rounded-2xl mb-8 border border-brand-100">
                                <p className="text-sm font-semibold uppercase tracking-wider text-brand-500 mb-2">Tu Puntaje</p>
                                <div className="text-5xl font-black text-brand-700">
                                    {score} <span className="text-2xl text-brand-400 font-bold">/ {prenatalQuestions.length}</span>
                                </div>
                                <p className="mt-3 text-brand-600 font-medium">
                                    ({Math.round((score / prenatalQuestions.length) * 100)}% de respuestas correctas)
                                </p>
                            </div>

                            <p className="text-sm text-brand-400">
                                Tus respuestas han sido guardadas exitosamente.
                            </p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}
