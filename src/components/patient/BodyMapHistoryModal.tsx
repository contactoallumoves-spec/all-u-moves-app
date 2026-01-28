import React from 'react';
import { BodyMap } from '../clinical/BodyMap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '../ui/Badge';
import { X } from 'lucide-react';

interface BodyMapEntry {
    date: Date;
    source: string; // 'Pre-Ingreso', 'Evaluación', etc.
    data: {
        painRegions: string[];
        painType?: string;
    };
}

interface BodyMapHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    maps: BodyMapEntry[];
    patientName: string;
}

export const BodyMapHistoryModal: React.FC<BodyMapHistoryModalProps> = ({
    isOpen,
    onClose,
    maps,
    patientName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-display font-bold text-brand-900">
                            Historial de Mapas Corporales
                        </h2>
                        <p className="text-brand-500 text-sm">Pac: {patientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                    {maps.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            No hay registros de mapas corporales.
                        </div>
                    ) : (
                        maps.map((map, index) => (
                            <div key={index} className="bg-white border border-brand-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-4 py-3 border-b border-brand-50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-white">
                                            {map.source}
                                        </Badge>
                                        <span className="text-sm font-medium text-gray-700">
                                            {/* Handle possible invalid dates or timestamps */}
                                            {(() => {
                                                try {
                                                    const d = map.date instanceof Date ? map.date :
                                                        (map.date as any)?.toDate ? (map.date as any).toDate() :
                                                            new Date(map.date);
                                                    return format(d, "d 'de' MMMM, yyyy", { locale: es });
                                                } catch (e) {
                                                    return 'Fecha desconocida';
                                                }
                                            })()}
                                        </span>
                                    </div>
                                    <span className="text-xs text-brand-300 font-mono">#{maps.length - index}</span>
                                </div>
                                <div className="flex justify-center bg-slate-900/5 py-8">
                                    {/* Wrapper to control scaling/sizing specifically for the history view */}
                                    <div className="relative w-[300px] h-[550px] flex items-center justify-center pointer-events-none">
                                        <div className="transform scale-90 origin-center">
                                            <BodyMap
                                                value={map.data}
                                                onChange={() => { }}
                                                readOnly={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {map.data.painType && (
                                    <div className="px-4 py-3 bg-white border-t border-brand-50 text-sm text-gray-600">
                                        <span className="font-medium text-brand-700">Sensaciones:</span> {map.data.painType}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
