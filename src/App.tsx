import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import NewEvaluationPage from './pages/NewEvaluationPage';
import FastEvaluationWizard from './pages/FastEvaluationWizard';
import { Button } from './components/ui/Button';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

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
                    <h1 className="text-3xl font-serif font-bold text-brand-800">All U Moves</h1>
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
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

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

                {/* Protected Routes */}
                <Route path="/" element={user ? <MainLayout><DashboardPage /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/eval/new" element={user ? <MainLayout><NewEvaluationPage /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/eval/fast" element={user ? <MainLayout><FastEvaluationWizard /></MainLayout> : <Navigate to="/login" />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
