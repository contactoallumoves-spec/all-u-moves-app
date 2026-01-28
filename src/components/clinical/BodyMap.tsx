import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

    const handleRegionClick = (_: string, regionKey: string) => {
        // Look up the friendly name
        const displayName = REGION_NAMES[regionKey] || regionKey;

        const currentRegions = value.painRegions || [];
        const isSelected = currentRegions.includes(displayName);

        let newRegions;
        if (isSelected) {
            newRegions = currentRegions.filter(r => r !== displayName);
        } else {
            // Remove 'SIN DOLOR' if selecting a region
            const tempRegions = currentRegions.filter(r => r !== 'SIN DOLOR');
            newRegions = [...tempRegions, displayName];
        }

        onChange({
            ...value,
            painRegions: newRegions
        });
    };

    const isSelected = (regionKey: string) => {
        const displayName = REGION_NAMES[regionKey] || regionKey;
        return value.painRegions?.includes(displayName);
    };

    // Choose which set of paths to render
    const activePaths = view === 'anterior' ? FRONT_PATHS : BACK_PATHS;

    return (
        <div className="w-full max-w-5xl mx-auto md:p-6 bg-white md:rounded-2xl md:shadow-lg md:border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h3 className="text-xl font-serif font-bold text-gray-800">Mapa del Dolor</h3>

                {/* View Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg mt-4 md:mt-0">
                    <button
                        onClick={() => setView('anterior')}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${view === 'anterior' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Vista Anterior
                    </button>
                    <button
                        onClick={() => setView('posterior')}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${view === 'posterior' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Vista Posterior
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12">

                {/* Interactive SVG Area */}
                <div className="relative bg-gray-50 md:rounded-3xl border-y md:border border-gray-200 py-8 flex flex-col items-center justify-center min-h-[600px] md:min-h-[700px]">

                    {/* Orientation Labels */}
                    <div className="absolute top-4 w-full flex justify-between px-8 text-xs font-bold text-gray-400 uppercase tracking-widest pointer-events-none">
                        <span>{view === 'anterior' ? 'Derecha' : 'Izquierda'}</span>
                        <span>{view === 'anterior' ? 'Izquierda' : 'Derecha'}</span>
                    </div>

                    <div className="relative w-full h-[700px] max-w-[400px]">
                        <svg
                            viewBox={SVG_CONFIG.viewBox}
                            className="w-full h-full drop-shadow-xl filter"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <AnimatePresence mode='wait'>
                                <g key={view}>
                                    {Object.entries(activePaths).map(([key, d]) => {
                                        if (!d) return null; // Skip empty paths while user is filling them out

                                        return (
                                            <motion.path
                                                key={key}
                                                d={d}
                                                id={key}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}

                                                // Style & Interaction
                                                fill={isSelected(key) ? '#EC4899' : '#334155'} // Slate-700 for unselected
                                                stroke={isSelected(key) ? '#BE185D' : '#475569'} // Slate-600 for stroke
                                                strokeWidth={isSelected(key) ? "3" : "2"}

                                                className="cursor-pointer transition-all duration-200 hover:filter hover:brightness-95"

                                                onClick={() => handleRegionClick(key, key)}

                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                            />
                                        );
                                    })}
                                    {/* Placeholder message if no paths are filled */}
                                    {Object.values(activePaths).every(v => v === "") && (
                                        <text x="50%" y="50%" textAnchor="middle" className="text-xs fill-gray-400">
                                            Esperando datos SVG...
                                        </text>
                                    )}
                                </g>
                            </AnimatePresence>
                        </svg>
                    </div>

                    {/* Quick Action: No Pain */}
                    <div className="absolute bottom-6 w-full flex justify-center">
                        <button
                            type="button"
                            onClick={() => onChange({ ...value, painRegions: ['SIN DOLOR'] })}
                            className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors ${value.painRegions?.includes('SIN DOLOR') ? 'bg-green-500 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-green-50'}`}
                        >
                            ✨ No siento dolor
                        </button>
                    </div>
                </div>

                {/* Details Side Panel */}
                <div className="flex flex-col space-y-6">
                    <div className="bg-brand-50/50 p-6 rounded-2xl border border-brand-100">
                        <h4 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                            Zonas Seleccionadas
                        </h4>

                        <div className="flex flex-wrap gap-2 min-h-[60px] content-start">
                            {(!value.painRegions || value.painRegions.length === 0) && (
                                <p className="text-gray-400 text-sm italic w-full text-center py-4">
                                    Haz clic en el cuerpo para marcar zonas...
                                </p>
                            )}

                            {value.painRegions?.map(region => (
                                <span
                                    key={region}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 ${region === 'SIN DOLOR' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white text-brand-700 border border-brand-100'}`}
                                >
                                    {region}
                                    {region !== 'SIN DOLOR' && (
                                        <button
                                            // Find the key for this displayName to remove it correctly
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                const keyToRemove = Object.keys(REGION_NAMES).find(key => REGION_NAMES[key] === region) || region;
                                                handleRegionClick('', keyToRemove);
                                            }}
                                            className="hover:text-red-500 ml-1"
                                        >×</button>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Detalle del Dolor (Opcional)
                        </label>
                        <textarea
                            value={value.painType || ''}
                            onChange={(e) => onChange({ ...value, painType: e.target.value })}
                            className="w-full h-40 p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 resize-none text-gray-600 placeholder-gray-400"
                            placeholder="Describe qué sientes (ej: punzante, quemazón, hormigueo)..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
