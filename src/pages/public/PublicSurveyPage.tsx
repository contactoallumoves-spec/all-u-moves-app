import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PatientService } from '../../services/patientService';
import { EvaluationService } from '../../services/evaluationService';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, CheckCircle2 } from 'lucide-react';

// Form Components (We'll create these next)
import { ICIQForm } from '../../components/clinical/questionnaires/ICIQForm';
import { UDI6Form } from '../../components/clinical/questionnaires/UDI6Form';

export default function PublicSurveyPage() {
    const { patientId, type } = useParams();
    // const navigate = useNavigate();
    const [patientName, setPatientName] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [answers, setAnswers] = useState<any>({});
    const [score, setScore] = useState(0);
    const [interpretation, setInterpretation] = useState('');

    useEffect(() => {
        const loadPatient = async () => {
            if (!patientId) return;
            try {
                const p = await PatientService.getById(patientId);
                if (p) {
                    setPatientName(`${p.firstName} ${p.lastName}`);
                } else {
                    setError('Enlace inválido o paciente no encontrada.');
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar datos.');
            } finally {
                setLoading(false);
            }
        };
        loadPatient();
    }, [patientId]);

    const handleSubmit = async () => {
        if (!patientId || !type) return;
        setSubmitting(true);
        try {
            // Save as a special 'questionnaire' type evaluation or part of "complete"
            // We'll save it as 'fast' type but with specialized details for now, or assume 'questionnaire' type support added later
            // For now, let's store it as 'complete' with just this data, or better:
            // We defined QuestionnaireResponse in Evaluation interface. We can use a standard structure.

            await EvaluationService.create({
                patientId,
                type: 'fast', // Marking as fast/generic for now, can be specific if we add enum
                date: new Date(),
                patientData: { stage: 'Remote', redFlags: [] },
                clusters: { active: [] },
                summary: `Cuestionario ${type.toUpperCase()} completado remotamente.`,
                plan: { education: [], tasks: [] },
                status: 'completed',
                location: 'Online',
                questionnaire: {
                    type: type as 'iciq-sf' | 'udi-6',
                    answers,
                    score,
                    interpretation,
                    source: 'public_link'
                }
            } as any);

            setCompleted(true);
        } catch (err) {
            console.error(err);
            alert('Error al guardar. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    if (completed) {
        return (
            <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-brand-800 mb-2">¡Gracias {patientName.split(' ')[0]}!</h2>
                    <p className="text-gray-600">Tus respuestas han sido guardadas exitosamente en tu ficha clínica.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-in fade-in duration-700">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Branding */}
                <div className="flex justify-center mb-4">
                    <img src="/allumoves-logo.png" alt="All U Moves" className="h-20 w-auto object-contain" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-serif font-extrabold text-brand-900 tracking-tight">
                    {type === 'iciq-sf' ? 'Cuestionario de Síntomas' : 'Evaluación de Salud'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {patientName ? `Hola, ${patientName.split(' ')[0]}.` : 'Cargando...'}
                    <br />
                    Por favor responde las siguientes preguntas.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-brand-100/50 sm:rounded-xl sm:px-10 border border-brand-50">
                    <p className="text-brand-600">Para: <span className="font-bold">{patientName}</span></p>
                </div>

                <Card className="mt-4">
                    <CardContent className="p-6">
                        {type === 'iciq-sf' ? (
                            <ICIQForm
                                onChange={(data) => {
                                    setAnswers(data.answers);
                                    setScore(data.score);
                                    setInterpretation(data.interpretation);
                                }}
                            />
                        ) : type === 'udi-6' ? (
                            <UDI6Form
                                onChange={(data) => {
                                    setAnswers(data.answers);
                                    setScore(data.score);
                                    setInterpretation(data.interpretation);
                                }}
                            />
                        ) : (
                            <div className="text-center py-10 text-gray-400">Formulario no encontrado.</div>
                        )}

                        <div className="mt-8">
                            <Button
                                onClick={handleSubmit}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                                size="lg"
                                disabled={submitting || (type === 'iciq-sf' && score === 0 && Object.keys(answers).length === 0)} // Basic validation
                            >
                                {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
                                Enviar Respuestas
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
