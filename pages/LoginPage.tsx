import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CatMascot from '../components/CatMascot';
import { ArrowRight, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../services/firebaseService';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleSignIn = async () => {
        setError('');
        setIsLoading(true);

        try {
            await signInWithGoogle();
            // Navigation will be handled by App.tsx after auth state changes
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Inicio de sesión cancelado');
            } else if (err.code === 'auth/popup-blocked') {
                setError('El navegador bloqueó la ventana. Habilita popups para continuar.');
            } else {
                setError('Error al iniciar sesión. Intenta de nuevo.');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6">
            {/* Decorative Orbs */}
            <div className="fixed -top-20 -left-20 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="fixed top-40 -right-20 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md">
                {/* Cat Mascot */}
                <div className="flex justify-center mb-6">
                    <CatMascot
                        mood="sleeping"
                        size={140}
                        message="Zzz... ¡Despiértame para comenzar!"
                    />
                </div>

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Calma</h1>
                    <p className="text-slate-500 mt-2">Tu espacio seguro de bienestar</p>
                </div>

                {/* Login Card */}
                <div className="glass-panel p-8 rounded-[2rem] shadow-xl space-y-6">

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in text-center">
                            {error}
                        </div>
                    )}

                    {/* Google Sign In Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${isLoading
                                ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-slate-300 shadow-slate-200 active:scale-[0.98]'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Conectando...
                            </>
                        ) : (
                            <>
                                {/* Google Icon */}
                                <svg width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continuar con Google
                            </>
                        )}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <span className="text-xs text-slate-400 font-medium">Tu información está segura</span>
                        <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    {/* Info */}
                    <div className="text-center space-y-2">
                        <p className="text-sm text-slate-500">
                            Usamos Google para un inicio de sesión seguro y sencillo.
                        </p>
                        <div className="flex justify-center gap-2 flex-wrap">
                            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-xs font-bold">🔒 Privado</span>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">⚡ Rápido</span>
                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">🛡️ Seguro</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-8">
                    Al continuar, aceptas nuestros términos de uso y política de privacidad.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
