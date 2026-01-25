import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Table as TableIcon, LineChart } from 'lucide-react';
import { ProgressChart } from './ProgressChart';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

interface ProgressDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: any[];
    patientName: string;
}

export function ProgressDetailModal({ isOpen, onClose, history, patientName }: ProgressDetailModalProps) {
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Setup dynamic import if needed, but for now we assume it's linked via handy utility
            const { generateProgressReport } = await import('../../utils/pdfExport');
            await generateProgressReport(patientName, history, 'progress-chart-container');
        } catch (error) {
            console.error(error);
            alert("Error al generar reporte. Asegúrate de haber instalado las dependencias.");
        } finally {
            setIsExporting(false);
        }
    };

    // Process data for Table View (Same logic as Chart)
    const data = history
        .filter(item => {
            if (!item.date) return false;
            const hasScore = item.raw?.symptomsScore !== undefined;
            const hasOxford = item.raw?.pelvic?.oxford !== undefined || item.raw?.reassessment?.oxford !== undefined;
            const hasSane = item.raw?.proms?.sane !== undefined;
            const psfsList = item.raw?.reassessment?.psfs || item.raw?.proms?.psfs || [];
            const hasPsfs = psfsList.length > 0;
            return hasScore || hasOxford || hasSane || hasPsfs;
        })
        .map(item => {
            let dateObj = new Date();
            if (item.date?.toDate) dateObj = item.date.toDate();
            else if (item.date instanceof Date) dateObj = item.date;

            const saneRaw = item.raw?.proms?.sane;
            const psfsList = item.raw?.reassessment?.psfs || item.raw?.proms?.psfs || [];
            const psfsAvg = psfsList.length > 0
                ? psfsList.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0) / psfsList.length
                : null;

            return {
                id: item.id,
                date: dateObj,
                dateLabel: format(dateObj, 'dd MMM yyyy', { locale: es }),
                eva: item.raw?.symptomsScore !== undefined ? Number(item.raw.symptomsScore) : '-',
                oxford: item.raw?.pelvic?.oxford || item.raw?.reassessment?.oxford || '-',
                sane: saneRaw !== undefined ? `${saneRaw}%` : '-',
                psfs: psfsAvg !== null ? psfsAvg.toFixed(1) : '-',
                adherence: item.raw?.adherence || '-'
            };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime()); // Reverse Chronological for Table

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="fixed inset-4 md:inset-10 bg-white rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden border border-gray-100"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-brand-900">Progreso Detallado</h2>
                                <p className="text-brand-500 text-sm">Paciente: {patientName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* View Toggles */}
                                <div className="flex bg-gray-200 rounded-lg p-1 mr-4">
                                    <button
                                        onClick={() => setViewMode('chart')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'chart' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <LineChart size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <TableIcon size={18} />
                                    </button>
                                </div>

                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    <Download size={18} />
                                    <span className="hidden sm:inline">{isExporting ? 'Generando...' : 'Exportar PDF'}</span>
                                </button>

                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white" id="report-content">
                            {viewMode === 'chart' ? (
                                <div className="h-full flex flex-col">
                                    <div className="flex-1 min-h-[400px]" id="progress-chart-container">
                                        {/* We reuse the component but in a larger container. 
                                            Ideally ProgressChart handles size automatically via ResponsiveContainer */}
                                        <ProgressChart history={history} />
                                    </div>
                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
                                            <h4 className="font-bold text-brand-800 text-sm mb-2">Resumen Clínico</h4>
                                            <p className="text-xs text-brand-600">
                                                Visualización longitudinal de las métricas clave. El gráfico muestra la tendencia de recuperación
                                                funcional (SANE/PSFS) contrastada con la sintomatología (Dolor) y capacidad (Fuerza).
                                            </p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                            <h4 className="font-bold text-green-800 text-sm mb-2">Últimos Resultados</h4>
                                            <div className="flex justify-between text-xs mt-2">
                                                <span>Fuerza: <strong>{data[0]?.oxford || '-'}</strong></span>
                                                <span>SANE: <strong>{data[0]?.sane || '-'}</strong></span>
                                                <span>Dolor: <strong>{data[0]?.eva || '-'}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3">Fecha</th>
                                                <th className="px-6 py-3 text-center">Dolor (EVA)</th>
                                                <th className="px-6 py-3 text-center">Fuerza (Oxford)</th>
                                                <th className="px-6 py-3 text-center">SANE</th>
                                                <th className="px-6 py-3 text-center">PSFS (Promedio)</th>
                                                <th className="px-6 py-3 text-center">Adherencia</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((row) => (
                                                <tr key={row.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.dateLabel}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${Number(row.eva) > 5 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                                            {row.eva}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-brand-600 font-bold">{row.oxford}</td>
                                                    <td className="px-6 py-4 text-center text-green-600 font-bold">{row.sane}</td>
                                                    <td className="px-6 py-4 text-center text-orange-600 font-bold">{row.psfs}</td>
                                                    <td className="px-6 py-4 text-center capitalize text-gray-600">{row.adherence}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
