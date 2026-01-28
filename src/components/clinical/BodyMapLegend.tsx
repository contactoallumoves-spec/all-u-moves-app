import React from 'react';

export const BodyMapLegend = () => {
    const SYMPTOM_TYPES = [
        { id: 'pain', label: 'Dolor', color: '#ef4444', ring: 'ring-red-500', bg: 'bg-red-500' },
        { id: 'tingling', label: 'Hormigueo', color: '#eab308', ring: 'ring-yellow-500', bg: 'bg-yellow-500' },
        { id: 'numbness', label: 'Adormecimiento', color: '#3b82f6', ring: 'ring-blue-500', bg: 'bg-blue-500' },
        { id: 'stiffness', label: 'Rigidez', color: '#22c55e', ring: 'ring-green-500', bg: 'bg-green-500' },
    ];

    return (
        <div className="flex flex-wrap justify-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-100">
            {SYMPTOM_TYPES.map((type) => (
                <div key={type.id} className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <span className={`w-3 h-3 rounded-full ${type.bg} shadow-sm border border-white`} />
                    {type.label}
                </div>
            ))}
        </div>
    );
};
