import { useState } from 'react';
import { AnnualPlan, Macrocycle } from '../../types/plan';
import { Button } from '../ui/Button';
import { ChevronRight, Calendar as CalendarIcon, Zap, Activity } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming this exists

interface AnnualCalendarProps {
    plan: AnnualPlan;
    onSelectWeek: (week: number) => void;
    onAddMacrocycle: () => void;
}

export function AnnualCalendar({ plan, onSelectWeek, onAddMacrocycle }: AnnualCalendarProps) {
    const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

    // Helper to find if a week belongs to a macrocycle
    const getMacroForWeek = (week: number) => {
        return plan.macrocycles.find(m => week >= m.startWeek && week <= m.endWeek);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif font-bold text-lg text-brand-900 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-brand-500" />
                    Vista Anual: {plan.name}
                </h3>
                <Button size="sm" variant="outline" onClick={onAddMacrocycle}>
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
        </div>
    );
}

// Ensure grid-cols-13 works or use style
