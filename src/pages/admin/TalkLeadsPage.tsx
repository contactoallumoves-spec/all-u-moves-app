import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, FileText, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TalkLead {
    id: string;
    name: string;
    email: string;
    phone: string;
    q1_incomodidad: boolean;
    symptoms: string[];
    risk_factors: string[];
    classification: string;
    createdAt: any;
}

const TalkLeadsPage = () => {
    const [leads, setLeads] = useState<TalkLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        tratamiento: 0,
        prevencion: 0,
        asesoria: 0
    });

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const q = query(collection(db, 'talk_evaluations'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                
                const fetchedLeads: TalkLead[] = [];
                let treatmentCount = 0;
                let preventionCount = 0;
                let adviceCount = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedLeads.push({ id: doc.id, ...data } as TalkLead);
                    
                    if (data.classification === 'TRATAMIENTO_KINESICO') treatmentCount++;
                    if (data.classification === 'PREVENCION_ACTIVA') preventionCount++;
                    if (data.classification === 'ASESORIA') adviceCount++;
                });

                setLeads(fetchedLeads);
                setStats({
                    total: fetchedLeads.length,
                    tratamiento: treatmentCount,
                    prevencion: preventionCount,
                    asesoria: adviceCount
                });
            } catch (err) {
                console.error("Error fetching leads:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, []);

    const handleExportCSV = () => {
        if (leads.length === 0) return;
        
        const headers = ["Fecha", "Nombre", "Teléfono", "Email", "Incomodidad", "Síntomas", "Factores de Riesgo", "Clasificación"];
        
        const csvContent = [
            headers.join(","),
            ...leads.map(lead => {
                const date = lead.createdAt ? format(lead.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A';
                return [
                    `"${date}"`,
                    `"${lead.name || ''}"`,
                    `"${lead.phone || ''}"`,
                    `"${lead.email || ''}"`,
                    `"${lead.q1_incomodidad ? 'Sí' : 'No'}"`,
                    `"${(lead.symptoms || []).join('; ')}"`,
                    `"${(lead.risk_factors || []).join('; ')}"`,
                    `"${lead.classification || ''}"`
                ].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Leads_Charlas_${format(new Date(), 'dd-MM-yyyy')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-brand-600 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-brand-600" />
                        Leads de Charlas (Evaluación Rápida)
                    </h1>
                    <p className="text-gray-500">Contactos capturados a través del código QR público</p>
                </div>
                <button 
                    onClick={handleExportCSV}
                    className="inline-flex items-center px-4 py-2 bg-brand-50 text-brand-700 font-medium rounded-lg border border-brand-200 hover:bg-brand-100 transition-colors"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar a Excel (CSV)
                </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Leads</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl shadow-sm border border-rose-100">
                    <p className="text-sm font-medium text-rose-700">Tratamiento Kine</p>
                    <p className="text-3xl font-bold text-rose-900">{stats.tratamiento}</p>
                </div>
                <div className="bg-pink-50 p-4 rounded-xl shadow-sm border border-pink-100">
                    <p className="text-sm font-medium text-pink-700">Prevención Activa</p>
                    <p className="text-3xl font-bold text-pink-900">{stats.prevencion}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-100">
                    <p className="text-sm font-medium text-purple-700">Asesoría</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.asesoria}</p>
                </div>
            </div>

            {/* Tabla de Leads */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4">Clasificación</th>
                                <th className="px-6 py-4">Detalles Médicos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 border-t border-gray-200">
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                        Aún no hay respuestas guardadas.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {lead.createdAt ? format(lead.createdAt.toDate(), 'dd MMM, HH:mm', { locale: es }) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{lead.name}</div>
                                            <div className="text-brand-600">{lead.phone}</div>
                                            {lead.email && <div className="text-gray-500 text-xs">{lead.email}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${lead.classification === 'TRATAMIENTO_KINESICO' ? 'bg-rose-100 text-rose-800 border-rose-200' : 
                                                  lead.classification === 'PREVENCION_ACTIVA' ? 'bg-pink-100 text-pink-800 border-pink-200' :
                                                  lead.classification === 'ASESORIA' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-gray-100 text-gray-800'}
                                            `}>
                                                {lead.classification ? lead.classification.replace('_', ' ') : 'Desconocido'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600">
                                            <div><span className="font-medium">Incomodidad:</span> {lead.q1_incomodidad ? 'Sí' : 'No'}</div>
                                            {(lead.symptoms && lead.symptoms.length > 0) && (
                                                <div className="mt-1"><span className="font-medium">Síntomas:</span> {lead.symptoms.join(', ')}</div>
                                            )}
                                            {(lead.risk_factors && lead.risk_factors.length > 0) && (
                                                <div className="mt-1"><span className="font-medium">Riesgos:</span> {lead.risk_factors.join(', ')}</div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TalkLeadsPage;
