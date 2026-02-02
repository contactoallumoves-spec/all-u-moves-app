import { useState } from 'react';
import { AnnualPlan, Macrocycle } from '../../types/plan';
import { Button } from '../ui/Button';
import { Calendar as CalendarIcon, Zap } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming this exists

interface AnnualCalendarProps {
    plan: AnnualPlan;
    onSelectWeek: (week: number) => void;
    onAddMacrocycle: (macro: Omit<Macrocycle, 'id'>) => Promise<void>;
}

export function AnnualCalendar({ plan, onSelectWeek, onAddMacrocycle }: AnnualCalendarProps) {
    const weeks = Array.from({ length: 52 }, (_, i) => i + 1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMacro, setNewMacro] = useState({
        name: '',
        startWeek: 1,
        endWeek: 4,
        color: '#3B82F6',
        focus: ''
    });

    // Helper to find if a week belongs to a macrocycle
    const getMacroForWeek = (week: number) => {
        return plan.macrocycles.find(m => week >= m.startWeek && week <= m.endWeek);
    };

    const handleSave = async () => {
        if (newMacro.endWeek < newMacro.startWeek) {
            alert("La semana de término debe ser posterior a la de inicio");
            return;
        }
        await onAddMacrocycle(newMacro as any);
        setIsModalOpen(false);
        setNewMacro({ name: '', startWeek: 1, endWeek: 4, color: '#3B82F6', focus: '' });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif font-bold text-lg text-brand-900 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-brand-500" />
                    Vista Anual: {plan.name}
                </h3>
                <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
                    + Nuevo Macrociclo
                </Button>
            </div>

            {/* Grid of Weeks */}
            <div className="grid grid-cols-13 gap-1 mb-4">
                {/* Headers? Optional */}
            </div>

            <div className="flex flex-wrap gap-2">
                {weeks.map(week => {
                    const macro = getMacroForWeek(week);
                    const weekData = plan.weeks[week];
                    const hasData = weekData && Object.values(weekData.schedule).some(day => day.length > 0);

                    return (
                        <div
                            key={week}
                            onClick={() => onSelectWeek(week)}
                            className={cn(
                                "relative w-10 h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all border",
                                macro ? "border-transparent" : "border-gray-100 bg-gray-50 hover:bg-gray-100",
                                hasData ? "ring-2 ring-brand-500 ring-offset-1" : ""
                            )}
                            style={{
                                backgroundColor: macro?.color ? `${macro.color}20` : undefined, // 20% opacity
                                color: macro?.color || '#666'
                            }}
                            title={`Semana ${week}`}
                        >
                            <span className="text-[10px] font-bold">S{week}</span>
                            {hasData && (
                                <Zap className="w-3 h-3 text-brand-500 fill-brand-500 mt-1" />
                            )}

                            {/* Macro indicator bar */}
                            {macro && (
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-lg"
                                    style={{ backgroundColor: macro.color }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend / Status */}
            <div className="mt-8 pt-4 border-t border-brand-50 flex gap-6 text-xs text-brand-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                    <span>Semana Planificada</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    <span>Vacío</span>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Nuevo Macrociclo</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                                <input
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                    placeholder="Ej: Fase General"
                                    value={newMacro.name}
                                    onChange={e => setNewMacro({ ...newMacro, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio (Semana)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={52}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                        value={newMacro.startWeek}
                                        onChange={e => setNewMacro({ ...newMacro, startWeek: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin (Semana)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={52}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                        value={newMacro.endWeek}
                                        onChange={e => setNewMacro({ ...newMacro, endWeek: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
                                <div className="flex gap-2">
                                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setNewMacro({ ...newMacro, color: c })}
                                            className={cn(
                                                "w-8 h-8 rounded-full border-2 transition-all",
                                                newMacro.color === c ? "border-gray-900 scale-110" : "border-transparent"
                                            )}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave}>Guardar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Ensure grid-cols-13 works or use style
