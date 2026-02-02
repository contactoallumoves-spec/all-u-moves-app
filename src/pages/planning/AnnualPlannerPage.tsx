import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PlanService } from '../../services/planService';
import { AnnualPlan } from '../../types/plan';
import { AnnualCalendar } from '../../components/planning/AnnualCalendar';
import { PlanBuilder } from '../../components/clinical/PlanBuilder'; // Reuse existing wrapper logic
// Note: PlanBuilder currently expects a patientId. We need to adapt it or the page logic.
// For now, let's assume we pass the *data* to it. 
// Actually PlanBuilder takes `patientId` and handles loading inside. 
// We might need to refactor PlanBuilder to accept `initialData` or `weekOffset`.

// Adapter Wrapper: We need the existing PlanBuilder to work with *Weeks*.
// The current PlanBuilder logs to `activePlan` on the Patient.
// Phase 13 goal is to move `activePlan` to the `weeks` record in `AnnualPlan`.

export default function AnnualPlannerPage() {
    const { patientId } = useParams<{ patientId: string }>();
    const [annualPlan, setAnnualPlan] = useState<AnnualPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

    useEffect(() => {
        if (patientId) loadPlan();
    }, [patientId]);

    const loadPlan = async () => {
        if (!patientId) return;
        setLoading(true);
        let plan = await PlanService.getActivePlan(patientId);

        if (!plan) {
            // Auto-create if not exists for demo
            const newId = await PlanService.create(patientId, 'Temporada 2024', new Date());
            // Fetch again (lazy way for now)
            plan = {
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
        setAnnualPlan(plan);
        setLoading(false);
    };

    const handleBackToMacro = () => {
        setSelectedWeek(null);
        // Reload to update heatmap
        if (patientId) loadPlan();
    };

    if (loading) return <div className="p-8 text-brand-500">Cargando Planificador...</div>;
    if (!annualPlan) return <div className="p-8 text-red-500">Error: No se pudo cargar el plan.</div>;

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
                        className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                        ← Volver a Vista Anual
                    </button>
                )}
            </div>

            {/* Content Switcher */}
            {selectedWeek ? (
                // MICRO VIEW (Weekly Editor)
                // TODO: Wire up PlanBuilder to save to this specific week
                <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-1 min-h-[600px]">
                    {/* Placeholder for now - Real integration requires refactoring PlanBuilder to accept props */}
                    <div className="p-8 text-center bg-gray-50 m-4 rounded-xl border border-dashed border-gray-200">
                        <h3 className="text-lg font-bold text-gray-700">Editor de Semana {selectedWeek}</h3>
                        <p className="text-gray-500 mt-2">Aquí se cargará el PlanBuilder para la semana seleccionada.</p>
                        <p className="text-xs text-gray-400 mt-4">(Integration Pending Phase 13.2)</p>
                    </div>
                </div>
            ) : (
                // MACRO VIEW (Annual Calendar)
                <AnnualCalendar
                    plan={annualPlan}
                    onSelectWeek={setSelectedWeek}
                    onAddMacrocycle={() => alert("Coming soon: Modal de Macrociclos")}
                />
            )}
        </div>
    );
}
