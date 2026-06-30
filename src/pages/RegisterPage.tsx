import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { KineService } from '../services/kineService';
import { Button } from '../components/ui/Button';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!firstName || !lastName || !email || !password) {
            setError('Todos los campos son obligatorios.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // 2. Create Firestore Profile
            await KineService.createProfile(uid, {
                firstName,
                lastName,
                email,
                role: 'kine',
                status: 'pending'
            });

            setSuccess(true);
            // Sign out immediately so they don't get logged into the dashboard before approval
            await signOut(auth);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('El correo ya está registrado.');
            } else if (err.code === 'auth/invalid-email') {
                setError('El formato del correo es inválido.');
            } else {
                setError('Error al registrar. Por favor inténtalo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-50 p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-brand-100 text-center space-y-6 animate-in fade-in">
                    <div className="flex justify-center">
                        <div className="p-3 bg-brand-50 text-brand-600 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-serif font-bold text-brand-900">Registro Exitoso</h2>
                        <p className="text-brand-500 text-sm">
                            Tu cuenta ha sido creada y se encuentra en estado <strong>Pendiente de Aprobación</strong>.
                        </p>
                        <p className="text-brand-400 text-xs">
                            Por favor solicita al administrador que active tu cuenta para poder ingresar a la plataforma.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link to="/login" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                            Volver al Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-brand-100 space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-2">
                        <img src="/allumoves-logo.png" alt="All U Moves" className="h-12 w-auto" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-brand-900">Registro de Kinesiólogos</h2>
                    <p className="text-xs text-brand-400">Solicita tu acceso a la Ficha Clínica</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Nombre"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Apellido"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                            required
                        />
                    </div>
                    <input
                        type="email"
                        placeholder="Correo Electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña (mínimo 6 caracteres)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirmar Contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                        required
                    />

                    {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                        Registrarme
                    </Button>
                </form>

                <div className="text-center pt-2">
                    <p className="text-xs text-brand-400">
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                            Inicia Sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
