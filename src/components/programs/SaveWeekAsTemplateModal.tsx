import { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Loader2 } from 'lucide-react';
import { PrescribedPlan } from '../../types/patient';
import { ProgramService } from '../../services/programService';
import { ProProgramWeek } from '../../types/pro-plan';

interface SaveWeekAsTemplateModalProps {
    weekPlan: PrescribedPlan;
    open: boolean;
    onClose: () => void;
}

export function SaveWeekAsTemplateModal({ weekPlan, open, onClose }: SaveWeekAsTemplateModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            // Convert PrescribedPlan to ProProgramWeek
            // Note: PrescribedPlan has specific dates, ProProgramWeek is generic (day 1..7 or mon..sun)
            // Our types share 'schedule' structure (monday: [...]).

            const templateWeek: ProProgramWeek = {
                id: crypto.randomUUID(),
                order: 1,
                name: "Semana 1",
                days: weekPlan.schedule as any // Cast to satisfy type if strict matching fails
            };

            const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);

            await ProgramService.create({
                name,
                description,
                tags: tagsArray,
                authorId: 'admin', // TODO: Get current user
                weeks: [templateWeek]
            });

            alert("Plantilla guardada exitosamente.");
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al guardar plantilla.");
        } finally {
            setSaving(false);
        }
    };

    const footer = (
        <>
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving} className="bg-brand-600 hover:bg-brand-700 text-white">
                {saving ? <Loader2 className="animate-spin mr-2" /> : null}
                Guardar
            </Button>
        </>
    );

    return (
        <Dialog
            isOpen={open}
            onClose={onClose}
            title="Guardar Semana como Plantilla"
            footer={footer}
        >
            <div className="space-y-4 py-2">
                <p className="text-sm text-slate-500">
                    Se creará un nuevo programa en la biblioteca con el contenido de esta semana.
                </p>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nombre del Programa</label>
                    <input
                        className="w-full p-2 border border-slate-200 rounded-md"
                        placeholder="Ej: Hipertrofia Básica S1"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Descripción</label>
                    <textarea
                        className="w-full p-2 border border-slate-200 rounded-md"
                        placeholder="Descripción opcional..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Etiquetas (separadas por coma)</label>
                    <input
                        className="w-full p-2 border border-slate-200 rounded-md"
                        placeholder="Ej: Hipertrofia, Pierna, Principiante"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                    />
                </div>
            </div>
        </Dialog>
    );
}
