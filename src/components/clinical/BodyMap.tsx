import React, { useState } from 'react';

import { SVG_CONFIG, FRONT_PATHS, BACK_PATHS, REGION_NAMES } from './BodyMapPaths';

interface BodyMapProps {
    value?: {
        painRegions: string[];
        painType?: string;
    };
    onChange: (value: { painRegions: string[]; painType?: string }) => void;
    containerClassName?: string;
    bodyFill?: string;
}

type ViewMode = 'anterior' | 'posterior';

export const BodyMap: React.FC<BodyMapProps & { readOnly?: boolean }> = ({
    value = { painRegions: [] as string[], painType: '' },
    onChange,
    readOnly = false,
    containerClassName,
    bodyFill = '#334155'
}) => {
    const [view, setView] = useState<ViewMode>('anterior');

    // Symptom types and colors
    // Pain = Solid Red
    // Tingling = Yellow Stripes
    // Numbness = Blue Dots
    // Stiffness = Green Crosshatch
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
        if (readOnly) return;

        const regionName = REGION_NAMES[regionKey] || regionKey;
        const currentRegions = value.painRegions || [];

        // Check if THIS specific symptom (Region + Type) is already present
        const exactMatchIndex = currentRegions.findIndex(r => {
            const data = getRegionData(r);
            return (data.id === regionName || data.id === regionKey) && data.type === selectedType;
        });

        let newRegions = [...currentRegions];

        if (exactMatchIndex >= 0) {
            // Toggle OFF this specific symptom
            newRegions.splice(exactMatchIndex, 1);
        } else {
            // Add NEW symptom (without removing others from same region)
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

                {!readOnly && (
                    <>
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
                            Selecciona un síntoma y toca el área afectada. Puedes marcar varios síntomas en la misma zona.
                        </p>
                    </>
                )}
            </div>

            {/* Body Map SVG Container */}
            <div
                className={containerClassName || "relative w-full overflow-hidden bg-slate-800/30 rounded-3xl border border-slate-700/50 shadow-2xl flex items-center justify-center transition-all"}
                style={{ minHeight: '700px' }}
            >
                <div className="relative z-10 w-full flex justify-center items-center h-full p-4">
                    <svg
                        viewBox={SVG_CONFIG.viewBox}
                        className="h-full w-full drop-shadow-2xl"
                        style={{ height: '700px', maxWidth: '100%', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}
                    >
                        <defs>
                            {/* PATTERN: Tingling (Yellow Stripes) */}
                            <pattern id="pattern-tingling" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                                <line x1="0" y="0" x2="0" y2="10" stroke="#eab308" strokeWidth="6" />
                            </pattern>

                            {/* PATTERN: Numbness (Blue Dots) */}
                            <pattern id="pattern-numbness" patternUnits="userSpaceOnUse" width="6" height="6">
                                <circle cx="2" cy="2" r="2" fill="#3b82f6" />
                            </pattern>

                            {/* PATTERN: Stiffness (Green Crosshatch) */}
                            <pattern id="pattern-stiffness" patternUnits="userSpaceOnUse" width="8" height="8">
                                <path d="M0,8 L8,0 M-2,2 L2,-2 M6,10 L10,6" stroke="#22c55e" strokeWidth="2" />
                            </pattern>
                        </defs>
                        <g>
                            {Object.entries(activePaths).map(([key, path]) => {
                                const regionName = REGION_NAMES[key] || key;
                                const currentRegions = value.painRegions || [];

                                // Find ALL symptoms for this region
                                const regionSymptoms = currentRegions.filter(r => {
                                    const data = getRegionData(r);
                                    return data.id === regionName || data.id === key;
                                }).map(r => getRegionData(r));

                                const isSelected = regionSymptoms.length > 0;
                                const hasPain = regionSymptoms.some(s => s.type === 'pain');
                                const otherSymptoms = regionSymptoms.filter(s => s.type !== 'pain');

                                // Base Fill: Red if 'pain' is present, else bodyFill
                                let baseFill = hasPain ? '#ef4444' : bodyFill;

                                // If NO pain but has others, use transparent base so patterns show clearly on dark bg?
                                // Better: Use Slate base always, and overlay pain as red layer?
                                // Current design: Fill is the base color.
                                // If ONLY 'tingling', base could be Slate, and we overlay Stripes.

                                return (
                                    <React.Fragment key={key}>
                                        {/* BASE LAYER (Structure/Pain) */}
                                        <path
                                            id={key}
                                            d={path}
                                            fill={baseFill}
                                            stroke={isSelected ? '#ffffff' : '#475569'}
                                            strokeWidth={isSelected ? 2 : 1}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRegionClick('', key);
                                            }}
                                            className={`transition-all duration-200 ${!readOnly ? 'cursor-pointer hover:opacity-80' : ''} ${isSelected ? 'filter drop-shadow-md' : ''}`}
                                        />

                                        {/* OVERLAY LAYERS (Patterns for other symptoms) */}
                                        {otherSymptoms.map((symptom) => (
                                            <path
                                                key={`${key}-${symptom.type}`}
                                                d={path}
                                                fill={`url(#pattern-${symptom.type})`}
                                                stroke="none"
                                                className="pointer-events-none"
                                                style={{ mixBlendMode: 'normal', opacity: 0.8 }}
                                            />
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
};
