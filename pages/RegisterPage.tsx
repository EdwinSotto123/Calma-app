import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CatMascot from '../components/CatMascot';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface RegisterPageProps {
    onRegister: (email: string) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const passwordChecks = {
        length: password.length >= 6,
        match: password === confirmPassword && confirmPassword.length > 0,
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password || !confirmPassword) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (!passwordChecks.length) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (!passwordChecks.match) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);

        // Simulate registration
        setTimeout(() => {
            onRegister(email);
            navigate('/onboarding');
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex flex-col items-center justify-center p-6">
            {/* Decorative Orbs */}
            <div className="fixed -top-20 -right-20 w-64 h-64 bg-violet-200/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="fixed bottom-20 -left-20 w-72 h-72 bg-fuchsia-200/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md">
                {/* Back Button */}
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 font-medium transition-colors"
                >
                    <ArrowLeft size={20} />
                    Volver
                </Link>

                {/* Cat Mascot */}
                <div className="flex justify-center mb-6">
                    <CatMascot
                        mood="curious"
                        size={120}
                        message="¡Vamos a conocernos! 🐾"
                    />
                </div>

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Crear Cuenta</h1>
                    <p className="text-slate-500 mt-2">Tu primer paso hacia la calma</p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-[2rem] shadow-xl space-y-5">

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">Correo electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full pl-12 pr-4 py-4 bg-white/70 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 focus:border-violet-300 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full pl-12 pr-12 py-4 bg-white/70 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 focus:border-violet-300 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">Confirmar contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repite tu contraseña"
                                className="w-full pl-12 pr-4 py-4 bg-white/70 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 focus:border-violet-300 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Password Checks */}
                    <div className="space-y-2 text-sm">
                        <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <Check size={16} className={passwordChecks.length ? '' : 'opacity-30'} />
                            Mínimo 6 caracteres
                        </div>
                        <div className={`flex items-center gap-2 ${passwordChecks.match ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <Check size={16} className={passwordChecks.match ? '' : 'opacity-30'} />
                            Las contraseñas coinciden
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${isLoading
                                ? 'bg-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-violet-200 active:scale-[0.98]'
                            }`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Comenzar mi viaje
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                {/* Login Link */}
                <div className="text-center mt-8">
                    <p className="text-slate-500">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-violet-600 font-bold hover:text-violet-700 transition-colors">
                            Iniciar sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
