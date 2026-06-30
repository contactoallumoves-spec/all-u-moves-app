import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import FastEvaluationWizard from './pages/FastEvaluationWizard';
import CompleteEvaluation from './pages/CompleteEvaluation';
import PatientDetailPage from './pages/PatientDetailPage'; // [NEW]
import EvolutionPage from './pages/EvolutionPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import { KineService } from './services/kineService';
import { Kinesiologist } from './types/clinical';
import { signOut } from 'firebase/auth';


import { Button } from './components/ui/Button';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import PublicLayout from './components/layout/PublicLayout';
import PreAdmissionPage from './pages/public/PreAdmissionPage';
import PublicSurveyPage from './pages/public/PublicSurveyPage';
import { PortalLayout } from './components/portal/PortalLayout'; // [NEW]
import { PortalGuard } from './pages/portal/PortalGuard'; // [NEW]
import PortalDashboard from './pages/portal/PortalDashboard'; // [NEW]
import SessionPlayer from './pages/portal/SessionPlayer'; // [NEW]
import TalkEvaluationPage from './pages/public/TalkEvaluationPage'; // [NEW] Public Questionnaire
import TalkLeadsPage from './pages/admin/TalkLeadsPage'; // [NEW] Admin View for Leads
import CuestionarioPrenatalPage from './pages/public/CuestionarioPrenatalPage'; // [NEW] Cuestionario Prenatal
import AppointmentsPage from './pages/AppointmentsPage';
import EvaluacionExpressV2Page from './pages/EvaluacionExpressV2Page';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Auth state listener in App will handle redirect
        } catch (err: any) {
            console.error(err);
            setError('Error: Revisa tu correo o contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-brand-100 text-center space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-center mb-4">
                        <img src="/allumoves-logo.png" alt="All U Moves" className="h-16 w-auto" />
                    </div>
                    <p className="text-brand-500">Matriz Maestra de Evaluación Integral</p>
                </div>

                <div className="space-y-4 pt-4">
                    <input
                        type="email"
                        placeholder="Correo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button onClick={handleLogin} className="w-full" size="lg" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                        Ingresar
                    </Button>
                </div>

                <p className="text-xs text-brand-300">v0.2.0 • Conectado a Firebase</p>
            </div>
        </div>
    );
};

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [kineProfile, setKineProfile] = useState<Kinesiologist | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Obtener perfil de Kinesiólogo
                let profile = await KineService.getProfile(currentUser.uid);
                const isFirstOrAdmin = currentUser.email === 'admin@allufem.cl' || 
                                       currentUser.email === 'contacto@allufem.cl' || 
                                       currentUser.email === 'contactoallumoves@gmail.com' ||
                                       currentUser.email?.includes('allufem') || 
                                       currentUser.email?.includes('allumoves') || 
                                       currentUser.email?.startsWith('admin');
                
                if (!profile) {
                    // Si no existe, lo creamos
                    const defaultProfile: Kinesiologist = {
                        id: currentUser.uid,
                        firstName: 'Usuario',
                        lastName: 'Allufem',
                        email: currentUser.email || '',
                        role: isFirstOrAdmin ? 'admin' : 'kine',
                        status: isFirstOrAdmin ? 'active' : 'pending',
                        createdAt: new Date()
                    };
                    await KineService.createProfile(currentUser.uid, {
                        firstName: defaultProfile.firstName,
                        lastName: defaultProfile.lastName,
                        email: defaultProfile.email,
                        role: defaultProfile.role,
                        status: defaultProfile.status
                    });
                    profile = defaultProfile;
                } else if (isFirstOrAdmin && (profile.status !== 'active' || profile.role !== 'admin')) {
                    // Si ya existe pero debería ser administrador activo por patrón de correo, lo corregimos en la BD
                    await KineService.approveKine(currentUser.uid, 'admin');
                    profile.status = 'active';
                    profile.role = 'admin';
                }
                setKineProfile(profile);
            } else {
                setKineProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-brand-50">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            </div>
        );
    }

    // Pantalla de espera para cuentas pendientes de aprobación
    if (user && kineProfile?.status === 'pending') {
        const handleLogout = () => signOut(auth);
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-50 p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-brand-100 text-center space-y-6 animate-in fade-in">
                    <div className="flex justify-center">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-full animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-serif font-bold text-brand-900">Aprobación Pendiente</h2>
                        <p className="text-brand-500 text-sm">
                            Hola, <strong>{kineProfile?.firstName}</strong>. Tu cuenta ha sido registrada y está en espera de aprobación por parte del administrador.
                        </p>
                        <p className="text-brand-400 text-xs">
                            Una vez aprobado, tendrás acceso completo a las fichas clínicas de tus pacientes.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Button onClick={handleLogout} variant="outline" className="w-full">
                            Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route path="/" element={user ? <MainLayout><DashboardPage /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/users" element={user ? <MainLayout><PatientsPage /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/eval/new/:patientId" element={user ? <MainLayout><EvaluacionExpressV2Page /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/eval/fast/:patientId" element={user ? <MainLayout><FastEvaluationWizard /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/eval/complete/:patientId" element={user ? <MainLayout><CompleteEvaluation /></MainLayout> : <Navigate to="/login" />} />

                {/* Hub & Sessions */}
                <Route path="/users/:id" element={user ? <MainLayout><PatientDetailPage /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/users/:patientId/sessions/new" element={user ? <MainLayout><EvolutionPage /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/turnos" element={user ? <MainLayout><AppointmentsPage /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/evaluacion-express-v2" element={user ? <MainLayout><EvaluacionExpressV2Page /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/evaluaciones-charlas" element={user ? <MainLayout><TalkLeadsPage /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/settings" element={user ? <MainLayout><SettingsPage /></MainLayout> : <Navigate to="/login" />} />

                {/* Public Routes */}
                <Route path="/" element={<PublicLayout />}>
                    <Route path="pre-ingreso" element={<PreAdmissionPage />} />
                    {/* [NEW] Public Survey Routes */}
                    <Route path="surveys/:patientId/:type" element={<PublicSurveyPage />} />
                </Route>
                <Route path="/charlas/evaluacion" element={<TalkEvaluationPage />} /> {/* [NEW] Public Questionnaire */}
                <Route path="/cuestionario-prenatal" element={<CuestionarioPrenatalPage />} /> {/* [NEW] Cuestionario Prenatal */}


                {/* [NEW] Patient Portal Routes (Magic Link) */}
                <Route path="/portal" element={<PortalLayout />}>
                    <Route path=":token" element={<PortalGuard />}>
                        <Route index element={<Navigate to="home" replace />} />
                        <Route path="home" element={<PortalDashboard />} />
                        <Route path="session/:dateStr" element={<SessionPlayer />} /> {/* [NEW] Standardized Route - Passing Date now */}
                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
