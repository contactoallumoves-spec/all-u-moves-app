
import { CLUSTERS } from '../../data/clusters';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface SymptomSelectorProps {
    selectedSymptoms: string[];
    onChange: (symptoms: string[]) => void;
}

export function SymptomSelector({ selectedSymptoms, onChange }: SymptomSelectorProps) {

    const toggleSymptom = (id: string) => {
        if (selectedSymptoms.includes(id)) {
            onChange(selectedSymptoms.filter(s => s !== id));
        } else {
            onChange([...selectedSymptoms, id]);
        }
    };

    // Helper to format ID to readable label (simple Replace or specialized map)
    const formatLabel = (id: string) => {
        return id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="space-y-6">
            <h3 className="font-bold text-brand-800">Síntomas y Signos Clave (Marcadores)</h3>
            <p className="text-sm text-brand-500 -mt-2">
                Selecciona los hallazgos para generar sugerencias automáticas.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
                {CLUSTERS.map(cluster => (
                    <div key={cluster.id} className="bg-brand-50/50 p-4 rounded-xl border border-brand-100">
                        <h4 className="font-bold text-sm text-brand-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                            {cluster.label}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {cluster.triggers.symptoms.map(symptomId => {
                                const isSelected = selectedSymptoms.includes(symptomId);
                                return (
                                    <button
                                        key={symptomId}
                                        onClick={() => toggleSymptom(symptomId)}
                                        className={cn(
                                            "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5",
                                            isSelected
                                                ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                                                : "bg-white text-brand-600 border-brand-200 hover:border-brand-300"
                                        )}
                                    >
                                        {isSelected && <Check className="w-3 h-3" />}
                                        {formatLabel(symptomId)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
