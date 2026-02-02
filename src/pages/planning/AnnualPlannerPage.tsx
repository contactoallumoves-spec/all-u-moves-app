import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PlanService } from '../../services/planService';
import { PatientService } from '../../services/patientService';
import { AnnualPlan } from '../../types/plan';
import { Patient, PrescribedPlan } from '../../types/patient';
import { AnnualCalendar } from '../../components/planning/AnnualCalendar';
import { PlanBuilder } from '../../components/clinical/PlanBuilder';
import { Timestamp } from 'firebase/firestore';

export default function AnnualPlannerPage() {
    const { patientId } = useParams<{ patientId: string }>();
    const [annualPlan, setAnnualPlan] = useState<AnnualPlan | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

    useEffect(() => {
        if (patientId) loadData();
    }, [patientId]);

    const loadData = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const [planData, patientData] = await Promise.all([
                PlanService.getActivePlan(patientId),
                PatientService.get(patientId)
            ]);

            let activePlan = planData;
            if (!activePlan) {
                // Auto-create if not exists for demo
                const newId = await PlanService.create(patientId, 'Temporada 2024', new Date());
                activePlan = {
                    id: newId,
                    patientId,
                    name: 'Temporada 2024',
                    startDate: new Date(),
                    macrocycles: [],
                    weeks: {},
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }
            setAnnualPlan(activePlan);
            setPatient(patientData);
        } catch (error) {
            console.error("Error loading planner data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToMacro = () => {
        setSelectedWeek(null);
        if (patientId) loadData(); // Reload to refresh calendar view
    };

    const handleSaveWeek = async (weekPlan: PrescribedPlan) => {
        if (!annualPlan?.id || !selectedWeek) return;
        await PlanService.updateWeek(annualPlan.id, selectedWeek, weekPlan);
        // We stay in the view or show success? PlanBuilder handles the alert.
    };

    const getWeekInitialPlan = (): PrescribedPlan => {
        if (!annualPlan || !selectedWeek) return {} as any;

        const existing = annualPlan.weeks[selectedWeek];
        if (existing) return existing;

        // Create empty structure for new week
        // Calculate date: StartDate + (Week-1) weeks
        const planStart = annualPlan.startDate instanceof Timestamp ? annualPlan.startDate.toDate() : new Date(annualPlan.startDate);
        const weekDate = new Date(planStart);
        weekDate.setDate(planStart.getDate() + (selectedWeek - 1) * 7);

        return {
            startDate: Timestamp.fromDate(weekDate),
            schedule: {
                monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
            },
            activeBlocks: {
                monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
            }
        };
    };

    if (loading) return <div className="p-8 text-brand-500 animate-pulse">Cargando Planificador...</div>;
    if (!annualPlan || !patient) return <div className="p-8 text-red-500">Error: No se pudo cargar el plan o el paciente.</div>;

    return (
        <div className="p-4 md:p-8 animate-in fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-brand-900">
                        {selectedWeek ? `Semana ${selectedWeek}` : annualPlan.name}
                    </h1>
                    <p className="text-brand-500 text-sm">
                        {selectedWeek ? 'Diseña las sesiones de esta semana.' : 'Panorama general de la temporada.'}
                    </p>
                </div>
                {selectedWeek && (
                    <button
                        onClick={handleBackToMacro}
                        className="text-sm font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                        ← Volver a Vista Anual
                    </button>
                )}
            </div>

            {/* Content Switcher */}
            {selectedWeek ? (
                // MICRO VIEW (Weekly Editor)
                <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-1 min-h-[600px]">
                    <PlanBuilder
                        patient={patient}
                        initialPlan={getWeekInitialPlan()}
                        customSaveHandler={handleSaveWeek}
                        onSave={handleBackToMacro} // Optional: Auto-exit on save? Or remove to keep editing. Let's keep for flow.
                    />
                </div>
            ) : (
                // MACRO VIEW (Annual Calendar)
                <AnnualCalendar
                    plan={annualPlan}
                    onSelectWeek={setSelectedWeek}
                    onAddMacrocycle={async (macro) => {
                        // TODO: Wire this up to PlanService
                        await PlanService.addMacrocycle(annualPlan.id!, macro, annualPlan.macrocycles);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
