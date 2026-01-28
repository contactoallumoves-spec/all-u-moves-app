import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { BodyMap } from '../clinical/BodyMap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '../ui/Badge';

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
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-display text-brand-900">
                        Historial de Mapas Corporales - {patientName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-8 py-4">
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
                                <div className="flex justify-center bg-slate-900/5 py-6">
                                    {/* Wrapper to control scaling/sizing specifically for the history view */}
                                    <div className="relative w-[300px] h-[550px] flex items-center justify-center">
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
            </DialogContent>
        </Dialog>
    );
};
