import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Users, Calendar, Activity, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-900">Hola, Fernanda</h1>
                    <p className="text-brand-500 mt-1">Aquí está el resumen de tu práctica hoy.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline">Ver Agenda</Button>
                    <Button>Iniciar Consulta</Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-brand-500 uppercase tracking-wider">Usuarias Activas</CardTitle>
                        <Users className="h-4 w-4 text-brand-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-900">24</div>
                        <p className="text-xs text-brand-400 mt-1">+2 esta semana</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-brand-500 uppercase tracking-wider">Próximas Sesiones</CardTitle>
                        <Calendar className="h-4 w-4 text-brand-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-900">5</div>
                        <p className="text-xs text-brand-400 mt-1">Para hoy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-brand-500 uppercase tracking-wider">Evaluaciones</CardTitle>
                        <Activity className="h-4 w-4 text-brand-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-900">12</div>
                        <p className="text-xs text-brand-400 mt-1">Este mes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Quick Lists */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-brand-800">Pacientes Recientes</h2>
                        <Button variant="ghost" size="sm" className="text-xs">Ver todas <ArrowRight className="ml-1 w-3 h-3" /></Button>
                    </div>

                    <Card className="overflow-hidden">
                        <div className="divide-y divide-brand-50">
                            {[
                                { name: 'Ana María G.', stage: 'Postparto', lastVisit: 'Hoy, 10:00' },
                                { name: 'Carolina S.', stage: 'Menopausia', lastVisit: 'Ayer, 15:30' },
                                { name: 'Valentina P.', stage: 'Runner', lastVisit: 'Ayer, 11:00' },
                            ].map((user, i) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-brand-50/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-brand-900 group-hover:text-brand-700">{user.name}</p>
                                            <p className="text-xs text-brand-500">{user.stage}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-brand-400">{user.lastVisit}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-brand-800">Alertas Clínicas</h2>
                    </div>
                    <Card className="bg-orange-50/50 border-orange-100">
                        <div className="p-4 space-y-3">
                            <div className="flex gap-3 items-start">
                                <div className="w-2 h-2 mt-2 rounded-full bg-orange-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-brand-900">Re-evaluación pendiente: Ana María G.</p>
                                    <p className="text-xs text-brand-500 mt-0.5">Cumple 8 semanas post-parto. Revisar diástasis.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-2 h-2 mt-2 rounded-full bg-brand-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-brand-900">Checklist incompleto: Carolina S.</p>
                                    <p className="text-xs text-brand-500 mt-0.5">Falta completar cuestionario de calidad de vida.</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
