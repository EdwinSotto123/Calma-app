import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, MessageCircle, Briefcase, BookOpen, Volume2, Sparkles, Flame, ChevronRight } from 'lucide-react';
import AmbientSoundPlayer from '../components/AmbientSoundPlayer';

const WellnessPage: React.FC = () => {
    const [showSoundPlayer, setShowSoundPlayer] = useState(false);

    const tools = [
        {
            to: '/live',
            icon: Mic,
            title: 'Hablar',
            subtitle: 'Agente de voz IA',
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
        },
        {
            to: '/chat',
            icon: MessageCircle,
            title: 'Chat',
            subtitle: 'Conversa con IA',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            to: '/kit',
            icon: Briefcase,
            title: 'Kit de Calma',
            subtitle: 'Respiración, grounding',
            iconBg: 'bg-teal-100',
            iconColor: 'text-teal-600',
        },
        {
            to: '/journal',
            icon: BookOpen,
            title: 'Diario',
            subtitle: 'Escribe tus emociones',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
        },
    ];

    return (
        <div className="p-5 pb-24 min-h-full">
            {/* Header */}
            <header className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="bg-gradient-to-br from-teal-400 to-emerald-500 p-2 rounded-xl">
                        <Sparkles className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Bienestar</h1>
                </div>
                <p className="text-slate-500 text-sm">Herramientas para cuidar tu mente 💚</p>
            </header>

            {/* 🔥 Daily Challenges Card - NEW */}
            <Link
                to="/challenges"
                className="block bg-gradient-to-r from-orange-500 to-rose-500 p-5 rounded-2xl text-white mb-6 shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <Flame size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Retos del Día</h3>
                            <p className="text-orange-200 text-sm">Completa retos y gana racha 🔥</p>
                        </div>
                    </div>
                    <ChevronRight size={24} className="text-orange-200" />
                </div>
            </Link>

            {/* Tools Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {tools.map((tool) => (
                    <Link
                        key={tool.to}
                        to={tool.to}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95 group"
                    >
                        <div className={`${tool.iconBg} w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <tool.icon size={24} className={tool.iconColor} />
                        </div>
                        <h3 className="font-bold text-slate-800">{tool.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{tool.subtitle}</p>
                    </Link>
                ))}
            </div>

            {/* Ambient Sounds Card */}
            <button
                onClick={() => setShowSoundPlayer(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 p-5 rounded-2xl text-white text-left shadow-lg shadow-purple-200 active:scale-[0.98] transition-transform"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <Volume2 size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Sonidos Ambientales</h3>
                        <p className="text-purple-200 text-sm">Mezcla sonidos de la naturaleza</p>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    {['🌧️', '🌲', '🐦', '💨', '⛈️', '🚶'].map((emoji, i) => (
                        <span key={i} className="bg-white/20 px-2 py-1 rounded-lg text-sm">{emoji}</span>
                    ))}
                </div>
            </button>

            {/* Sound Player Modal */}
            <AmbientSoundPlayer isOpen={showSoundPlayer} onClose={() => setShowSoundPlayer(false)} />
        </div>
    );
};

export default WellnessPage;
