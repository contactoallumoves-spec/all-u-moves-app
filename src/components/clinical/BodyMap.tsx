import React, { useState } from 'react';

import { SVG_CONFIG, FRONT_PATHS, BACK_PATHS, REGION_NAMES } from './BodyMapPaths';

interface BodyMapProps {
    value?: {
        painRegions: string[];
        painType?: string;
    };
    onChange: (value: { painRegions: string[]; painType?: string }) => void;
}

type ViewMode = 'anterior' | 'posterior';

export const BodyMap: React.FC<BodyMapProps> = ({ value = { painRegions: [] as string[], painType: '' }, onChange }) => {
    const [view, setView] = useState<ViewMode>('anterior');

    // Symptom types and colors
    const SYMPTOM_TYPES = [
        { id: 'pain', label: 'Dolor', color: '#ef4444', ring: 'ring-red-500', bg: 'bg-red-500' },
        { id: 'tingling', label: 'Hormigueo', color: '#eab308', ring: 'ring-yellow-500', bg: 'bg-yellow-500' },
        { id: 'numbness', label: 'Adormecimiento', color: '#3b82f6', ring: 'ring-blue-500', bg: 'bg-blue-500' },
        { id: 'stiffness', label: 'Rigidez', color: '#22c55e', ring: 'ring-green-500', bg: 'bg-green-500' },
    ];

    const [selectedType, setSelectedType] = useState('pain');

    // Helper to parse "RegionName" or "RegionName:type"
    const getRegionData = (regionString: string) => {
        const [id, type] = regionString.split(':');
        return { id, type: type || 'pain' };
    };

    const handleRegionClick = (_: string, regionKey: string) => {
        // We use the friendly name as the ID to match existing data conventions if possible, 
        // but for new granular paths we might want to be more specific. 
        // Current convention seems to be storing the Display Name.
        const regionName = REGION_NAMES[regionKey] || regionKey;

        const currentRegions = value.painRegions || [];
        // Find if this region is already selected (checking both name and potential raw key for safety)
        const existingIndex = currentRegions.findIndex(r => {
            const data = getRegionData(r);
            return data.id === regionName || data.id === regionKey;
        });

        let newRegions = [...currentRegions];

        if (existingIndex >= 0) {
            const existingData = getRegionData(currentRegions[existingIndex]);
            if (existingData.type === selectedType) {
                // Toggle OFF if clicking same region with same tool
                newRegions.splice(existingIndex, 1);
            } else {
                // Update Type if clicking with different tool
                newRegions[existingIndex] = `${regionName}:${selectedType}`;
            }
        } else {
            // Add New
            const cleanRegions = newRegions.filter(r => r !== 'SIN DOLOR');
            cleanRegions.push(`${regionName}:${selectedType}`);
            newRegions = cleanRegions;
        }

        onChange({
            ...value,
            painRegions: newRegions
        });
    };

    // Choose which set of paths to render
    const activePaths = view === 'anterior' ? FRONT_PATHS : BACK_PATHS;

    return (
        <div className="flex flex-col items-center w-full">
            {/* Controls Header */}
            <div className="w-full max-w-md mb-4 flex flex-col gap-4">
                {/* View Toggle */}
                <div className="flex justify-center p-1 bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700">
                    <button
                        onClick={() => setView('anterior')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${view === 'anterior'
                            ? 'bg-slate-700 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Vista Anterior
                    </button>
                    <button
                        onClick={() => setView('posterior')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${view === 'posterior'
                            ? 'bg-slate-700 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Vista Posterior
                    </button>
                </div>

                {/* Symptom Selector Palette */}
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <div className="flex flex-wrap justify-center gap-2">
                        {SYMPTOM_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 text-xs font-medium ${selectedType === type.id
                                    ? `bg-slate-700 border-slate-500 text-white shadow-md ${type.ring} ring-1`
                                    : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                    }`}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${type.bg}`} />
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <p className="text-[10px] uppercase tracking-wider text-slate-500 text-center">
                    Selecciona un síntoma y toca el área afectada
                </p>
            </div>

            {/* Body Map SVG Container */}
            <div
                className="relative w-full overflow-hidden bg-slate-800/30 rounded-3xl border border-slate-700/50 shadow-2xl flex items-center justify-center transition-all"
                style={{ minHeight: '700px' }}
            >
                <div className="relative z-10 w-full flex justify-center items-center h-full p-4">
                    <svg
                        viewBox={SVG_CONFIG.viewBox}
                        className="h-full w-full drop-shadow-2xl"
                        style={{ height: '700px', maxWidth: '100%', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}
                    >
                        <g>
                            {Object.entries(activePaths).map(([key, path]) => {
                                const regionName = REGION_NAMES[key] || key;
                                // Find data for this region
                                const currentRegions = value.painRegions || [];
                                const regionEntry = currentRegions.find(r => {
                                    const data = getRegionData(r);
                                    return data.id === regionName || data.id === key; // Match name or raw key
                                });

                                const regionData = regionEntry ? getRegionData(regionEntry) : null;
                                const isSelected = !!regionData;

                                // Determine color
                                const symptomColor = regionData
                                    ? SYMPTOM_TYPES.find(s => s.id === regionData.type)?.color
                                    : null;

                                const finalFill = isSelected && symptomColor ? symptomColor : '#334155'; // Dark Slate for empty
                                const strokeColor = isSelected ? '#ffffff' : '#475569';

                                return (
                                    <path
                                        key={key}
                                        id={key}
                                        d={path}
                                        fill={finalFill}
                                        stroke={strokeColor}
                                        strokeWidth={isSelected ? 2 : 1}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRegionClick('', key);
                                        }}
                                        className={`cursor-pointer transition-all duration-200 hover:opacity-80 ${isSelected ? 'filter drop-shadow-md' : ''
                                            }`}
                                    />
                                );
                            })}
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
};
