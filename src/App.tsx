import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import NewEvaluationPage from './pages/NewEvaluationPage';
import FastEvaluationWizard from './pages/FastEvaluationWizard';
import { Button } from './components/ui/Button';

const Login = ({ onLogin }: { onLogin: () => void }) => (
    <div className="flex items-center justify-center min-h-screen bg-brand-50 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-brand-100 text-center space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-brand-800">All U Moves</h1>
                <p className="text-brand-500">Matriz Maestra de Evaluación Integral</p>
            </div>

            <div className="space-y-4 pt-4">
                <input type="email" placeholder="Correo" className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                <input type="password" placeholder="Contraseña" className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                <Button onClick={onLogin} className="w-full" size="lg">Ingresar</Button>
            </div>

            <p className="text-xs text-brand-300">v0.1.0 • Diseño Premium</p>
        </div>
    </div>
);

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/" />} />

                {/* Protected Routes */}
                <Route path="/" element={isAuthenticated ? <MainLayout><DashboardPage /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/eval/new" element={isAuthenticated ? <MainLayout><NewEvaluationPage /></MainLayout> : <Navigate to="/login" />} />
                <Route path="/eval/fast" element={isAuthenticated ? <MainLayout><FastEvaluationWizard /></MainLayout> : <Navigate to="/login" />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
