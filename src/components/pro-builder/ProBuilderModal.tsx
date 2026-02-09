import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Plus, Save, LayoutTemplate } from 'lucide-react';
import { ProDayPlan, ProSectionBlock } from '../../types/pro-plan';
import { SectionBlock } from './SectionBlock';


interface ProBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan?: ProDayPlan;
    onSave: (plan: ProDayPlan) => void;
    dayLabel: string; // e.g. "Lunes 12"
}

export function ProBuilderModal({ isOpen, onClose, initialPlan, onSave, dayLabel }: ProBuilderModalProps) {
    // Canvas State
    const [sections, setSections] = useState<ProSectionBlock[]>(initialPlan?.sections || []);

    if (!isOpen) return null;

    // Actions
    const addSection = (type: ProSectionBlock['type'] = 'strength') => {
        const newSection: ProSectionBlock = {
            id: crypto.randomUUID(),
            name: type === 'warmup' ? 'Calentamiento' : 'Bloque Principal',
            type,
            order: sections.length,
            exercises: []
        };
        setSections([...sections, newSection]);
    };

    const handleSave = () => {
        onSave({
            id: initialPlan?.id || crypto.randomUUID(),
            sections
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden bg-slate-50 border-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-100 rounded-lg text-brand-700">
                            <LayoutTemplate className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Constructor de Sesión</h2>
                            <p className="text-sm text-slate-500 font-medium">{dayLabel} • Modo Pro</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} className="gap-2 bg-brand-700 hover:bg-brand-800 text-white">
                            <Save className="w-4 h-4" /> Guardar Sesión
                        </Button>
                    </div>
                </header>

                {/* Main Canvas (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 relative bg-slate-50/50">
                    {/* Background Grid Pattern (Optional Aesthetic) */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light" />

                    {sections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 border-2 border-dashed border-slate-200 rounded-2xl m-10">
                            <LayoutTemplate className="w-16 h-16 opacity-20" />
                            <p className="text-lg font-medium">La sesión está vacía</p>
                            <Button variant="outline" onClick={() => addSection('warmup')}>
                                + Añadir Primer Bloque
                            </Button>
                        </div>
                    ) : (
                        sections.map((section, index) => (
                            <SectionBlock
                                key={section.id}
                                section={section}
                                index={index}
                                onChange={(updated: ProSectionBlock) => {
                                    const newSections = [...sections];
                                    newSections[index] = updated;
                                    setSections(newSections);
                                }}
                                onDelete={() => {
                                    setSections(sections.filter(s => s.id !== section.id));
                                }}
                            />
                        ))
                    )}

                    {/* Add Section Button (Bottom) */}
                    {sections.length > 0 && (
                        <div className="border-t-2 border-dashed border-slate-200 pt-6 flex justify-center pb-12">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => addSection('strength')}
                                    className="bg-white hover:bg-slate-50 border-slate-300 text-slate-600 gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Añadir Bloque
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
