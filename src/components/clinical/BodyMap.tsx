import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BodyMapProps {
    value?: {
        painRegions: string[];
        painType: string;
    };
    onChange: (value: { painRegions: string[]; painType: string }) => void;
}

type ViewMode = 'general-front' | 'general-back' | 'pelvis' | 'vulva';

export const BodyMap: React.FC<BodyMapProps> = ({ value = { painRegions: [], painType: '' }, onChange }) => {
    const [view, setView] = useState<ViewMode>('general-front');

    const handleRegionClick = (region: string) => {
        const currentRegions = value.painRegions || [];
        const newRegions = currentRegions.includes(region)
            ? currentRegions.filter(r => r !== region)
            : [...currentRegions, region];

        onChange({ ...value, painRegions: newRegions });
    };

    const isSelected = (region: string) => value.painRegions?.includes(region);

    return (
        <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-serif font-bold text-gray-800 mb-4 text-center">Mapa del Dolor</h3>

            {/* View Selector */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                <button
                    onClick={() => setView('general-front')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${view === 'general-front' ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Cuerpo (Frente)
                </button>
                <button
                    onClick={() => setView('general-back')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${view === 'general-back' ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Cuerpo (Espalda)
                </button>
                <button
                    onClick={() => setView('pelvis')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${view === 'pelvis' ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Pelvis Osea
                </button>
                <button
                    onClick={() => setView('vulva')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${view === 'vulva' ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Zona Vulvar
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">

                {/* Interactive Map Area */}
                <div className="relative aspect-[3/4] bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden">
                    <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-gray-500 pointer-events-none">
                        {view === 'general-front' && 'Vista Anterior'}
                        {view === 'general-back' && 'Vista Posterior'}
                        {view === 'pelvis' && 'Pelvis Ósea'}
                        {view === 'vulva' && 'Mapa Vulvar'}
                    </div>

                    <svg viewBox="0 0 200 400" className="h-full w-auto max-h-[500px] drop-shadow-xl">
                        {/* GENERAL FRONT */}
                        {view === 'general-front' && (
                            <g className="cursor-pointer">
                                {/* Head */}
                                <path
                                    d="M100 20 C85 20 75 35 75 50 C75 65 85 75 100 75 C115 75 125 65 125 50 C125 35 115 20 100 20"
                                    fill={isSelected('Cabeza') ? '#EC4899' : '#E5E7EB'}
                                    stroke="#CBD5E1" strokeWidth="1"
                                    onClick={() => handleRegionClick('Cabeza')}
                                    className="hover:fill-pink-200 transition-colors"
                                />
                                {/* Neck */}
                                <path
                                    d="M90 75 L110 75 L110 85 L90 85 Z"
                                    fill={isSelected('Cuello') ? '#EC4899' : '#E5E7EB'}
                                    stroke="#CBD5E1" strokeWidth="1"
                                    onClick={() => handleRegionClick('Cuello')}
                                    className="hover:fill-pink-200 transition-colors"
                                />
                                {/* Chest */}
                                <path
                                    d="M70 85 L130 85 L125 130 L75 130 Z"
                                    fill={isSelected('Pecho') ? '#EC4899' : '#E5E7EB'}
                                    stroke="#CBD5E1" strokeWidth="1"
                                    onClick={() => handleRegionClick('Pecho')}
                                    className="hover:fill-pink-200 transition-colors"
                                />
                                {/* Abdomen */}
                                <path
                                    d="M75 130 L125 130 L120 170 L80 170 Z"
                                    fill={isSelected('Abdomen') ? '#EC4899' : '#E5E7EB'}
                                    stroke="#CBD5E1" strokeWidth="1"
                                    onClick={() => handleRegionClick('Abdomen')}
                                    className="hover:fill-pink-200 transition-colors"
                                />
                                {/* Pelvis/Hips */}
                                <path
                                    d="M80 170 L120 170 L130 190 L70 190 Z"
                                    fill={isSelected('Pelvis') ? '#EC4899' : '#E5E7EB'}
                                    stroke="#CBD5E1" strokeWidth="1"
                                    onClick={() => handleRegionClick('Pelvis')}
                                    className="hover:fill-pink-200 transition-colors"
                                />
                                {/* Arms */}
                                <path
                                    d="M70 85 L50 150 L60 155 L75 100 Z"
                                    fill={isSelected('Brazo Izq') ? '#EC4899' : '#E5E7EB'}
                                    stroke="#CBD5E1" strokeWidth="1"
                                    onClick={() => handleRegionClick('Brazo Izq')}
                                    className="hover:fill-pink-200 transition-colors"
                                />
                                <path
                                    d="M130 85 L150 150 L140 155 L125 100 Z"
                                    fill={isSelected('Brazo Der') ? '#EC4899' : '#E5E7EB'}
                                    stroke="#CBD5E1" strokeWidth="1"
                                    onClick={() => handleRegionClick('Brazo Der')}
                                    className="hover:fill-pink-200 transition-colors"
                                />
                                {/* Legs */}
                                <path
                                    d="M70 190 L95 190 L90 300 L75 300 Z"
                                    fill={isSelected('Pierna Izq') ? '#EC4899' : '#E5E7EB'}
                                    stroke="#CBD5E1" strokeWidth="1"
                                    onClick={() => handleRegionClick('Pierna Izq')}
                                    className="hover:fill-pink-200 transition-colors"
                                />
                                <path
                                    d="M105 190 L130 190 L125 300 L110 300 Z"
                                    fill={isSelected('Pierna Der') ? '#EC4899' : '#E5E7EB'}
                                    stroke="#CBD5E1" strokeWidth="1"
                                    onClick={() => handleRegionClick('Pierna Der')}
                                    className="hover:fill-pink-200 transition-colors"
                                />
                            </g>
                        )}

                        {/* GENERAL BACK */}
                        {view === 'general-back' && (
                            <g className="cursor-pointer">
                                {/* Head Back */}
                                <circle cx="100" cy="50" r="25" fill={isSelected('Cabeza Posterior') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Cabeza Posterior')} className="hover:fill-pink-200" />
                                {/* Neck Back */}
                                <rect x="90" y="75" width="20" height="10" fill={isSelected('Cervical') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Cervical')} className="hover:fill-pink-200" />
                                {/* Upper Back */}
                                <path d="M70 85 L130 85 L125 140 L75 140 Z" fill={isSelected('Dorsal') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Dorsal')} className="hover:fill-pink-200" />
                                {/* Lower Back */}
                                <path d="M75 140 L125 140 L120 170 L80 170 Z" fill={isSelected('Lumbar') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Lumbar')} className="hover:fill-pink-200" />
                                {/* Glutes */}
                                <path d="M80 170 L120 170 L130 200 L70 200 Z" fill={isSelected('Glúteos') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Glúteos')} className="hover:fill-pink-200" />
                                {/* Legs Back */}
                                <path d="M70 200 L95 200 L90 310 L75 310 Z" fill={isSelected('Pierna Izq Post') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Pierna Izq Post')} className="hover:fill-pink-200" />
                                <path d="M105 200 L130 200 L125 310 L110 310 Z" fill={isSelected('Pierna Der Post') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Pierna Der Post')} className="hover:fill-pink-200" />
                            </g>
                        )}

                        {/* PELVIS SCHEMATIC */}
                        {view === 'pelvis' && (
                            <g transform="translate(0, 50) scale(1.5)" className="cursor-pointer">
                                {/* Ilium Left */}
                                <path d="M40 50 Q60 20 80 50 L90 90 L30 90 Z" fill={isSelected('Iliaco Izq') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Iliaco Izq')} className="hover:fill-pink-200" />
                                {/* Ilium Right */}
                                <path d="M160 50 Q140 20 120 50 L110 90 L170 90 Z" fill={isSelected('Iliaco Der') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Iliaco Der')} className="hover:fill-pink-200" />
                                /* Sacrum */
                                <path d="M90 90 L110 90 L100 130 Z" fill={isSelected('Sacro') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Sacro')} className="hover:fill-pink-200" />
                                /* Pubis */
                                <rect x="90" y="135" width="20" height="15" rx="5" fill={isSelected('Pubis') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Pubis')} className="hover:fill-pink-200" />
                                /* Hip Joint Left */
                                <circle cx="35" cy="110" r="15" fill={isSelected('Cadera Izq') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Cadera Izq')} className="hover:fill-pink-200" />
                                /* Hip Joint Right */
                                <circle cx="165" cy="110" r="15" fill={isSelected('Cadera Der') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Cadera Der')} className="hover:fill-pink-200" />
                            </g>
                        )}

                        {/* VULVA SCHEMATIC */}
                        {view === 'vulva' && (
                            <g transform="translate(0, 50) scale(1.2)" className="cursor-pointer">
                                {/* Labia Majora */}
                                <ellipse cx="100" cy="100" rx="40" ry="70" fill={isSelected('Labios Mayores') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Labios Mayores')} className="hover:fill-pink-200" />
                                {/* Labia Minora */}
                                <ellipse cx="100" cy="100" rx="20" ry="50" fill={isSelected('Labios Menores') ? '#EC4899' : '#FCE7F3'} stroke="#EC4899" onClick={() => handleRegionClick('Labios Menores')} className="hover:fill-pink-300" />
                                {/* Clitoris */}
                                <circle cx="100" cy="55" r="8" fill={isSelected('Clítoris') ? '#EC4899' : '#F472B6'} stroke="#BE185D" onClick={() => handleRegionClick('Clítoris')} className="hover:fill-pink-600" />
                                {/* Vestibule/Entrance */}
                                <circle cx="100" cy="110" r="15" fill={isSelected('Vestíbulo') ? '#EC4899' : '#FBCFE8'} stroke="#DB2777" onClick={() => handleRegionClick('Vestíbulo')} className="hover:fill-pink-400" />
                                {/* Perineum */}
                                <rect x="90" y="175" width="20" height="15" fill={isSelected('Periné') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Periné')} className="hover:fill-pink-200" />
                                {/* Anus */}
                                <circle cx="100" cy="200" r="6" fill={isSelected('Ano') ? '#EC4899' : '#E5E7EB'} stroke="#CBD5E1" onClick={() => handleRegionClick('Ano')} className="hover:fill-pink-200" />
                            </g>
                        )}
                    </svg>

                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => onChange({ ...value, painRegions: [] })}
                            className="text-xs bg-white border px-2 py-1 rounded shadow-sm hover:bg-red-50 text-red-500"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* Details Panel */}
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2">Zonas Seleccionadas</h4>
                        <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-gray-50 rounded-xl border border-gray-200">
                            {(!value.painRegions || value.painRegions.length === 0) && (
                                <span className="text-gray-400 text-sm italic">Selecciona zonas en el mapa...</span>
                            )}
                            {value.painRegions?.includes('SIN DOLOR') && (
                                <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full font-bold border border-green-200 shadow-sm">
                                    ✨ Sin Dolor
                                </span>
                            )}
                            {value.painRegions?.filter(r => r !== 'SIN DOLOR').map(region => (
                                <motion.span
                                    key={region}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="px-3 py-1 text-sm bg-white text-brand-700 rounded-full font-medium border border-brand-100 shadow-sm flex items-center gap-2"
                                >
                                    {region}
                                    <button
                                        onClick={() => handleRegionClick(region)}
                                        className="text-brand-400 hover:text-red-500"
                                    >×</button>
                                </motion.span>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const isNoPain = value.painRegions?.includes('SIN DOLOR');
                                onChange({
                                    ...value,
                                    painRegions: isNoPain ? [] : ['SIN DOLOR']
                                });
                            }}
                            className={`mt-3 w-full py-2 px-4 rounded-lg font-bold text-sm transition-all border ${value.painRegions?.includes('SIN DOLOR') ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600'}`}
                        >
                            {value.painRegions?.includes('SIN DOLOR') ? '✓ Actualmente Sin Dolor' : 'No siento dolor actualmente'}
                        </button>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-700 mb-2">Descripción del Dolor</h4>
                        <p className="text-xs text-gray-500 mb-2">¿Cómo describirías la sensación? (Ej: Punzante, Quemazón, Pesadez...)</p>
                        <textarea
                            value={value.painType}
                            onChange={(e) => onChange({ ...value, painType: e.target.value })}
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none resize-none h-32 text-sm"
                            placeholder="Escribe aquí..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
